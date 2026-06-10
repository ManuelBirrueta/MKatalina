/**
 * ============================================================================
 * USE WISHLIST — KATALINA (Fase 8: implementación real)
 * ============================================================================
 *
 * Hook de wishlist conectado al sistema de auth real.
 *
 * Comportamiento según estado de sesión:
 *   - Sin sesión (requiresAuth=true):
 *       has() → false, itemCount → 0, items → []
 *       add()/remove() → no-op (la UI debe redirigir a login antes)
 *   - Con sesión:
 *       Lee y muta la wishlist del usuario actual
 *
 * IMPORTANTE: la UI que llama add() o remove() debe primero verificar
 * `requiresAuth` y redirigir a login si es necesario. El hook no fuerza
 * navegación porque eso sería responsabilidad de routing, no de estado.
 *
 * Cambios respecto al placeholder anterior:
 *   - Ya NO devuelve mock data
 *   - Lee del wishlist-store con persistencia
 *   - El itemCount y items dependen del usuario actual
 *   - has() ahora verifica por slug (antes era por id de producto;
 *     unificamos con cómo trabaja el cart-store que también usa slugs)
 *
 * ⚠️ Compatibilidad con código existente:
 *   El ProductCard y ProductActions actualmente llaman `wishlist.has(product.id)`
 *   con el ID (no slug). Para no romperlos, este hook acepta AMBOS pero
 *   internamente normaliza a slug. La forma correcta a futuro es usar slug
 *   directamente, pero el cambio gradual evita breaks.
 *
 *   Nota: para que `has(id)` funcione, necesitamos la lista completa de
 *   productos para mapear id → slug. La importamos de products.ts.
 * ============================================================================
 */

"use client";

import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { productsData } from "@/data/products";

interface UseWishlistReturn {
  /**
   * True si el sistema requiere auth para usar wishlist (= no hay sesión).
   * Componentes deben verificar esto antes de llamar add()/remove().
   */
  requiresAuth: boolean;

  /** Cantidad de items en la wishlist del usuario actual (0 si no logueado) */
  itemCount: number;

  /** Array de slugs en la wishlist del usuario actual */
  items: string[];

  /**
   * True si el producto está en la wishlist del usuario.
   * Acepta tanto id como slug — internamente normaliza a slug.
   */
  has: (idOrSlug: string) => boolean;

  /**
   * Agrega un producto a la wishlist. No-op si no hay sesión.
   * Acepta id o slug.
   */
  add: (idOrSlug: string) => void;

  /**
   * Quita un producto de la wishlist. No-op si no hay sesión.
   * Acepta id o slug.
   */
  remove: (idOrSlug: string) => void;
}

/**
 * Helper para resolver id → slug si es necesario.
 *
 * Si el input ya es un slug (existe en productsData con ese slug), lo
 * devuelve. Si es un id (existe con ese id), devuelve el slug. Si no
 * existe ninguno de los dos, devuelve null.
 */
function resolveSlug(idOrSlug: string): string | null {
  // Buscar por slug primero (caso común)
  const bySlug = productsData.find((p) => p.slug === idOrSlug);
  if (bySlug) return bySlug.slug;

  // Buscar por id (caso legacy)
  const byId = productsData.find((p) => p.id === idOrSlug);
  if (byId) return byId.slug;

  return null;
}

export function useWishlist(): UseWishlistReturn {
  const { user, requiresAuth } = useAuth();

  // Suscribirse al store. Si no hay usuario, getList devuelve []
  const wishlistsByUserId = useWishlistStore(
    (state) => state.wishlistsByUserId
  );
  const addToStore = useWishlistStore((state) => state.addToWishlist);
  const removeFromStore = useWishlistStore((state) => state.removeFromWishlist);

  // Obtener la wishlist del usuario actual (o array vacío)
  const items = user ? (wishlistsByUserId[user.id] ?? []) : [];

  const has = (idOrSlug: string): boolean => {
    if (requiresAuth) return false;
    const slug = resolveSlug(idOrSlug);
    if (!slug) return false;
    return items.includes(slug);
  };

  const add = (idOrSlug: string): void => {
    // No-op si no hay sesión — UI debe redirigir antes de llegar aquí
    if (requiresAuth || !user) return;
    const slug = resolveSlug(idOrSlug);
    if (!slug) return;
    addToStore(user.id, slug);
  };

  const remove = (idOrSlug: string): void => {
    if (requiresAuth || !user) return;
    const slug = resolveSlug(idOrSlug);
    if (!slug) return;
    removeFromStore(user.id, slug);
  };

  return {
    requiresAuth,
    itemCount: items.length,
    items,
    has,
    add,
    remove,
  };
}