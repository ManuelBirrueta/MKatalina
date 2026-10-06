/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: CARRITO · Fase 13 · Etapa 3
 * ============================================================================
 *
 *  El carrito es distinto a wishlist/apartados: funciona para invitados
 *  (localStorage, sin cuenta) y para usuarios con sesión (base de datos). Estas
 *  acciones cubren SOLO la parte de la base (usuarios con sesión). La parte de
 *  invitado (localStorage) la maneja el hook, en el cliente.
 *
 *  Estrategia de guardado: "reemplazar todo". En cada cambio, el hook manda la
 *  lista completa del carrito y aquí borramos e insertamos de nuevo dentro de
 *  una transacción. Es simple y siempre consistente; los carritos son chicos
 *  (1-10 items), así que el costo es despreciable.
 *
 *  FUSIÓN: mergeGuestCartIntoDb combina el carrito de invitado con el de la
 *  base SUMANDO cantidades (tope 99), y devuelve el resultado.
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";
import type { CartItem } from "@/stores/cart-store";

/**
 * Limpia y combina una lista de items: agrupa por slug sumando cantidades y
 * acota cada cantidad al rango 1..99. Sirve tanto para guardar como para fusionar.
 */
function sanitize(items: CartItem[]): CartItem[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item?.slug) continue;
    const qty = Math.min(99, Math.max(1, Math.floor(item.quantity)));
    map.set(item.slug, Math.min(99, (map.get(item.slug) ?? 0) + qty));
  }
  return [...map.entries()].map(([slug, quantity]) => ({ slug, quantity }));
}

/** Devuelve el carrito del usuario actual (vacío si no hay sesión). */
export async function getMyCart(): Promise<CartItem[]> {
  const user = await getOptionalUser();
  if (!user) return [];

  const rows = await prisma.cartItem.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "asc" },
    select: { productSlug: true, quantity: true },
  });

  return rows.map((row) => ({ slug: row.productSlug, quantity: row.quantity }));
}

/**
 * Reemplaza por completo el carrito del usuario con la lista dada.
 * Se llama en cada cambio mientras hay sesión (guardado optimista en 2° plano).
 */
export async function saveMyCart(items: CartItem[]): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  const clean = sanitize(items);

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { profileId: user.id } }),
    ...(clean.length > 0
      ? [
          prisma.cartItem.createMany({
            data: clean.map((item) => ({
              profileId: user.id,
              productSlug: item.slug,
              quantity: item.quantity,
            })),
          }),
        ]
      : []),
  ]);
}

/**
 * Fusiona el carrito de invitado con el del usuario en la base (suma
 * cantidades, tope 99) y devuelve el resultado. Se llama UNA vez, al iniciar
 * sesión, si el invitado traía cosas en su carrito local.
 */
export async function mergeGuestCartIntoDb(
  guestItems: CartItem[],
): Promise<CartItem[]> {
  const user = await getOptionalUser();
  if (!user) return [];

  const existingRows = await prisma.cartItem.findMany({
    where: { profileId: user.id },
    select: { productSlug: true, quantity: true },
  });
  const existing: CartItem[] = existingRows.map((row) => ({
    slug: row.productSlug,
    quantity: row.quantity,
  }));

  // Combinar (sanitize agrupa por slug y suma) y volver a guardar.
  const merged = sanitize([...existing, ...guestItems]);

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { profileId: user.id } }),
    ...(merged.length > 0
      ? [
          prisma.cartItem.createMany({
            data: merged.map((item) => ({
              profileId: user.id,
              productSlug: item.slug,
              quantity: item.quantity,
            })),
          }),
        ]
      : []),
  ]);

  return merged;
}