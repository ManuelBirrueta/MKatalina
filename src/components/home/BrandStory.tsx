/**
 * ============================================================================
 * BRAND STORY — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component (necesario para useTranslations).
 *   - import Link cambia a "@/i18n/navigation".
 *   - Todos los textos hardcoded traducidos desde "homepage.brandStory.*":
 *     eyebrow, título en 2 líneas, 2 párrafos, CTA y placeholder de imagen.
 *
 * Lo que NO cambia:
 *   - Estructura visual: grid 2 columnas asimétricas
 *   - Imagen a la izquierda, texto a la derecha
 *   - Aspect ratio 4:5 del placeholder
 *   - CTA tipo link inline con flecha al hover
 *   - Espacio negativo generoso entre elementos (space-y-6, etc.)
 *
 * ─── PATRÓN: TÍTULO EN 2 LÍNEAS ────────────────────────────────────────
 *
 * El título original era:
 *   <h2>
 *     Hecho a mano<br />en México
 *   </h2>
 *
 * Para bilingüe usamos 2 keys separadas (titleLine1 + titleLine2) en lugar
 * de una sola con \n. Razón: cada idioma controla su quiebre de línea sin
 * forzar al otro. En inglés sería "Handmade / in Mexico" — mismo patrón
 * de 2 líneas pero con palabras de longitudes distintas.
 *
 * Es el mismo patrón que aplicamos en el Hero del Turno A.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

export function BrandStory() {
  const t = useTranslations("homepage.brandStory");

  return (
    <section className="py-24">
      <Container>
        {/* Grid 2 columnas iguales en desktop, stack en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ─── IMAGEN (placeholder) ─── */}
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
                  {t("imagePlaceholderEyebrow")}
                </p>
                <p className="font-display text-lg text-foreground">
                  {t("imagePlaceholderTextLine1")}
                  <br />
                  {t("imagePlaceholderTextLine2")}
                </p>
              </div>
            </div>
          </div>

          {/* ─── TEXTO ─── */}
          <div className="order-2 space-y-6">
            {/* Eyebrow en mayúsculas cobre */}
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              {t("eyebrow")}
            </p>

            {/* Título en 2 líneas controladas por keys separadas */}
            <h2
              className={cn(
                "font-display font-medium",
                "text-4xl md:text-5xl",
                "leading-[1.1] tracking-tight"
              )}
            >
              {t("titleLine1")}
              <br />
              {t("titleLine2")}
            </h2>

            {/*
             * 2 párrafos editoriales.
             * max-w-md mantiene la legibilidad (~448px de ancho máximo).
             */}
            <div className="space-y-4 text-base text-muted-foreground leading-relaxed max-w-md">
              <p>{t("paragraph1")}</p>
              <p>{t("paragraph2")}</p>
            </div>

            {/* CTA tipo link inline con flecha animada al hover */}
            <Link
              href="/quienes-somos"
              className={cn(
                "group inline-flex items-center gap-2",
                "text-xs uppercase tracking-[0.15em] font-medium",
                "text-foreground hover:text-accent transition-colors duration-200",
                "border-b border-foreground hover:border-accent pb-1"
              )}
            >
              {t("ctaLink")}
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