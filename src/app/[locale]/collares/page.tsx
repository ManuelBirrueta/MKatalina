/**
 * ============================================================================
 * PAGE: /[locale]/collares — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Esta página es IDÉNTICA estructuralmente a /aretes. La única diferencia
 * es el valor de la categoría que se pasa a CategoryPage y a los schemas.
 *
 * Toda la lógica visual + textos visibles los resuelve CategoryPage usando
 * los namespaces de messages.json:
 *   - product.categories.Collares → "Collares" / "Necklaces"
 *   - catalog.categoryDescriptions.Collares → descripción editorial
 *   - catalog.metaDescriptions.Collares → meta description SEO
 *
 * Ver aretes/page.tsx para comentarios extensos sobre el patrón general:
 *   - generateMetadata async para metadata bilingüe
 *   - params es Promise<{ locale }> en Next.js 15+
 *   - Structured data (BreadcrumbList + ItemList) con labels traducidos
 *   - CategoryPage simplificado a una sola línea
 * ============================================================================
 */

import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { CategoryPage } from "@/components/shop/CategoryPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductsByCategory } from "@/data/products";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { breadcrumbSchema, itemListSchema } from "@/lib/jsonld";

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

  // Resolver título y meta description traducidos
  const categoryTitle = tProduct("categories.Collares");
  const metaDescription = tCatalog("metaDescriptions.Collares");

  return {
    title: categoryTitle,
    description: metaDescription,
    alternates: {
      canonical: absoluteUrl("/collares"),
    },
    openGraph: {
      title: `${categoryTitle} · Katalina`,
      description: metaDescription,
      url: absoluteUrl("/collares"),
    },
  };
}

export default async function CollaresPage() {
  const locale = await getLocale();
  const tProduct = await getTranslations({
    locale,
    namespace: "product",
  });
  const tBreadcrumb = await getTranslations({
    locale,
    namespace: "breadcrumb",
  });

  // Obtener productos para los structured data
  const products = getProductsByCategory("Collares");

  // Labels traducidos para BreadcrumbList schema
  const homeLabel = tBreadcrumb("home");
  const categoryTitle = tProduct("categories.Collares");

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: homeLabel, url: SITE_URL },
    { name: categoryTitle, url: absoluteUrl("/collares") },
  ]);

  const itemListJsonLd = itemListSchema(products, categoryTitle);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <CategoryPage category="Collares" />
    </>
  );
}