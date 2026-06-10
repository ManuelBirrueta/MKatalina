/**
 * ============================================================================
 * RESERVATION CTA — KATALINA (Sección 6 de la Home, justo antes del Footer)
 * ============================================================================
 *
 * Banner ancho con fondo cobre que invita al visitante a usar el módulo de
 * reservaciones (que aparece en tu cotización como feature del backend).
 *
 * Por qué este CTA al final de la home:
 *   - Reservaciones es un diferenciador de Katalina vs e-commerce típico
 *   - La gente que llega hasta aquí YA HIZO scroll completo = está interesada
 *   - Ofrecer una experiencia personalizada captura a un tipo de cliente que
 *     no comprará impulsivamente (busca asesoría / regalo / pieza especial)
 *
 * Anatomía visual:
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │                                                                  │
 *   │                                                                  │
 *   │              EYEBROW: Experiencia personalizada                  │
 *   │              ¿Buscas algo único?                                 │
 *   │              Subtítulo descriptivo                               │
 *   │                                                                  │
 *   │              [Reservar cita]                                     │
 *   │                                                                  │
 *   │                                                                  │
 *   └──────────────────────────────────────────────────────────────────┘
 *   (Fondo entero en cobre / accent)
 *
 * Decisiones de diseño:
 *
 *   1. FONDO COBRE (bg-accent): el cobre que hasta ahora solo aparecía
 *      en pequeños acentos (botones, eyebrows) ahora domina toda la sección.
 *      Crea CONTRASTE visual fuerte respecto al resto de la página (que es
 *      mayormente crema y blanco), llamando atención sin gritar.
 *
 *   2. SIN IMAGEN: pura tipografía + un botón. Decisión deliberada — la
 *      acción que pedimos es muy concreta ("reservar cita"), no necesita
 *      ilustración. Menos elementos = más enfoque en el CTA.
 *
 *   3. CENTRADO: todo el contenido va al centro, no en grid. Refuerza el
 *      foco en la acción única.
 *
 *   4. BOTÓN BLANCO/CREMA EN LUGAR DE CACAO: como el fondo ya es cobre,
 *      el botón cacao se vería pesado. Un botón claro contrasta mejor.
 *      Usamos variant="outline" personalizado en lugar de default.
 * ============================================================================
 */

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReservationCTA() {
  return (
    /**
     * <section> con fondo cobre.
     *
     * py-24 = padding vertical generoso (96px arriba y abajo) para que la
     * sección "respire" y no se sienta apretada.
     *
     * NOTE sobre el color: usamos bg-accent (--accent = #B07953 = cobre).
     * El texto va en accent-foreground (crema) para contrastar correctamente.
     */
    <section className="bg-accent text-accent-foreground py-24">
      <Container size="narrow">
        {/*
         * Contenido centrado.
         * max-w-narrow (de Container) = 720px → texto cómodo de leer.
         */}
        <div className="text-center space-y-6">
          {/*
           * Eyebrow: en el fondo cobre, usamos el accent-foreground con
           * opacidad reducida para que sea más sutil. NO usamos text-accent
           * porque sería cobre-sobre-cobre = invisible.
           */}
          <p
            className={cn(
              "text-xs uppercase tracking-[0.3em]",
              "text-accent-foreground/80" // Crema al 80% para verse "secundario"
            )}
          >
            Experiencia personalizada
          </p>

          {/*
           * Título: serif grande, color crema completo (no /80) para
           * máxima legibilidad.
           */}
          <h2
            className={cn(
              "font-display font-medium",
              "text-4xl md:text-5xl lg:text-6xl",
              "leading-[1.1] tracking-tight",
              "text-accent-foreground"
            )}
          >
            ¿Buscas algo único?
          </h2>

          {/*
           * Subtítulo descriptivo. max-w-md (28rem ≈ 448px) y centrado
           * con mx-auto para que el párrafo no sea muy ancho.
           */}
          <p
            className={cn(
              "text-base leading-relaxed",
              "text-accent-foreground/80",
              "max-w-md mx-auto"
            )}
          >
            Reserva una cita personalizada y diseñamos juntas la pieza
            perfecta para ti o para ese momento especial.
          </p>

          {/*
           * CTA: botón con variant outline pero adaptado al fondo cobre.
           *
           * El variant outline por defecto usa border-foreground (cacao).
           * Aquí necesitamos un outline claro (crema) sobre el cobre.
           * Por eso pasamos clases custom que sobrescriben el variant.
           *
           * Nota: idealmente esto sería un variant nuevo "outline-inverse"
           * en button.tsx, pero por ahora lo resolvemos inline para no
           * tocar el archivo del Button. Si vamos a necesitarlo en más
           * lugares, lo refactorizamos.
           */}
          <div className="pt-4">
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                // Sobrescribir el outline default que es cacao
                "border-accent-foreground text-accent-foreground",
                // Hover: invierte — fondo crema, texto cobre
                "hover:bg-accent-foreground hover:text-accent"
              )}
            >
              <Link href="/reservaciones">Reservar cita</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}