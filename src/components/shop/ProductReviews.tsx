/**
 * ============================================================================
 * PRODUCT REVIEWS — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link de "next/link" → "@/i18n/navigation"
 *   - useTranslations agregado con namespace "reviews"
 *   - Header de sección (eyebrow + título) traducido
 *   - LoginPrompt traducido (título, descripción, 2 botones)
 *   - EmptyState traducido (título + descripción según auth status)
 *
 * Lo que NO cambia:
 *   - Recibe productName como prop YA RESUELTO (el padre lo pasa con
 *     getLocalized — verificado en page.tsx)
 *   - Estado local de reseñas + recalculate stats
 *   - Estructura de sub-componentes (ReviewSummary, ReviewForm, ReviewsList)
 *
 * Decisión arquitectural mantenida:
 *   Las reseñas mock NO se traducen. El title/comment de cada Review se
 *   queda en español (es contenido editorial específico de cada testimonio).
 *   Solo se traduce el UI alrededor.
 *
 * En el futuro, cuando lleguen reseñas reales con backend, cada Review
 * tendrá `language: "es" | "en"` y se mostrará con su idioma original,
 * agregando un disclaimer "Traducido del español" si quisiéramos i18n
 * automática. Pero esa es discusión para Fase 12 backend.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogIn } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { ReviewSummary } from "@/components/shop/ReviewSummary";
import { ReviewForm } from "@/components/shop/ReviewForm";
import { ReviewsList } from "@/components/shop/ReviewsList";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Review, NewReviewInput, ReviewStats } from "@/types/review";

interface ProductReviewsProps {
  productSlug: string;
  /**
   * Nombre del producto YA RESUELTO al locale activo (string, no LocalizedString).
   * El padre (productos/[slug]/page.tsx) lo resuelve antes de pasarlo.
   */
  productName: string;
  initialReviews: Review[];
  initialStats: ReviewStats;
}

export function ProductReviews({
  productSlug,
  productName,
  initialReviews,
  initialStats,
}: ProductReviewsProps) {
  const t = useTranslations("reviews");
  const { isAuthenticated, user } = useAuth();

  /**
   * Estado local de reseñas.
   * Cuando el usuario envía una nueva, la agregamos al inicio del array
   * y recalculamos las stats agregadas.
   */
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [stats, setStats] = useState<ReviewStats>(initialStats);

  /**
   * handleNewReview — agrega una reseña al estado local (optimistic UI).
   * En Fase 12+ con backend: POST + refetch.
   */
  const handleNewReview = (input: NewReviewInput) => {
    if (!user) return;

    const newReview: Review = {
      id: `local-${Date.now()}`,
      productSlug,
      userId: user.id,
      userName: user.firstName,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      createdAt: new Date().toISOString(),
      verified: false,
      helpful: 0,
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);

    const newStats = calculateStatsFromList(updatedReviews);
    setStats(newStats);
  };

  return (
    <section className="border-t border-border" id="reviews">
      <Container>
        <div className="py-16">
          {/* Header de la sección */}
          <header className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
              {t("header.eyebrow")}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium">
              {t("header.title")}
              {stats.totalReviews > 0 && (
                <span className="text-muted-foreground ml-2 tabular-nums">
                  ({stats.totalReviews})
                </span>
              )}
            </h2>
          </header>

          {/* Resumen agregado (solo si hay reseñas) */}
          <ReviewSummary stats={stats} />

          {/* Formulario o banner login */}
          <div className="py-8">
            {isAuthenticated ? (
              <ReviewForm
                productName={productName}
                onSubmit={handleNewReview}
              />
            ) : (
              <LoginPrompt />
            )}
          </div>

          {/* Lista de reseñas o estado vacío */}
          {reviews.length > 0 ? (
            <ReviewsList reviews={reviews} />
          ) : (
            <EmptyState />
          )}
        </div>
      </Container>
    </section>
  );
}

/**
 * LoginPrompt — banner para usuarios sin sesión.
 * Textos del namespace reviews.loginPrompt.
 */
function LoginPrompt() {
  const t = useTranslations("reviews.loginPrompt");

  return (
    <div
      className={cn(
        "border border-border rounded-md p-8",
        "text-center",
        "bg-muted/30"
      )}
    >
      <LogIn className="h-6 w-6 mx-auto text-accent mb-3" />
      <h3 className="font-display text-xl font-medium mb-2">{t("title")}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
        {t("description")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/login">{t("loginButton")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/registro">{t("registerButton")}</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * EmptyState — cuando aún no hay reseñas del producto.
 * Mensaje varía según si el usuario está logueado o no.
 */
function EmptyState() {
  const t = useTranslations("reviews.empty");
  const { isAuthenticated } = useAuth();

  return (
    <div className="py-12 text-center">
      <h3 className="font-display text-xl font-medium mb-2">{t("title")}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {isAuthenticated
          ? t("descriptionAuthenticated")
          : t("descriptionGuest")}
      </p>
    </div>
  );
}

/**
 * calculateStatsFromList — recalcula stats al agregar una reseña local.
 * Sin cambios respecto a la versión anterior.
 */
function calculateStatsFromList(reviews: Review[]): ReviewStats {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = sum / reviews.length;

  const distribution: Record<"1" | "2" | "3" | "4" | "5", number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };

  for (const review of reviews) {
    const key = review.rating.toString() as "1" | "2" | "3" | "4" | "5";
    distribution[key]++;
  }

  return {
    averageRating,
    totalReviews: reviews.length,
    distribution,
  };
}