/**
 * ============================================================================
 * PRODUCT CARD — KATALINA (Fase 12 Turno 3B.2: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link cambia de "next/link" a "@/i18n/navigation"
 *     (mantiene el prefijo de idioma en las URLs)
 *   - product.name se resuelve con getLocalized() porque ahora es LocalizedString
 *   - product.category se traduce vía mapping en messages.json (namespace product.categories)
 *   - badgeLabels se traduce vía namespace product.badges
 *   - aria-label del wishlist se traduce vía namespace product.wishlist
 *
 * Toda la lógica visual (hover zoom, animación del corazón, badges,
 * stop propagation) se mantiene idéntica.
 *
 * Patrón:
 *   - useLocale para saber el idioma activo (para getLocalized)
 *   - useTranslations para los labels del UI
 *   - Mapping de category usando t() porque las claves de categoría
 *     son enums fijos ("Aretes", "Collares", etc.)
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/hooks/use-wishlist";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { Product, ProductBadgeType } from "@/types/product";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

/**
 * badgeStyles — sin cambios. Los colores son universales.
 */
const badgeStyles: Record<ProductBadgeType, { bg: string; text: string }> = {
  nuevo: { bg: "bg-primary", text: "text-primary-foreground" },
  oferta: { bg: "bg-secondary", text: "text-secondary-foreground" },
  limitado: { bg: "bg-accent", text: "text-accent-foreground" },
  agotado: { bg: "bg-muted", text: "text-muted-foreground" },
};

/**
 * NOTA: badgeLabels ya NO existe como const.
 * Los labels se obtienen ahora con t("badges.nuevo"), t("badges.oferta"), etc.
 */

export function ProductCard({
  product,
  className,
  priority = false,
}: ProductCardProps) {
  /**
   * Hooks de i18n:
   *   - locale: idioma activo, para resolver getLocalized()
   *   - t: traducciones bajo el namespace "product"
   */
  const locale = useLocale() as Locale;
  const t = useTranslations("product");

  const wishlist = useWishlist();
  const isInWishlist = wishlist.has(product.id);

  const [justClicked, setJustClicked] = useState(false);

  const effectiveBadge: ProductBadgeType | undefined =
    product.badge ??
    (product.originalPrice && product.originalPrice > product.price
      ? "oferta"
      : undefined);

  /**
   * Resolver el nombre al idioma activo.
   * Lo hacemos UNA vez al inicio y reutilizamos.
   */
  const productName = getLocalized(product.name, locale);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlist) {
      wishlist.remove(product.id);
    } else {
      wishlist.add(product.id);
    }

    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 300);
  };

  const mainImage = product.images[0];

  return (
    <Link
      href={product.href}
      className={cn("group block", className)}
    >
      {/* ─── SECCIÓN IMAGEN ─── */}
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden",
          "bg-secondary-subtle"
        )}
      >
        {mainImage?.src.startsWith("/placeholder") ? (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "transition-transform duration-700",
              "group-hover:scale-105"
            )}
          >
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {productName}
            </span>
          </div>
        ) : (
          <Image
            src={mainImage.src}
            alt={mainImage.alt}
            fill
            className={cn(
              "object-cover",
              "transition-transform duration-700 group-hover:scale-105"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />
        )}

        {/*
         * BADGE — el texto se traduce vía t("badges.X").
         * effectiveBadge es la clave del enum ("nuevo", "oferta", etc.)
         */}
        {effectiveBadge && (
          <div
            className={cn(
              "absolute top-3 left-3",
              "px-2.5 py-1 rounded-sm",
              "text-[10px] uppercase tracking-[0.15em] font-medium",
              badgeStyles[effectiveBadge].bg,
              badgeStyles[effectiveBadge].text
            )}
          >
            {t(`badges.${effectiveBadge}`)}
          </div>
        )}

        {/*
         * BOTÓN WISHLIST — aria-label se traduce con interpolación de productName.
         * t("wishlist.add", { productName }) devuelve "Agregar Aretes Camelia
         * a la wishlist" / "Add Camelia Earrings to wishlist".
         */}
        <button
          onClick={handleWishlistClick}
          aria-label={
            isInWishlist
              ? t("wishlist.remove", { productName })
              : t("wishlist.add", { productName })
          }
          aria-pressed={isInWishlist}
          className={cn(
            "absolute top-3 right-3",
            "h-9 w-9 rounded-full",
            "flex items-center justify-center",
            "bg-card/80 backdrop-blur-sm",
            "hover:bg-card",
            "transition-all duration-200",
            justClicked && "scale-110"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isInWishlist
                ? "fill-secondary text-secondary"
                : "text-foreground"
            )}
          />
        </button>
      </div>

      {/* ─── SECCIÓN TEXTO ─── */}
      <div className="pt-4 space-y-1">
        {/*
         * Eyebrow: categoría traducida.
         * product.category es enum en español ("Aretes"). El t() mapea
         * a "Aretes" en es o "Earrings" en en según el namespace product.categories.
         */}
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t(`categories.${product.category}`)}
        </p>

        {/*
         * Nombre del producto resuelto al locale.
         */}
        <h3
          className={cn(
            "font-display text-base font-medium",
            "transition-colors duration-200",
            "group-hover:text-accent"
          )}
        >
          {productName}
        </h3>

        {/* Línea de precios — los números son universales */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-sm font-medium text-foreground">
            {formatPrice(product.price)}
          </span>

          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}