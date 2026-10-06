/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: WISHLIST · Fase 13 · Etapa 3
 * ============================================================================
 *
 *  QUÉ ES ESTE ARCHIVO
 *  -------------------
 *  "use server" al inicio marca TODO lo de este archivo como "acciones de
 *  servidor": funciones que se ESCRIBEN aquí pero se pueden LLAMAR desde el
 *  cliente (por ejemplo, desde el hook useWishlist). Cuando el cliente las
 *  llama, Next.js las ejecuta en el servidor de forma segura. Son el puente
 *  entre la UI (cliente) y Prisma (que solo corre en el servidor).
 *
 *  SEGURIDAD
 *  ---------
 *  Cada acción averigua QUIÉN es el usuario con getOptionalUser() (que valida
 *  la sesión con Supabase). Nunca confiamos en un userId que venga del cliente:
 *  el usuario siempre se resuelve aquí, en el servidor. Así, un usuario solo
 *  puede tocar SU propia wishlist.
 *
 *  La wishlist REQUIERE sesión. Si no hay usuario, las acciones simplemente no
 *  hacen nada (la UI ya evita llegar aquí sin sesión, pero validamos igual).
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";

/**
 * Devuelve los slugs de la wishlist del usuario actual, del más reciente al
 * más antiguo. Si no hay sesión, devuelve lista vacía.
 * El hook la llama una vez al cargar, para "hidratar" la caché del cliente.
 */
export async function getMyWishlist(): Promise<string[]> {
  const user = await getOptionalUser();
  if (!user) return [];

  const rows = await prisma.wishlistItem.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
    select: { productSlug: true },
  });

  return rows.map((row) => row.productSlug);
}

/**
 * Agrega un producto a la wishlist del usuario actual.
 * Usamos upsert (crear-o-no-hacer-nada) para que agregar dos veces el mismo
 * producto nunca falle por la restricción de unicidad (profileId + productSlug).
 */
export async function addToWishlist(slug: string): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  await prisma.wishlistItem.upsert({
    where: {
      // Clave compuesta generada por Prisma a partir de @@unique([profileId, productSlug])
      profileId_productSlug: { profileId: user.id, productSlug: slug },
    },
    create: { profileId: user.id, productSlug: slug },
    update: {}, // ya existe: no hay nada que actualizar
  });
}

/**
 * Quita un producto de la wishlist del usuario actual.
 * Usamos deleteMany (en vez de delete) porque no lanza error si el producto
 * no estaba en la lista — la operación es idempotente.
 */
export async function removeFromWishlist(slug: string): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  await prisma.wishlistItem.deleteMany({
    where: { profileId: user.id, productSlug: slug },
  });
}