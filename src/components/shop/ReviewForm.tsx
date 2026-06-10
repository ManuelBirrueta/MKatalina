/**
 * ============================================================================
 * REVIEW FORM — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - useTranslations agregado con namespace "reviews.form"
 *   - Todos los textos hardcoded traducidos:
 *     * aria-label del form (con interpolación de productName)
 *     * Título "Escribe tu reseña"
 *     * Labels (rating, title, comment)
 *     * Placeholders
 *     * Hints "Entre X y Y caracteres"
 *     * Mensajes de error (5 distintos según campo y tipo)
 *     * Botón submit + estado "Enviando..."
 *     * Toasts success/error
 *     * aria-labels de estrellas con pluralización
 *
 * Lo que NO cambia:
 *   - Validación de length (rating obligatorio, title 3-80, comment 20-1000)
 *   - Hover preview de estrellas
 *   - Lógica de submit con try-catch
 *   - Reset del form al éxito
 *
 * Pluralización en aria-label de estrellas:
 *   "1 estrella" / "2 estrellas" (es)
 *   "1 star" / "2 stars" (en)
 *   Con interpolación de count + claves separadas singular/plural.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { NewReviewInput } from "@/types/review";

interface ReviewFormProps {
  /** Nombre del producto YA RESUELTO al locale activo */
  productName: string;
  onSubmit: (review: NewReviewInput) => Promise<void> | void;
}

export function ReviewForm({ productName, onSubmit }: ReviewFormProps) {
  const t = useTranslations("reviews.form");

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    rating?: string;
    title?: string;
    comment?: string;
  }>({});

  /**
   * Validación local. Si hay errores, los pone en state y devuelve false.
   * Los mensajes de error vienen de messages.json (no se traducen acá).
   */
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (rating === 0) newErrors.rating = t("errors.ratingRequired");

    if (title.length < 3) newErrors.title = t("errors.titleMin");
    else if (title.length > 80) newErrors.title = t("errors.titleMax");

    if (comment.length < 20) newErrors.comment = t("errors.commentMin");
    else if (comment.length > 1000)
      newErrors.comment = t("errors.commentMax");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        rating: rating as 1 | 2 | 3 | 4 | 5,
        title: title.trim(),
        comment: comment.trim(),
      });

      toast.success(t("toast.successTitle"), {
        description: t("toast.successDescription"),
      });
      // Reset del form al éxito
      setRating(0);
      setTitle("");
      setComment("");
      setErrors({});
    } catch {
      toast.error(t("toast.errorTitle"), {
        description: t("toast.errorDescription"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Rating mostrado visualmente: hover preview o rating fijo */
  const displayedRating = hoveredRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-border rounded-md p-6 space-y-5 bg-card"
      aria-label={t("ariaLabel", { productName })}
    >
      <h3 className="font-display text-2xl font-medium">{t("title")}</h3>

      {/* Selector de estrellas */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] font-medium block">
          {t("ratingLabel")}
        </label>

        <div
          className="flex gap-1"
          onMouseLeave={() => setHoveredRating(0)}
          role="radiogroup"
          aria-label={t("ratingGroupAriaLabel")}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              aria-label={
                /*
                 * aria-label con pluralización:
                 * "1 estrella" / "X estrellas" (es)
                 * "1 star" / "X stars" (en)
                 */
                star === 1
                  ? t("starSingular", { count: star })
                  : t("starPlural", { count: star })
              }
              aria-checked={rating === star}
              role="radio"
              className="p-1 transition-transform hover:scale-110 cursor-pointer"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  star <= displayedRating
                    ? "fill-accent text-accent"
                    : "fill-none text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>

        {errors.rating && (
          <p className="text-xs text-destructive" role="alert">
            {errors.rating}
          </p>
        )}
      </div>

      {/* Título */}
      <div className="space-y-2">
        <label
          htmlFor="review-title"
          className="text-xs uppercase tracking-[0.2em] font-medium block"
        >
          {t("titleLabel")}
        </label>

        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder={t("titlePlaceholder")}
          className={cn(
            "w-full h-10 px-3",
            "bg-background border border-input rounded-md",
            "text-sm",
            "focus:outline-none focus:border-ring transition-colors",
            errors.title && "border-destructive"
          )}
        />

        <div className="flex items-center justify-between text-xs">
          {errors.title ? (
            <p className="text-destructive" role="alert">
              {errors.title}
            </p>
          ) : (
            <span className="text-muted-foreground">{t("titleHint")}</span>
          )}
          <span className="text-muted-foreground tabular-nums">
            {title.length}/80
          </span>
        </div>
      </div>

      {/* Comentario */}
      <div className="space-y-2">
        <label
          htmlFor="review-comment"
          className="text-xs uppercase tracking-[0.2em] font-medium block"
        >
          {t("commentLabel")}
        </label>

        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={5}
          placeholder={t("commentPlaceholder")}
          className={cn(
            "w-full px-3 py-2",
            "bg-background border border-input rounded-md",
            "text-sm resize-none",
            "focus:outline-none focus:border-ring transition-colors",
            errors.comment && "border-destructive"
          )}
        />

        <div className="flex items-center justify-between text-xs">
          {errors.comment ? (
            <p className="text-destructive" role="alert">
              {errors.comment}
            </p>
          ) : (
            <span className="text-muted-foreground">{t("commentHint")}</span>
          )}
          <span className="text-muted-foreground tabular-nums">
            {comment.length}/1000
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          size="default"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? t("submitting") : t("submitButton")}
        </Button>
      </div>
    </form>
  );
}