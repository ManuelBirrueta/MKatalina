/**
 * ============================================================================
 * CATEGORIES GRID — KATALINA (Sección 2 de la Home)
 * ============================================================================
 *
 * Grid de 4 cards grandes una por categoría: Aretes, Collares, Pulseras,
 * Gargantillas. Cada card es una imagen con el nombre en serif sobre ella.
 *
 * Anatomía visual:
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │                  EYEBROW: Categorías                             │
 *   │                  Explora la colección                            │
 *   │                                                                  │
 *   │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                  │
 *   │  │        │  │        │  │        │  │        │                  │
 *   │  │ IMG    │  │ IMG    │  │ IMG    │  │ IMG    │                  │
 *   │  │        │  │        │  │        │  │        │                  │
 *   │  │        │  │        │  │        │  │        │                  │
 *   │  │ Aretes │  │Collares│  │Pulseras│  │ Garg.  │                  │
 *   │  └────────┘  └────────┘  └────────┘  └────────┘                  │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Decisiones de diseño:
 *
 *   1. CADA CARD ES UN LINK COMPLETO: tap en cualquier parte (imagen o
 *      nombre) navega a la página de categoría. Mismo patrón que ProductCard.
 *
 *   2. NOMBRE DENTRO DE LA IMAGEN (NO DEBAJO): es la convención de cards
 *      de categoría tipo Pandora/Tiffany. El nombre se superpone a la
 *      imagen en la parte inferior, con un gradiente sutil para legibilidad.
 *      Crea más impacto visual que tener el nombre debajo separado.
 *
 *   3. ASPECT RATIO 3:4 (NO 4:5 COMO PRODUCTOS): las categorías son un
 *      poco más cuadradas que los productos para diferenciarlas visualmente.
 *
 *   4. HOVER: zoom de imagen + el nombre cambia a cobre. Sutil pero presente.
 * ============================================================================
 */

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

/**
 * Category — estructura de una categoría a mostrar.
 *
 * Cuando integremos el CMS (Fase 6), esto vendrá de Sanity. Mientras,
 * vive aquí hardcoded.
 */
interface Category {
  /** Nombre que aparece en la card (ej. "Aretes") */
  label: string;
  /** Descripción breve opcional debajo del nombre */
  tagline: string;
  /** Ruta de la página de la categoría */
  href: string;
  /** Imagen representativa de la categoría */
  image: {
    src: string;
    alt: string;
  };
}

const categories: Category[] = [
  {
    label: "Aretes",
    tagline: "Desde minimalistas hasta statement",
    href: "/aretes",
    image: {
      src: "/placeholder-cat-aretes.jpg",
      alt: "Aretes Katalina sobre fondo neutro",
    },
  },
  {
    label: "Collares",
    tagline: "Dijes, cadenas y personalizados",
    href: "/collares",
    image: {
      src: "/placeholder-cat-collares.jpg",
      alt: "Collares Katalina sobre fondo neutro",
    },
  },
  {
    label: "Pulseras",
    tagline: "Brazaletes, charms y tejidas",
    href: "/pulseras",
    image: {
      src: "/placeholder-cat-pulseras.jpg",
      alt: "Pulseras Katalina sobre fondo neutro",
    },
  },
  {
    label: "Gargantillas",
    tagline: "Piezas que abrazan con elegancia",
    href: "/gargantillas",
    image: {
      src: "/placeholder-cat-gargantillas.jpg",
      alt: "Gargantillas Katalina sobre fondo neutro",
    },
  },
];

export function CategoriesGrid() {
  return (
    /**
     * <section> con padding vertical generoso.
     * py-section = 96px arriba y abajo (definido en globals.css como token).
     */
    <section className="py-24">
      <Container>
        {/*
         * Header de sección: eyebrow + título centrados.
         * Patrón repetible que vamos a usar también en "Productos destacados".
         */}
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
            Categorías
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium">
            Explora la colección
          </h2>
        </header>

        {/*
         * GRID RESPONSIVO:
         *   - móvil: 2 columnas
         *   - tablet: 2 columnas (mismo, pero más grandes)
         *   - desktop: 4 columnas (todas en una sola fila)
         *
         * gap-4 horizontal, gap-y-6 vertical: poco espacio entre cards
         * para que se sientan como "exhibición coherente" en lugar de
         * elementos sueltos.
         */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className="group block"
            >
              {/*
               * Contenedor de la imagen + nombre superpuesto.
               *
               * aspect-[3/4] = formato un poco más cuadrado que productos
               * (que usan 4/5). Diferencia visual sutil pero deliberada.
               *
               * overflow-hidden es CRÍTICO porque la imagen va a escalar 105%
               * al hover y necesitamos cortar el desborde.
               */}
              <div
                className={cn(
                  "relative aspect-[3/4] w-full overflow-hidden",
                  "bg-secondary-subtle"
                )}
              >
                {/*
                 * Placeholder de imagen. Misma estrategia que en ProductCard:
                 * detecta el prefix "/placeholder" y muestra placeholder visual.
                 *
                 * Cuando tengas fotos reales, reemplaza por <Image> de next/image.
                 */}
                {category.image.src.startsWith("/placeholder") ? (
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      "transition-transform duration-700",
                      "group-hover:scale-105"
                    )}
                  >
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Imagen {category.label}
                    </span>
                  </div>
                ) : (
                  // Aquí iría <Image src={category.image.src} ... />
                  null
                )}

                {/*
                 * Gradiente oscuro en la parte inferior de la imagen.
                 * Garantiza legibilidad del nombre superpuesto sobre cualquier
                 * tipo de imagen (clara, oscura, multicolor).
                 *
                 * from-black/60 = empieza en negro 60% opacidad abajo
                 * to-transparent = se desvanece a transparente arriba
                 * h-1/3 = ocupa el tercio inferior de la imagen
                 */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-1/3",
                    "bg-gradient-to-t from-black/60 to-transparent",
                    "pointer-events-none" // No bloquea clicks al link padre
                  )}
                />

                {/*
                 * Nombre de la categoría superpuesto en la parte inferior.
                 * Color blanco para contrastar con el gradiente oscuro.
                 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h3
                    className={cn(
                      "font-display text-2xl lg:text-3xl font-medium",
                      "text-white",
                      // Hover: el nombre cambia a cobre claro
                      "transition-colors duration-300",
                      "group-hover:text-accent-subtle"
                    )}
                  >
                    {category.label}
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    {category.tagline}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}