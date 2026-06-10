/**
 * ============================================================================
 * CART STORE — KATALINA
 * ============================================================================
 *
 * Store global de Zustand para el carrito de compras.
 *
 * Por qué Zustand y no Context:
 *   - Zustand es ~3KB minified vs Context que requiere boilerplate
 *   - Solo los componentes que USAN el carrito se re-renderizan al cambiar
 *     (Context re-renderiza todo el árbol descendiente)
 *   - API más simple: `const items = useCartStore(s => s.items)` en lugar
 *     de crear provider + consumer + hook envoltorio
 *
 * Persistencia con localStorage:
 *   El middleware `persist` guarda automáticamente el carrito en localStorage
 *   con la llave 'katalina-cart-v1'. Al refrescar la página, Zustand lee
 *   localStorage y restaura el estado.
 *
 *   Versionado de la llave (-v1): si en el futuro cambiamos la estructura
 *   del carrito (ej. agregamos variantes), incrementamos a -v2. Los carritos
 *   viejos se descartan automáticamente porque la nueva versión no encuentra
 *   data en -v2. Mejor que migrar estructuras incompatibles.
 *
 * Forma del estado:
 *   Solo guardamos { slug, quantity } por cada item. El producto completo
 *   se busca al renderizar usando getProductBySlug(). Razón:
 *     1. localStorage mínimo (no duplicamos toda la info del producto)
 *     2. Precios siempre actualizados (si cambia el precio del producto,
 *        el carrito muestra el precio actual, no uno viejo cacheado)
 *     3. Si un producto se elimina del catálogo, el item se filtra silenciosamente
 *
 * Esta llave NO contiene PII del usuario — es seguro persistir.
 *
 * En Fase 12+ (backend):
 *   - Para usuarios logueados, el carrito también se sincroniza con backend
 *   - Si el usuario inicia sesión con items en carrito local, hacemos merge
 *   - Si tiene items en backend y agrega más localmente, también merge
 *   - El backend es source of truth para usuarios logueados; localStorage
 *     es source of truth para invitados
 * ============================================================================
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * CartItem — representa UN item en el carrito.
 * Solo guardamos lo mínimo: identificador del producto y cantidad.
 * Al renderizar, hacemos lookup del producto completo vía getProductBySlug.
 */
export interface CartItem {
  /** Slug del producto. Es nuestro identificador en lugar de id porque es legible */
  slug: string;
  /** Cantidad de este producto en el carrito. Mínimo 1, máximo 99 */
  quantity: number;
}

/**
 * CartState — todo el estado del carrito.
 */
interface CartState {
  /** Array de items en el carrito. Vacío al inicio. */
  items: CartItem[];

  /**
   * addItem — agrega un producto al carrito.
   *
   * Comportamiento "smart":
   *   - Si el producto YA está en el carrito, suma a la cantidad existente
   *     (NO crea una segunda entrada del mismo producto)
   *   - Si NO está, lo agrega como entrada nueva
   *   - Respeta el límite máximo de 99 unidades por producto
   *
   * Ejemplo: si carrito tiene { slug: "aretes-camelia", quantity: 2 } y
   * llamas addItem("aretes-camelia", 3), el resultado es
   * { slug: "aretes-camelia", quantity: 5 }, no dos entradas separadas.
   */
  addItem: (slug: string, quantity: number) => void;

  /**
   * removeItem — quita un producto del carrito completamente.
   * No importa la cantidad — el item desaparece.
   */
  removeItem: (slug: string) => void;

  /**
   * updateQuantity — cambia la cantidad de un producto específico.
   *
   * Si la nueva cantidad es 0 o menos, equivale a removeItem (limpiamos el
   * carrito de items con cantidad inválida). Si es mayor a 99, se cap a 99.
   */
  updateQuantity: (slug: string, quantity: number) => void;

  /**
   * clear — vacía el carrito completamente.
   * Útil después de un checkout exitoso, o para botón "Vaciar carrito".
   */
  clear: () => void;
}

/**
 * useCartStore — el store de Zustand.
 *
 * Internamente NO se exporta directo a los componentes. En su lugar, los
 * componentes usan el hook `useCart` (de hooks/use-cart.ts) que expone una
 * API más conveniente con valores derivados como `itemCount` y `subtotal`.
 *
 * Esta separación tiene dos beneficios:
 *   1. Si en el futuro cambiamos de Zustand a otra librería (Jotai, signals),
 *      solo modificamos useCart, los componentes no cambian.
 *   2. Los componentes acceden a una API limpia y semántica, sin tener que
 *      conocer la estructura interna del store.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (slug, quantity) => {
        // Validar que la cantidad sea positiva
        if (quantity <= 0) return;

        set((state) => {
          // Buscar si el producto ya está en el carrito
          const existingItem = state.items.find((item) => item.slug === slug);

          if (existingItem) {
            // Ya existe → sumar cantidad respetando el máximo de 99
            return {
              items: state.items.map((item) =>
                item.slug === slug
                  ? {
                      ...item,
                      quantity: Math.min(99, item.quantity + quantity),
                    }
                  : item
              ),
            };
          } else {
            // Nuevo item → agregar al final del array, cap a 99 por si acaso
            return {
              items: [
                ...state.items,
                { slug, quantity: Math.min(99, quantity) },
              ],
            };
          }
        });
      },

      removeItem: (slug) => {
        set((state) => ({
          items: state.items.filter((item) => item.slug !== slug),
        }));
      },

      updateQuantity: (slug, quantity) => {
        // Si la nueva cantidad es 0 o negativa, equivale a remover
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((item) => item.slug !== slug),
          }));
          return;
        }

        // Si no, actualizar cap a 99
        set((state) => ({
          items: state.items.map((item) =>
            item.slug === slug
              ? { ...item, quantity: Math.min(99, quantity) }
              : item
          ),
        }));
      },

      clear: () => {
        set({ items: [] });
      },
    }),
    {
      // Configuración del middleware persist
      name: "katalina-cart-v1", // Llave de localStorage. Versionada.
      // createJSONStorage explícito porque por defecto usa localStorage,
      // pero algunos entornos (Safari modo incógnito) lo tienen deshabilitado.
      // Esta línea hace el storage opcional — si localStorage no está disponible,
      // Zustand opera en memoria normal sin crashear.
      storage: createJSONStorage(() => localStorage),
    }
  )
);