/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: APARTADOS · Fase 13 · Etapa 5
 * ============================================================================
 *
 *  Acciones para los apartados del CLIENTE: leer y cancelar. Se llaman desde
 *  el hook useReservations y se ejecutan en el servidor.
 *  Los apartados se CREAN y se COMPLETAN en src/actions/paypal.ts, junto con
 *  su cobro real (anticipo: capturePaypalReservationOrder; resto + envío:
 *  capturePaypalCompletionOrder).
 *
 *  CAMBIO DE LA ETAPA 5:
 *    - Se ELIMINÓ completeReservationAction: marcaba el apartado como pagado
 *      sin cobrar el 80% restante y, como toda Server Action, cualquier
 *      cliente con sesión podía llamarla para "liquidar" sus apartados gratis.
 *
 *  CAMBIOS DE LAS ETAPAS 3C y 3D:
 *    - Se ELIMINÓ createReservationAction: creaba apartados sin cobrar el
 *      anticipo (época del pago simulado) y, como toda Server Action, era un
 *      punto de entrada público que cualquiera podía usar para bloquear
 *      piezas gratis.
 *    - cancelar aplica las reglas de stock de src/lib/inventory.ts (deshacer
 *      un completado devuelve la pieza) dentro de una transacción.
 *
 *  SEGURIDAD: el usuario se resuelve SIEMPRE en el servidor y cancelar solo
 *  afecta apartados de ese usuario (filtro por profileId).
 *
 *  "EXPIRADO" NO SE GUARDA: en la base solo viven ACTIVO / COMPLETADO /
 *  CANCELADO; "expirado" se calcula al leer comparando expiresAt.
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";
import type { Reservation as PrismaReservation } from "@prisma/client";
import type {
  Reservation,
  DeliveryMethod,
  ProductSnapshot,
} from "@/types/reservation";
import { applyReservationStockChange } from "@/lib/inventory";

/**
 * Mapea el estado de la base (español, mayúsculas) al de la app.
 * "EXPIRADO" no se persiste; si apareciera, se trata como "active"
 * (getEffectiveStatus recalcula la expiración al leer).
 */
function dbStatusToApp(status: string): "active" | "completed" | "cancelled" {
  switch (status) {
    case "COMPLETADO":
      return "completed";
    case "CANCELADO":
      return "cancelled";
    default:
      return "active";
  }
}

/** Convierte una fila de la base al tipo Reservation que espera la app. */
function toAppReservation(row: PrismaReservation): Reservation {
  return {
    id: row.id,
    userId: row.profileId,
    product: row.productSnapshot as unknown as ProductSnapshot,
    depositAmount: row.depositAmount,
    remainingAmount: row.remainingAmount,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    status: dbStatusToApp(row.status),
    deliveryMethod: (row.deliveryMethod as DeliveryMethod) ?? null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

/** Slug del producto guardado dentro del snapshot JSON del apartado. */
function snapshotSlug(row: PrismaReservation): string {
  const snapshot = row.productSnapshot as unknown as { slug?: string };
  return typeof snapshot?.slug === "string" ? snapshot.slug : "";
}

/** Devuelve los apartados del usuario actual (más reciente primero). */
export async function getMyReservations(): Promise<Reservation[]> {
  const user = await getOptionalUser();
  if (!user) return [];

  const rows = await prisma.reservation.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toAppReservation);
}

/**
 * Cancela un apartado del usuario (el anticipo no se devuelve; regla de
 * negocio reflejada en la UI). Cancelar un ACTIVO libera la pieza sin tocar
 * el stock; si estaba COMPLETADO, la pieza vuelve al stock.
 */
export async function cancelReservationAction(
  reservationId: string,
): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  await prisma.$transaction(async (tx) => {
    const row = await tx.reservation.findFirst({
      where: { id: reservationId, profileId: user.id },
    });
    if (!row || row.status === "CANCELADO") return;

    await applyReservationStockChange(tx, {
      slug: snapshotSlug(row),
      from: row.status,
      to: "CANCELADO",
      expiresAt: row.expiresAt,
    });

    await tx.reservation.update({
      where: { id: row.id },
      data: { status: "CANCELADO" },
    });
  });
}