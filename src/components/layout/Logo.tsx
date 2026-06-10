/**
 * ============================================================================
 * LOGO — KATALINA (con color adaptativo)
 * ============================================================================
 *
 * Cambio respecto a la versión anterior:
 *   - El wordmark "KATALINA" YA NO tiene text-foreground hardcodeado.
 *   - Ahora usa text-current → hereda el color del padre que lo contiene.
 *
 * Por qué este cambio:
 *   En el HEADER, el Logo vive dentro de un contexto con texto cacao oscuro
 *   sobre fondo crema → el wordmark se ve cacao = correcto, alto contraste.
 *
 *   En el FOOTER, el Logo vive dentro de un contexto con texto crema sobre
 *   fondo cacao → con la versión anterior (text-foreground = cacao), el
 *   wordmark cacao desaparecía contra el fondo cacao. INVISIBLE.
 *
 *   Con text-current, el wordmark adopta automáticamente el color de su
 *   contexto. Header → cacao. Footer → crema. Sin necesidad de pasar props
 *   o duplicar componentes.
 *
 * Principio de diseño aplicado:
 *   Los componentes reutilizables NO deben hardcodear colores. Deben
 *   "heredar" del contexto donde se usan. Esto los hace verdaderamente
 *   componibles — el mismo componente funciona en cualquier fondo sin
 *   modificaciones.
 *
 * Cómo se usa (sin cambios):
 *   <Logo />                          {/* Default: solo wordmark, tamaño M *\/}
 *   <Logo size="lg" />                {/* Hero o página de bienvenida *\/}
 *   <Logo size="sm" />                {/* Header al hacer scroll *\/}
 *   <Logo withTagline />              {/* Footer o página "Quiénes somos" *\/}
 * ============================================================================
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * logoVariants — variantes de tamaño del wordmark.
 *
 * IMPORTANTE: el color YA NO está en las clases base.
 * Ahora se hereda del padre vía `text-current` (que se aplica más abajo).
 */
const logoVariants = cva(
  cn(
    "font-display font-medium uppercase",
    "tracking-[0.25em]", // Espaciado característico de joyería de lujo
    "leading-none" // Sin line-height extra — el wordmark debe ser compacto
    // ❌ ELIMINADO: "text-foreground"
    //    Razón: hardcodear color rompe la reutilización entre fondos claros y oscuros.
    //    El color ahora se hereda del padre (header → cacao, footer → crema).
  ),
  {
    variants: {
      size: {
        sm: "text-xl", // ~20px — header scrolled
        md: "text-3xl", // ~30px — header reposo, drawer móvil
        lg: "text-4xl", // ~36px — footer
        xl: "text-6xl md:text-7xl", // ~60-72px — página de bienvenida
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
    /**
     * Wrapper: inline-flex centrado.
     *
     * Aquí NO ponemos color — dejamos que el wrapper herede el color del
     * padre (`text-current` implícito). Esto se propaga a los hijos:
     *   - El wordmark hereda este color
     *   - La tagline puede sobreescribirlo con text-accent (cobre)
     */
    <span className={cn("inline-flex flex-col items-center gap-1", className)}>
      {/*
       * Wordmark principal "KATALINA"
       *
       * Sin color explícito → hereda el color del wrapper, que a su vez
       * hereda del padre del Logo.
       *
       * Resultado:
       *   - En header (text-foreground cacao) → wordmark cacao ✓
       *   - En footer (text-primary-foreground crema) → wordmark crema ✓
       *   - En cualquier otro contexto futuro → se adapta automáticamente ✓
       */}
      <Comp className={cn(logoVariants({ size }))}>Katalina</Comp>

      {/*
       * Tagline opcional "JOYERÍA ARTESANAL"
       *
       * DECISIÓN: mantenemos `text-accent` (cobre) porque la tagline debe
       * llamar atención como detalle metálico de marca, independientemente
       * del fondo.
       *
       * El cobre se ve bien tanto sobre crema (header) como sobre cacao
       * (footer) — fue elegido específicamente para ser un "puente" de
       * marca visible en cualquier contexto.
       *
       * Si en algún caso futuro la tagline necesitara adaptarse al fondo,
       * agregaríamos una prop `taglineColor` al componente. Por ahora KISS.
       */}
      {withTagline && (
        <span
          className={cn(
            "font-sans text-[10px] uppercase tracking-[0.3em]",
            "text-accent" // Cobre — el "metálico" de la marca, visible en cualquier fondo
          )}
        >
          Joyería artesanal
        </span>
      )}
    </span>
  );
}