/**
 * ============================================================================
 * LOGO — MKATALINA (sizes responsivos: mobile más compacto)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Las variantes `md` y `lg` ahora son RESPONSIVAS:
 *     * md: text-xl en mobile (20px), sm:text-3xl en desktop (30px)
 *     * lg: text-2xl en mobile (24px), sm:text-4xl en desktop (36px)
 *
 * Por qué este cambio:
 *   El wordmark "MKatalina" tiene 9 caracteres + tracking-[0.25em] (espaciado
 *   amplio característico de joyería de lujo). En mobile (~375-480px de
 *   ancho), el wordmark a tamaño md (30px) se desbordaba sobre las columnas
 *   laterales del header, causando que el ícono de búsqueda se superpusiera
 *   sobre las últimas letras del logo.
 *
 *   Al hacerlo responsivo, en mobile el logo se ve más compacto (20px) y
 *   cabe sin desbordarse, mientras que en desktop mantiene su tamaño
 *   editorial original (30px).
 *
 *   Esto es práctica estándar en e-commerce de lujo: Pandora, Tiffany,
 *   Cartier, todos reducen el logo en mobile para evitar exactamente este
 *   problema.
 *
 * Lo que NO cambia:
 *   - Las variantes `sm` y `xl` (mantienen su tamaño fijo)
 *     * sm sigue text-xl (~20px) — usado en header scrolled
 *     * xl sigue text-6xl md:text-7xl — ya era responsivo, para hero pages
 *   - Toda la lógica del componente (text-current, tagline opcional, etc.)
 *   - El wordmark sigue siendo "MKatalina"
 *   - Los breakpoints de Tailwind usados (sm = 640px)
 *
 * ─── BREAKPOINTS DE TAILWIND USADOS ────────────────────────────────────
 *
 * El prefijo "sm:" en Tailwind aplica el estilo cuando el ancho de pantalla
 * es ≥ 640px. Antes de 640px (mobile), aplica el tamaño base sin prefijo.
 *
 *   - Mobile (<640px):  text-xl  (variante md → 20px)
 *   - ≥640px:           text-3xl (variante md → 30px)
 *
 * 640px cubre todos los teléfonos en orientación vertical. Las tablets
 * en vertical son ≥640px → caen en el comportamiento desktop. Esto es
 * correcto: una tablet tiene espacio suficiente para el logo grande.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const logoVariants = cva(
  cn(
    "font-display font-medium uppercase",
    "tracking-[0.25em]",
    "leading-none"
  ),
  {
    variants: {
      size: {
        /** sm — ~20px. Header scrolled, drawer mobile. NO responsivo. */
        sm: "text-xl",

        /**
         * md — Default del componente. RESPONSIVO:
         *   - Mobile (<640px): text-xl (~20px) — cabe sin desbordar
         *   - ≥640px: text-3xl (~30px) — tamaño editorial original
         */
        md: "text-xl sm:text-3xl",

        /**
         * lg — Footer, secciones grandes. RESPONSIVO:
         *   - Mobile: text-2xl (~24px)
         *   - ≥640px: text-4xl (~36px)
         */
        lg: "text-2xl sm:text-4xl",

        /**
         * xl — Página de bienvenida, hero gigante. Ya era responsivo
         * con su propio breakpoint (md = 768px) por ser un tamaño
         * tan grande que necesita más espacio antes de crecer.
         */
        xl: "text-6xl md:text-7xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface LogoProps extends VariantProps<typeof logoVariants> {
  className?: string;
  withTagline?: boolean;
  as?: "span" | "h1" | "div";
}

export function Logo({
  className,
  size,
  withTagline = false,
  as: Comp = "span",
}: LogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-1", className)}>
      <Comp className={cn(logoVariants({ size }))}>MKatalina</Comp>

      {withTagline && (
        <span
          className={cn(
            "font-sans text-[10px] uppercase tracking-[0.3em]",
            "text-accent"
          )}
        >
          Joyería artesanal
        </span>
      )}
    </span>
  );
}