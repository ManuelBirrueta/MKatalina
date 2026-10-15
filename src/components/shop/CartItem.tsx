/**
 * ============================================================================
 * CART ITEM — MKATALINA (Fase 13 · Etapa 3D: límite de cantidad)
 * ============================================================================
 *
 * Un renglón del carrito: imagen, nombre, material · color, cantidad, precio
 * y botón de eliminar (con "Deshacer").
 *
 * CAMBIO DE LA ETAPA 3D — LÍMITE DE CANTIDAD:
 *   - El "+" se detiene en item.maxQuantity (piezas disponibles).
 *   - Si el renglón tiene MÁS piezas de las disponibles (alguien compró o
 *     apartó mientras tanto), se avisa: "Solo quedan N" o "Agotado". El
 *     cliente puede bajar la cantidad con "−" o quitar el producto; si
 *     intentara pagar así, el servidor lo rechazaría sin cobrar.
 *   Textos nuevos en el objeto COPY (es/en); los existentes siguen saliendo
 *   de los namespaces "cart" y "product".
 *
 * Lo que NO cambia: diseño, enlaces con prefijo de idioma, nombre resuelto
 * al idioma activo, labels traducidos de material y color, y el "Deshacer".
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

/** Textos nuevos de la Etapa 3D (es/en). */
const COPY = {
  es: {
    soldOut: "Agotado: quítalo para continuar con tu compra.",
    onlyLeft: (n: number) =>
      n === 1
        ? "Solo queda 1 pieza disponible: ajusta la cantidad."
        : `Solo quedan ${n} piezas disponibles: ajusta la cantidad.`,
  },
  en: {
    soldOut: "Sold out: remove it to continue checking out.",
    onlyLeft: (n: number) =>
      n === 1
        ? "Only 1 piece left: please adjust the quantity."
        : `Only ${n} pieces left: please adjust the quantity.`,
  },
} as const;

interface CartItemProps {
  item: CartItemWithProduct;
}

export function CartItem({ item }: CartItemProps) {
  const { product, quantity, lineTotal, maxQuantity, exceedsStock } = item;
  const { updateQuantity, removeItem, addItem } = useCart();

  const locale = useLocale() as Locale;
  const tProduct = useTranslations("product");
  const tCart = useTranslations("cart");
  const copy = locale === "en" ? COPY.en : COPY.es;

  // Nombre resuelto al idioma activo (aria-labels, título, aviso).
  const productName = getLocalized(product.name, locale);

  const isPlaceholder =
    product.images[0]?.src.startsWith("/placeholder") ?? true;

  const hasDiscount =
    product.originalPrice !== undefined &&
    product.originalPrice > product.price;

  /** Elimina el renglón con opción de deshacer (respeta el tope al restaurar). */
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
    if (quantity < maxQuantity) {
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
          "hover:opacity-80 transition-opacity",
        )}
        aria-label={tCart("item.viewDetails", { productName })}
      >
        {isPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Placeholder visual mínimo: inicial de la categoría */}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
              <h3 className="font-display text-lg font-medium leading-tight">
                {productName}
              </h3>
            </Link>

            {/* Material · Color (traducidos) */}
            <p className="text-xs text-muted-foreground mt-1">
              {tProduct(`materials.${product.material}`)}
              {" · "}
              {tProduct(`colors.${product.color}`)}
            </p>

            {/* Aviso: más piezas en el carrito de las que hay disponibles */}
            {exceedsStock && (
              <p className="text-xs font-medium text-destructive mt-1.5" role="alert">
                {maxQuantity === 0 ? copy.soldOut : copy.onlyLeft(maxQuantity)}
              </p>
            )}
          </div>

          <button
            onClick={handleRemove}
            aria-label={tCart("item.removeFromCart", { productName })}
            className={cn(
              "flex-shrink-0 p-1 -m-1",
              "text-muted-foreground hover:text-foreground",
              "transition-colors cursor-pointer",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Fila inferior: cantidad + precio */}
        <div className="flex items-end justify-between gap-3 mt-auto pt-2">
          {/* Selector de cantidad (tope = piezas disponibles) */}
          <div className="inline-flex items-center border border-input rounded-md">
            <button
              onClick={decrement}
              disabled={quantity <= 1}
              aria-label={tCart("item.decreaseQuantity")}
              className={cn(
                "h-8 w-8 flex items-center justify-center",
                "hover:bg-muted transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer",
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
              disabled={quantity >= maxQuantity}
              aria-label={tCart("item.increaseQuantity")}
              className={cn(
                "h-8 w-8 flex items-center justify-center",
                "hover:bg-muted transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer",
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