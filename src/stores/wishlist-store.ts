/**
 * ============================================================================
 * WISHLIST STORE — KATALINA
 * ============================================================================
 *
 * Store de Zustand para wishlists. A diferencia del cart-store (un solo
 * carrito por navegador), las wishlists son POR-USUARIO:
 *
 *   {
 *     "user-mock-001": ["aretes-camelia", "collar-luna-llena"],
 *     "user-mock-002": ["pulsera-dalia"],
 *     "user-new-xyz": []
 *   }
 *
 * Por qué guardar todas las wishlists juntas en lugar de cambiar de "store"
 * según el usuario:
 *   - Un solo middleware persist es más simple
 *   - Si el usuario A cierra sesión, sus items siguen ahí para cuando
 *     vuelva a iniciar (UX esperada)
 *   - Si el usuario B inicia sesión en el mismo navegador, ve SUS items,
 *     no los de A (correcto)
 *
 * Acceso a wishlists desde la UI:
 *   El hook useWishlist mira el usuario actual (de auth-store), obtiene
 *   los items de ese userId, y los expone. Las mutaciones siempre se
 *   asocian al usuario actual.
 *
 * Si no hay sesión, todas las operaciones devuelven o no-op:
 *   - has() → false siempre
 *   - itemCount → 0
 *   - add()/remove() → no hacen nada (la UI debe redirigir a login antes)
 *
 * Llave de localStorage: 'katalina-wishlist-v1'
 *
 * En Fase 12 con backend:
 *   - Las wishlists viven en una tabla `wishlists` con FK al usuario
 *   - El store se reemplaza por queries al backend (TanStack Query)
 *   - El hook useWishlist mantiene la misma API
 * ============================================================================
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * WishlistState — el store interno.
 *
 * `wishlistsByUserId` es el mapa principal. Las funciones reciben userId
 * explícito (en lugar de leer del auth-store directamente) porque eso
 * mantiene este store puro y testeable. El hook useWishlist es quien
 * inyecta el userId actual.
 */
interface WishlistState {
  /** Mapa userId → array de slugs */
  wishlistsByUserId: Record<string, string[]>;

  /** Agrega un slug a la wishlist del userId */
  addToWishlist: (userId: string, slug: string) => void;

  /** Quita un slug de la wishlist del userId */
  removeFromWishlist: (userId: string, slug: string) => void;

  /** Limpia la wishlist completa de un userId */
  clearWishlist: (userId: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      wishlistsByUserId: {},

      addToWishlist: (userId, slug) => {
        set((state) => {
          // Obtener la wishlist actual del usuario, o array vacío si no existe
          const currentList = state.wishlistsByUserId[userId] ?? [];

          // Si ya está, no hacer nada (no duplicar)
          if (currentList.includes(slug)) return state;

          // Agregar al inicio (los más recientes arriba)
          return {
            wishlistsByUserId: {
              ...state.wishlistsByUserId,
              [userId]: [slug, ...currentList],
            },
          };
        });
      },

      removeFromWishlist: (userId, slug) => {
        set((state) => {
          const currentList = state.wishlistsByUserId[userId] ?? [];
          return {
            wishlistsByUserId: {
              ...state.wishlistsByUserId,
              [userId]: currentList.filter((s) => s !== slug),
            },
          };
        });
      },

      clearWishlist: (userId) => {
        set((state) => ({
          wishlistsByUserId: {
            ...state.wishlistsByUserId,
            [userId]: [],
          },
        }));
      },
    }),
    {
      name: "katalina-wishlist-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);