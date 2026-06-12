/**
 * ============================================================================
 * TESTIMONIALS — KATALINA (Fase 12 Turno 3B.3: bilingüe — solo chrome)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component (necesario para useTranslations).
 *   - Eyebrow + título de sección traducidos desde "homepage.testimonials.*".
 *   - El aria-label del StarRating se construye con t() para que el screen
 *     reader lo lea en el idioma correcto ("X de 5 estrellas" / "X out of
 *     5 stars").
 *
 * Lo que NO cambia (DECISIÓN ARQUITECTURAL):
 *   - Las 3 quotes, autores y productos referenciados SE QUEDAN HARDCODED
 *     EN ESPAÑOL. Razón: son contenido editorial de clientes reales, no
 *     copy de la marca. Es el mismo patrón que usamos con las reviews mock
 *     (review.title, review.comment, review.userName NO se traducen).
 *
 *     Si "María L." dice "Las piezas son una joya..." en español, ese ES
 *     su testimonio real. Traducirlo automáticamente sería:
 *     a) inventar palabras que María nunca dijo
 *     b) editorial inconsistente (¿por qué este testimonio sí y la reseña
 *        de un producto no?)
 *
 *     Cuando integremos backend, cada testimonio podría tener:
 *       - quote: LocalizedString (si el admin curador lo traduce manualmente)
 *       - O quedar en el idioma original del cliente
 *
 * Lo que NO cambia (visual):
 *   - Estructura: 3 cards en desktop, stack en móvil
 *   - Fondo crema sutil (bg-muted/30) para crear "banda" visual
 *   - Estrellas cobre (StarRating)
 *   - Comillas tipográficas en cobre alrededor de cada quote
 *   - Card con border, padding 8, rounded-md
 *
 * ─── PATRÓN PARA EL ARIA-LABEL DEL StarRating ──────────────────────────
 *
 * StarRating es un sub-componente local. Recibe el rating (número) y
 * ahora también recibe el aria-label ya traducido como prop. Razón:
 * StarRating no se renderiza arriba en jerarquía, así que no podemos
 * llamar a useTranslations dentro de Testimonials para pasarle el
 * aria-label ya resuelto.
 *
 * Alternativa rechazada: llamar useTranslations dentro de StarRating
 * también. Funciona, pero estoy pasando t() múltiples veces por el
 * árbol cuando ya tengo el texto resuelto arriba. Es más simple y
 * eficiente pasar el string ya traducido.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

/**
 * Testimonial — estructura de una reseña hardcoded.
 *
 * Las quotes/autores/productos NO son LocalizedString (decisión arquitectural).
 * Cuando integremos backend con admin curador, puede que cada testimonio
 * sea bilingüe si la marca decide traducirlos manualmente.
 */
interface Testimonial {
  quote: string;
  author: string;
  product: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Las piezas son una joya. Encargué unos aretes para mi mamá y llegaron impecablemente empacados. La calidad supera por mucho lo que esperaba. Volveré por más.",
    author: "María L.",
    product: "Aretes Camelia",
    rating: 5,
  },
  {
    quote:
      "La atención al cliente es excepcional. Tenía dudas sobre el largo del collar y me respondieron en minutos. La pieza es hermosa, justo como en las fotos.",
    author: "Sofía R.",
    product: "Collar Luna Llena",
    rating: 5,
  },
  {
    quote:
      "Compré una pulsera para regalar y terminé pidiendo otra para mí. Se ven y se sienten de muy buena calidad. Llegan en una caja preciosa, lista para regalar.",
    author: "Ana M.",
    product: "Pulsera Dalia",
    rating: 5,
  },
];

/**
 * StarRating — sub-componente local para las estrellas.
 *
 * Recibe el rating (número 1-5) y un aria-label ya traducido como string.
 * Esto permite que Testimonials llame a useTranslations una sola vez y
 * pase los textos resueltos hacia abajo.
 */
function StarRating({
  rating,
  ariaLabel,
}: {
  rating: number;
  ariaLabel: string;
}) {
  return (
    <div className="flex gap-0.5" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating
              ? "fill-accent text-accent"
              : "fill-none text-muted-foreground"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const t = useTranslations("homepage.testimonials");

  return (
    <section className="py-24 bg-muted/30">
      <Container>
        {/* Header de sección */}
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium">
            {t("title")}
          </h2>
        </header>

        {/* Grid: 1 col móvil, 3 cols desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                "bg-card p-8",
                "border border-border",
                "rounded-md",
                "flex flex-col gap-4"
              )}
            >
              {/*
               * Estrellas: pasamos el aria-label traducido para que el
               * screen reader lo lea correctamente en cada idioma.
               */}
              <StarRating
                rating={testimonial.rating}
                ariaLabel={t("ratingAriaLabel", { rating: testimonial.rating })}
              />

              {/*
               * Quote con comillas tipográficas en cobre.
               * El texto se queda en español (decisión arquitectural).
               */}
              <blockquote className="text-base text-foreground leading-relaxed flex-1">
                <span className="text-accent text-2xl font-display leading-none mr-1">
                  &ldquo;
                </span>
                {testimonial.quote}
                <span className="text-accent text-2xl font-display leading-none ml-1">
                  &rdquo;
                </span>
              </blockquote>

              {/* Footer: nombre del autor + producto comprado */}
              <footer className="pt-4 border-t border-border">
                <cite className="font-display text-base not-italic text-foreground block">
                  {testimonial.author}
                </cite>
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  {testimonial.product}
                </p>
              </footer>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}