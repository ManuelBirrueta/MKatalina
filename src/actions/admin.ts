/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: ADMIN · Fase 13 · Etapas 3C, 5 y 6B
 * ============================================================================
 *
 *  Acciones solo para administradores. Cada una verifica isCurrentUserAdmin()
 *  en el servidor (defensa en profundidad). Cubre PEDIDOS y APARTADOS:
 *  listar y cambiar estado.
 *
 *  CAMBIO DE LA ETAPA 3C — los cambios de estado mueven el STOCK:
 *    Pedidos:
 *      - a CANCELADO (desde cualquier otro) → las piezas vuelven al stock.
 *      - de CANCELADO a otro estado → se vuelven a restar, solo si alcanzan;
 *        si alguna no alcanza, el estado se guarda igual y se avisa con
 *        `stockShortage: true` para revisarlo a mano.
 *      - entre estados no cancelados (PAGADO → ENVIADO…) → sin cambios.
 *    Apartados: las reglas de src/lib/inventory.ts
 *      (applyReservationStockChange): COMPLETADO resta 1 pieza; deshacer un
 *      completado la devuelve.
 *  Todo dentro de una transacción: el estado y el stock cambian juntos.
 *
 *  CAMBIOS DE LA ETAPA 6B — ENVÍOS Y AVISOS AL CLIENTE:
 *    - shipOrder: marca un pedido como ENVIADO con su paquetería y número
 *      de guía (src/lib/shipping-carriers.ts). También sirve para CORREGIR
 *      la guía de un pedido ya enviado. Si notify = true, manda al cliente
 *      el correo "Tu pedido va en camino".
 *    - updateOrderStatus ya NO acepta ENVIADO (se usa shipOrder, que exige
 *      la guía). Al pasar a ENTREGADO guarda la fecha y, si notify = true,
 *      manda el correo "Tu pedido fue entregado".
 *    - shipReservation: lo mismo para apartados liquidados con envío.
 *    - getAllOrders / getAllReservations devuelven también la guía.
 *    Los correos salen con after() (después de responder) y, si fallan, el
 *    cambio de estado se conserva igual.
 *
 *  CAMBIO DE LA ETAPA 5 — getAllReservations trae también la ENTREGA de los
 *  apartados completados: método (recoger / envío), costo y dirección de
 *  envío, y si el resto se pagó EN LÍNEA (completionPaypalOrderId) o el
 *  admin lo marcó completado a mano (pago en tienda).
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { after } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { parseShipmentInput } from "@/lib/shipping-carriers";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendReservationShippedEmail,
} from "@/lib/email/transactional";
import type { DeliveryAddress } from "@/lib/reservation-delivery";
import {
  restoreStock,
  decrementStockIfAvailable,
  applyReservationStockChange,
} from "@/lib/inventory";

/* ─────────────────────────── PEDIDOS ─────────────────────────── */

const ORDER_STATUSES = [
  "PENDIENTE",
  "PAGADO",
  "PROCESANDO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
] as const;
type OrderStatusValue = (typeof ORDER_STATUSES)[number];

interface AdminOrder {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  itemCount: number;
  total: number;
  status: string;
  /** Envío (Etapa 6B). */
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export async function getAllOrders(): Promise<AdminOrder[]> {
  if (!(await isCurrentUserAdmin())) return [];

  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return rows.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    customerName: `${order.firstName} ${order.lastName}`.trim(),
    email: order.email,
    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
    total: order.total,
    status: order.status,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
  }));
}

/** Respuesta de los cambios de estado de pedidos. */
type OrderChangeResult = {
  success: boolean;
  stockShortage?: boolean;
  /** Estado que tenía antes (para decidir si se manda correo). */
  previousStatus?: string;
};

/**
 * Cambia el estado de un pedido y ajusta el stock si entra o sale de
 * CANCELADO (ver la cabecera). `extraData` agrega campos al mismo guardado
 * (guía, fechas de envío/entrega). Uso interno: no se exporta, así que solo
 * la llaman las acciones de abajo, que ya verificaron que eres admin.
 */
async function changeOrderStatus(
  orderId: string,
  newStatus: OrderStatusValue,
  extraData: {
    carrier?: string;
    trackingNumber?: string | null;
    shippedAt?: Date;
    deliveredAt?: Date;
  } = {},
): Promise<OrderChangeResult> {
  try {
    let previousStatus = "";
    const stockShortage = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { select: { productSlug: true, quantity: true } } },
      });
      if (!order) throw new Error("Pedido no encontrado");
      previousStatus = order.status;

      const lines = order.items.map((i) => ({
        slug: i.productSlug,
        quantity: i.quantity,
      }));
      let shortage = false;

      if (order.status !== "CANCELADO" && newStatus === "CANCELADO") {
        // Se cancela: las piezas regresan al inventario.
        await restoreStock(tx, lines);
      } else if (order.status === "CANCELADO" && newStatus !== "CANCELADO") {
        // Se reactiva: volver a restar solo lo que alcance.
        for (const line of lines) {
          const ok = await decrementStockIfAvailable(tx, line.slug, line.quantity);
          if (!ok) shortage = true;
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus, ...extraData },
      });
      return shortage;
    });

    return { success: true, stockShortage, previousStatus };
  } catch (error) {
    console.error("changeOrderStatus:", error);
    return { success: false };
  }
}

/**
 * Cambia el estado de un pedido desde el selector del panel.
 *   - ENVIADO no se acepta aquí: se usa shipOrder (pide la guía).
 *   - ENTREGADO guarda la fecha de entrega y, con notify = true, avisa al
 *     cliente por correo (solo si antes NO estaba entregado).
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  options: { notify?: boolean } = {},
): Promise<{ success: boolean; stockShortage?: boolean }> {
  if (!(await isCurrentUserAdmin())) return { success: false };
  if (!ORDER_STATUSES.includes(status as OrderStatusValue)) {
    return { success: false };
  }
  const newStatus = status as OrderStatusValue;
  if (newStatus === "ENVIADO") return { success: false };

  const result = await changeOrderStatus(
    orderId,
    newStatus,
    newStatus === "ENTREGADO" ? { deliveredAt: new Date() } : {},
  );

  if (
    result.success &&
    newStatus === "ENTREGADO" &&
    result.previousStatus !== "ENTREGADO" &&
    options.notify
  ) {
    after(() => sendOrderDeliveredEmail(orderId));
  }

  return { success: result.success, stockShortage: result.stockShortage };
}

/**
 * Marca un pedido como ENVIADO con su paquetería y guía (o corrige la guía
 * de uno ya enviado). Con notify = true manda "Tu pedido va en camino".
 */
export async function shipOrder(
  orderId: string,
  shipment: unknown,
  notify: boolean,
): Promise<{ success: boolean; stockShortage?: boolean; error?: "invalidShipment" }> {
  if (!(await isCurrentUserAdmin())) return { success: false };

  const data = parseShipmentInput(shipment);
  if (!data) return { success: false, error: "invalidShipment" };

  const result = await changeOrderStatus(orderId, "ENVIADO", {
    carrier: data.carrier,
    trackingNumber: data.trackingNumber,
    shippedAt: new Date(),
  });

  if (result.success && notify) {
    after(() => sendOrderShippedEmail(orderId));
  }

  return { success: result.success, stockShortage: result.stockShortage };
}

/* ─────────────────────────── APARTADOS ─────────────────────────── */

// Solo los estados que SE GUARDAN. "EXPIRADO" no se pone a mano: se calcula.
const RESERVATION_STATUSES = ["ACTIVO", "COMPLETADO", "CANCELADO"] as const;
type ReservationStatusValue = (typeof RESERVATION_STATUSES)[number];

interface AdminReservation {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  productName: string;
  depositAmount: number;
  remainingAmount: number;
  /** Estado guardado (editable): ACTIVO | COMPLETADO | CANCELADO */
  status: string;
  /** Estado efectivo (incluye EXPIRADO si venció estando activo) */
  effectiveStatus: string;
  expiresAt: string;
  /** "pickup" | "shipping" | null (se llena al completar). */
  deliveryMethod: string | null;
  /** "estandar" | "express" | null. */
  shippingMethodId: string | null;
  /** Costo del envío cobrado (0 si recoge o si aún no se completa). */
  shippingCost: number;
  /** Dirección congelada al completar con envío; null si no aplica. */
  shippingAddress: DeliveryAddress | null;
  completedAt: string | null;
  /** true si el resto se cobró con PayPal; false si se marcó a mano. */
  paidOnline: boolean;
  /** Envío de la pieza (Etapa 6B). */
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
}

export async function getAllReservations(): Promise<AdminReservation[]> {
  if (!(await isCurrentUserAdmin())) return [];

  const rows = await prisma.reservation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      profile: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  const now = Date.now();

  return rows.map((r) => {
    // El nombre del producto vive dentro del snapshot JSON.
    const snapshot = r.productSnapshot as unknown as { name?: string };
    const productName = typeof snapshot?.name === "string" ? snapshot.name : "";

    // "expirado" se calcula: activo + ya pasó la fecha de vencimiento.
    const isExpired = r.status === "ACTIVO" && r.expiresAt.getTime() < now;

    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      customerName: `${r.profile?.firstName ?? ""} ${r.profile?.lastName ?? ""}`.trim(),
      email: r.profile?.email ?? "",
      productName,
      depositAmount: r.depositAmount,
      remainingAmount: r.remainingAmount,
      status: r.status,
      effectiveStatus: isExpired ? "EXPIRADO" : r.status,
      expiresAt: r.expiresAt.toISOString(),
      deliveryMethod: r.deliveryMethod,
      shippingMethodId: r.shippingMethodId,
      shippingCost: r.shippingCost,
      shippingAddress: (r.shippingAddress as unknown as DeliveryAddress | null) ?? null,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      paidOnline: r.completionPaypalOrderId !== null,
      carrier: r.carrier,
      trackingNumber: r.trackingNumber,
      shippedAt: r.shippedAt ? r.shippedAt.toISOString() : null,
    };
  });
}

/**
 * Cambia el estado de un apartado y aplica su efecto en el stock
 * (COMPLETADO resta 1 pieza; deshacer un completado la devuelve).
 */
export async function updateReservationStatus(
  reservationId: string,
  status: string,
): Promise<{ success: boolean; stockShortage?: boolean }> {
  if (!(await isCurrentUserAdmin())) return { success: false };
  if (!RESERVATION_STATUSES.includes(status as ReservationStatusValue)) {
    return { success: false };
  }
  const newStatus = status as ReservationStatusValue;

  try {
    const stockShortage = await prisma.$transaction(async (tx) => {
      const row = await tx.reservation.findUnique({
        where: { id: reservationId },
      });
      if (!row) throw new Error("Apartado no encontrado");

      const snapshot = row.productSnapshot as unknown as { slug?: string };
      const { stockShortage: shortage } = await applyReservationStockChange(tx, {
        slug: typeof snapshot?.slug === "string" ? snapshot.slug : "",
        from: row.status,
        to: newStatus,
        expiresAt: row.expiresAt,
      });

      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: newStatus,
          // Al marcar COMPLETADO, registramos la fecha de completado.
          ...(newStatus === "COMPLETADO" ? { completedAt: new Date() } : {}),
        },
      });
      return shortage;
    });

    return { success: true, stockShortage };
  } catch (error) {
    console.error("updateReservationStatus:", error);
    return { success: false };
  }
}

/**
 * Marca como ENVIADA la pieza de un apartado liquidado con envío a domicilio
 * (o corrige su guía). Con notify = true manda al cliente "Tu pieza va en
 * camino". El estado del apartado sigue siendo COMPLETADO: el envío se
 * registra con la fecha shippedAt.
 */
export async function shipReservation(
  reservationId: string,
  shipment: unknown,
  notify: boolean,
): Promise<{ success: boolean; error?: "invalidShipment" | "notShippable" }> {
  if (!(await isCurrentUserAdmin())) return { success: false };

  const data = parseShipmentInput(shipment);
  if (!data) return { success: false, error: "invalidShipment" };

  try {
    // Solo apartados COMPLETADOS con envío a domicilio.
    const updated = await prisma.reservation.updateMany({
      where: {
        id: reservationId,
        status: "COMPLETADO",
        deliveryMethod: "shipping",
      },
      data: {
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        shippedAt: new Date(),
      },
    });
    if (updated.count !== 1) return { success: false, error: "notShippable" };
  } catch (error) {
    console.error("shipReservation:", error);
    return { success: false };
  }

  if (notify) {
    after(() => sendReservationShippedEmail(reservationId));
  }
  return { success: true };
}