/**
 * ============================================================================
 * RESERVATION CTA — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component (necesario para useTranslations).
 *   - import Link cambia a "@/i18n/navigation".
 *   - Todos los textos traducidos desde "homepage.reservationCTA.*":
 *     eyebrow, título, descripción y CTA.
 *
 * Lo que NO cambia:
 *   - Fondo cobre (bg-accent) — el "grito visual" de la página
 *   - Texto crema (text-accent-foreground) sobre el fondo cobre
 *   - Centrado, sin imagen, máximo foco en el CTA
 *   - Botón outline con bordes crema que se invierten al hover
 *   - max-w-md en la descripción para legibilidad
 *
 * ─── DECISIÓN: TODO EN UNA SOLA SECCIÓN, SIN SECCIÓN SECUNDARIA ────────
 *
 * Este componente no usa keys complejas como Hero o BrandStory (que tienen
 * título en múltiples líneas). El título "¿Buscas algo único?" / "Looking
 * for something unique?" es UNA SOLA LÍNEA en ambos idiomas. Por eso una
 * sola key `title` es suficiente.
 *
 * Si en el futuro decidimos partirlo en 2 líneas (ej. "¿Buscas algo / único?"),
 * adoptaríamos el patrón titleLine1 + titleLine2 igual que BrandStory.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReservationCTA() {
  const t = useTranslations("homepage.reservationCTA");

  return (
    <section className="bg-accent text-accent-foreground py-24">
      <Container size="narrow">
        {/* Contenido centrado, max-w heredado de Container size="narrow" */}
        <div className="text-center space-y-6">
          {/*
           * Eyebrow: usa accent-foreground/80 (crema 80% opacidad) para
           * que se vea "secundario" sin perder legibilidad. NO usamos
           * text-accent porque sería cobre-sobre-cobre = invisible.
           */}
          <p
            className={cn(
              "text-xs uppercase tracking-[0.3em]",
              "text-accent-foreground/80"
            )}
          >
            {t("eyebrow")}
          </p>

          {/* Título grande, crema completo */}
          <h2
            className={cn(
              "font-display font-medium",
              "text-4xl md:text-5xl lg:text-6xl",
              "leading-[1.1] tracking-tight",
              "text-accent-foreground"
            )}
          >
            {t("title")}
          </h2>

          {/* Descripción centrada con max-w-md */}
          <p
            className={cn(
              "text-base leading-relaxed",
              "text-accent-foreground/80",
              "max-w-md mx-auto"
            )}
          >
            {t("description")}
          </p>

          {/*
           * CTA: outline custom adaptado al fondo cobre.
           * Borde crema + texto crema. Hover: invierte (fondo crema, texto cobre).
           */}
          <div className="pt-4">
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                "border-accent-foreground text-accent-foreground",
                "hover:bg-accent-foreground hover:text-accent"
              )}
            >
              <Link href="/reservaciones">{t("ctaButton")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}