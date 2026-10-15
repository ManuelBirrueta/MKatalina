/**
 * ============================================================================
 * USE CART — MKATALINA (Fase 13 · Etapa 3D: + tope de piezas disponibles)
 * ============================================================================
 *
 * CAMBIO DE LA ETAPA 3D — LÍMITE DE CANTIDAD:
 *   - addItem / updateQuantity pasan al store el tope de piezas DISPONIBLES
 *     del producto (product.stock del catálogo = stock − apartados activos).
 *     La cantidad nunca pasa de lo que el servidor dejaría pagar.
 *   - addItem devuelve cuántas piezas agregó de verdad (para avisar si caben
 *     menos de las pedidas).
 *   - Cada renglón trae `maxQuantity` (tope) y `exceedsStock` (true si tiene
 *     más piezas de las disponibles, p. ej. porque alguien compró mientras
 *     tanto). CartItem lo usa para el "+" y para avisar.
 *
 * MISMA API de siempre (items, itemCount, uniqueCount, subtotal, isEmpty,
 * isLoading, addItem, removeItem, updateQuantity, clear). Por eso la página de
 * carrito, el checkout y el header siguen funcionando sin cambios.
 *
 * CAMBIO DE LA ETAPA 3B:
 *   - Cada renglón se "enriquece" con su producto (nombre, precio, imagen)
 *     usando useCatalog() — el catálogo de la base que entrega el layout — en
 *     lugar de getProductBySlug() de src/data/products.ts.
 *   - Consecuencia: si un producto del carrito fue RETIRADO desde el panel, ya
 *     no está en el catálogo y su renglón deja de mostrarse (y no suma al
 *     total). El checkout volverá a verificarlo en el servidor (Etapa 3C).
 *
 * DÓNDE SE GUARDA EL CARRITO
 * --------------------------
 *   - Invitado (sin sesión) → localStorage (llave GUEST_CART_KEY).
 *   - Con sesión            → base de datos (acciones de servidor).
 * Regla clave: mientras hay sesión, NUNCA se escribe en la llave de invitado.
 * Así, si al iniciar sesión esa llave tiene algo, sabemos que es un carrito de
 * invitado que hay que FUSIONAR con el de la cuenta.
 *
 * FLUJO DE CARGA (efecto de sincronización)
 * -----------------------------------------
 *   - Espera a que la sesión se resuelva (if authLoading return).
 *   - Con sesión: si hay carrito de invitado pendiente, lo fusiona con la base
 *     (suma cantidades), limpia el local, y carga el resultado. Si no, carga la
 *     base tal cual.
 *   - Sin sesión: carga el carrito de invitado de localStorage.
 *   - Al cambiar el dueño (login/logout) se vuelve a cargar.
 *
 * MUTACIONES
 * ----------
 * Son optimistas: cambian el store al instante y luego persisten (localStorage
 * o base, según sesión). En base, el guardado es en 2° plano.
 *
 * isEmpty solo es true UNA VEZ que el carrito terminó de cargar. Así, durante
 * la carga, ni el checkout ni la página de carrito creen que está vacío (evita
 * el rebote a /carrito y el parpadeo de "carrito vacío").
 * ============================================================================
 */

"use client";

import { useEffect } from "react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { MAX_PER_ITEM } from "@/stores/cart-store";
import type { Product } from "@/types/product";
import { getMyCart, saveMyCart, mergeGuestCartIntoDb } from "@/actions/cart";

/** Llave de localStorage SOLO para el carrito de invitado. */
const GUEST_CART_KEY = "mkatalina-cart-guest-v1";

function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // localStorage puede fallar (Safari incógnito); no es crítico.
  }
}

function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // ignorar
  }
}

export interface CartItemWithProduct {
  slug: string;
  quantity: number;
  product: Product;
  lineTotal: number;
  /** Tope de piezas para este renglón: disponibles (máximo 99). */
  maxQuantity: number;
  /** true si el renglón tiene más piezas de las que hay disponibles. */
  exceedsStock: boolean;
}

interface UseCartReturn {
  items: CartItemWithProduct[];
  itemCount: number;
  uniqueCount: number;
  subtotal: number;
  isEmpty: boolean;
  /** True mientras el carrito aún se está cargando (base o localStorage). */
  isLoading: boolean;
  /** Agrega sin pasar de las disponibles. Devuelve cuántas agregó. */
  addItem: (slug: string, quantity: number) => number;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
}

export function useCart(): UseCartReturn {
  const { user, isLoading: authLoading } = useAuth();

  // Catálogo visible (de la base, vía el layout) para enriquecer los renglones.
  const { getBySlug } = useCatalog();

  const rawItems = useCartStore((s) => s.items);
  const syncOwner = useCartStore((s) => s.syncOwner);
  const beginSync = useCartStore((s) => s.beginSync);
  const finishSync = useCartStore((s) => s.finishSync);
  const addItemStore = useCartStore((s) => s.addItem);
  const removeItemStore = useCartStore((s) => s.removeItem);
  const updateQuantityStore = useCartStore((s) => s.updateQuantity);
  const clearStore = useCartStore((s) => s.clear);

  // --- Sincronización con la fuente correcta (base o localStorage) ---
  useEffect(() => {
    if (authLoading) return;

    const owner = user ? user.id : null;
    if (!beginSync(owner)) return;

    (async () => {
      if (user) {
        // Con sesión: ¿hay carrito de invitado pendiente de fusionar?
        const guestItems = readGuestCart();
        if (guestItems.length > 0) {
          const merged = await mergeGuestCartIntoDb(guestItems);
          clearGuestCart(); // el carrito de invitado ya se absorbió en la cuenta
          finishSync(merged, user.id);
        } else {
          const dbItems = await getMyCart();
          finishSync(dbItems, user.id);
        }
      } else {
        // Invitado: cargar de localStorage.
        finishSync(readGuestCart(), null);
      }
    })().catch(() => finishSync([], owner));
  }, [authLoading, user, syncOwner, beginSync, finishSync]);

  /**
   * Persiste el estado actual del store donde corresponda.
   * Lee los items EN VIVO (getState) para tomarlos ya mutados.
   */
  const persist = () => {
    const items = useCartStore.getState().items;
    if (user) {
      void saveMyCart(items).catch((error) =>
        console.error("No se pudo guardar el carrito:", error),
      );
    } else {
      writeGuestCart(items);
    }
  };

  /** Piezas disponibles de un producto según el catálogo (0 si no está). */
  const maxFor = (slug: string): number => {
    const product = getBySlug(slug);
    if (!product) return 0;
    return Math.min(MAX_PER_ITEM, product.stock ?? MAX_PER_ITEM);
  };

  const addItem = (slug: string, quantity: number): number => {
    const added = addItemStore(slug, quantity, maxFor(slug));
    if (added > 0) persist(); // si no cupo nada, no hay nada que guardar
    return added;
  };
  const removeItem = (slug: string) => {
    removeItemStore(slug);
    persist();
  };
  const updateQuantity = (slug: string, quantity: number) => {
    updateQuantityStore(slug, quantity, maxFor(slug));
    persist();
  };
  const clear = () => {
    clearStore();
    persist();
  };

  // --- Enriquecer cada renglón con su producto del catálogo ---
  // Los renglones cuyo producto ya no está visible (retirado) se omiten.
  const items: CartItemWithProduct[] = rawItems
    .map((item) => {
      const product = getBySlug(item.slug);
      if (!product) return null;
      const maxQuantity = Math.min(
        MAX_PER_ITEM,
        product.stock ?? MAX_PER_ITEM,
      );
      return {
        slug: item.slug,
        quantity: item.quantity,
        product,
        lineTotal: product.price * item.quantity,
        maxQuantity,
        exceedsStock: item.quantity > maxQuantity,
      };
    })
    .filter((item): item is CartItemWithProduct => item !== null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueCount = items.length;
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  // isLoading: true mientras no se resuelve la sesión o no se ha cargado el carrito.
  const isLoading = authLoading || syncOwner === undefined;

  // isEmpty solo es fiable una vez cargado (evita rebotes/parpadeos).
  const isEmpty = !isLoading && items.length === 0;

  return {
    items,
    itemCount,
    uniqueCount,
    subtotal,
    isEmpty,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  };
}