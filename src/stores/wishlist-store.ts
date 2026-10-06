/**
 * ============================================================================
 * WISHLIST STORE — MKATALINA (Fase 13 · Etapa 3: caché de la base de datos)
 * ============================================================================
 *
 * QUÉ CAMBIÓ RESPECTO A LA VERSIÓN ANTERIOR
 * -----------------------------------------
 * Antes: guardaba TODAS las wishlists de todos los usuarios en localStorage
 *        (un mapa userId → slugs), porque no había base de datos.
 *
 * Ahora: la fuente de verdad es la BASE DE DATOS. Este store se convierte en
 *        una simple CACHÉ EN MEMORIA de la wishlist del usuario ACTUAL (solo
 *        sus slugs). Ya NO persiste en localStorage: en cada carga del sitio,
 *        el hook la rellena desde la base. Persistir aquí solo crearía datos
 *        desactualizados que podrían chocar con la base.
 *
 * POR QUÉ SEGUIR USANDO UN STORE (y no estado local del hook)
 * -----------------------------------------------------------
 * El corazón de wishlist aparece en MUCHOS lugares a la vez (cada tarjeta de
 * producto, la página de wishlist, etc.). Todos esos usos necesitan ver la
 * MISMA lista y mantenerse sincronizados: si marcas un corazón en una tarjeta,
 * el conteo y las demás vistas deben reflejarlo al instante. Un store compartido
 * (singleton) resuelve eso de forma natural.
 *
 * EL "STATUS" Y EL GUARD DE CARGA
 * -------------------------------
 * Como muchos componentes usan el hook, todos intentarían cargar la wishlist
 * desde la base al mismo tiempo. Para traerla UNA SOLA VEZ, el store lleva un
 * `status` y la función beginLoad() actúa como cerrojo atómico: solo el primero
 * que la llame obtiene `true` y hace la petición; los demás obtienen `false`.
 * ============================================================================
 */

import { create } from "zustand";

/**
 * Estados posibles de la caché:
 *   - "unloaded": aún no se ha traído nada de la base (estado inicial).
 *   - "loading" : se está trayendo ahora mismo.
 *   - "loaded"  : ya se trajo; `slugs` es confiable.
 */
type WishlistStatus = "unloaded" | "loading" | "loaded";

interface WishlistState {
  /** Slugs de la wishlist del usuario actual, del más reciente al más antiguo. */
  slugs: string[];
  /** En qué punto de la carga desde la base estamos. */
  status: WishlistStatus;

  /**
   * Cerrojo atómico: si el estado era "unloaded", lo pasa a "loading" y
   * devuelve true (este llamador debe hacer la petición). Si ya estaba
   * cargando o cargado, devuelve false (otro ya se encargó).
   */
  beginLoad: () => boolean;

  /** Guarda la lista traída de la base y marca la caché como "loaded". */
  finishLoad: (slugs: string[]) => void;

  /** Agrega un slug de forma optimista (sin duplicar). */
  addSlug: (slug: string) => void;

  /** Quita un slug de forma optimista. */
  removeSlug: (slug: string) => void;

  /** Reinicia la caché (al cerrar sesión). */
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  slugs: [],
  status: "unloaded",

  beginLoad: () => {
    // Lectura del estado EN VIVO (get()), no de una copia vieja, para que el
    // cerrojo sea confiable aunque varios componentes lo llamen a la vez.
    if (get().status !== "unloaded") return false;
    set({ status: "loading" });
    return true;
  },

  finishLoad: (slugs) => set({ slugs, status: "loaded" }),

  addSlug: (slug) =>
    set((state) =>
      state.slugs.includes(slug)
        ? state // ya está: no duplicar
        : { slugs: [slug, ...state.slugs] },
    ),

  removeSlug: (slug) =>
    set((state) => ({ slugs: state.slugs.filter((s) => s !== slug) })),

  reset: () =>
    set((state) =>
      // Si ya está limpio, devolvemos el MISMO estado: así Zustand no notifica
      // ni provoca un re-render innecesario (evita churn cuando muchas
      // instancias del hook llaman reset sin que nada haya cambiado).
      state.status === "unloaded" && state.slugs.length === 0
        ? state
        : { slugs: [], status: "unloaded" },
    ),
}));