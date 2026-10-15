/**
 * ============================================================================
 * CATEGORY PAGE — MKATALINA (Fase 13 · Etapa 3: productos como prop)
 * ============================================================================
 *
 * CAMBIO DE ESTA ETAPA:
 *   - Antes llamaba a getProductsByCategory() de src/data/products.ts por su
 *     cuenta (productos en código).
 *   - Ahora RECIBE los productos en la prop `products`. Los lee de la base la
 *     página de servidor que lo usa (aretes/page.tsx, collares/page.tsx…),
 *     porque este es un componente de NAVEGADOR ("use client") y el navegador
 *     no puede consultar la base.
 *
 *   Uso:  <CategoryPage category="Aretes" products={products} />
 *
 * Lo que NO cambia:
 *   - Filtros (material, color, precio, solo en stock), orden y paginación,
 *     todos leídos de la URL.
 *   - Título y descripción de la categoría desde messages.json.
 *   - El orden por nombre resuelve cada nombre al idioma activo antes de
 *     comparar (name es { es, en }).
 *
 * ─── PATRÓN DE DATA ────────────────────────────────────────────────────
 *   La categoría se identifica con su ENUM en español ("Aretes",
 *   "Collares", "Pulseras", "Gargantillas"), igual en ambos idiomas. La
 *   etiqueta visible se traduce con t("product.categories.{Enum}").
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { CategoryHero } from "@/components/shop/CategoryHero";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { SortBar } from "@/components/shop/SortBar";
import { Pagination } from "@/components/shop/Pagination";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Product, ProductCategory } from "@/types/product";
import type { Locale } from "@/i18n/routing";

const PRODUCTS_PER_PAGE = 16;

interface CategoryPageProps {
  /**
   * Enum en español de la categoría. Se usa para el título y la descripción
   * visibles (messages.json).
   */
  category: ProductCategory;

  /**
   * Productos visibles de la categoría, ya leídos de la base por la página
   * de servidor. Aquí solo se filtran, ordenan y paginan.
   */
  products: Product[];
}

export function CategoryPage({ category, products }: CategoryPageProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("catalog");
  const tProduct = useTranslations("product");

  const searchParams = useSearchParams();

  /**
   * Textos visibles desde messages.json:
   *   - product.categories.{Enum}            → label corto ("Aretes" / "Earrings")
   *   - catalog.categoryDescriptions.{Enum}  → descripción larga
   */
  const categoryTitle = tProduct(`categories.${category}`);
  const categoryDescription = t(`categoryDescriptions.${category}`);

  /**
   * Todos los productos de la categoría (llegan de la base vía prop).
   * Como la prop no cambia entre renders, los useMemo de abajo no
   * recalculan de más.
   */
  const allProducts = products;

  // Leer estado de la URL (filtros + sort + página)
  const activeMaterials = searchParams.get("material")?.split(",") ?? [];
  const activeColors = searchParams.get("color")?.split(",") ?? [];
  const priceMin = Number(searchParams.get("precio_min")) || 0;
  const priceMax = Number(searchParams.get("precio_max")) || Infinity;
  const onlyInStock = searchParams.get("en_stock") === "true";
  const currentSort = searchParams.get("sort") ?? "nuevos";
  const currentPage = Number(searchParams.get("p")) || 1;

  /**
   * Paso 1: filtrado.
   * Los filtros usan los ENUMS (material, color) en español, por eso no
   * necesitan resolución al idioma. `inStock` ya viene calculado del stock
   * real de la base (stock > 0).
   */
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (
        activeMaterials.length > 0 &&
        !activeMaterials.includes(product.material)
      )
        return false;
      if (activeColors.length > 0 && !activeColors.includes(product.color))
        return false;
      if (product.price < priceMin) return false;
      if (product.price > priceMax) return false;
      if (onlyInStock && !product.inStock) return false;
      return true;
    });
  }, [
    allProducts,
    activeMaterials,
    activeColors,
    priceMin,
    priceMax,
    onlyInStock,
  ]);

  /**
   * Paso 2: ordenamiento.
   * En "nombre", cada nombre se resuelve al idioma activo antes de comparar
   * (name es { es, en }) y se usa la collation de ese idioma (orden de la
   * "ñ", acentos, etc.).
   */
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (currentSort) {
      case "precio_asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "precio_desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "nombre":
        sorted.sort((a, b) => {
          const nameA = getLocalized(a.name, locale);
          const nameB = getLocalized(b.name, locale);
          return nameA.localeCompare(nameB, locale === "es" ? "es" : "en");
        });
        break;
      case "nuevos":
      default:
        // ISO string DESC = más nuevo primero
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }

    return sorted;
  }, [filteredProducts, currentSort, locale]);

  /**
   * Paso 3: paginación.
   */
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  return (
    <>
      <Container>
        {/* Breadcrumb recibe el título VISIBLE (ya traducido), no el enum. */}
        <Breadcrumb items={[{ label: categoryTitle }]} />
      </Container>

      {/* CategoryHero recibe strings ya resueltos (presentación pura). */}
      <CategoryHero
        name={categoryTitle}
        description={categoryDescription}
        productCount={sortedProducts.length}
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 pb-16">
          {/* Sidebar — solo desktop */}
          <div className="hidden lg:block">
            <FilterSidebar />
          </div>

          {/* Columna de productos */}
          <div id="products-grid">
            <SortBar visibleCount={sortedProducts.length} />

            {paginatedProducts.length === 0 ? (
              <NoResults />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 py-8">
                {paginatedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                  />
                ))}
              </div>
            )}

            <Pagination totalPages={totalPages} currentPage={currentPage} />
          </div>
        </div>
      </Container>
    </>
  );
}

/**
 * NoResults — fallback cuando los filtros dejan 0 productos.
 * Textos traducidos desde catalog.noResults.
 */
function NoResults() {
  const t = useTranslations("catalog.noResults");

  return (
    <div className="py-24 text-center">
      <h3 className="font-display text-2xl font-medium mb-3">{t("title")}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        {t("description")}
      </p>
      <Button asChild variant="outline">
        <a
          href={typeof window !== "undefined" ? window.location.pathname : "#"}
        >
          {t("clearButton")}
        </a>
      </Button>
    </div>
  );
}