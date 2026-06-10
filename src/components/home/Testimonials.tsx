/**
 * ============================================================================
 * TESTIMONIALS — KATALINA (Sección 5 de la Home)
 * ============================================================================
 *
 * Tres reseñas de clientes reales. Crea PRUEBA SOCIAL: "otras personas como
 * yo confiaron y les gustó". Es uno de los factores más influyentes en
 * decisión de compra para joyería en LATAM, donde la confianza en pagos
 * online y calidad de producto es un blocker común.
 *
 * Decisiones de diseño:
 *   1. EXACTAMENTE 3 TESTIMONIOS — número óptimo
 *   2. ESTRELLAS EN COBRE — respeta la paleta de marca
 *   3. CITAS LARGAS (3-4 LÍNEAS) — creíbles, no pegan a vista
 *   4. NOMBRE + PIEZA COMPRADA — contextualiza el testimonio
 * ============================================================================
 */

import { Star } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

/**
 * Testimonial — estructura de una reseña.
 *
 * Cuando integremos backend, los testimonios vendrán de la base de datos
 * con reseñas verificadas. Por ahora hardcodeamos 3 placeholders.
 */
interface Testimonial {
  /** Texto de la reseña */
  quote: string;
  /** Nombre de la persona que dio la reseña */
  author: string;
  /** Producto comprado, para contextualizar (ej. "Aretes Camelia") */
  product: string;
  /** Rating de 1 a 5 estrellas */
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
 * StarRating — sub-componente para renderizar las estrellas de un testimonio.
 *
 * Lo separamos porque también lo usaremos en:
 *   - Página de detalle de producto (resumen de reviews)
 *   - Página individual de cada review
 *   - Filtros de "buscar por rating"
 *
 * Cuando llegue ese momento, lo extraeremos a `src/components/shop/StarRating.tsx`.
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating
              ? "fill-accent text-accent" // Llena + color cobre
              : "fill-none text-muted-foreground" // Vacía
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Testimonials — el componente principal exportado.
 *
 * IMPORTANTE: el nombre de esta función debe ser EXACTAMENTE "Testimonials"
 * (igual al nombre del archivo Testimonials.tsx). Si lees "BrandStory" o
 * cualquier otra cosa aquí, el contenido del archivo está equivocado.
 */
export function Testimonials() {
  return (
    <section className="py-24 bg-muted/30">
      <Container>
        {/* Header de sección */}
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
            La confianza de nuestras clientas
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium">
            Lo que dicen
          </h2>
        </header>

        {/*
         * Grid responsivo:
         *   - móvil: 1 columna (stack vertical)
         *   - desktop: 3 columnas
         */}
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
              {/* Estrellas en la parte superior */}
              <StarRating rating={testimonial.rating} />

              {/*
               * Cita del testimonio con comillas tipográficas en cobre.
               * Detalle editorial que distingue una reseña real de un
               * párrafo cualquiera.
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

              {/* Footer del testimonio: nombre + producto comprado */}
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