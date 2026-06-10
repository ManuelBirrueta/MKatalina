/**
 * ============================================================================
 * BRAND STORY — KATALINA (Sección 4 de la Home)
 * ============================================================================
 *
 * Sección editorial donde la marca cuenta SU HISTORIA. Es el alma del sitio,
 * lo que diferencia a Katalina de un e-commerce genérico de joyería.
 *
 * Anatomía visual:
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  ┌──────────────┐    EYEBROW: Hecho con propósito                │
 *   │  │              │                                                │
 *   │  │              │    Hecho a mano                                │
 *   │  │  IMAGEN      │    en México                                   │
 *   │  │  (manos      │                                                │
 *   │  │  trabajando) │    Párrafo de 3-4 líneas contando la historia │
 *   │  │              │    de la marca, valores, proceso artesanal.    │
 *   │  │              │                                                │
 *   │  └──────────────┘    Conoce nuestra historia →                   │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Decisiones de diseño:
 *
 *   1. IMAGEN A LA IZQUIERDA, TEXTO A LA DERECHA: patrón clásico editorial.
 *      En contraste con el hero (texto izq, imagen der), este orden crea
 *      ritmo visual al hacer scroll: la página "respira" entre layouts.
 *
 *   2. IMAGEN DE PROCESO, NO DE PRODUCTO: aquí queremos foto de manos
 *      trabajando, herramientas, el taller. NO joyería terminada (esa va
 *      en el hero y en los productos destacados).
 *
 *   3. TEXTO MÁS LARGO QUE EN OTRAS SECCIONES: aquí es donde dejamos
 *      que la marca hable. 3-4 líneas en lugar de 1-2.
 *
 *   4. CTA TIPO LINK (NO BOTÓN): el call-to-action aquí es "leer más" no
 *      "comprar ahora". El link inline con flecha lo refleja perfectamente.
 *
 *   5. FONDO LIGERAMENTE OSCURO: bg-muted en lugar del background normal.
 *      Otra forma de crear "bandas" sutiles entre secciones.
 * ============================================================================
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

export function BrandStory() {
  return (
    <section className="py-24">
      <Container>
        {/*
         * GRID DE 2 COLUMNAS asimétricas:
         *   - lg:grid-cols-2 = dos columnas IGUALES en desktop
         *   - En móvil: stack vertical (imagen arriba, texto debajo)
         *
         * gap-12 lg:gap-20 = más espacio en desktop entre las dos columnas
         * para que el conjunto no se sienta apretado.
         *
         * items-center = ambas columnas se centran verticalmente entre sí.
         * Si el texto es más corto que la imagen, queda centrado.
         */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/*
           * ─── IMAGEN ───
           * Placeholder con aspect 4:5 (el formato editorial estándar).
           */}
          <div className="order-1">
            <div
              className={cn(
                "relative aspect-[4/5] w-full overflow-hidden",
                "bg-secondary-subtle",
                "flex items-center justify-center"
              )}
            >
              <div className="text-center px-8">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Imagen taller
                </p>
                <p className="font-display text-lg text-foreground">
                  Foto de manos artesanales
                  <br />
                  trabajando una pieza
                </p>
              </div>
            </div>
          </div>

          {/*
           * ─── TEXTO ───
           * space-y-6 = 24px de separación entre cada elemento (eyebrow,
           * título, párrafos, CTA). Más aire que en hero porque aquí el
           * texto es protagonista.
           */}
          <div className="order-2 space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              Hecho con propósito
            </p>

            {/*
             * Título: ligeramente más chico que el hero (text-5xl en lugar
             * de text-7xl). Razón: el hero es el "grito" principal de la
             * página; las otras secciones son "conversaciones".
             */}
            <h2
              className={cn(
                "font-display font-medium",
                "text-4xl md:text-5xl",
                "leading-[1.1] tracking-tight"
              )}
            >
              Hecho a mano
              <br />
              en México
            </h2>

            {/*
             * Párrafos del story. Dos párrafos cortos en lugar de uno
             * largo: más legible, más editorial.
             *
             * max-w-md = 28rem (~448px). Importante para legibilidad:
             * texto largo en líneas anchas cansa al lector.
             */}
            <div className="space-y-4 text-base text-muted-foreground leading-relaxed max-w-md">
              <p>
                Cada pieza de Katalina nace en un pequeño taller en el centro
                de México, donde manos expertas combinan técnicas tradicionales
                con diseño contemporáneo.
              </p>
              <p>
                Trabajamos con plata 925, oro rosa y piedras naturales,
                eligiendo materiales que envejecen con gracia y que tienen
                una historia detrás. Sin producción masiva. Sin desperdicio.
                Solo piezas pensadas para durar.
              </p>
            </div>

            {/* CTA tipo link */}
            <Link
              href="/quienes-somos"
              className={cn(
                "group inline-flex items-center gap-2",
                "text-xs uppercase tracking-[0.15em] font-medium",
                "text-foreground hover:text-accent transition-colors duration-200",
                "border-b border-foreground hover:border-accent pb-1"
              )}
            >
              Conoce nuestra historia
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}