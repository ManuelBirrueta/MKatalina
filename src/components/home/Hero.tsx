/**
 * ============================================================================
 * HERO — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component (necesario para useTranslations).
 *     Cualquier componente con texto traducido del proyecto sigue el mismo
 *     patrón. Costo en bundle: insignificante (Hero es pequeño).
 *   - import Link cambia a "@/i18n/navigation" (mantiene prefijo locale)
 *   - Todos los textos hardcoded traducidos desde "homepage.hero.*"
 *   - El título con palabra resaltada usa t.rich() con un componente custom
 *     <em> que aplica el color cobre
 *
 * Lo que NO cambia:
 *   - Estructura visual: layout 2 columnas desktop, stack móvil
 *   - Animaciones de los CTAs (group-hover en flecha)
 *   - Placeholder de imagen con aspect ratio 4/5
 *   - Color cobre del eyebrow y de la palabra resaltada
 *
 * ─── PATRÓN t.rich() PARA EL TÍTULO CON <em> ──────────────────────────
 *
 * El título original tenía estructura:
 *   <h1>
 *     Piezas que<br />
 *     cuentan tu<br />
 *     <em className="text-accent not-italic">historia</em>
 *   </h1>
 *
 * Para bilingüe, podemos:
 *   A) Una sola clave con marcadores: "Piezas que\ncuentan tu\n<em>historia</em>"
 *      y usar t.rich() con el componente <em> mapeado
 *   B) Dos claves: línea + palabra resaltada, concatenadas en JSX
 *
 * Elegí Opción B (más simple): 3 keys separadas (titleLine1, titleLine2,
 * titleHighlighted). Cada idioma controla su propio orden de palabras y
 * la palabra resaltada se renderiza en <em>.
 *
 * Esto es importante porque en inglés la estructura natural es:
 *   "Pieces that / tell your / story"
 * Y la palabra resaltada cambia ("historia" → "story"). Con 3 keys
 * separadas, cada idioma tiene control total sobre el wording sin
 * forzarse al patrón del otro.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Hero — primera sección de la home, ahora Client Component bilingüe.
 */
export function Hero() {
  const t = useTranslations("homepage.hero");

  return (
    <section
      className={cn(
        "relative min-h-[80vh] flex items-center",
        // Quitamos el padding-top del main que recibiría del layout
        // para que el hero se pegue al header (efecto editorial).
        "-mt-6 md:-mt-6"
      )}
    >
      <Container>
        {/* Grid 2 columnas en desktop, 1 en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          {/* ─── COLUMNA IZQUIERDA: TEXTO + CTAs ─── */}
          <div className="order-2 lg:order-1 space-y-6">
            {/* Eyebrow en mayúsculas cobre */}
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              {t("eyebrow")}
            </p>

            {/*
             * Título hero con palabra resaltada al final.
             *
             * 3 líneas controladas por claves separadas. La última se
             * envuelve en <em> con clase text-accent + not-italic para
             * el resaltado en cobre sin formato itálico.
             */}
            <h1
              className={cn(
                "font-display font-medium",
                "text-5xl md:text-6xl lg:text-7xl",
                "leading-[1.05] tracking-tight",
                "text-foreground"
              )}
            >
              {t("titleLine1")}
              <br />
              {t("titleLine2")}
              <br />
              <em className="text-accent not-italic">
                {t("titleHighlighted")}
              </em>
            </h1>

            {/* Descripción */}
            <p className="text-base text-muted-foreground max-w-md leading-relaxed">
              {t("description")}
            </p>

            {/* CTAs: botón primario + link secundario */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg">
                <Link href="/aretes">{t("ctaPrimary")}</Link>
              </Button>

              <Link
                href="/quienes-somos"
                className={cn(
                  "group inline-flex items-center gap-2",
                  "text-xs uppercase tracking-[0.15em] font-medium",
                  "text-foreground hover:text-accent transition-colors duration-200",
                  "border-b border-foreground hover:border-accent pb-1"
                )}
              >
                {t("ctaSecondary")}
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* ─── COLUMNA DERECHA: IMAGEN HERO (placeholder) ─── */}
          <div className="order-1 lg:order-2">
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
        </div>
      </Container>
    </section>
  );
}