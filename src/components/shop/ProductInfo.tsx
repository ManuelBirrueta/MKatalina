/**
 * ============================================================================
 * PRODUCT INFO — KATALINA (Fase 12 Turno 3B.2: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server Component a Client Component porque ahora usa
 *     useLocale + useTranslations (ambos hooks de Client)
 *   - product.name resuelve a string con getLocalized()
 *   - product.description resuelve a string con getLocalized() antes del split
 *   - product.category se traduce vía namespace product.categories
 *   - Textos hardcoded ("reseña/reseñas", "Envío gratis", etc.) ahora vienen
 *     de messages.json bajo el namespace "product"
 *
 * Por qué convertir a Client Component:
 *   En el Turno 3A vimos que para Client Components usamos useTranslations,
 *   para Server Components usamos getTranslations (async). Como este
 *   componente NO tiene operaciones async ni hidratación específica, lo más
 *   simple es agregar "use client" y usar useTranslations.
 *
 *   Trade-off: pierde la optimización de ser puro HTML server-rendered.
 *   Pero es un componente pequeño y va dentro de una página Server que
 *   sí pre-renderiza el HTML.
 *
 * El resto se mantiene idéntico: layout, rating, precios, badges informativos.
 * ============================================================================
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { ProductDetail } from "@/types/product";

interface ProductInfoProps {
  product: ProductDetail;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("product");

  /**
   * Resolver el nombre y la descripción al locale activo.
   * Ambos son LocalizedString en el tipo nuevo.
   */
  const productName = getLocalized(product.name, locale);
  const description = getLocalized(product.description, locale);

  /**
   * Resumen: primer párrafo de la descripción, truncado a ~200 chars
   * en una palabra completa.
   *
   * Importante: ahora description es un string YA resuelto al locale,
   * así que .split() funciona normalmente. Antes del fix, intentaba
   * hacer split sobre el objeto { es, en } y fallaba.
   */
  const shortDescription = (() => {
    const fullDesc = description.split("\n")[0];
    if (fullDesc.length <= 200) return fullDesc;
    const truncated = fullDesc.substring(0, 200);
    const lastSpace = truncated.lastIndexOf(" ");
    return truncated.substring(0, lastSpace) + "...";
  })();

  return (
    <div className="space-y-5">
      {/*
       * Eyebrow: categoría traducida vía namespace.
       * product.category es enum en español ("Aretes" / "Collares" / etc.)
       */}
      <p className="text-xs uppercase tracking-[0.3em] text-accent">
        {t(`categories.${product.category}`)}
      </p>

      <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
        {productName}
      </h1>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <div
          className="flex gap-0.5"
          aria-label={t("rating.ariaLabel", { rating: product.averageRating })}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                star <= Math.round(product.averageRating)
                  ? "fill-accent text-accent"
                  : "fill-none text-muted-foreground"
              )}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="text-sm text-foreground font-medium tabular-nums">
          {product.averageRating.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">
          ({product.reviewCount}{" "}
          {/*
           * Singular vs plural traducido.
           * En español: "1 reseña" / "47 reseñas"
           * En inglés: "1 review" / "47 reviews"
           */}
          {product.reviewCount === 1
            ? t("rating.reviewSingular")
            : t("rating.reviewPlural")}
          )
        </span>
      </div>

      {/* Precio — formato universal mediante formatPrice */}
      <div className="flex items-baseline gap-3 py-2">
        <span className="text-3xl font-medium text-foreground tabular-nums">
          {formatPrice(product.price)}
        </span>

        {product.originalPrice && product.originalPrice > product.price && (
          <span className="text-base text-muted-foreground line-through tabular-nums">
            {formatPrice(product.originalPrice)}
          </span>
        )}
      </div>

      {/* Descripción corta — ya resuelto al locale */}
      <p className="text-base text-muted-foreground leading-relaxed">
        {shortDescription}
      </p>

      {/*
       * Badges informativos: envío, compra protegida, hecho a mano.
       * Cada uno traducido vía namespace product.info.
       */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border">
        <span className="inline-flex items-center gap-1">
          <span className="text-accent">●</span>
          {t("info.freeShipping")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-accent">●</span>
          {t("info.protectedPurchase")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-accent">●</span>
          {t("info.handmade")}
        </span>
      </div>
    </div>
  );
}