/**
 * ============================================================================
 * USE CART — KATALINA
 * ============================================================================
 *
 * Hook que expone una API conveniente sobre el cart-store de Zustand.
 *
 * Diferencia con acceder directo al store:
 *   - El store solo guarda `{ slug, quantity }` por item.
 *   - Este hook hace los lookups de producto y calcula valores derivados
 *     como subtotal, itemCount, etc.
 *
 * Cambios respecto a la versión placeholder anterior:
 *   - Ya NO devuelve mock data
 *   - Conecta al store real de Zustand
 *   - Expone valores derivados (subtotal, itemCount, isEmpty)
 *   - Re-exporta las acciones del store con la misma signature
 *
 * Hidratación (importante en Next.js + persist):
 *   Cuando Next.js renderiza la página en el servidor, NO tiene acceso a
 *   localStorage (que es API del navegador). Resultado: el servidor renderiza
 *   `items: []`, pero el cliente al hidratarse lee localStorage y puede
 *   tener items. Esto causa una mismatch de hydration.
 *
 *   Para evitarlo:
 *     - Los componentes que consumen useCart deben renderizarse igual en
 *       servidor y cliente al inicio (mostrar "0 items" inicialmente).
 *     - Después del primer render del cliente, Zustand actualiza el state
 *       con los datos de localStorage y los componentes re-renderizan.
 *
 *   El truco: useState con flag `isMounted` que detecta cuándo estamos
 *   en el cliente. Aplicamos esto en los lugares donde mostramos el conteo
 *   visible (header). Para el resto, no es problema porque la página de
 *   carrito solo se ve después del primer render cliente.
 * ============================================================================
 */

"use client";

import { useCartStore } from "@/stores/cart-store";
import { getProductBySlug } from "@/data/products";
import type { Product } from "@/types/product";

/**
 * CartItemWithProduct — un item del carrito con el producto resuelto.
 *
 * El store guarda solo { slug, quantity }. Cuando un componente quiere
 * mostrar el carrito, necesita el producto completo (nombre, precio, imagen).
 * Este hook hace el lookup y devuelve la combinación enriquecida.
 *
 * Si el producto ya no existe en productsData (fue eliminado del catálogo),
 * el item se filtra automáticamente — no aparece en `items`.
 */
export interface CartItemWithProduct {
  slug: string;
  quantity: number;
  product: Product;
  /** Subtotal de este item específico: product.price × quantity */
  lineTotal: number;
}

interface UseCartReturn {
  /** Items del carrito con sus productos resueltos */
  items: CartItemWithProduct[];

  /**
   * Total de UNIDADES en el carrito (suma de quantities).
   * Ej. si tengo 2 aretes + 3 pulseras = 5 unidades.
   * NO es el número de items distintos (que serían 2).
   * Esto es lo que mostramos en el badge del header.
   */
  itemCount: number;

  /**
   * Cantidad de productos DISTINTOS en el carrito.
   * Ej. si tengo 2 aretes + 3 pulseras = 2 productos distintos.
   * Útil para mensajes tipo "1 producto en tu carrito" vs "3 productos".
   */
  uniqueCount: number;

  /**
   * Suma del precio × cantidad de todos los items.
   * NO incluye envío ni impuestos — eso se calcula en el checkout.
   */
  subtotal: number;

  /** Carrito vacío shortcut: items.length === 0 */
  isEmpty: boolean;

  /** Acciones — pasan tal cual al store */
  addItem: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
}

export function useCart(): UseCartReturn {
  // Suscribirse al store. Cuando cambia `items` de Zustand, este hook
  // re-renderiza automáticamente.
  const rawItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clear = useCartStore((state) => state.clear);

  /**
   * Enriquecer cada item con su producto. Si un producto ya no existe,
   * filtramos ese item silenciosamente.
   *
   * NOTA sobre performance: este map se ejecuta en cada render que use el
   * hook. Para un carrito típico de 1-10 items es trivial. Si en el futuro
   * tuviéramos carritos enormes, podríamos memoizar con useMemo, pero hoy
   * sería optimización prematura.
   */
  const items: CartItemWithProduct[] = rawItems
    .map((item) => {
      const product = getProductBySlug(item.slug);
      if (!product) return null; // Producto eliminado → ignorar
      return {
        slug: item.slug,
        quantity: item.quantity,
        product,
        lineTotal: product.price * item.quantity,
      };
    })
    .filter((item): item is CartItemWithProduct => item !== null);

  // Cálculos derivados
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueCount = items.length;
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const isEmpty = items.length === 0;

  return {
    items,
    itemCount,
    uniqueCount,
    subtotal,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  };
}