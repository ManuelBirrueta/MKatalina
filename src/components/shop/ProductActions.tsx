/**
 * ============================================================================
 * PRODUCT ACTIONS — MKATALINA (Fase 13 · Etapa 3D: límite de cantidad)
 * ============================================================================
 *
 * Botones de la ficha: cantidad, agregar al carrito, apartar y wishlist.
 *
 * CAMBIO DE LA ETAPA 3D — LÍMITE DE CANTIDAD:
 *   - product.stock = piezas DISPONIBLES (stock − apartados activos; ver
 *     src/lib/products-db.ts).
 *   - El selector no pasa de: disponibles − las que ya están en tu carrito.
 *     Si ya las tienes todas, se avisa y el botón de agregar se desactiva.
 *   - Con 3 o menos disponibles se muestra "Solo quedan N".
 *   - Al agregar, si caben menos de las pedidas, se agregan las que caben y
 *     el aviso dice cuántas fueron (addItem devuelve las agregadas).
 *   Los textos NUEVOS van en el objeto COPY de abajo (es/en) para no tocar
 *   messages.json; los existentes siguen saliendo de productActions.
 *
 * Lo que NO cambia: autenticación para apartar, modal de apartado, wishlist,
 * iconos, layout y colores.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Heart, Minus, Plus, ShoppingBag, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationModal } from "@/components/shop/ReservationModal";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { MAX_PER_ITEM } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";

/** Con estas piezas o menos se muestra el aviso "Solo quedan N". */
const LOW_STOCK_THRESHOLD = 3;

/** Textos nuevos de la Etapa 3D (es/en). */
const COPY = {
  es: {
    onlyLeft: (n: number) =>
      n === 1 ? "Solo queda 1 pieza" : `Solo quedan ${n} piezas`,
    allInCart: "Ya tienes en tu carrito todas las piezas disponibles.",
    partialTitle: "Se agregaron menos piezas",
    partialDescription: (added: number, name: string) =>
      `Solo había disponibles para agregar ${added} × ${name}.`,
    noneTitle: "No se pudo agregar",
  },
  en: {
    onlyLeft: (n: number) => (n === 1 ? "Only 1 left" : `Only ${n} left`),
    allInCart: "You already have every available piece in your cart.",
    partialTitle: "Fewer pieces were added",
    partialDescription: (added: number, name: string) =>
      `Only ${added} × ${name} could be added.`,
    noneTitle: "Couldn't add to cart",
  },
} as const;

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [showReservationModal, setShowReservationModal] = useState(false);

  const router = useRouter();
  const { addItem, items } = useCart();
  const { isAuthenticated } = useAuth();

  const locale = useLocale() as Locale;
  const t = useTranslations("productActions");
  const copy = locale === "en" ? COPY.en : COPY.es;

  // Nombre resuelto al idioma activo (para los avisos).
  const productName = getLocalized(product.name, locale);

  const wishlist = useWishlist();
  const isInWishlist = wishlist.has(product.id);
  const [justClickedWishlist, setJustClickedWishlist] = useState(false);

  /**
   * Piezas disponibles (de la base) y cuántas ya están en el carrito.
   * Lo que aún se puede agregar = disponibles − en carrito.
   */
  const available = Math.min(MAX_PER_ITEM, product.stock ?? MAX_PER_ITEM);
  const inCart = items.find((i) => i.slug === product.slug)?.quantity ?? 0;
  const maxSelectable = Math.max(0, available - inCart);
  const allInCart = product.inStock && maxSelectable === 0;

  // Cantidad mostrada: nunca pasa del máximo seleccionable (ni baja de 1).
  const shownQuantity = Math.max(1, Math.min(quantity, maxSelectable || 1));

  const decrement = () => setQuantity(() => Math.max(1, shownQuantity - 1));
  const increment = () =>
    setQuantity(() => Math.min(maxSelectable, shownQuantity + 1));

  const handleAddToCart = () => {
    // El carrito guarda solo { slug, quantity } y nunca pasa del tope.
    const added = addItem(product.slug, shownQuantity);

    if (added === 0) {
      toast.info(copy.noneTitle, { description: copy.allInCart });
      return;
    }

    if (added < shownQuantity) {
      // Cupieron menos de las pedidas: se dice cuántas exactamente.
      toast.warning(copy.partialTitle, {
        description: copy.partialDescription(added, productName),
      });
    } else {
      toast.success(t("toast.addedTitle"), {
        description: t("toast.addedDescription", {
          quantity: added,
          productName,
        }),
        action: {
          label: t("toast.viewCart"),
          onClick: () => router.push("/carrito"),
        },
      });
    }

    setQuantity(1);
  };

  /**
   * Abre el modal de apartado. Sin sesión, manda a /login y regresa aquí.
   * router.push de @/i18n/navigation conserva el prefijo de idioma.
   */
  const handleReserve = () => {
    if (!isAuthenticated) {
      const currentPath = `/productos/${product.slug}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      toast.info(t("toast.loginRequiredTitle"), {
        description: t("toast.loginRequiredDescription"),
      });
      return;
    }

    setShowReservationModal(true);
  };

  const handleWishlistClick = () => {
    if (wishlist.requiresAuth) {
      const currentPath = `/productos/${product.slug}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (isInWishlist) {
      wishlist.remove(product.id);
      toast.success(t("toast.removedFromWishlist"));
    } else {
      wishlist.add(product.id);
      toast.success(t("toast.addedToWishlist"));
    }
    setJustClickedWishlist(true);
    setTimeout(() => setJustClickedWishlist(false), 300);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Selector de cantidad: solo si hay piezas que aún se puedan agregar */}
        {product.inStock && !allInCart && (
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.2em] font-medium text-foreground block"
              htmlFor="quantity-display"
            >
              {t("quantityLabel")}
            </label>
            <div className="inline-flex items-center border border-input rounded-md">
              <button
                onClick={decrement}
                disabled={shownQuantity <= 1}
                aria-label={t("decreaseQuantity")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center",
                  "hover:bg-muted transition-colors",
                  "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer",
                )}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <span
                id="quantity-display"
                className="w-12 text-center text-sm font-medium tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {shownQuantity}
              </span>

              <button
                onClick={increment}
                disabled={shownQuantity >= maxSelectable}
                aria-label={t("increaseQuantity")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center",
                  "hover:bg-muted transition-colors",
                  "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer",
                )}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Pocas piezas: aviso de escasez */}
        {product.inStock && available <= LOW_STOCK_THRESHOLD && (
          <p className="text-xs font-medium text-accent">
            {copy.onlyLeft(available)}
          </p>
        )}

        {/* Ya están todas en el carrito */}
        {allInCart && (
          <p className="text-sm text-muted-foreground">{copy.allInCart}</p>
        )}

        {/* Botón Agregar al carrito — CTA principal */}
        <Button
          onClick={handleAddToCart}
          disabled={!product.inStock || allInCart}
          size="lg"
          className="w-full"
        >
          <ShoppingBag className="h-4 w-4" />
          {!product.inStock ? t("outOfStock") : t("addToCart")}
        </Button>

        {/* Botón Apartar producto — solo si hay piezas disponibles */}
        {product.inStock && (
          <Button
            onClick={handleReserve}
            variant="outline"
            size="lg"
            className="w-full border-accent text-accent hover:bg-accent-subtle hover:text-accent"
          >
            <BookmarkPlus className="h-4 w-4" />
            {t("reserve")}
          </Button>
        )}

        {/* Botón Wishlist */}
        <Button
          onClick={handleWishlistClick}
          variant="outline"
          size="lg"
          className={cn("w-full", justClickedWishlist && "scale-[1.02]")}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isInWishlist && "fill-secondary text-secondary",
            )}
          />
          {isInWishlist ? t("savedToWishlist") : t("saveToWishlist")}
        </Button>
      </div>

      {/* Modal de apartado (cobra el anticipo con PayPal) */}
      <ReservationModal
        product={product}
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
      />
    </>
  );
}