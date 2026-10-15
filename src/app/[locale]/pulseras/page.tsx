/**
 * ============================================================================
 * PAGE: /[locale]/pulseras — MKATALINA (Fase 13 · Etapa 3: productos desde la base)
 * ============================================================================
 *
 * Página de la categoría "Pulseras". Es un componente de SERVIDOR que:
 *   1. Lee de la base los productos visibles de la categoría
 *      (getProductsByCategory de src/lib/products-db.ts).
 *   2. Arma los datos estructurados para buscadores (migas de pan + lista).
 *   3. Le PASA esos productos a <CategoryPage>, que pinta la cuadrícula con
 *      filtros, orden y paginación en el navegador.
 *
 * CAMBIO DE ESTA ETAPA:
 *   - Antes: getProductsByCategory venía de src/data/products.ts (código) y
 *     CategoryPage volvía a buscar los productos por su cuenta.
 *   - Ahora: se leen UNA vez aquí, desde la base, y se pasan como prop.
 *     (El navegador no puede consultar la base; el servidor sí.)
 *
 * `dynamic = "force-dynamic"`: la página se genera en CADA visita. Sin esto,
 * Next.js podría congelarla al compilar y un producto agregado, editado o
 * agotado desde el panel no se vería hasta el siguiente despliegue.
 *
 * generateMetadata (título y descripción SEO bilingües) no cambia.
 * ============================================================================
 */

import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { CategoryPage } from "@/components/shop/CategoryPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductsByCategory } from "@/lib/products-db";
import { absoluteUrl, SITE_URL, SITE_NAME } from "@/lib/seo";
import { breadcrumbSchema, itemListSchema } from "@/lib/jsonld";

// Leer la base en cada visita (ver la cabecera).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const tProduct = await getTranslations({
    locale,
    namespace: "product",
  });
  const tCatalog = await getTranslations({
    locale,
    namespace: "catalog",
  });

  // Título y descripción de la categoría, traducidos según el idioma.
  const categoryTitle = tProduct("categories.Pulseras");
  const metaDescription = tCatalog("metaDescriptions.Pulseras");

  return {
    title: categoryTitle,
    description: metaDescription,
    alternates: {
      canonical: absoluteUrl("/pulseras"),
    },
    openGraph: {
      // SITE_NAME viene de lib/seo.ts: el nombre de marca vive en un solo lugar.
      title: `${categoryTitle} · ${SITE_NAME}`,
      description: metaDescription,
      url: absoluteUrl("/pulseras"),
    },
  };
}

export default async function PulserasPage() {
  const locale = await getLocale();
  const tProduct = await getTranslations({
    locale,
    namespace: "product",
  });
  const tBreadcrumb = await getTranslations({
    locale,
    namespace: "breadcrumb",
  });

  // Productos visibles de "Pulseras", leídos de la base (ahora es asíncrono).
  const products = await getProductsByCategory("Pulseras");

  const homeLabel = tBreadcrumb("home");
  const categoryTitle = tProduct("categories.Pulseras");

  // Migas de pan para SEO: Inicio → Pulseras.
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: homeLabel, url: SITE_URL },
    { name: categoryTitle, url: absoluteUrl("/pulseras") },
  ]);

  // Lista de productos en formato de datos estructurados (para buscadores).
  const itemListJsonLd = itemListSchema(products, categoryTitle);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      {/* Los productos viajan como prop: CategoryPage ya no los busca. */}
      <CategoryPage category="Pulseras" products={products} />
    </>
  );
}