/**
 * ============================================================================
 * PAGE: /[locale]/pulseras — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Esta página es IDÉNTICA estructuralmente a /aretes. La única diferencia
 * es el valor de la categoría que se pasa a CategoryPage y a los schemas.
 *
 * Toda la lógica visual + textos visibles los resuelve CategoryPage usando
 * los namespaces de messages.json:
 *   - product.categories.Pulseras → "Pulseras" / "Bracelets"
 *   - catalog.categoryDescriptions.Pulseras → descripción editorial
 *   - catalog.metaDescriptions.Pulseras → meta description SEO
 *
 * Ver aretes/page.tsx para comentarios extensos sobre el patrón general.
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

  const categoryTitle = tProduct("categories.Pulseras");
  const metaDescription = tCatalog("metaDescriptions.Pulseras");

  return {
    title: categoryTitle,
    description: metaDescription,
    alternates: {
      canonical: absoluteUrl("/pulseras"),
    },
    openGraph: {
      title: `${categoryTitle} · Katalina`,
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

  const products = getProductsByCategory("Pulseras");

  const homeLabel = tBreadcrumb("home");
  const categoryTitle = tProduct("categories.Pulseras");

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: homeLabel, url: SITE_URL },
    { name: categoryTitle, url: absoluteUrl("/pulseras") },
  ]);

  const itemListJsonLd = itemListSchema(products, categoryTitle);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <CategoryPage category="Pulseras" />
    </>
  );
}