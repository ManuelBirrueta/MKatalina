/**
 * ============================================================================
 * CATALOG PROVIDER — MKATALINA · Fase 13 · Etapa 3B
 * ============================================================================
 *
 * QUÉ RESUELVE
 * ------------
 * Varios componentes del NAVEGADOR necesitan buscar productos al instante:
 * la búsqueda, el carrito (para mostrar nombre, precio e imagen de cada línea)
 * y la wishlist. Antes lo hacían con `productsData` (productos en código).
 * Ahora los productos viven en la base, y el navegador no puede consultarla.
 *
 * CÓMO FUNCIONA
 * -------------
 *   1. El layout de [locale] (servidor) lee el catálogo de la base UNA vez por
 *      visita (getActiveProducts) y se lo pasa a este provider.
 *   2. Este provider lo guarda en un "contexto" de React: un dato compartido
 *      que cualquier componente de abajo puede leer sin pasarlo de mano en mano.
 *   3. Los componentes usan useCatalog() en lugar de productsData.
 *
 * Como el layout persiste al navegar entre páginas, el catálogo llega con la
 * primera carga y se reutiliza; al recargar la página se lee de nuevo.
 *
 * Solo incluye productos VISIBLES (isActive = true). Uno retirado desde el
 * panel deja de existir para la búsqueda, el carrito y la wishlist.
 * ============================================================================
 */

"use client";

import { createContext, useContext, useMemo } from "react";
import type { Product } from "@/types/product";

interface CatalogContextValue {
  /** Todos los productos visibles, del más nuevo al más antiguo. */
  products: Product[];
  /** Producto por slug, o null si no existe o está retirado. */
  getBySlug: (slug: string) => Product | null;
  /**
   * Convierte un id o un slug en el slug del producto, o null si no está en
   * el catálogo. (La wishlist recibe a veces el id y a veces el slug.)
   */
  resolveSlug: (idOrSlug: string) => string | null;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  /**
   * Índices por slug y por id para buscar en tiempo constante (un Map) en
   * lugar de recorrer la lista cada vez. useMemo los arma una sola vez
   * mientras la lista no cambie.
   */
  const value = useMemo<CatalogContextValue>(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const byId = new Map(products.map((p) => [p.id, p]));

    return {
      products,
      getBySlug: (slug) => bySlug.get(slug) ?? null,
      resolveSlug: (idOrSlug) =>
        bySlug.get(idOrSlug)?.slug ?? byId.get(idOrSlug)?.slug ?? null,
    };
  }, [products]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

/**
 * Acceso al catálogo desde cualquier componente de navegador.
 * Si se usa fuera del provider es un error de programación: lo avisamos
 * claramente en lugar de devolver una lista vacía silenciosa.
 */
export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error(
      "useCatalog() debe usarse dentro de <CatalogProvider> (ver src/app/[locale]/layout.tsx)",
    );
  }
  return ctx;
}