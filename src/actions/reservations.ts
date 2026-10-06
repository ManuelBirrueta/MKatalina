/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: APARTADOS · Fase 13 · Etapa 3
 * ============================================================================
 *
 *  QUÉ ES ESTE ARCHIVO
 *  -------------------
 *  Acciones de servidor ("use server") para los apartados: leer, crear,
 *  completar y cancelar. Se llaman desde el hook useReservations (cliente) y
 *  se ejecutan en el servidor, donde Prisma escribe en la base.
 *
 *  SNAPSHOT INMUTABLE
 *  ------------------
 *  Un apartado es un DOCUMENTO: guarda una copia congelada del producto
 *  (nombre ya resuelto al idioma, precio, imagen, etc.) en la columna JSON
 *  `productSnapshot`. Si el catálogo cambia después, el apartado no se altera.
 *
 *  SEGURIDAD
 *  ---------
 *  - El usuario se resuelve SIEMPRE en el servidor (getOptionalUser); nunca se
 *    confía en un userId del cliente.
 *  - Al crear, los MONTOS se recalculan desde el precio REAL del producto (no
 *    se confía en los que mande el cliente). Cuando en la Etapa 4 haya pago
 *    real, aquí también se generará el id y el snapshot del lado del servidor.
 *  - Completar/cancelar están acotados por profileId: un usuario solo puede
 *    tocar SUS apartados.
 *
 *  EL ESTADO "EXPIRADO" NO SE GUARDA
 *  ---------------------------------
 *  En la base solo viven ACTIVO / COMPLETADO / CANCELADO. "Expirado" se
 *  calcula al leer, comparando expiresAt con la fecha actual (getEffectiveStatus).
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";
import { productsData } from "@/data/products";
import { Prisma } from "@prisma/client";
import type { Reservation as PrismaReservation } from "@prisma/client";
import {
  RESERVATION_DEPOSIT_PERCENTAGE,
  RESERVATION_DURATION_DAYS,
  type Reservation,
  type DeliveryMethod,
  type ProductSnapshot,
} from "@/types/reservation";

/**
 * Mapea el estado de la base (español, mayúsculas) al de la app.
 * "EXPIRADO" no se persiste, pero si apareciera lo tratamos como "active"
 * (getEffectiveStatus recalculará la expiración al leer).
 */
function dbStatusToApp(
  status: string,
): "active" | "completed" | "cancelled" {
  switch (status) {
    case "COMPLETADO":
      return "completed";
    case "CANCELADO":
      return "cancelled";
    default:
      return "active";
  }
}

/**
 * Convierte una fila de la base al tipo Reservation que espera la app.
 */
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

/**
 * Devuelve los apartados del usuario actual (más reciente primero).
 */
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
 * Crea un apartado. Recalcula montos y vencimiento en el servidor por seguridad.
 */
export async function createReservationAction(
  reservation: Reservation,
): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  // Montos desde el precio REAL del producto (no confiamos en el cliente).
  const product = productsData.find(
    (p) => p.slug === reservation.product.slug,
  );
  const price = product?.price ?? reservation.product.price;
  const depositAmount = Math.round(price * RESERVATION_DEPOSIT_PERCENTAGE);
  const remainingAmount = price - depositAmount;

  // Vencimiento = creación + 5 días (recomputado, no confiamos en el cliente).
  const createdAt = new Date(reservation.createdAt);
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + RESERVATION_DURATION_DAYS);

  // Limpiamos el snapshot: JSON.parse(JSON.stringify(...)) quita propiedades
  // undefined (como originalPrice cuando no hay oferta), que Prisma no acepta
  // en un campo JSON.
  const snapshot = JSON.parse(
    JSON.stringify(reservation.product),
  ) as Prisma.InputJsonValue;

  await prisma.reservation.create({
    data: {
      id: reservation.id,
      profileId: user.id,
      productSnapshot: snapshot,
      depositAmount,
      remainingAmount,
      status: "ACTIVO",
      deliveryMethod: null,
      expiresAt,
      completedAt: null,
      createdAt,
    },
  });
}

/**
 * Marca un apartado como completado (pago del restante) y guarda el método de
 * entrega. updateMany acotado por profileId: solo afecta apartados del usuario.
 */
export async function completeReservationAction(
  reservationId: string,
  deliveryMethod: DeliveryMethod,
): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  await prisma.reservation.updateMany({
    where: { id: reservationId, profileId: user.id },
    data: {
      status: "COMPLETADO",
      deliveryMethod: deliveryMethod ?? null,
      completedAt: new Date(),
    },
  });
}

/**
 * Cancela un apartado (el anticipo no se devuelve; esa regla es de negocio y
 * se refleja en la UI). Acotado por profileId.
 */
export async function cancelReservationAction(
  reservationId: string,
): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  await prisma.reservation.updateMany({
    where: { id: reservationId, profileId: user.id },
    data: { status: "CANCELADO" },
  });
}