/**
 * ============================================================================
 * BUTTON — KATALINA (restaurado tras override de shadcn)
 * ============================================================================
 *
 * Si ves este archivo, es porque el Button de shadcn por defecto fue
 * reinstalado en algún momento (probablemente al agregar el componente Sheet
 * en Fase 2, shadcn pregunta si sobrescribir dependencias). Esta versión
 * personalizada agrega la variante "gold" que el sistema de diseño de
 * Katalina necesita para CTAs premium con cobre.
 *
 * Mantenemos las 6 variantes estándar (default, destructive, outline,
 * secondary, ghost, link) por compatibilidad con OTROS componentes shadcn
 * que internamente usan Button (ej. Dialog footer, AlertDialog actions).
 *
 * NUEVA variante agregada por Katalina:
 *   - "gold" — fondo cobre (--accent), para CTAs premium tipo "Reservar pieza",
 *     "Suscribirme al newsletter", "Edición especial", "Personalizar".
 *
 * Si ves errores tipo `Type '"gold"' is not assignable to type ...` en el
 * futuro, significa que este archivo fue sobrescrito otra vez. La solución
 * es regenerar este archivo (NO cambiar variant="gold" por algo más).
 *
 * IMPORTANTE — para evitar que esto se repita:
 *   Cuando ejecutes `npx shadcn@latest add <algo>`, si pregunta
 *   "button.tsx already exists. Overwrite?" — responde NO (n).
 *   Si dices SÍ, perderás todas las personalizaciones de este archivo.
 * ============================================================================
 */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * buttonVariants — fábrica de clases del botón.
 *
 * cva (class-variance-authority) genera el string de clases combinando:
 *   1. Las clases BASE (aplicadas a TODOS los botones)
 *   2. Las clases del eje "variant" (color y peso visual)
 *   3. Las clases del eje "size" (tamaño físico)
 */
const buttonVariants = cva(
  // ============================================================
  // CLASES BASE — aplicadas a TODOS los botones de Katalina
  // ============================================================
  cn(
    // Layout: flex para alinear icono + texto
    "inline-flex items-center justify-center gap-2",
    // Sin wrap del texto
    "whitespace-nowrap",
    // Esquinas ligeramente redondeadas (4px desde globals.css)
    "rounded-md",
    // ESTÉTICA EDITORIAL: text-xs + medium + uppercase + tracking amplio
    // = fórmula clásica de catálogo de joyería de lujo
    "text-xs font-medium uppercase tracking-[0.15em]",
    // Solo transición de color (sin transform, sin scale): el lujo es estático
    "transition-colors duration-200",
    // Cursor pointer (Tailwind v4 ya no lo da por default a buttons)
    "cursor-pointer",
    // Estado de focus visible: anillo rosa polvo
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Estado deshabilitado
    "disabled:pointer-events-none disabled:opacity-50",
    // Iconos hijos: tamaño consistente, no se encogen
    "[&_svg]:size-4 [&_svg]:shrink-0",
    // SVGs no heredan el tracking del texto
    "[&_svg]:tracking-normal"
  ),
  {
    variants: {
      // ============================================================
      // EJE 1: VARIANT — color y peso visual
      // ============================================================
      variant: {
        /** default — CTA principal. Cacao oscuro. */
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",

        /** secondary — CTA con rosa polvo. Para wishlist, notificarme. */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover",

        /**
         * gold — CTA premium con cobre. ESPECÍFICO DE KATALINA.
         * Para: "Reservar", "Edición limitada", "Suscribirme", "Personalizar".
         */
        gold: "bg-accent text-accent-foreground hover:bg-accent-hover",

        /** destructive — rojo de error/eliminar. */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        /** outline — fantasma con borde. Acciones secundarias. */
        outline:
          "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",

        /** ghost — sin borde, sin fondo. Iconos en headers. */
        ghost: "bg-transparent text-foreground hover:bg-muted",

        /** link — parece link de texto. Anula uppercase y tracking. */
        link: "text-foreground underline-offset-4 hover:underline normal-case tracking-normal font-normal",
      },

      // ============================================================
      // EJE 2: SIZE — tamaño físico
      // ============================================================
      size: {
        /** default — 44px de alto. Cumple HIG para targets táctiles. */
        default: "h-11 px-6 py-2",
        /** sm — 36px. Filtros, toolbars, acciones secundarias. */
        sm: "h-9 px-4",
        /** lg — 52px. Hero CTAs. */
        lg: "h-13 px-10 text-sm",
        /** icon — cuadrado para botones de un solo icono. */
        icon: "h-10 w-10",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * ButtonProps — props del Button.
 * Extiende todas las props nativas de <button> + variantes de cva + asChild.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Si es true, no renderiza <button> sino que pasa las clases al hijo.
   * Útil para envolver <Link> manteniendo navegación correcta.
   */
  asChild?: boolean;
}

/**
 * Button — el componente final.
 * forwardRef permite que padres pasen ref al elemento DOM real.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };