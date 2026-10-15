/**
 * ============================================================================
 * USE WISHLIST — MKATALINA (Fase 13 · Etapa 3: base de datos + catálogo)
 * ============================================================================
 *
 * La API que consume la UI es la MISMA (requiresAuth, isLoading, itemCount,
 * items, has, add, remove), así que ProductCard y la página de wishlist siguen
 * funcionando igual.
 *
 * CAMBIO DE LA ETAPA 3B:
 *   - Para convertir un id o slug al slug del producto se usa useCatalog()
 *     (catálogo de la base, vía el layout) en vez de productsData (código).
 *   - PRODUCTOS RETIRADOS: si alguien guardó un producto que después se
 *     retira desde el panel, su slug sigue en la base pero ya no está en el
 *     catálogo. Ahora:
 *       · `items` e `itemCount` cuentan SOLO productos visibles, así el
 *         número del corazón en el header coincide con lo que muestra la
 *         página de wishlist (antes contaba también los retirados).
 *       · remove() acepta también un slug guardado que ya no está en el
 *         catálogo, para que siempre se pueda quitar.
 *
 * CÓMO FLUYE LA INFORMACIÓN
 * -------------------------
 *   1. Al haber un usuario (y una vez resuelta la sesión), el hook trae su
 *      wishlist desde la base UNA vez (getMyWishlist) y la mete en la caché.
 *   2. has() lee de esa caché (instantáneo, sin ir al servidor).
 *   3. add()/remove() son OPTIMISTAS: cambian la caché al instante y persisten
 *      en la base en segundo plano; si falla, revierten.
 *   4. Al cerrar sesión, la caché se limpia.
 *
 * POR QUÉ ESPERAMOS A QUE LA SESIÓN SE RESUELVA (authLoading)
 * ----------------------------------------------------------
 * Muchos componentes (cada tarjeta de producto) usan este hook a la vez, cada
 * uno con su propia instancia de useAuth que resuelve la sesión en momentos
 * distintos. Si actuáramos antes, unas instancias creerían "sin sesión" y
 * otras "con sesión", y pelearían por la caché compartida en bucle infinito.
 * Por eso el efecto no hace NADA mientras authLoading sea true.
 * ============================================================================
 */

"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/components/providers/CatalogProvider";
import {
  getMyWishlist,
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
} from "@/actions/wishlist";

interface UseWishlistReturn {
  /** True si NO hay sesión (la wishlist requiere cuenta). La UI debe
   *  redirigir a login antes de llamar add()/remove(). */
  requiresAuth: boolean;
  /** True mientras se trae la wishlist de la base por primera vez. */
  isLoading: boolean;
  /** Cantidad de productos VISIBLES en la wishlist. */
  itemCount: number;
  /** Slugs de los productos VISIBLES en la wishlist. */
  items: string[];
  /** True si el producto está en la wishlist. Acepta id o slug. */
  has: (idOrSlug: string) => boolean;
  /** Agrega un producto (optimista). No-op sin sesión. Acepta id o slug. */
  add: (idOrSlug: string) => void;
  /** Quita un producto (optimista). No-op sin sesión. Acepta id o slug. */
  remove: (idOrSlug: string) => void;
}

export function useWishlist(): UseWishlistReturn {
  // authLoading = true mientras la sesión aún no se resuelve (ver cabecera).
  const { user, requiresAuth, isLoading: authLoading } = useAuth();

  // Catálogo visible: convierte id/slug al slug canónico (null si retirado).
  const { resolveSlug } = useCatalog();

  const slugs = useWishlistStore((s) => s.slugs);
  const status = useWishlistStore((s) => s.status);
  const beginLoad = useWishlistStore((s) => s.beginLoad);
  const finishLoad = useWishlistStore((s) => s.finishLoad);
  const addSlug = useWishlistStore((s) => s.addSlug);
  const removeSlug = useWishlistStore((s) => s.removeSlug);
  const reset = useWishlistStore((s) => s.reset);

  useEffect(() => {
    // 1) Esperar a que la sesión esté resuelta (evita el bucle infinito entre
    //    instancias que resuelven la sesión a destiempo).
    if (authLoading) return;

    // 2) Sin usuario: dejar la caché limpia.
    if (!user) {
      if (status !== "unloaded") reset();
      return;
    }

    // 3) Con usuario: cargar de la base una sola vez (beginLoad es el cerrojo).
    if (beginLoad()) {
      getMyWishlist()
        .then((serverSlugs) => finishLoad(serverSlugs))
        .catch(() => finishLoad([])); // ante error, lista vacía pero "loaded"
    }
  }, [authLoading, user, status, beginLoad, finishLoad, reset]);

  // Solo los guardados que siguen visibles en el catálogo.
  const visibleSlugs = slugs.filter((slug) => resolveSlug(slug) !== null);

  const has = (idOrSlug: string): boolean => {
    if (requiresAuth) return false;
    const slug = resolveSlug(idOrSlug);
    return slug ? slugs.includes(slug) : false;
  };

  const add = (idOrSlug: string): void => {
    // Sin sesión no hacemos nada: la UI debe haber redirigido a login antes.
    if (requiresAuth || !user) return;
    // Solo se pueden agregar productos visibles del catálogo.
    const slug = resolveSlug(idOrSlug);
    if (!slug || slugs.includes(slug)) return;

    addSlug(slug); // 1) optimista: el corazón se llena al instante
    void addToWishlistAction(slug).catch((error) => {
      // 2) si la base falla, revertimos para no mentirle al usuario
      removeSlug(slug);
      console.error("No se pudo guardar en wishlist:", error);
    });
  };

  const remove = (idOrSlug: string): void => {
    if (requiresAuth || !user) return;
    // Visible → su slug. Retirado pero guardado → se acepta tal cual, para
    // que siempre se pueda quitar.
    const slug =
      resolveSlug(idOrSlug) ?? (slugs.includes(idOrSlug) ? idOrSlug : null);
    if (!slug) return;

    removeSlug(slug); // optimista
    void removeFromWishlistAction(slug).catch((error) => {
      addSlug(slug); // revertir en caso de error
      console.error("No se pudo quitar de wishlist:", error);
    });
  };

  return {
    requiresAuth,
    // isLoading es true cuando hay usuario y la caché aún no terminó de
    // cargar, o mientras la propia sesión se resuelve.
    isLoading: authLoading || (!!user && status !== "loaded"),
    itemCount: visibleSlugs.length,
    items: visibleSlugs,
    has,
    add,
    remove,
  };
}