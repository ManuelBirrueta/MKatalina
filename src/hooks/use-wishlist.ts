/**
 * ============================================================================
 * USE WISHLIST — MKATALINA (Fase 13 · Etapa 3: persistencia real en la base)
 * ============================================================================
 *
 * QUÉ CAMBIÓ RESPECTO A LA VERSIÓN ANTERIOR
 * -----------------------------------------
 * El motor pasó de localStorage a la BASE DE DATOS (vía acciones de servidor).
 * Lo importante: la API que consume la UI es la MISMA de antes (requiresAuth,
 * itemCount, items, has, add, remove), más un `isLoading` nuevo (aditivo). Por
 * eso el ProductCard y la página de wishlist siguen funcionando casi igual.
 *
 * CÓMO FLUYE LA INFORMACIÓN
 * -------------------------
 *   1. Al haber un usuario (y una vez resuelta la sesión), el hook trae su
 *      wishlist desde la base UNA vez (getMyWishlist) y la mete en la caché.
 *   2. has() lee de esa caché (instantáneo, sin ir al servidor).
 *   3. add()/remove() hacen actualización OPTIMISTA: cambian la caché al
 *      instante y persisten en la base en segundo plano; si falla, revierten.
 *   4. Al cerrar sesión, la caché se limpia.
 *
 * POR QUÉ ESPERAMOS A QUE LA SESIÓN SE RESUELVA (authLoading)
 * ----------------------------------------------------------
 * Muchos componentes (cada tarjeta de producto) usan este hook a la vez, y
 * cada uno tiene su propia instancia de useAuth que resuelve la sesión en
 * momentos distintos. Si actuáramos antes de que la sesión esté resuelta, unas
 * instancias creerían "sin sesión" y otras "con sesión", y pelearían por la
 * caché compartida (una limpia, otra carga, en bucle infinito). Por eso el
 * efecto no hace NADA mientras authLoading sea true.
 * ============================================================================
 */

"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { productsData } from "@/data/products";
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
  /** Cantidad de items en la wishlist. */
  itemCount: number;
  /** Array de slugs en la wishlist. */
  items: string[];
  /** True si el producto está en la wishlist. Acepta id o slug. */
  has: (idOrSlug: string) => boolean;
  /** Agrega un producto (optimista). No-op sin sesión. Acepta id o slug. */
  add: (idOrSlug: string) => void;
  /** Quita un producto (optimista). No-op sin sesión. Acepta id o slug. */
  remove: (idOrSlug: string) => void;
}

/**
 * Resuelve un id o slug al slug canónico del producto.
 * Devuelve null si no corresponde a ningún producto del catálogo.
 */
function resolveSlug(idOrSlug: string): string | null {
  const bySlug = productsData.find((p) => p.slug === idOrSlug);
  if (bySlug) return bySlug.slug;

  const byId = productsData.find((p) => p.id === idOrSlug);
  if (byId) return byId.slug;

  return null;
}

export function useWishlist(): UseWishlistReturn {
  // authLoading = true mientras la sesión aún no se resuelve (ver cabecera).
  const { user, requiresAuth, isLoading: authLoading } = useAuth();

  const slugs = useWishlistStore((s) => s.slugs);
  const status = useWishlistStore((s) => s.status);
  const beginLoad = useWishlistStore((s) => s.beginLoad);
  const finishLoad = useWishlistStore((s) => s.finishLoad);
  const addSlug = useWishlistStore((s) => s.addSlug);
  const removeSlug = useWishlistStore((s) => s.removeSlug);
  const reset = useWishlistStore((s) => s.reset);

  useEffect(() => {
    // 1) Esperar a que la sesión esté resuelta. Esto es lo que evita el bucle
    //    infinito entre instancias que resuelven la sesión a destiempo.
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

  const has = (idOrSlug: string): boolean => {
    if (requiresAuth) return false;
    const slug = resolveSlug(idOrSlug);
    return slug ? slugs.includes(slug) : false;
  };

  const add = (idOrSlug: string): void => {
    // Sin sesión no hacemos nada: la UI debe haber redirigido a login antes.
    if (requiresAuth || !user) return;
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
    const slug = resolveSlug(idOrSlug);
    if (!slug) return;

    removeSlug(slug); // optimista
    void removeFromWishlistAction(slug).catch((error) => {
      addSlug(slug); // revertir en caso de error
      console.error("No se pudo quitar de wishlist:", error);
    });
  };

  return {
    requiresAuth,
    // isLoading (de la wishlist) es true cuando hay usuario y la caché aún no
    // terminó de cargar, o mientras la propia sesión se resuelve.
    isLoading: authLoading || (!!user && status !== "loaded"),
    itemCount: slugs.length,
    items: slugs,
    has,
    add,
    remove,
  };
}