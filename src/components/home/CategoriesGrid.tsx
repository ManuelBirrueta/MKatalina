/**
 * ============================================================================
 * CATEGORIES GRID — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component (useTranslations)
 *   - import Link cambia a "@/i18n/navigation"
 *   - El array `categories` ya no tiene labels ni taglines hardcoded —
 *     solo guarda el ID (enum) y el href. Los textos visibles se resuelven
 *     en runtime con t() desde namespaces existentes/nuevos:
 *       - label  → product.categories.{id}  (reutilizado, ya existe)
 *       - tagline → homepage.categoriesGrid.taglines.{id}  (nuevo)
 *       - alt    → homepage.categoriesGrid.imageAlt  (interpolando category)
 *
 * Lo que NO cambia:
 *   - Estructura visual: 2 columnas móvil / 4 columnas desktop
 *   - Aspect ratio 3:4 de las cards
 *   - Gradiente oscuro inferior para legibilidad del nombre
 *   - Hover: zoom + cambio de color del nombre a cobre claro
 *   - Las RUTAS (/aretes, /collares, etc.) siempre en español
 *
 * ─── ARQUITECTURA DEL ARRAY DE CATEGORÍAS ──────────────────────────────
 *
 * El array `categories` ahora solo tiene id + href + datos NO traducibles
 * (la ruta de la imagen). Esto es el mismo patrón que usamos en EmptyCart,
 * FilterSidebar, etc.:
 *
 *   - id: enum estable, sirve como clave para traducciones
 *   - href: URL en español (decisión arquitectural del proyecto)
 *   - image.src: ruta del asset (no se traduce; cuando haya CMS, puede
 *     venir en su propio campo bilingüe)
 *
 * Los labels y taglines se construyen al render con useTranslations.
 * Esto centraliza las traducciones y permite que un cambio en messages.json
 * se refleje sin tocar el código.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

/**
 * Category — estructura interna de cada card.
 *
 * Sin labels ni taglines: esos se resuelven en el render.
 * Solo guardamos lo que ES estable: enum ID, URL, ruta de imagen.
 */
interface Category {
  /** ID enum: misma clave que en product.categories y homepage.categoriesGrid.taglines */
  id: "Aretes" | "Collares" | "Pulseras" | "Gargantillas";
  /** Ruta de la página de la categoría (siempre español) */
  href: string;
  /** Imagen representativa */
  image: {
    src: string;
  };
}

const categories: Category[] = [
  {
    id: "Aretes",
    href: "/aretes",
    image: { src: "/placeholder-cat-aretes.jpg" },
  },
  {
    id: "Collares",
    href: "/collares",
    image: { src: "/placeholder-cat-collares.jpg" },
  },
  {
    id: "Pulseras",
    href: "/pulseras",
    image: { src: "/placeholder-cat-pulseras.jpg" },
  },
  {
    id: "Gargantillas",
    href: "/gargantillas",
    image: { src: "/placeholder-cat-gargantillas.jpg" },
  },
];

export function CategoriesGrid() {
  /**
   * 3 namespaces que usamos en esta sección:
   *   - t (homepage.categoriesGrid): eyebrow, title, taglines, imageAlt
   *   - tCategories (product.categories): labels reutilizables
   *
   * Reutilizamos product.categories para las etiquetas porque ya están
   * mapeadas ahí desde el catálogo, breadcrumbs, etc. Una sola fuente
   * de verdad para "Aretes" → "Earrings".
   */
  const t = useTranslations("homepage.categoriesGrid");
  const tCategories = useTranslations("product.categories");

  return (
    <section className="py-24">
      <Container>
        {/* Header de la sección */}
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium">
            {t("title")}
          </h2>
        </header>

        {/* Grid 2 cols móvil / 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category) => {
            /**
             * Resolver textos por categoría:
             *   - label: nombre visible (Aretes / Earrings)
             *   - tagline: descripción corta debajo del nombre
             *   - imageAlt: alt text del placeholder (interpolando category)
             *   - placeholder: texto del placeholder visual
             */
            const label = tCategories(category.id);
            const tagline = t(`taglines.${category.id}`);

            return (
              <Link
                key={category.id}
                href={category.href}
                className="group block"
              >
                <div
                  className={cn(
                    "relative aspect-[3/4] w-full overflow-hidden",
                    "bg-secondary-subtle"
                  )}
                >
                  {/* Placeholder visual (en producción: <Image>) */}
                  {category.image.src.startsWith("/placeholder") ? (
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        "transition-transform duration-700",
                        "group-hover:scale-105"
                      )}
                    >
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {t("imagePlaceholder", { category: label })}
                      </span>
                    </div>
                  ) : null}

                  {/* Gradiente para legibilidad del nombre */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-1/3",
                      "bg-gradient-to-t from-black/60 to-transparent",
                      "pointer-events-none"
                    )}
                  />

                  {/* Nombre + tagline superpuestos */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                    <h3
                      className={cn(
                        "font-display text-2xl lg:text-3xl font-medium",
                        "text-white",
                        "transition-colors duration-300",
                        "group-hover:text-accent-subtle"
                      )}
                    >
                      {label}
                    </h3>
                    <p className="text-xs text-white/80 mt-1">{tagline}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}