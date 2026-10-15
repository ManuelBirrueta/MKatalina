/**
 * ============================================================================
 * CART STORE — MKATALINA (Fase 13 · Etapa 3D: tope de piezas disponibles)
 * ============================================================================
 *
 * Caché en memoria del carrito. El HOOK (use-cart) decide dónde guardar:
 *   - Invitado   → localStorage (llave propia del carrito de invitado).
 *   - Con sesión → base de datos (acciones de servidor).
 * (Sin middleware persist: así la llave de localStorage guarda SOLO el
 * carrito de invitado, requisito de la fusión al iniciar sesión.)
 *
 * CAMBIO DE LA ETAPA 3D — TOPE POR PIEZAS DISPONIBLES:
 *   addItem y updateQuantity reciben un `max` opcional: las piezas
 *   disponibles del producto. La cantidad de un renglón NUNCA pasa de
 *   min(max, 99). Como la regla vive aquí, aplica igual desde la ficha, el
 *   carrito o el "Deshacer" de un producto eliminado.
 *   addItem ahora DEVUELVE cuántas piezas agregó de verdad (puede ser menos
 *   de las pedidas, o 0 si ya no cabía ninguna), para avisarle al cliente.
 *
 * CAMPOS DE SINCRONIZACIÓN
 * ------------------------
 * syncOwner indica para quién está cargado el carrito:
 *   - undefined → aún no se ha cargado nada
 *   - null      → cargado como invitado
 *   - string    → cargado para ese userId
 * beginSync es el cerrojo atómico para cargar una sola vez aunque muchos
 * componentes usen el hook a la vez.
 * ============================================================================
 */

import { create } from "zustand";

/** Tope absoluto por renglón, aunque haya más piezas. */
export const MAX_PER_ITEM = 99;

/**
 * CartItem — un renglón del carrito. Se guarda lo mínimo: slug + cantidad.
 * El producto completo se resuelve al renderizar (catálogo de useCatalog).
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

  // --- Mutaciones ---
  /**
   * Suma `quantity` al renglón (o lo crea) sin pasar de `max`.
   * Devuelve cuántas piezas se agregaron realmente.
   */
  addItem: (slug: string, quantity: number, max?: number) => number;
  removeItem: (slug: string) => void;
  /** Fija la cantidad (sin pasar de `max`); 0 o menos elimina el renglón. */
  updateQuantity: (slug: string, quantity: number, max?: number) => void;
  clear: () => void;
}

/** Tope efectivo: piezas disponibles, sin pasar de 99 ni bajar de 0. */
function limitFor(max: number | undefined): number {
  return Math.max(0, Math.min(MAX_PER_ITEM, max ?? MAX_PER_ITEM));
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

  addItem: (slug, quantity, max) => {
    if (quantity <= 0) return 0;
    const limit = limitFor(max);
    const items = get().items;
    const existing = items.find((item) => item.slug === slug);
    const current = existing?.quantity ?? 0;

    // Nueva cantidad sin pasar del tope; lo agregado es la diferencia.
    const next = Math.min(limit, current + quantity);
    const added = next - current;
    if (added <= 0) return 0;

    set({
      items: existing
        ? items.map((item) =>
            item.slug === slug ? { ...item, quantity: next } : item,
          )
        : [...items, { slug, quantity: next }],
    });
    return added;
  },

  removeItem: (slug) =>
    set((state) => ({ items: state.items.filter((i) => i.slug !== slug) })),

  updateQuantity: (slug, quantity, max) => {
    if (quantity <= 0) {
      set((state) => ({ items: state.items.filter((i) => i.slug !== slug) }));
      return;
    }
    const next = Math.min(limitFor(max), quantity);
    set((state) => ({
      items: state.items.map((item) =>
        // Si el tope es 0 (agotado) no se fuerza a 0: se deja como estaba para
        // que el cliente vea el aviso y decida quitarlo.
        item.slug === slug && next > 0 ? { ...item, quantity: next } : item,
      ),
    }));
  },

  clear: () => set({ items: [] }),
}));