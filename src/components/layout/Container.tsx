/**
 * ============================================================================
 * CONTAINER — KATALINA
 * ============================================================================
 *
 * El componente más usado de toda la app. Define el "ancho máximo" del
 * contenido y los paddings horizontales responsivos. CADA sección de la app
 * (header, footer, hero, grids de producto, páginas de detalle, etc.) lo
 * envuelve, garantizando alineación visual perfecta en todo el sitio.
 *
 * Por qué existe como componente y no como una clase Tailwind directa:
 *   - Cambiar el max-width o el padding requiere actualizar UN archivo,
 *     no buscar y reemplazar en 30 lugares.
 *   - Permite variantes (`size`) sin duplicar lógica.
 *   - Acepta `asChild` para envolver elementos semánticamente correctos
 *     (a veces queremos <section> envolviendo el Container, a veces queremos
 *     que el Container SEA el <section>).
 *
 * Anatomía visual:
 *
 *   |←─── padding ───→|←──── max-width ────→|←─── padding ───→|
 *   |                 |                     |                 |
 *   |                 |  CONTENIDO REAL     |                 |
 *   |                 |                     |                 |
 *
 * Cómo se usa:
 *   <Container>
 *     <h1>Mi sección</h1>
 *   </Container>
 *
 *   <Container size="narrow">         {/* Para texto largo legible *\/}
 *     <article>...</article>
 *   </Container>
 *
 *   <Container asChild>                {/* El container ES un <section> *\/}
 *     <section>...</section>
 *   </Container>
 * ============================================================================
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * containerVariants — define las variantes de ancho máximo.
 * ---------------------------------------------------------
 * "size" es el único eje de variación porque el padding horizontal es
 * IGUAL en todos los tamaños (queremos que todas las secciones queden
 * alineadas verticalmente, sin importar su ancho interno).
 *
 * Decisión de breakpoints:
 *   - mobile (< 640px):  padding 1.5rem (24px) — espacio suficiente sin sentirse apretado
 *   - tablet (≥ 640px):  padding 2rem (32px)
 *   - desktop (≥ 1024px): padding 3rem (48px)
 *
 * Decisión de max-widths:
 *   - default: 1440px → para layouts comerciales tipo grid de productos.
 *     Pandora usa 1440-1600px. Más de eso se siente "vacío" en pantallas
 *     normales (1366px era el monitor más común hasta hace poco).
 *   - narrow:  720px → para artículos, "Quiénes somos", políticas — texto
 *     legible no debe pasar de 65-75 caracteres por línea.
 *   - wide:    full → ocupa TODO el ancho disponible, sin max-width.
 *     Útil para heroes con imágenes a pantalla completa.
 */
const containerVariants = cva(
  // Clases BASE: aplicadas siempre, sin importar la variante
  cn(
    "mx-auto w-full", // mx-auto = centrado horizontal
    "px-6 sm:px-8 lg:px-12" // Padding responsivo (24px → 32px → 48px)
  ),
  {
    variants: {
      size: {
        default: "max-w-[1440px]", // Para grids, headers, footers, la mayoría de casos
        narrow: "max-w-3xl", // 768px — artículos legibles, formularios
        wide: "max-w-none", // Sin límite — heros, secciones con imagen a sangrado
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

/**
 * ContainerProps — props del Container.
 * --------------------------------------
 * Extiende todas las props de un <div> estándar (className, id, etc.)
 * + las variantes de cva + asChild para flexibilidad semántica.
 */
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * Si es true, el Container "se convierte" en su hijo único, aplicándole
   * sus clases. Útil cuando queremos que el contenedor sea un <section>,
   * <article>, <header>, etc. en lugar de un <div> genérico — esto importa
   * para SEO y accesibilidad.
   *
   * Ejemplo:
   *   <Container asChild>
   *     <section aria-label="Productos destacados">...</section>
   *   </Container>
   *
   * Renderiza: <section aria-label="..." class="mx-auto w-full px-6...">...</section>
   *
   * Si asChild=false (default), renderiza: <div class="...">...</div>
   */
  asChild?: boolean;
}

/**
 * Container — el componente final.
 * --------------------------------
 * forwardRef permite que padres pasen `ref` al DOM real, necesario para
 * librerías de animación (Framer Motion), intersection observers, etc.
 */
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    // Si asChild=true usa Slot (absorbe el hijo), si no usa un <div> normal.
    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        ref={ref}
        // cn() combina clases con prioridad: las pasadas por el padre
        // (className prop) ganan sobre las del variant. Esto permite
        // override puntual sin romper el sistema.
        className={cn(containerVariants({ size }), className)}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";

export { Container, containerVariants };
