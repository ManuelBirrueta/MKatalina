/**
 * ============================================================================
 * PRODUCT ACTIONS — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import useRouter cambia de "next/navigation" a "@/i18n/navigation"
 *     (mantiene el prefijo de locale al redirigir a /login)
 *   - Agregado useLocale + useTranslations
 *   - product.name se resuelve con getLocalized() para usar en el toast
 *     (antes se interpolaba en template string → "[object Object]")
 *   - Todos los textos hardcoded ahora vienen de messages.json bajo
 *     namespace productActions
 *
 * Lo que NO cambia:
 *   - El cart-store sigue guardando solo { slug, quantity } → no necesita
 *     resolver el name al añadir (lo resolverá CartItem al render)
 *   - La lógica de stock, autenticación, modal de reservación
 *   - Los iconos, layout, colores
 *
 * Patrón aplicado: el name se resuelve UNA vez al inicio del componente
 * y se usa en los toasts. Esto evita duplicar getLocalized() en cada
 * lugar donde se necesite.
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [showReservationModal, setShowReservationModal] = useState(false);

  const router = useRouter();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  /**
   * Hooks de i18n:
   *   - locale: idioma activo, para resolver product.name (LocalizedString)
   *   - t: traducciones bajo namespace productActions
   */
  const locale = useLocale() as Locale;
  const t = useTranslations("productActions");

  /**
   * Resolver el nombre del producto UNA vez al inicio del componente.
   * Se usa en los toasts cuando se interpola con la cantidad.
   *
   * Antes:
   *   description: `${quantity} × ${product.name}`
   *   → "1 × [object Object]" cuando name es LocalizedString
   *
   * Ahora:
   *   description: t("toast.addedDescription", { quantity, productName })
   *   → "1 × Aretes Camelia" (resuelto al locale activo)
   */
  const productName = getLocalized(product.name, locale);

  const wishlist = useWishlist();
  const isInWishlist = wishlist.has(product.id);
  const [justClickedWishlist, setJustClickedWishlist] = useState(false);

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(99, q + 1));

  const handleAddToCart = () => {
    /**
     * El cart-store solo guarda { slug, quantity }. NO necesita el name
     * porque CartItem lo busca con getProductBySlug() al renderizar.
     * Aquí solo lo usamos para el toast de feedback.
     */
    addItem(product.slug, quantity);

    toast.success(t("toast.addedTitle"), {
      description: t("toast.addedDescription", {
        quantity,
        productName,
      }),
      action: {
        label: t("toast.viewCart"),
        onClick: () => router.push("/carrito"),
      },
    });

    setQuantity(1);
  };

  /**
   * handleReserve — abre el modal de apartado.
   *
   * Si el usuario no tiene sesión, redirige a /login con redirect a esta
   * página. router.push de @/i18n/navigation mantiene el prefijo de locale
   * automáticamente.
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
        {/* Selector de cantidad — solo si en stock */}
        {product.inStock && (
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
                disabled={quantity === 1}
                aria-label={t("decreaseQuantity")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center",
                  "hover:bg-muted transition-colors",
                  "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
                {quantity}
              </span>

              <button
                onClick={increment}
                disabled={quantity === 99}
                aria-label={t("increaseQuantity")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center",
                  "hover:bg-muted transition-colors",
                  "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Botón Agregar al carrito — CTA principal */}
        <Button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          size="lg"
          className="w-full"
        >
          <ShoppingBag className="h-4 w-4" />
          {!product.inStock ? t("outOfStock") : t("addToCart")}
        </Button>

        {/* Botón Apartar producto — solo si en stock */}
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
              isInWishlist && "fill-secondary text-secondary"
            )}
          />
          {isInWishlist ? t("savedToWishlist") : t("saveToWishlist")}
        </Button>
      </div>

      {/*
       * Modal de apartado.
       * NOTA: ReservationModal probablemente recibe `product` y muestra
       * el nombre adentro. Cuando lo arreglemos en el siguiente paso,
       * también necesitará useLocale + getLocalized.
       */}
      <ReservationModal
        product={product}
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
      />
    </>
  );
}