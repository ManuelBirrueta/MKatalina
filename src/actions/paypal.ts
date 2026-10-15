/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: PAGOS PAYPAL · Fase 13 · Etapas 3C, 5, 6A, 6B y 7
 * ============================================================================
 *
 *  PEDIDOS (carrito):            createPaypalOrder / capturePaypalOrder
 *  APARTADOS (anticipo del 20%): createPaypalReservationOrder /
 *                                capturePaypalReservationOrder
 *  COMPLETAR APARTADO (80% + envío, Etapa 5):
 *                                createPaypalCompletionOrder /
 *                                capturePaypalCompletionOrder
 *
 *  CAMBIOS DE LA ETAPA 7 — ENVÍOS INTERNACIONALES:
 *    - El costo del envío depende del PAÍS (src/lib/shipping-rates.ts):
 *      México → estándar/express; extranjero → DHL Express por zona.
 *      createPaypalOrder recibe el país; capturePaypalOrder lo toma de la
 *      dirección. Un método que no aplica al país (ej. "express" a España)
 *      se rechaza como "invalid" y no se cobra.
 *    - capturePaypalOrder ahora REVISA la dirección y el correo en el
 *      servidor (validateAddress, src/lib/address.ts) antes de cobrar; antes
 *      los guardaba tal como llegaban del navegador. Guarda el país y el
 *      teléfono completo con lada ("+1 2125551234").
 *    - El nombre del método de envío lo pone el servidor
 *      (shippingMethodLabel) en lugar de aceptar el texto del navegador.
 *
 *  CAMBIO DE LA ETAPA 6B: el apartado guarda el idioma del cliente
 *  (reservation.locale) al crearse, para que los avisos posteriores (como
 *  "tu pieza va en camino", que manda el admin días después) lleguen en el
 *  idioma correcto.
 *
 *  CAMBIO DE LA ETAPA 6A — CORREOS DE CONFIRMACIÓN:
 *    Tras cada cobro exitoso se programa un correo para el cliente con
 *    after() de Next.js (src/lib/email/transactional.ts):
 *      - pedido pagado      → sendOrderConfirmationEmail
 *      - anticipo pagado    → sendReservationDepositEmail
 *      - apartado liquidado → sendReservationCompletedEmail
 *    after() corre el envío DESPUÉS de responder al navegador: el cliente ve
 *    su confirmación al instante y el correo sale en segundo plano. Si el
 *    correo falla, el cobro y el pedido no se ven afectados.
 *
 *  CAMBIOS DE LA ETAPA 5:
 *    - NUEVO: cobrar el resto de un apartado. Antes, "Completar" en Mis
 *      apartados lo marcaba pagado SIN cobrar (completeReservationAction,
 *      que se eliminó). Ver la sección COMPLETAR APARTADO al final.
 *    - SEGURIDAD en los TRES cobros: antes de capturar se confirma con
 *      PayPal que la orden es por el monto que calculó el servidor
 *      (paypalOrderHasAmount, src/lib/paypal.ts). Si no coincide, se deshace
 *      todo como si el pago hubiera fallado y NO se cobra.
 *
 *  CAMBIOS DE LA ETAPA 3C:
 *    - Precios desde la BASE (antes productsData): lo que se cobra es el
 *      precio vigente del producto, nunca lo que diga el navegador.
 *    - Solo productos VISIBLES (isActive) y con piezas DISPONIBLES
 *      (stock − apartados activos, ver src/lib/inventory.ts).
 *    - NUEVO ORDEN AL COBRAR, para no cobrar nunca algo que no se puede
 *      entregar ni dejar cobros sin registro:
 *
 *        1. Transacción: bloquear productos, verificar y RESTAR stock, y
 *           crear el pedido como PENDIENTE (o el apartado como ACTIVO).
 *           Si no alcanza → se responde "unavailable" y NO se cobra.
 *        2. Cobrar en PayPal (capture).
 *        3a. Cobro OK    → el pedido pasa a PAGADO.
 *        3b. Cobro falla → se devuelve el stock y se borra el pedido/apartado.
 *
 *      Así el registro existe ANTES de que se mueva el dinero. Si algo se
 *      interrumpiera a la mitad, quedaría un pedido PENDIENTE visible en el
 *      panel, en vez de un cobro sin pedido.
 *    - Apartados: la sesión se revisa ANTES de cobrar (antes se cobraba y
 *      luego se revisaba; si la sesión había expirado, se cobraba sin crear
 *      el apartado).
 *
 *  Respuestas: las acciones devuelven un `error` con el motivo cuando algo
 *  sale mal, para que los botones de PayPal muestren el mensaje correcto.
 * ============================================================================
 */

"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import type { CheckoutFormData } from "@/types/checkout";
import { getShippingCost, shippingMethodLabel } from "@/lib/shipping-rates";
import { validateAddress } from "@/lib/address";
import {
  RESERVATION_DEPOSIT_PERCENTAGE,
  RESERVATION_DURATION_DAYS,
  type ProductSnapshot,
} from "@/types/reservation";
import {
  createPaypalOrderApi,
  capturePaypalOrderApi,
  paypalOrderHasAmount,
} from "@/lib/paypal";
import {
  InventoryError,
  normalizeItems,
  findUnavailableItems,
  reserveStockForOrder,
  restoreStock,
  lockProduct,
  getAvailableUnits,
  applyReservationStockChange,
} from "@/lib/inventory";
import {
  parseCompletionDelivery,
  completionShippingCost,
} from "@/lib/reservation-delivery";
import {
  sendOrderConfirmationEmail,
  sendReservationDepositEmail,
  sendReservationCompletedEmail,
} from "@/lib/email/transactional";

/** Motivos de fallo que entienden los botones de PayPal. */
export type CheckoutError =
  | "unavailable" // algún producto ya no está o no alcanzan las piezas
  | "invalid" // datos del pedido inválidos (carrito vacío, envío inexistente…)
  | "notAuthenticated" // apartar requiere sesión
  | "paymentFailed" // PayPal no completó el cobro (no se cobró nada)
  | "expired" // (Etapa 5) el apartado ya venció: no se puede completar
  | "reservationUnavailable" // (Etapa 5) la pieza del apartado ya no está en stock
  | "serverError"; // error inesperado

/** Formato simple de correo (el mismo criterio que el formulario). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Identificador de negocio con prefijo (MKTL- pedidos, APTD- apartados). */
function makeBusinessId(prefix: "MKTL" | "APTD"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;
}

/**
 * Cobra una orden de PayPal SOLO si es por el monto esperado (Etapa 5).
 * Devuelve true si el dinero se cobró. Cualquier error cuenta como "no se
 * cobró" (el que llama deshace lo que preparó).
 */
async function verifyAndCapture(
  paypalOrderId: string,
  expectedPesos: number,
  context: string,
): Promise<boolean> {
  try {
    if (!(await paypalOrderHasAmount(paypalOrderId, expectedPesos))) {
      console.error(
        `${context}: la orden ${paypalOrderId} no es por $${expectedPesos} MXN; no se cobra.`,
      );
      return false;
    }
    return await capturePaypalOrderApi(paypalOrderId);
  } catch (error) {
    console.error(`${context} (cobro):`, error);
    return false;
  }
}

/* ══════════════════════════════ PEDIDOS ══════════════════════════════ */

interface CreateOrderInput {
  items: { slug: string; quantity: number }[];
  shippingMethodId: string;
  /** País de entrega (Etapa 7): decide el costo del envío. */
  country: string;
}

/**
 * Antes de abrir PayPal: verifica disponibilidad y calcula el total con los
 * precios de la base. No resta stock (solo avisa pronto si algo no alcanza).
 */
export async function createPaypalOrder(input: CreateOrderInput): Promise<{
  paypalOrderId: string | null;
  error?: CheckoutError;
  unavailableSlugs?: string[];
}> {
  try {
    const items = normalizeItems(input.items);
    // Costo del envío para ese país y método (null = no aplica).
    const shippingCost = getShippingCost(
      String(input.country ?? "").toUpperCase(),
      String(input.shippingMethodId ?? ""),
    );
    if (items.length === 0 || shippingCost === null) {
      return { paypalOrderId: null, error: "invalid" };
    }

    const unavailableSlugs = await findUnavailableItems(items);
    if (unavailableSlugs.length > 0) {
      return { paypalOrderId: null, error: "unavailable", unavailableSlugs };
    }

    // Total con precios vigentes de la base.
    const products = await prisma.product.findMany({
      where: { slug: { in: items.map((i) => i.slug) }, isActive: true },
      select: { slug: true, price: true },
    });
    const priceBySlug = new Map(products.map((p) => [p.slug, p.price]));
    const subtotal = items.reduce(
      (sum, i) => sum + (priceBySlug.get(i.slug) ?? 0) * i.quantity,
      0,
    );
    const total = subtotal + shippingCost;
    if (total <= 0) return { paypalOrderId: null, error: "invalid" };

    const paypalOrderId = await createPaypalOrderApi(total);
    return { paypalOrderId };
  } catch (error) {
    console.error("createPaypalOrder:", error);
    return { paypalOrderId: null, error: "serverError" };
  }
}

interface CaptureOrderItemInput {
  slug: string;
  quantity: number;
  /** Nombre ya traducido al idioma de la compra (queda congelado en el pedido). */
  nameSnapshot: string;
  imageSnapshot?: string;
  categorySnapshot?: string;
}

interface CaptureOrderInput {
  formData: CheckoutFormData;
  shippingMethodId: string;
  /**
   * Ya no se usa (Etapa 7): el servidor pone el nombre del método. Se
   * conserva opcional para no romper llamadas existentes.
   */
  shippingLabel?: string;
  locale: string;
  items: CaptureOrderItemInput[];
}

/**
 * El cliente aprobó el pago en PayPal: aparta las piezas, cobra y confirma.
 * Ver el orden completo en la cabecera.
 */
export async function capturePaypalOrder(
  paypalOrderId: string,
  input: CaptureOrderInput,
): Promise<{
  success: boolean;
  orderId?: string;
  error?: CheckoutError;
  unavailableSlugs?: string[];
}> {
  const items = normalizeItems(input.items);

  // Dirección y correo revisados en el servidor (Etapa 7).
  const email = String(input.formData?.email ?? "").trim();
  const checked = validateAddress(input.formData);
  if (items.length === 0 || !EMAIL_REGEX.test(email) || !checked.ok) {
    return { success: false, error: "invalid" };
  }
  const address = checked.data; // teléfono ya con lada

  // Costo del envío para el país de la dirección (null = método no aplica).
  const shippingMethodId = String(input.shippingMethodId ?? "");
  const shippingCost = getShippingCost(address.country, shippingMethodId);
  if (shippingCost === null) return { success: false, error: "invalid" };

  // Nombre congelado (traducido) que mandó el navegador, por slug.
  const nameBySlug = new Map(input.items.map((i) => [i.slug, i.nameSnapshot]));

  const user = await getOptionalUser(); // null = compra como invitado
  const orderId = makeBusinessId("MKTL");
  // Total que calcula el servidor; se compara con la orden de PayPal.
  let expectedTotal = 0;

  // ── 1) Transacción: restar stock + crear el pedido PENDIENTE ──
  try {
    // Imagen y categoría se toman de la base (no del navegador).
    const details = await prisma.product.findMany({
      where: { slug: { in: items.map((i) => i.slug) } },
      select: {
        slug: true,
        category: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      },
    });
    const detailBySlug = new Map(details.map((d) => [d.slug, d]));

    await prisma.$transaction(async (tx) => {
      const locked = await reserveStockForOrder(tx, items);

      const itemsData = items.map((item) => {
        const unitPrice = locked.get(item.slug)!.price; // precio vigente
        const detail = detailBySlug.get(item.slug);
        return {
          productSlug: item.slug,
          nameSnapshot: nameBySlug.get(item.slug) ?? item.slug,
          unitPrice,
          quantity: item.quantity,
          lineTotal: unitPrice * item.quantity,
          imageSnapshot: detail?.images[0]?.url ?? null,
          categorySnapshot: detail?.category ?? null,
        };
      });

      const subtotal = itemsData.reduce((sum, i) => sum + i.lineTotal, 0);
      expectedTotal = subtotal + shippingCost;
      const f = address;

      await tx.order.create({
        data: {
          id: orderId,
          profileId: user?.id ?? null,
          email,
          phone: f.phone,
          firstName: f.firstName,
          lastName: f.lastName,
          address: f.address,
          addressLine2: f.addressLine2 || null,
          neighborhood: f.neighborhood,
          city: f.city,
          state: f.state,
          postalCode: f.postalCode,
          country: f.country,
          notes: f.notes || null,
          shippingMethodId,
          // Nombre del método en el idioma de la compra (lo pone el servidor).
          shippingLabel: shippingMethodLabel(shippingMethodId, input.locale),
          shippingCost,
          subtotal,
          total: expectedTotal,
          status: "PENDIENTE", // aún no se cobra
          locale: input.locale,
          paypalOrderId,
          items: { create: itemsData },
        },
      });
    });
  } catch (error) {
    if (error instanceof InventoryError) {
      // No alcanzan las piezas: NO se cobra.
      return { success: false, error: "unavailable", unavailableSlugs: [error.slug] };
    }
    console.error("capturePaypalOrder (preparar pedido):", error);
    return { success: false, error: "serverError" };
  }

  // ── 2) Cobrar en PayPal (solo si la orden es por el total correcto) ──
  const captured = await verifyAndCapture(
    paypalOrderId,
    expectedTotal,
    "capturePaypalOrder",
  );

  // ── 3b) Cobro fallido: devolver stock y borrar el pedido pendiente ──
  if (!captured) {
    try {
      await prisma.$transaction(async (tx) => {
        await restoreStock(tx, items);
        await tx.order.delete({ where: { id: orderId } });
      });
    } catch (error) {
      // Queda PENDIENTE en el panel para revisarlo a mano.
      console.error("capturePaypalOrder (deshacer):", error);
    }
    return { success: false, error: "paymentFailed" };
  }

  // ── 3a) Cobro OK: el pedido pasa a PAGADO ──
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAGADO" },
    });
  } catch (error) {
    // El cobro SÍ se hizo y el pedido existe (PENDIENTE): el cliente debe ver
    // su confirmación; el panel mostrará el pedido para revisarlo.
    console.error("capturePaypalOrder (marcar PAGADO):", error);
  }

  // Correo de confirmación (en segundo plano, después de responder).
  after(() => sendOrderConfirmationEmail(orderId));

  return { success: true, orderId };
}

/* ════════════════════════════ APARTADOS ════════════════════════════ */

/**
 * Antes de abrir PayPal: exige sesión, verifica que haya una pieza disponible
 * y calcula el anticipo (20%) con el precio vigente de la base.
 */
export async function createPaypalReservationOrder(input: {
  slug: string;
}): Promise<{ paypalOrderId: string | null; error?: CheckoutError }> {
  try {
    const user = await getOptionalUser();
    if (!user) return { paypalOrderId: null, error: "notAuthenticated" };

    const product = await prisma.product.findFirst({
      where: { slug: input.slug, isActive: true },
      select: { price: true, stock: true },
    });
    if (!product) return { paypalOrderId: null, error: "unavailable" };

    const available = await getAvailableUnits(prisma, input.slug, product.stock);
    if (available < 1) return { paypalOrderId: null, error: "unavailable" };

    const deposit = Math.round(product.price * RESERVATION_DEPOSIT_PERCENTAGE);
    if (deposit <= 0) return { paypalOrderId: null, error: "invalid" };

    const paypalOrderId = await createPaypalOrderApi(deposit);
    return { paypalOrderId };
  } catch (error) {
    console.error("createPaypalReservationOrder:", error);
    return { paypalOrderId: null, error: "serverError" };
  }
}

/**
 * El cliente aprobó el anticipo: crea el apartado (que bloquea la pieza),
 * cobra y, si el cobro falla, lo borra. La sesión se exige ANTES de cobrar.
 */
export async function capturePaypalReservationOrder(
  paypalOrderId: string,
  input: { productSnapshot: ProductSnapshot; locale: string },
): Promise<{ success: boolean; reservationId?: string; error?: CheckoutError }> {
  // Apartar requiere cuenta: se revisa ANTES de mover dinero.
  const user = await getOptionalUser();
  if (!user) return { success: false, error: "notAuthenticated" };

  const slug = input.productSnapshot.slug;
  const reservationId = makeBusinessId("APTD");
  // Anticipo que calcula el servidor; se compara con la orden de PayPal.
  let expectedDeposit = 0;

  // ── 1) Transacción: bloquear producto, verificar pieza, crear apartado ──
  try {
    await prisma.$transaction(async (tx) => {
      const product = await lockProduct(tx, slug);
      if (!product) throw new InventoryError(slug);

      const available = await getAvailableUnits(tx, slug, product.stock);
      if (available < 1) throw new InventoryError(slug);

      // Montos con el precio vigente de la base.
      const depositAmount = Math.round(
        product.price * RESERVATION_DEPOSIT_PERCENTAGE,
      );
      const remainingAmount = product.price - depositAmount;
      expectedDeposit = depositAmount;

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + RESERVATION_DURATION_DAYS);

      // Snapshot congelado: textos del navegador (ya traducidos) + precios de
      // la base. JSON.parse/stringify quita los undefined, que Prisma no
      // acepta en un campo JSON.
      const snapshot = JSON.parse(
        JSON.stringify({
          ...input.productSnapshot,
          price: product.price,
          originalPrice: product.originalPrice ?? undefined,
        }),
      ) as Prisma.InputJsonValue;

      await tx.reservation.create({
        data: {
          id: reservationId,
          profileId: user.id,
          productSnapshot: snapshot,
          depositAmount,
          remainingAmount,
          status: "ACTIVO", // bloquea la pieza desde ya
          deliveryMethod: null,
          expiresAt,
          completedAt: null,
          createdAt: now,
          paypalOrderId,
          // Idioma del cliente para los correos (Etapa 6B).
          locale: input.locale === "en" ? "en" : "es",
        },
      });
    });
  } catch (error) {
    if (error instanceof InventoryError) {
      return { success: false, error: "unavailable" };
    }
    console.error("capturePaypalReservationOrder (preparar):", error);
    return { success: false, error: "serverError" };
  }

  // ── 2) Cobrar el anticipo (solo si la orden es por el monto correcto) ──
  const captured = await verifyAndCapture(
    paypalOrderId,
    expectedDeposit,
    "capturePaypalReservationOrder",
  );

  // ── 3b) Cobro fallido: borrar el apartado (libera la pieza) ──
  if (!captured) {
    try {
      await prisma.reservation.delete({ where: { id: reservationId } });
    } catch (error) {
      console.error("capturePaypalReservationOrder (deshacer):", error);
    }
    return { success: false, error: "paymentFailed" };
  }

  // ── 3a) Cobro OK: el apartado ya existe y quedó ACTIVO ──
  // Correo de confirmación del anticipo (en segundo plano).
  after(() => sendReservationDepositEmail(reservationId, input.locale));

  return { success: true, reservationId };
}

/* ═════════════════════ COMPLETAR APARTADO (Etapa 5) ═════════════════════ */
/*
 *  El cliente paga el 80% restante (+ envío, si eligió envío a domicilio)
 *  desde "Mis apartados" → CompleteReservationModal → PaypalCompletionButton.
 *
 *  Reglas:
 *    - Solo el DUEÑO del apartado, con sesión iniciada.
 *    - Solo apartados ACTIVOS y VIGENTES (no vencidos): decisión de negocio.
 *    - El monto lo calcula el servidor: remainingAmount guardado en el
 *      apartado + costo del envío elegido.
 *
 *  Mismo orden seguro que los otros cobros:
 *    1. Transacción: marcar el apartado COMPLETADO (con entrega y dirección)
 *       y restar la pieza del stock. Si algo no cuadra → no se cobra.
 *    2. Confirmar el monto con PayPal y cobrar.
 *    3b. Si el cobro falla → se deshace: vuelve a ACTIVO, sin datos de
 *        entrega, y la pieza regresa al stock.
 */

/** Error interno para cortar la transacción con un motivo concreto. */
class CompletionError extends Error {
  constructor(public readonly code: CheckoutError) {
    super(code);
  }
}

/** Slug del producto guardado dentro del snapshot JSON del apartado. */
function reservationSlug(productSnapshot: Prisma.JsonValue): string {
  const snapshot = productSnapshot as { slug?: unknown } | null;
  return typeof snapshot?.slug === "string" ? snapshot.slug : "";
}

/**
 * Antes de abrir PayPal: revisa que el apartado se pueda completar y crea la
 * orden por el resto + envío. No cambia nada en la base.
 */
export async function createPaypalCompletionOrder(input: {
  reservationId: string;
  delivery: unknown;
}): Promise<{ paypalOrderId: string | null; error?: CheckoutError }> {
  try {
    const user = await getOptionalUser();
    if (!user) return { paypalOrderId: null, error: "notAuthenticated" };

    const delivery = parseCompletionDelivery(input.delivery);
    if (!delivery) return { paypalOrderId: null, error: "invalid" };

    const row = await prisma.reservation.findFirst({
      where: { id: input.reservationId, profileId: user.id },
      select: { status: true, expiresAt: true, remainingAmount: true },
    });
    if (!row || row.status !== "ACTIVO") {
      return { paypalOrderId: null, error: "invalid" };
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      return { paypalOrderId: null, error: "expired" };
    }

    const amount = row.remainingAmount + completionShippingCost(delivery);
    if (amount <= 0) return { paypalOrderId: null, error: "invalid" };

    const paypalOrderId = await createPaypalOrderApi(amount);
    return { paypalOrderId };
  } catch (error) {
    console.error("createPaypalCompletionOrder:", error);
    return { paypalOrderId: null, error: "serverError" };
  }
}

/**
 * El cliente aprobó el pago del resto: completa el apartado, cobra y, si el
 * cobro falla, lo regresa a ACTIVO. Devuelve la fecha de completado para que
 * "Mis apartados" se actualice sin recargar.
 */
export async function capturePaypalCompletionOrder(
  paypalOrderId: string,
  input: {
    reservationId: string;
    delivery: unknown;
    /** Idioma del cliente, solo para el correo de confirmación (Etapa 6A). */
    locale?: string;
  },
): Promise<{ success: boolean; completedAt?: string; error?: CheckoutError }> {
  // Sesión y datos se revisan ANTES de mover dinero.
  const user = await getOptionalUser();
  if (!user) return { success: false, error: "notAuthenticated" };

  const delivery = parseCompletionDelivery(input.delivery);
  if (!delivery) return { success: false, error: "invalid" };

  const shippingCost = completionShippingCost(delivery);
  const completedAt = new Date();

  // Datos que hacen falta después de la transacción (cobro y deshacer).
  let expectedAmount = 0;
  let slug = "";
  let expiresAt = completedAt;

  // ── 1) Transacción: completar el apartado y restar la pieza ──
  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.reservation.findFirst({
        where: { id: input.reservationId, profileId: user.id },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          remainingAmount: true,
          productSnapshot: true,
        },
      });
      if (!row || row.status !== "ACTIVO") throw new CompletionError("invalid");
      if (row.expiresAt.getTime() <= completedAt.getTime()) {
        throw new CompletionError("expired");
      }

      // Cambio CONDICIONADO a que siga ACTIVO: si llegan dos cobros al mismo
      // tiempo, Postgres bloquea la fila y solo uno encuentra "ACTIVO".
      const updated = await tx.reservation.updateMany({
        where: { id: row.id, status: "ACTIVO" },
        data: {
          status: "COMPLETADO",
          deliveryMethod: delivery.method,
          completedAt,
          completionPaypalOrderId: paypalOrderId,
          shippingMethodId:
            delivery.method === "shipping" ? delivery.shippingMethodId : null,
          shippingCost,
          shippingAddress:
            delivery.method === "shipping"
              ? (delivery.address as unknown as Prisma.InputJsonValue)
              : Prisma.DbNull,
        },
      });
      if (updated.count !== 1) throw new CompletionError("invalid");

      // Regla de inventario: ACTIVO → COMPLETADO resta la pieza apartada.
      slug = reservationSlug(row.productSnapshot);
      expiresAt = row.expiresAt;
      const { stockShortage } = await applyReservationStockChange(tx, {
        slug,
        from: "ACTIVO",
        to: "COMPLETADO",
        expiresAt: row.expiresAt,
      });
      if (stockShortage) throw new CompletionError("reservationUnavailable");

      expectedAmount = row.remainingAmount + shippingCost;
    });
  } catch (error) {
    if (error instanceof CompletionError) {
      return { success: false, error: error.code };
    }
    console.error("capturePaypalCompletionOrder (preparar):", error);
    return { success: false, error: "serverError" };
  }

  // ── 2) Cobrar (solo si la orden es por el resto + envío exactos) ──
  const captured = await verifyAndCapture(
    paypalOrderId,
    expectedAmount,
    "capturePaypalCompletionOrder",
  );

  // ── 3b) Cobro fallido: regresar a ACTIVO y devolver la pieza ──
  if (!captured) {
    try {
      await prisma.$transaction(async (tx) => {
        await applyReservationStockChange(tx, {
          slug,
          from: "COMPLETADO",
          to: "ACTIVO",
          expiresAt,
        });
        await tx.reservation.update({
          where: { id: input.reservationId },
          data: {
            status: "ACTIVO",
            deliveryMethod: null,
            completedAt: null,
            completionPaypalOrderId: null,
            shippingMethodId: null,
            shippingCost: 0,
            shippingAddress: Prisma.DbNull,
          },
        });
      });
    } catch (error) {
      // Queda COMPLETADO sin cobro: el panel lo muestra sin "pagado en
      // línea" para revisarlo a mano.
      console.error("capturePaypalCompletionOrder (deshacer):", error);
    }
    return { success: false, error: "paymentFailed" };
  }

  // ── 3a) Cobro OK: el apartado ya quedó COMPLETADO ──
  // Correo de confirmación de la liquidación (en segundo plano).
  after(() =>
    sendReservationCompletedEmail(input.reservationId, input.locale ?? "es"),
  );

  return { success: true, completedAt: completedAt.toISOString() };
}