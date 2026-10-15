/**
 * ============================================================================
 *  MKatalina · INVENTARIO (stock y apartados) · Fase 13 · Etapa 3C
 * ============================================================================
 *
 *  Todas las reglas de stock viven aquí, para que pedidos, apartados y el
 *  panel de administración las apliquen exactamente igual.
 *
 *  ── LA REGLA DE DISPONIBILIDAD ──────────────────────────────────────────
 *
 *      disponibles = stock − apartados ACTIVOS no vencidos
 *
 *  Un apartado bloquea una pieza durante sus 5 días SIN restarla del stock.
 *  Ventaja: cuando un apartado vence, la pieza se libera sola (deja de
 *  contar), sin tareas automáticas ni devoluciones de stock.
 *  El stock se resta "de verdad" solo cuando:
 *    - se paga un pedido, o
 *    - un apartado pasa a COMPLETADO.
 *
 *  ── POR QUÉ "BLOQUEAR LA FILA" (lockProduct) ────────────────────────────
 *
 *  Si queda 1 pieza y dos clientes pagan al mismo tiempo, ambos podrían leer
 *  "queda 1" y venderse 2. Para evitarlo, antes de revisar disponibilidad se
 *  BLOQUEA la fila del producto (SELECT … FOR UPDATE) dentro de una
 *  transacción: el segundo cliente espera a que termine el primero y luego
 *  ve el stock ya actualizado. Pedidos y apartados bloquean la misma fila,
 *  así que también se ordenan entre sí.
 *
 *  SOLO SERVIDOR (usa Prisma).
 * ============================================================================
 */

import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Cliente de base dentro de una transacción (o el normal, para lecturas). */
type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Error de negocio: no hay piezas suficientes de un producto (o ya no está
 * visible). Las acciones lo atrapan y responden "unavailable" sin cobrar.
 */
export class InventoryError extends Error {
  constructor(public readonly slug: string) {
    super(`Sin disponibilidad suficiente: ${slug}`);
    this.name = "InventoryError";
  }
}

/** Datos mínimos de un producto bloqueado para cobrarlo. */
export interface LockedProduct {
  id: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  stock: number;
}

/**
 * Cuántos apartados están bloqueando piezas de un producto ahora mismo:
 * estado ACTIVO y fecha de vencimiento en el futuro. El slug vive dentro del
 * snapshot JSON del apartado (productSnapshot.slug).
 */
export async function countActiveReservations(
  db: Db,
  slug: string,
): Promise<number> {
  return db.reservation.count({
    where: {
      status: "ACTIVO",
      expiresAt: { gt: new Date() },
      productSnapshot: { path: ["slug"], equals: slug },
    },
  });
}

/**
 * Bloquea la fila de un producto VISIBLE hasta que termine la transacción y
 * devuelve su precio y stock actuales. null si no existe o está retirado.
 * DEBE llamarse dentro de prisma.$transaction(async (tx) => …).
 */
export async function lockProduct(
  tx: Prisma.TransactionClient,
  slug: string,
): Promise<LockedProduct | null> {
  // Consulta parametrizada: ${slug} viaja como parámetro, no se pega al SQL
  // (sin riesgo de inyección). Los nombres en camelCase van entre comillas
  // porque así se crearon las columnas.
  const rows = await tx.$queryRaw<LockedProduct[]>`
    SELECT "id", "slug", "price", "originalPrice", "stock"
    FROM "products"
    WHERE "slug" = ${slug} AND "isActive" = true
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

/** Piezas disponibles de un producto: stock − apartados activos (mínimo 0). */
export async function getAvailableUnits(
  db: Db,
  slug: string,
  stock: number,
): Promise<number> {
  const blocked = await countActiveReservations(db, slug);
  return Math.max(0, stock - blocked);
}

/**
 * Junta renglones repetidos del mismo producto y limpia cantidades
 * (enteras, entre 1 y 99). Lo que mande el navegador nunca se usa tal cual.
 */
export function normalizeItems(
  items: { slug: string; quantity: number }[],
): { slug: string; quantity: number }[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const qty = Math.floor(Number(item.quantity));
    if (!item.slug || !Number.isFinite(qty) || qty < 1) continue;
    totals.set(item.slug, Math.min(99, (totals.get(item.slug) ?? 0) + qty));
  }
  return [...totals].map(([slug, quantity]) => ({ slug, quantity }));
}

/**
 * Revisa (SIN bloquear ni restar) si hay piezas para todos los renglones.
 * Se usa ANTES de abrir PayPal para avisar pronto. Devuelve los slugs que
 * no alcanzan (lista vacía = todo disponible).
 */
export async function findUnavailableItems(
  items: { slug: string; quantity: number }[],
): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { slug: { in: items.map((i) => i.slug) }, isActive: true },
    select: { slug: true, stock: true },
  });
  const stockBySlug = new Map(products.map((p) => [p.slug, p.stock]));

  const unavailable: string[] = [];
  for (const item of items) {
    const stock = stockBySlug.get(item.slug);
    if (stock === undefined) {
      unavailable.push(item.slug); // no existe o está retirado
      continue;
    }
    const available = await getAvailableUnits(prisma, item.slug, stock);
    if (available < item.quantity) unavailable.push(item.slug);
  }
  return unavailable;
}

/**
 * PEDIDO: bloquea cada producto, verifica disponibilidad y RESTA el stock.
 * Lanza InventoryError si alguno no alcanza (la transacción completa se
 * deshace y no se resta nada). Devuelve los productos bloqueados (precios
 * reales de la base) para armar el pedido.
 *
 * Los productos se bloquean en orden alfabético de slug: si dos pedidos
 * comparten productos, ambos los toman en el mismo orden y no pueden
 * quedarse esperándose el uno al otro (lo que se llama un "deadlock").
 */
export async function reserveStockForOrder(
  tx: Prisma.TransactionClient,
  items: { slug: string; quantity: number }[],
): Promise<Map<string, LockedProduct>> {
  const locked = new Map<string, LockedProduct>();
  const sorted = [...items].sort((a, b) => a.slug.localeCompare(b.slug));

  for (const item of sorted) {
    const product = await lockProduct(tx, item.slug);
    if (!product) throw new InventoryError(item.slug);

    const available = await getAvailableUnits(tx, item.slug, product.stock);
    if (available < item.quantity) throw new InventoryError(item.slug);

    await tx.product.update({
      where: { id: product.id },
      data: { stock: { decrement: item.quantity } },
    });
    locked.set(item.slug, product);
  }
  return locked;
}

/**
 * Devuelve piezas al stock (pago fallido, pedido cancelado…). Si el producto
 * ya no existe, no hace nada. No exige que esté visible: un producto retirado
 * también recupera su inventario.
 */
export async function restoreStock(
  db: Db,
  items: { slug: string; quantity: number }[],
): Promise<void> {
  for (const item of items) {
    await db.product.updateMany({
      where: { slug: item.slug },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/**
 * Resta piezas solo si alcanzan (stock ≥ cantidad). Devuelve false si no
 * alcanzaba (no resta nada). Para reactivar pedidos cancelados y completar
 * apartados vencidos, casos donde la pieza pudo venderse mientras tanto.
 */
export async function decrementStockIfAvailable(
  db: Db,
  slug: string,
  quantity: number,
): Promise<boolean> {
  const result = await db.product.updateMany({
    where: { slug, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  return result.count > 0;
}

/**
 * Efecto en el stock de cambiar el estado de un APARTADO. Centraliza las
 * reglas para que el cliente y el panel hagan lo mismo:
 *
 *   ACTIVO → COMPLETADO : resta 1. Mientras estaba activo y vigente la pieza
 *                         estaba bloqueada para él, así que debe alcanzar. Si
 *                         ya había vencido, la pieza pudo venderse: se resta
 *                         solo si alcanza, y si no, se avisa (stockShortage).
 *   COMPLETADO → otro   : devuelve 1 (se deshizo la venta).
 *   cualquier otro      : no toca el stock (ACTIVO ↔ CANCELADO solo deja o
 *                         vuelve a bloquear, lo que ya calcula la regla de
 *                         disponibilidad).
 *
 * Devuelve { stockShortage: true } si se completó sin pieza en inventario.
 */
export async function applyReservationStockChange(
  tx: Prisma.TransactionClient,
  params: {
    slug: string;
    from: string;
    to: string;
    expiresAt: Date;
  },
): Promise<{ stockShortage: boolean }> {
  const { slug, from, to, expiresAt } = params;

  if (from === "ACTIVO" && to === "COMPLETADO") {
    const wasBlocking = expiresAt.getTime() > Date.now();
    if (wasBlocking) {
      // Su pieza estaba bloqueada: se resta si hay al menos 1.
      const ok = await decrementStockIfAvailable(tx, slug, 1);
      return { stockShortage: !ok };
    }
    // Vencido: solo si hay una pieza libre (no bloqueada por otro apartado).
    const product = await lockProduct(tx, slug);
    if (!product) return { stockShortage: true };
    const available = await getAvailableUnits(tx, slug, product.stock);
    if (available < 1) return { stockShortage: true };
    await tx.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 1 } },
    });
    return { stockShortage: false };
  }

  if (from === "COMPLETADO" && to !== "COMPLETADO") {
    await restoreStock(tx, [{ slug, quantity: 1 }]);
  }

  return { stockShortage: false };
}