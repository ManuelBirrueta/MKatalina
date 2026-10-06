/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: ADMIN · Fase 13
 * ============================================================================
 *
 *  Acciones solo para administradores. Cada una verifica isCurrentUserAdmin()
 *  en el servidor (defensa en profundidad).
 *
 *  Cubre PEDIDOS y APARTADOS: listar y cambiar estado.
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { isCurrentUserAdmin } from "@/lib/auth";

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
  }));
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ success: boolean }> {
  if (!(await isCurrentUserAdmin())) return { success: false };
  if (!ORDER_STATUSES.includes(status as OrderStatusValue)) {
    return { success: false };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatusValue },
  });

  return { success: true };
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
    const productName =
      typeof snapshot?.name === "string" ? snapshot.name : "";

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
    };
  });
}

export async function updateReservationStatus(
  reservationId: string,
  status: string,
): Promise<{ success: boolean }> {
  if (!(await isCurrentUserAdmin())) return { success: false };
  if (!RESERVATION_STATUSES.includes(status as ReservationStatusValue)) {
    return { success: false };
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: status as ReservationStatusValue,
      // Al marcar COMPLETADO, registramos la fecha de completado.
      ...(status === "COMPLETADO" ? { completedAt: new Date() } : {}),
    },
  });

  return { success: true };
}