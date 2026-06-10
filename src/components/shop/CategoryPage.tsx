/**
 * ============================================================================
 * CATEGORY PAGE — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *
 *   1. FIRMA SIMPLIFICADA (Opción A):
 *      Antes:  <CategoryPage categoryName="Aretes" categoryDescription="..." allProducts={...} />
 *      Ahora:  <CategoryPage category="Aretes" />
 *
 *      Todo el contenido editorial (título, descripción, meta) ahora vive en
 *      messages.json bajo `catalog.categoryDescriptions.{Aretes|Collares|...}`.
 *      El componente resuelve internamente título y descripción usando los
 *      hooks de i18n. Las páginas de categoría (aretes/page.tsx, etc.) ahora
 *      son una sola línea: <CategoryPage category="Aretes" />.
 *
 *   2. FIX CRÍTICO DEL SORT POR NOMBRE:
 *      Antes:  a.name.localeCompare(b.name, "es")
 *              → CRASH porque a.name ahora es LocalizedString {es, en}
 *              → "TypeError: a.name.localeCompare is not a function"
 *      Ahora:  getLocalized(a.name, locale).localeCompare(
 *                getLocalized(b.name, locale),
 *                locale === "es" ? "es" : "en"
 *              )
 *              → Resuelve cada nombre al locale activo antes de comparar
 *              → Usa la collation correcta del idioma (orden alfabético
 *                difiere entre idiomas; "ñ" en es, etc.)
 *
 *   3. INTERNACIONALIZACIÓN COMPLETA:
 *      - useLocale + useTranslations agregados
 *      - getProductsByCategory devuelve productos cuyo `category` enum es
 *        en español (ej: "Aretes"). Eso NO cambia — los enums se quedan
 *        en español. Solo las LABELS visibles se traducen via
 *        t("product.categories.Aretes") que devuelve "Aretes" en ES,
 *        "Earrings" en EN.
 *
 * ─── PATRÓN DE DATA ────────────────────────────────────────────────────
 *   Como en TODAS las páginas que usamos hasta ahora, la categoría se
 *   identifica con su ENUM en español ("Aretes", "Collares", "Pulseras",
 *   "Gargantillas"). Estos enums son STABLE — no cambian con el idioma.
 *
 *   La conversión a label visible la hace cada componente cuando lo
 *   necesita vía t("product.categories.{Enum}").
 *
 *   Beneficio: la URL /aretes funciona en ambos idiomas. Los apartados
 *   guardados con category="Aretes" siguen siendo consistentes. La base
 *   de datos algún día también guardará "Aretes", no "Earrings".
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
import { getProductsByCategory } from "@/data/products";
import { getLocalized } from "@/lib/i18n-helpers";
import type { ProductCategory } from "@/types/product";
import type { Locale } from "@/i18n/routing";

const PRODUCTS_PER_PAGE = 16;

interface CategoryPageProps {
  /**
   * Enum en español de la categoría. Es el ÚNICO prop necesario.
   * Todo lo demás (título visible, descripción, lista de productos) se
   * resuelve internamente.
   */
  category: ProductCategory;
}

export function CategoryPage({ category }: CategoryPageProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("catalog");
  const tProduct = useTranslations("product");

  const searchParams = useSearchParams();

  /**
   * Resolver textos visibles desde messages.json:
   *   - categoryTitle: el label de la categoría ("Aretes" / "Earrings")
   *   - categoryDescription: descripción editorial bilingüe
   *
   * Ambos viven en namespaces diferentes:
   *   - product.categories.{Enum} → label corto
   *   - catalog.categoryDescriptions.{Enum} → descripción larga
   */
  const categoryTitle = tProduct(`categories.${category}`);
  const categoryDescription = t(`categoryDescriptions.${category}`);

  /**
   * Obtener todos los productos de esta categoría.
   * getProductsByCategory busca por el enum en español.
   */
  const allProducts = getProductsByCategory(category);

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
   * useMemo evita recalcular si las dependencias no cambian.
   * Los filtros usan los ENUMS (material, color) que están en español,
   * por eso no necesitan resolución al locale.
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
   *
   * ─── FIX CRÍTICO ────────────────────────────────────────────────────
   * El case "nombre" antes hacía:
   *   sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
   *
   * Eso CRASHEA ahora porque a.name es LocalizedString {es, en}, no string.
   *
   * Solución:
   *   1. Resolver cada nombre al locale ACTIVO con getLocalized()
   *   2. Comparar los strings resueltos
   *   3. Usar la collation correcta según el locale (es vs en)
   *
   * Por qué pasar la collation:
   *   localeCompare puede dar resultados ligeramente diferentes entre
   *   idiomas (ej: el orden de la "ñ", el de los acentos). Pasar el
   *   locale correcto asegura orden alfabético natural en cada idioma.
   * ─────────────────────────────────────────────────────────────────────
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
          // Resolver cada nombre al locale activo antes de comparar
          const nameA = getLocalized(a.name, locale);
          const nameB = getLocalized(b.name, locale);
          // Collation: "es" para español, "en" para inglés
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
        {/*
         * Breadcrumb recibe el TÍTULO VISIBLE de la categoría (ya traducido),
         * no el enum. El componente Breadcrumb es solo de presentación.
         */}
        <Breadcrumb items={[{ label: categoryTitle }]} />
      </Container>

      {/*
       * CategoryHero recibe los tres datos básicos como strings ya resueltos.
       * El componente es de presentación pura.
       */}
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
 * NoResults — fallback cuando filtros dejan 0 productos.
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