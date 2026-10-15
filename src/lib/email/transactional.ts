/**
 * ============================================================================
 *  MKatalina · Correos al cliente: buscar datos y enviar · Fase 13 · Etapas 6A, 6B y 7
 * ============================================================================
 *
 *  Une las tres piezas del sistema de correos:
 *    1. Lee de la base el pedido o apartado (Prisma).
 *    2. Arma el correo con la plantilla (src/lib/email/templates.ts).
 *    3. Lo manda con Resend (src/lib/email/send.ts).
 *
 *  Quién las llama (siempre dentro de after() de Next.js, para no hacer
 *  esperar a nadie):
 *    - Confirmaciones de compra → acciones de cobro de src/actions/paypal.ts.
 *    - Avisos de envío/entrega (Etapa 6B) → acciones del panel en
 *      src/actions/admin.ts (shipOrder, updateOrderStatus, shipReservation).
 *
 *  ETAPA 7: las direcciones llevan el país, y el nombre del método de envío
 *  sale de src/lib/shipping-rates.ts (incluye el internacional).
 *
 *  IDIOMA: los pedidos guardan su idioma (order.locale). Desde la Etapa 6B
 *  los apartados también (reservation.locale); los apartados anteriores a
 *  esa etapa quedaron en "es".
 *
 *  Ninguna función lanza errores: si algo falla (el pedido no aparece, Resend
 *  no responde…), se anota en la consola y listo. Un correo nunca debe
 *  deshacer ni bloquear una compra.
 *
 *  ¿Por qué se lee de la BASE y no se reciben los datos ya armados? Porque la
 *  base tiene la versión final y confiable (precios cobrados, dirección
 *  congelada). Así el correo dice exactamente lo que quedó registrado.
 * ============================================================================
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail, getSiteUrl } from "./send";
import { toEmailLocale } from "./layout";
import { shippingMethodLabel } from "@/lib/shipping-rates";
import {
  orderConfirmationEmail,
  reservationDepositEmail,
  reservationCompletedEmail,
  shipmentEmail,
  orderDeliveredEmail,
  type EmailAddress,
} from "./templates";
import {
  carrierLabel,
  carrierNeedsPaste,
  carrierTrackingUrl,
} from "@/lib/shipping-carriers";


/** Datos del producto guardados en el snapshot JSON del apartado. */
function readSnapshot(snapshot: unknown): { name: string; price: number } {
  const s = (snapshot ?? {}) as { name?: unknown; price?: unknown };
  return {
    name: typeof s.name === "string" ? s.name : "",
    price: typeof s.price === "number" ? s.price : 0,
  };
}

/** Dirección guardada como JSON en el apartado (Etapa 5) → formato del correo. */
function readReservationAddress(value: unknown): EmailAddress | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;
  const str = (key: string) => (typeof a[key] === "string" ? (a[key] as string) : "");
  return {
    firstName: str("firstName"),
    lastName: str("lastName"),
    phone: str("phone"),
    address: str("address"),
    addressLine2: str("addressLine2") || null,
    neighborhood: str("neighborhood"),
    city: str("city"),
    state: str("state"),
    postalCode: str("postalCode"),
    notes: str("notes") || null,
    country: str("country") || null,
  };
}

/* ─────────────────────────────── Pedido pagado ─────────────────────────────── */

/** Confirmación de un pedido del carrito ya cobrado. */
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      console.error(`[email] No se encontró el pedido ${orderId} para su confirmación.`);
      return;
    }

    const locale = toEmailLocale(order.locale);
    const email = orderConfirmationEmail(
      {
        id: order.id,
        createdAt: order.createdAt,
        firstName: order.firstName,
        items: order.items.map((item) => ({
          name: item.nameSnapshot,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        subtotal: order.subtotal,
        shippingLabel: order.shippingLabel,
        shippingCost: order.shippingCost,
        total: order.total,
        address: {
          firstName: order.firstName,
          lastName: order.lastName,
          phone: order.phone,
          address: order.address,
          addressLine2: order.addressLine2,
          neighborhood: order.neighborhood,
          city: order.city,
          state: order.state,
          postalCode: order.postalCode,
          notes: order.notes,
          country: order.country,
        },
        hasAccount: order.profileId !== null,
      },
      locale,
      getSiteUrl(),
    );

    await sendEmail({ to: order.email, ...email });
  } catch (error) {
    console.error(`[email] Falló la confirmación del pedido ${orderId}:`, error);
  }
}

/* ─────────────────────────── Anticipo de apartado ─────────────────────────── */

/**
 * Confirmación del anticipo (apartado recién creado). `localeInput` es el
 * idioma que mandó el navegador; si el apartado ya lo tiene guardado, se usa
 * el guardado.
 */
export async function sendReservationDepositEmail(
  reservationId: string,
  localeInput?: string,
): Promise<void> {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { profile: { select: { email: true, firstName: true } } },
    });
    if (!reservation?.profile) {
      console.error(`[email] No se encontró el apartado ${reservationId} para su confirmación.`);
      return;
    }

    const locale = toEmailLocale(reservation.locale ?? localeInput);
    const product = readSnapshot(reservation.productSnapshot);
    const email = reservationDepositEmail(
      {
        id: reservation.id,
        firstName: reservation.profile.firstName,
        productName: product.name,
        productPrice: product.price,
        depositAmount: reservation.depositAmount,
        remainingAmount: reservation.remainingAmount,
        expiresAt: reservation.expiresAt,
      },
      locale,
      getSiteUrl(),
    );

    await sendEmail({ to: reservation.profile.email, ...email });
  } catch (error) {
    console.error(`[email] Falló la confirmación del apartado ${reservationId}:`, error);
  }
}

/* ─────────────────────────── Apartado liquidado ─────────────────────────── */

/** Confirmación del pago del resto (apartado completado). */
export async function sendReservationCompletedEmail(
  reservationId: string,
  localeInput?: string,
): Promise<void> {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { profile: { select: { email: true, firstName: true } } },
    });
    if (!reservation?.profile) {
      console.error(`[email] No se encontró el apartado ${reservationId} para su confirmación.`);
      return;
    }

    const locale = toEmailLocale(reservation.locale ?? localeInput);
    const product = readSnapshot(reservation.productSnapshot);
    const isShipping = reservation.deliveryMethod === "shipping";
    const address = isShipping ? readReservationAddress(reservation.shippingAddress) : null;

    const email = reservationCompletedEmail(
      {
        id: reservation.id,
        // Si dio dirección, se usa ese nombre; si no, el de su perfil.
        firstName: address?.firstName || reservation.profile.firstName,
        productName: product.name,
        productPrice: product.price,
        depositAmount: reservation.depositAmount,
        remainingAmount: reservation.remainingAmount,
        deliveryMethod: isShipping ? "shipping" : "pickup",
        shippingLabel: isShipping
          ? shippingMethodLabel(reservation.shippingMethodId, locale) || null
          : null,
        shippingCost: reservation.shippingCost,
        address,
      },
      locale,
      getSiteUrl(),
    );

    await sendEmail({ to: reservation.profile.email, ...email });
  } catch (error) {
    console.error(`[email] Falló la confirmación de liquidación ${reservationId}:`, error);
  }
}

/* ─────────────────────── Avisos de envío (Etapa 6B) ─────────────────────── */

/** Dirección de un pedido en el formato del correo. */
function orderAddress(order: {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  addressLine2: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string | null;
  country: string;
}): EmailAddress {
  return {
    firstName: order.firstName,
    lastName: order.lastName,
    phone: order.phone,
    address: order.address,
    addressLine2: order.addressLine2,
    neighborhood: order.neighborhood,
    city: order.city,
    state: order.state,
    postalCode: order.postalCode,
    notes: order.notes,
    country: order.country,
  };
}

/** "Tu pedido va en camino" (pedido marcado como ENVIADO). */
export async function sendOrderShippedEmail(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order?.carrier) {
      console.error(`[email] El pedido ${orderId} no tiene datos de envío.`);
      return;
    }

    const locale = toEmailLocale(order.locale);
    const siteUrl = getSiteUrl();
    const email = shipmentEmail(
      {
        kind: "order",
        id: order.id,
        firstName: order.firstName,
        items: order.items.map((i) => ({ name: i.nameSnapshot, quantity: i.quantity })),
        carrierName: carrierLabel(order.carrier, locale),
        trackingNumber: order.trackingNumber,
        trackingUrl: carrierTrackingUrl(order.carrier, order.trackingNumber),
        pasteNumber: carrierNeedsPaste(order.carrier),
        address: orderAddress(order),
        accountUrl: order.profileId
          ? `${siteUrl}/${locale}/mis-pedidos/${encodeURIComponent(order.id)}`
          : null,
      },
      locale,
      siteUrl,
    );

    await sendEmail({ to: order.email, ...email });
  } catch (error) {
    console.error(`[email] Falló el aviso de envío del pedido ${orderId}:`, error);
  }
}

/** "Tu pedido fue entregado" (pedido marcado como ENTREGADO). */
export async function sendOrderDeliveredEmail(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      console.error(`[email] No se encontró el pedido ${orderId} (entregado).`);
      return;
    }

    const locale = toEmailLocale(order.locale);
    const siteUrl = getSiteUrl();
    const email = orderDeliveredEmail(
      {
        id: order.id,
        firstName: order.firstName,
        items: order.items.map((i) => ({ name: i.nameSnapshot, quantity: i.quantity })),
        accountUrl: order.profileId ? `${siteUrl}/${locale}/mis-pedidos` : null,
      },
      locale,
      siteUrl,
    );

    await sendEmail({ to: order.email, ...email });
  } catch (error) {
    console.error(`[email] Falló el aviso de entrega del pedido ${orderId}:`, error);
  }
}

/** "Tu pieza va en camino" (apartado liquidado, marcado como enviado). */
export async function sendReservationShippedEmail(reservationId: string): Promise<void> {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { profile: { select: { email: true, firstName: true } } },
    });
    if (!reservation?.profile || !reservation.carrier) {
      console.error(`[email] El apartado ${reservationId} no tiene datos de envío.`);
      return;
    }

    const locale = toEmailLocale(reservation.locale);
    const siteUrl = getSiteUrl();
    const product = readSnapshot(reservation.productSnapshot);
    const address = readReservationAddress(reservation.shippingAddress);

    const email = shipmentEmail(
      {
        kind: "reservation",
        id: reservation.id,
        firstName: address?.firstName || reservation.profile.firstName,
        items: [{ name: product.name, quantity: 1 }],
        carrierName: carrierLabel(reservation.carrier, locale),
        trackingNumber: reservation.trackingNumber,
        trackingUrl: carrierTrackingUrl(reservation.carrier, reservation.trackingNumber),
        pasteNumber: carrierNeedsPaste(reservation.carrier),
        address,
        accountUrl: `${siteUrl}/${locale}/mis-apartados`,
      },
      locale,
      siteUrl,
    );

    await sendEmail({ to: reservation.profile.email, ...email });
  } catch (error) {
    console.error(`[email] Falló el aviso de envío del apartado ${reservationId}:`, error);
  }
}