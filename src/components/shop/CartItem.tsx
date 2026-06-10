/**
 * ============================================================================
 * CART ITEM — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link cambia de "next/link" a "@/i18n/navigation"
 *     (mantiene el prefijo de idioma en URLs internas)
 *   - product.name se resuelve con getLocalized() porque ahora es LocalizedString
 *   - MATERIAL_LABELS y COLOR_LABELS reemplazados por t() del namespace product
 *   - Textos hardcoded ("Producto eliminado", "Deshacer", "Reducir cantidad",
 *     "c/u") ahora vienen de namespace cart
 *   - aria-labels usan interpolación con productName ya resuelto
 *
 * Lo que NO cambia:
 *   - cart-store.ts queda intacto (solo guarda slug + quantity)
 *   - useCart hook queda intacto (sigue devolviendo CartItemWithProduct)
 *   - La lógica del "Deshacer" toast queda intacta
 *   - El layout visual queda 100% idéntico
 * ============================================================================
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { CartItemWithProduct } from "@/hooks/use-cart";

interface CartItemProps {
  item: CartItemWithProduct;
}

/**
 * NOTA: MATERIAL_LABELS y COLOR_LABELS ya NO existen como constantes.
 * Los labels se obtienen ahora con t() del namespace product.materials
 * y product.colors, que se traducen automáticamente al locale activo.
 */

export function CartItem({ item }: CartItemProps) {
  const { product, quantity, lineTotal } = item;
  const { updateQuantity, removeItem, addItem } = useCart();

  /**
   * Hooks de i18n:
   *   - locale: idioma activo, para resolver product.name (LocalizedString)
   *   - tProduct: traducciones del namespace "product" (materials, colors)
   *   - tCart: traducciones del namespace "cart" (toasts, aria-labels)
   */
  const locale = useLocale() as Locale;
  const tProduct = useTranslations("product");
  const tCart = useTranslations("cart");

  /**
   * Resolver el nombre al locale activo.
   * Lo hacemos UNA vez y reutilizamos en todos los lugares donde se usa
   * (aria-labels, h3, toast description, etc.)
   */
  const productName = getLocalized(product.name, locale);

  const isPlaceholder =
    product.images[0]?.src.startsWith("/placeholder") ?? true;

  const hasDiscount =
    product.originalPrice !== undefined &&
    product.originalPrice > product.price;

  /**
   * handleRemove — elimina con opción de deshacer.
   *
   * Cambios:
   *   - El texto del toast viene de tCart("toast.removed")
   *   - La description del toast usa productName ya resuelto
   *   - El label "Deshacer" viene de tCart("toast.undo")
   *   - "Restaurado" viene de tCart("toast.restored")
   */
  const handleRemove = () => {
    const snapshot = { slug: product.slug, quantity };

    removeItem(product.slug);

    toast.success(tCart("toast.removed"), {
      description: productName,
      duration: 5000,
      action: {
        label: tCart("toast.undo"),
        onClick: () => {
          addItem(snapshot.slug, snapshot.quantity);
          toast.success(tCart("toast.restored"));
        },
      },
    });
  };

  const decrement = () => {
    if (quantity > 1) {
      updateQuantity(product.slug, quantity - 1);
    }
  };

  const increment = () => {
    if (quantity < 99) {
      updateQuantity(product.slug, quantity + 1);
    }
  };

  return (
    <article className="flex gap-4 py-6 border-b border-border last:border-b-0">
      {/* ─── IMAGEN ─── */}
      <Link
        href={product.href}
        className={cn(
          "flex-shrink-0 relative w-20 h-[100px]",
          "bg-secondary-subtle overflow-hidden",
          "hover:opacity-80 transition-opacity"
        )}
        aria-label={tCart("item.viewDetails", { productName })}
      >
        {isPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {/*
               * Primera letra de la categoría como placeholder.
               * product.category es enum en español, pero solo usamos
               * la primera letra. "A" para Aretes funciona en ambos
               * idiomas porque también es "A" de "Aretes" en es
               * y serviría para "E" en en — pero como product.category
               * sigue siendo el enum en español, será "A".
               *
               * Esto es un placeholder visual mínimo, no es texto crítico.
               */}
              {product.category[0]}
            </span>
          </div>
        ) : (
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt}
            fill
            className="object-cover"
            sizes="80px"
          />
        )}
      </Link>

      {/* ─── INFO + CONTROLES ─── */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Fila superior: nombre + botón eliminar */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={product.href}
              className="hover:text-accent transition-colors"
            >
              {/*
               * Nombre del producto ya resuelto al locale.
               */}
              <h3 className="font-display text-lg font-medium leading-tight">
                {productName}
              </h3>
            </Link>

            {/*
             * Material · Color en línea pequeña debajo.
             * Ambos traducidos vía namespace product.materials y product.colors.
             */}
            <p className="text-xs text-muted-foreground mt-1">
              {tProduct(`materials.${product.material}`)}
              {" · "}
              {tProduct(`colors.${product.color}`)}
            </p>
          </div>

          {/*
           * Botón eliminar.
           * aria-label traducido con interpolación de productName.
           */}
          <button
            onClick={handleRemove}
            aria-label={tCart("item.removeFromCart", { productName })}
            className={cn(
              "flex-shrink-0 p-1 -m-1",
              "text-muted-foreground hover:text-foreground",
              "transition-colors cursor-pointer"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Fila inferior: cantidad + precio */}
        <div className="flex items-end justify-between gap-3 mt-auto pt-2">
          {/* Selector de cantidad */}
          <div className="inline-flex items-center border border-input rounded-md">
            <button
              onClick={decrement}
              disabled={quantity === 1}
              aria-label={tCart("item.decreaseQuantity")}
              className={cn(
                "h-8 w-8 flex items-center justify-center",
                "hover:bg-muted transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              )}
            >
              <Minus className="h-3 w-3" />
            </button>

            <span
              className="w-8 text-center text-sm font-medium tabular-nums"
              aria-live="polite"
            >
              {quantity}
            </span>

            <button
              onClick={increment}
              disabled={quantity === 99}
              aria-label={tCart("item.increaseQuantity")}
              className={cn(
                "h-8 w-8 flex items-center justify-center",
                "hover:bg-muted transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              )}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Precio total + unitario si aplica */}
          <div className="text-right">
            <p className="text-base font-medium tabular-nums">
              {formatPrice(lineTotal)}
            </p>
            {quantity > 1 && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                {/*
                 * "{precio} c/u" en español → "{price} ea" en inglés
                 * tCart("item.pricePerUnit") devuelve "c/u" / "ea".
                 */}
                {formatPrice(product.price)} {tCart("item.pricePerUnit")}
              </p>
            )}
            {hasDiscount && product.originalPrice && quantity === 1 && (
              <p className="text-xs text-muted-foreground line-through tabular-nums mt-0.5">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}