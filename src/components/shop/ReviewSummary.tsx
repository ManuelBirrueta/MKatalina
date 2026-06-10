/**
 * ============================================================================
 * REVIEW SUMMARY — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server Component a Client Component (necesario para
 *     useTranslations). Es ligero, costo mínimo.
 *   - aria-labels y "reseña/reseñas" traducidos
 *
 * Lo que NO cambia:
 *   - Si totalReviews === 0 no renderiza nada (el padre muestra empty state)
 *   - Lógica de cálculo de porcentajes y distribución
 *   - Layout 2 columnas (promedio | distribución)
 *
 * Pluralización: keys separadas `totalSingular` y `totalPlural` para
 * legibilidad (mismo patrón que en wishlist, apartados, etc.).
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewStats } from "@/types/review";

interface ReviewSummaryProps {
  stats: ReviewStats;
}

export function ReviewSummary({ stats }: ReviewSummaryProps) {
  const t = useTranslations("reviews.summary");

  if (stats.totalReviews === 0) return null;

  const averageFormatted = stats.averageRating.toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 py-8 border-b border-border">
      {/* Promedio grande */}
      <div className="text-center md:text-left">
        <p className="font-display text-5xl font-medium text-foreground tabular-nums">
          {averageFormatted}
        </p>

        <div
          className="flex gap-0.5 mt-2 justify-center md:justify-start"
          aria-label={t("averageAriaLabel", { rating: averageFormatted })}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                star <= Math.round(stats.averageRating)
                  ? "fill-accent text-accent"
                  : "fill-none text-muted-foreground"
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Total con pluralización */}
        <p className="text-sm text-muted-foreground mt-2">
          {stats.totalReviews === 1
            ? t("totalSingular", { count: stats.totalReviews })
            : t("totalPlural", { count: stats.totalReviews })}
        </p>
      </div>

      {/* Distribución por rating (5 barras: 5★, 4★, 3★, 2★, 1★) */}
      <div className="space-y-2">
        {([5, 4, 3, 2, 1] as const).map((rating) => {
          const count =
            stats.distribution[rating.toString() as "1" | "2" | "3" | "4" | "5"];
          const percentage =
            stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 w-10 flex-shrink-0">
                <span className="text-foreground tabular-nums">{rating}</span>
                <Star
                  className="h-3 w-3 fill-accent text-accent"
                  aria-hidden="true"
                />
              </div>

              <div
                className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={stats.totalReviews}
                aria-label={t("barAriaLabel", { count, rating })}
              >
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="text-muted-foreground tabular-nums w-8 text-right text-xs">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}