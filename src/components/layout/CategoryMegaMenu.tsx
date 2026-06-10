/**
 * ============================================================================
 * CATEGORY MEGA MENU — KATALINA
 * ============================================================================
 *
 * Panel desplegable que aparece al hacer hover en una categoría del header
 * (Aretes, Collares, Pulseras, Gargantillas). Replica el patrón de Pandora:
 * dos columnas de sub-links a la izquierda + imagen destacada a la derecha
 * + CTA "Ver toda la colección" al fondo de los sub-links.
 *
 * Anatomía visual del mega-menú:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  [Eyebrow: "Categoría"]                                       │
 *   │  Aretes                                                       │
 *   │  Descripción breve de la categoría                            │
 *   │                                                  ┌─────────┐  │
 *   │  Por estilo          Por material                │         │  │
 *   │  • Minimalistas      • Plata 925                 │ IMAGEN  │  │
 *   │  • Statement         • Oro rosa                  │COLECCIÓN│  │
 *   │  • Vintage           • Acero                     │         │  │
 *   │  • Étnicos           • Piedras naturales         │         │  │
 *   │                                                  └─────────┘  │
 *   │  → Ver toda la colección                                      │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Por qué es un componente separado del Header:
 *   - Lógica de "qué contenido mostrar" es independiente de "cuándo abrir"
 *   - Cuando integremos el CMS, la data de categorías vendrá de Sanity y
 *     este archivo solo necesitará tipar la estructura
 *   - Facilita testing visual (Storybook) sin levantar todo el header
 *
 * Por qué es Client Component:
 *   - El Header lo posiciona con CSS hover, pero a futuro queremos:
 *     · Lazy-load de imágenes solo cuando se hace hover
 *     · Animaciones de entrada/salida con Framer Motion
 *     · Detectar clicks fuera para cerrar
 *   - Esas features requieren JS, por eso desde ahora va como "use client"
 * ============================================================================
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tipos de la data del mega-menú
 * -------------------------------
 * Cuando el CMS esté integrado, estos tipos se moverán a `src/types/`
 * y se generarán desde el schema de Sanity/Contentful para garantizar
 * consistencia entre lo que el editor publica y lo que el frontend espera.
 *
 * Por ahora viven aquí porque es el único consumidor.
 */

/**
 * MegaMenuSubLink — un link individual dentro de una columna.
 */
export interface MegaMenuSubLink {
  /** Texto visible del link (ej. "Minimalistas") */
  label: string;
  /** Ruta a la que enlaza (ej. "/aretes/minimalistas") */
  href: string;
}

/**
 * MegaMenuColumn — una columna de sub-links agrupados con su título.
 * Pandora típicamente usa 2-3 columnas, organizando por criterios
 * diferentes (estilo, material, ocasión).
 */
export interface MegaMenuColumn {
  /** Encabezado de la columna (ej. "Por estilo", "Por material") */
  title: string;
  /** Los sub-links de esta columna */
  links: MegaMenuSubLink[];
}

/**
 * MegaMenuContent — toda la data necesaria para renderizar UN mega-menú.
 * Cada categoría (Aretes, Collares, etc.) tiene SU propio MegaMenuContent.
 */
export interface MegaMenuContent {
  /** Eyebrow text — texto pequeño arriba del título (ej. "Categoría") */
  eyebrow?: string;
  /** Título principal del menú (ej. "Aretes") */
  title: string;
  /** Descripción breve, 1-2 líneas, debajo del título */
  description?: string;
  /** Las columnas de sub-links (típicamente 2) */
  columns: MegaMenuColumn[];
  /** Imagen destacada — placeholder por ahora, luego viene del CMS */
  featuredImage: {
    src: string;
    alt: string;
  };
  /** CTA del fondo (ej. "Ver todos los aretes") */
  ctaLabel: string;
  ctaHref: string;
}

/**
 * CategoryMegaMenuProps
 * ----------------------
 * content: la data a renderizar (definida arriba)
 * className: para override puntual desde el Header
 */
interface CategoryMegaMenuProps {
  content: MegaMenuContent;
  className?: string;
}

/**
 * CategoryMegaMenu — componente
 * ------------------------------
 */
export function CategoryMegaMenu({
  content,
  className,
}: CategoryMegaMenuProps) {
  return (
    /**
     * Contenedor del mega-menú.
     *
     * Decisiones de layout:
     *   - bg-card: fondo blanco puro (no crema) — crea contraste visible
     *     contra el background del body, indica claramente que es un "panel"
     *   - border-t: borde superior delgado que conecta visualmente con el header
     *   - shadow-lg: sombra discreta para flotar sobre el contenido inferior
     *     (este es uno de los pocos lugares donde la marca SÍ usa sombra,
     *     porque es necesaria para indicar profundidad de dropdown)
     *   - py-12: padding vertical generoso (96px arriba y abajo)
     */
    <div
      className={cn(
        "w-full bg-card border-t border-border shadow-lg",
        "py-12",
        className
      )}
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        {/*
         * GRID PRINCIPAL: 12 columnas
         *
         * Distribución:
         *   - Sub-links a la izquierda: 7 columnas (~58% del ancho)
         *   - Imagen a la derecha: 5 columnas (~42% del ancho)
         *
         * En móvil (debajo de md) se apila vertical: links primero, imagen segunda.
         * Aunque normalmente el mega-menú solo se muestra en desktop (en móvil
         * hay un drawer distinto), declaramos el responsive por completitud.
         */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/*
           * ─── COLUMNA IZQUIERDA: Header + columnas de links + CTA ───
           */}
          <div className="md:col-span-7 flex flex-col">
            {/* Header del menú: eyebrow + título + descripción */}
            <div className="mb-8">
              {content.eyebrow && (
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3 font-sans">
                  {content.eyebrow}
                </p>
              )}
              <h3 className="font-display text-3xl font-medium mb-2">
                {content.title}
              </h3>
              {content.description && (
                <p className="text-sm text-muted-foreground max-w-md">
                  {content.description}
                </p>
              )}
            </div>

            {/*
             * Columnas de sub-links: grid responsivo
             * En desktop: 2 columnas lado a lado
             * En móvil: 1 columna apilada
             */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {content.columns.map((column) => (
                <div key={column.title}>
                  {/* Título de la columna en mayúsculas pequeñas — lenguaje editorial */}
                  <h4 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-sans font-medium mb-4">
                    {column.title}
                  </h4>
                  {/* Lista de links de la columna */}
                  <ul className="space-y-3">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            "text-sm text-foreground",
                            // Hover: cambia a cobre (color metálico de marca)
                            // Sin underline, sin transformaciones — el cambio de color
                            // es señal suficiente de interactividad
                            "hover:text-accent transition-colors duration-200",
                            // Inline-block para que solo el texto sea clickeable, no
                            // todo el ancho del <li>
                            "inline-block"
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/*
             * CTA "Ver toda la colección"
             * 
             * Diseño: link inline con flecha que se desplaza al hover (detalle
             * editorial muy usado en marcas premium). Mayúsculas + tracking
             * amplio para coincidir con el lenguaje de los botones.
             */}
            <Link
              href={content.ctaHref}
              className={cn(
                "group inline-flex items-center gap-2 self-start",
                "text-xs uppercase tracking-[0.15em] font-medium",
                "text-foreground hover:text-accent transition-colors duration-200",
                "border-b border-foreground hover:border-accent pb-1"
              )}
            >
              {content.ctaLabel}
              {/* La flecha se desplaza 4px a la derecha al hacer hover en el grupo padre */}
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/*
           * ─── COLUMNA DERECHA: Imagen destacada de la colección ───
           */}
          <div className="md:col-span-5">
            <Link
              href={content.ctaHref}
              className="block group overflow-hidden"
            >
              {/*
               * Wrapper de la imagen.
               * aspect-[4/5] da una proporción "retrato" típica de fotografía
               * editorial de joyería (más alta que ancha). Tipo Pandora.
               * 
               * `overflow-hidden` es CRÍTICO porque la imagen se va a escalar
               * al 105% en hover y necesitamos cortar lo que sobre.
               */}
              <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                {/*
                 * Mientras no haya foto real, mostramos un placeholder con texto.
                 * Cuando el CMS tenga imágenes, este bloque se reemplaza por
                 * un <Image> de next/image (que ya está importado arriba).
                 * 
                 * IMPORTANTE: para usar next/image necesitas que el dominio de
                 * las imágenes esté en `next.config.ts → images.remotePatterns`.
                 * El CMS te dará URLs tipo `cdn.sanity.io/...` que hay que registrar.
                 */}
                {content.featuredImage.src.startsWith("/placeholder") ? (
                  // ── Placeholder mientras no hay fotos reales ──
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      "bg-secondary-subtle", // Rosa polvo muy claro
                      "transition-transform duration-700 group-hover:scale-105"
                    )}
                  >
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
                      Imagen · {content.title}
                    </span>
                  </div>
                ) : (
                  // ── Imagen real cuando exista ──
                  <Image
                    src={content.featuredImage.src}
                    alt={content.featuredImage.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
