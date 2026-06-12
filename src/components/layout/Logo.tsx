/**
 * ============================================================================
 * LOGO — MKATALINA (rebrand: wordmark actualizado)
 * ============================================================================
 *
 * Cambio respecto a la versión anterior:
 *   - El wordmark renderizado pasa de "Katalina" a "MKatalina".
 *
 * Lo que NO cambia:
 *   - El comportamiento de text-current (hereda color del contexto)
 *   - Las variantes de tamaño (sm/md/lg/xl)
 *   - La tagline opcional con text-accent (cobre)
 *   - La estructura del componente (wordmark + tagline opcional)
 *
 * Este es el cambio MÁS VISIBLE del rebrand: el logo aparece en el centro
 * del header en todas las páginas, y en el footer también.
 *
 * Nota sobre el visual del wordmark:
 *   "MKatalina" ahora tiene 9 caracteres (antes "Katalina" tenía 8). El
 *   tracking-[0.25em] sigue siendo correcto pero el wordmark se ve
 *   ligeramente más ancho. Esto es esperado y consistente con el branding
 *   nuevo. Si en el futuro quisieras un wordmark más compacto, podríamos
 *   ajustar el tracking o usar una versión SVG dibujada a mano (que sería
 *   lo ideal para una marca de joyería).
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
        sm: "text-xl",
        md: "text-3xl",
        lg: "text-4xl",
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
      {/*
       * Wordmark principal "MKATALINA"
       * Sin color explícito → hereda del wrapper que a su vez hereda del
       * padre (header → cacao, footer → crema).
       */}
      <Comp className={cn(logoVariants({ size }))}>MKatalina</Comp>

      {/* Tagline opcional con color cobre (visible en cualquier fondo) */}
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