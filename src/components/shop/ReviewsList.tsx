/**
 * ============================================================================
 * REVIEWS LIST — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - useLocale + useTranslations agregados
 *   - aria-label de estrellas traducido
 *   - Badge "Compra verificada" / "Verified purchase" traducido
 *   - "X persona/personas marcaron esto como útil" traducido + pluralización
 *   - "Ver X reseña/s más" traducido + pluralización
 *   - formatRelativeDate ahora recibe locale + justNowText desde t()
 *
 * Lo que NO cambia:
 *   - El TÍTULO Y COMENTARIO de cada reseña NO se traducen (decisión
 *     arquitectural — son testimonios específicos del autor en su idioma)
 *   - El nombre del autor tampoco se traduce
 *   - Paginación "Ver más" con incrementos de 5
 *
 * Sobre formatRelativeDate:
 *   La función ahora vive en lib/format.ts pero recibe 3 parámetros:
 *     1. isoDateString (fecha de la reseña)
 *     2. locale (idioma activo, viene de useLocale)
 *     3. justNowText (texto para diferencias < 1 minuto, viene de t())
 *
 *   Intl.RelativeTimeFormat traduce automáticamente las unidades (día,
 *   semana, mes) según el locale. Solo el caso "hace unos segundos" no
 *   está en Intl, por eso lo pasamos como string.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, ShieldCheck, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/format";
import type { Review } from "@/types/review";
import type { Locale } from "@/i18n/routing";

const INITIAL_VISIBLE = 5;
const LOAD_INCREMENT = 5;

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const t = useTranslations("reviews.list");

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  if (reviews.length === 0) return null;

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;
  const remainingCount = reviews.length - visibleCount;

  /**
   * Cuántas reseñas se van a cargar al hacer clic en "Ver más".
   * Es el mínimo entre LOAD_INCREMENT (5) y las que quedan.
   * Ej: si quedan 3, el botón dice "Ver 3 reseñas más".
   */
  const nextLoadCount = Math.min(LOAD_INCREMENT, remainingCount);

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border">
        {visibleReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + LOAD_INCREMENT)}
          >
            {/*
             * Pluralización del botón "Ver X reseña/s más":
             *   1 → "Ver 1 reseña más" / "View 1 more review"
             *   >1 → "Ver N reseñas más" / "View N more reviews"
             */}
            {nextLoadCount === 1
              ? t("loadMoreSingular", { count: nextLoadCount })
              : t("loadMorePlural", { count: nextLoadCount })}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * ReviewCard — una reseña individual.
 *
 * El title y comment NO se traducen (decisión arquitectural).
 * Solo el chrome del card (verified badge, fecha, contador útil) está
 * en el idioma activo.
 */
function ReviewCard({ review }: { review: Review }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("reviews.list");
  const tRelative = useTranslations("reviews.relativeTime");

  /**
   * Calcular fecha relativa en el locale activo.
   * Le pasamos a formatRelativeDate:
   *   1. La fecha ISO de la reseña
   *   2. El locale activo
   *   3. El texto "hace unos segundos" / "a few seconds ago"
   *      resuelto desde messages.json
   */
  const relativeDateText = formatRelativeDate(
    review.createdAt,
    locale,
    tRelative("justNow")
  );

  return (
    <article className="py-6 first:pt-0">
      {/* Estrellas + título */}
      <div className="space-y-2 mb-3">
        <div
          className="flex gap-0.5"
          aria-label={t("ratingAriaLabel", { rating: review.rating })}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-3.5 w-3.5",
                star <= review.rating
                  ? "fill-accent text-accent"
                  : "fill-none text-muted-foreground"
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {/*
         * Título de la reseña en el idioma del autor.
         * NO se traduce.
         */}
        <h4 className="font-display text-lg font-medium text-foreground">
          {review.title}
        </h4>
      </div>

      {/* Meta: autor + verificada + fecha */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-3">
        {/* Nombre del autor: tal cual está */}
        <span className="font-medium text-foreground">{review.userName}</span>

        {review.verified && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-success">
              <ShieldCheck className="h-3 w-3" />
              {t("verifiedPurchase")}
            </span>
          </>
        )}

        <span aria-hidden="true">·</span>
        <time dateTime={review.createdAt}>{relativeDateText}</time>
      </div>

      {/*
       * Comentario de la reseña en el idioma del autor.
       * NO se traduce.
       */}
      <p className="text-sm text-foreground leading-relaxed mb-3">
        {review.comment}
      </p>

      {/* Footer: contador "útil" con pluralización */}
      {review.helpful > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="h-3 w-3" />
          <span>
            {review.helpful === 1
              ? t("helpfulSingular", { count: review.helpful })
              : t("helpfulPlural", { count: review.helpful })}
          </span>
        </div>
      )}
    </article>
  );
}