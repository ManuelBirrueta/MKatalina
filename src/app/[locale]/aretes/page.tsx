/**
 * ============================================================================
 * PAGE: /[locale]/pulseras — MKATALINA (rebrand: openGraph actualizado)
 * ============================================================================
 *
 * Cambio respecto a la versión anterior:
 *   - openGraph.title: "${categoryTitle} · Katalina" → "${categoryTitle} · MKatalina"
 *
 * Lo que NO cambia:
 *   - generateMetadata async para metadata bilingüe
 *   - params como Promise<{ locale }> en Next.js 15+
 *   - Structured data (BreadcrumbList + ItemList) con labels traducidos
 *   - CategoryPage simplificado a una sola línea
 *
 * El openGraph.title aparece cuando alguien comparte la URL de esta página
 * en WhatsApp, Twitter, Facebook, etc. Antes mostraba "Aretes · Katalina",
 * ahora muestra "Aretes · MKatalina".
 *
 * Ver aretes/page.tsx para comentarios extensos sobre el patrón general.
 * ============================================================================
 */

import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { CategoryPage } from "@/components/shop/CategoryPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductsByCategory } from "@/data/products";
import { absoluteUrl, SITE_URL, SITE_NAME } from "@/lib/seo";
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
      /**
       * Usamos SITE_NAME importado de lib/seo.ts (ya rebrandeado a "MKatalina")
       * en lugar de hardcodear el nombre. Esto garantiza que si en el futuro
       * cambia de nuevo el nombre, solo se actualiza en un lugar.
       */
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