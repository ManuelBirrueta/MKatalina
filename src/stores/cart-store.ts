/**
 * ============================================================================
 * CART STORE — MKATALINA (Fase 13 · Etapa 3: invitado localStorage + base)
 * ============================================================================
 *
 * QUÉ CAMBIÓ RESPECTO A LA VERSIÓN ANTERIOR
 * -----------------------------------------
 * Antes: el store persistía SIEMPRE en localStorage (middleware persist).
 *
 * Ahora: el store ya NO persiste solo. Es una caché en memoria, y el HOOK
 * (use-cart) decide dónde guardar según haya sesión o no:
 *   - Invitado  → localStorage (llave propia del carrito de invitado).
 *   - Con sesión → base de datos (acciones de servidor).
 *
 * Se quitó el persist para poder mantener la regla clave de la fusión: la
 * llave de localStorage guarda SOLO el carrito de invitado; mientras hay
 * sesión, nunca se escribe ahí. Con persist encendido eso era imposible.
 *
 * CAMPOS DE SINCRONIZACIÓN
 * ------------------------
 * syncOwner indica para quién está cargado el carrito actualmente:
 *   - undefined → aún no se ha cargado nada
 *   - null      → cargado como invitado
 *   - string    → cargado para ese userId
 * Cuando cambia el "dueño" (login/logout), el hook detecta que syncOwner ya no
 * corresponde y vuelve a cargar. beginSync es el cerrojo atómico (como en
 * wishlist/apartados) para que solo se cargue una vez aunque muchos
 * componentes usen el hook.
 *
 * La lógica de las mutaciones (sumar cantidades, tope 99) es la MISMA de antes.
 * ============================================================================
 */

import { create } from "zustand";

/**
 * CartItem — un item del carrito. Guardamos lo mínimo: slug + cantidad.
 * El producto completo se resuelve al renderizar (getProductBySlug).
 */
export interface CartItem {
  slug: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];

  // --- Sincronización ---
  syncOwner: string | null | undefined;
  syncing: boolean;
  /** Cerrojo atómico: true solo para el primero que carga a este dueño. */
  beginSync: (owner: string | null) => boolean;
  /** Guarda los items cargados y marca el dueño. */
  finishSync: (items: CartItem[], owner: string | null) => void;

  // --- Mutaciones (misma lógica de siempre) ---
  addItem: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  syncOwner: undefined,
  syncing: false,

  beginSync: (owner) => {
    const state = get();
    // Ya está cargado para este dueño, o hay una carga en curso: no hacer nada.
    if (state.syncing) return false;
    if (state.syncOwner === owner) return false;
    set({ syncing: true });
    return true;
  },

  finishSync: (items, owner) =>
    set({ items, syncOwner: owner, syncing: false }),

  addItem: (slug, quantity) => {
    if (quantity <= 0) return;
    set((state) => {
      const existing = state.items.find((item) => item.slug === slug);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.slug === slug
              ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
              : item,
          ),
        };
      }
      return {
        items: [...state.items, { slug, quantity: Math.min(99, quantity) }],
      };
    });
  },

  removeItem: (slug) =>
    set((state) => ({ items: state.items.filter((i) => i.slug !== slug) })),

  updateQuantity: (slug, quantity) => {
    if (quantity <= 0) {
      set((state) => ({ items: state.items.filter((i) => i.slug !== slug) }));
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.slug === slug
          ? { ...item, quantity: Math.min(99, quantity) }
          : item,
      ),
    }));
  },

  clear: () => set({ items: [] }),
}));