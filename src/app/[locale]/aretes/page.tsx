/**
 * ============================================================================
 * PAGE: /[locale]/aretes — MKATALINA
 * ============================================================================
 *
 * CORRECCIÓN (Fase 13): este archivo tenía TODO el contenido de "Pulseras" por
 * un copiar-pegar, y por eso /aretes mostraba brazaletes. Se corrigió cada
 * referencia para que apunte a la categoría correcta ("Aretes") y a la ruta
 * "/aretes". El bug visible lo causaba getProductsByCategory("Pulseras");
 * las demás correcciones arreglan el título, la descripción SEO, las URLs
 * para compartir y los datos estructurados.
 *
 * Qué hace esta página:
 *   - generateMetadata async: metadata bilingüe (título + descripción para SEO)
 *   - params como Promise<{ locale }> (patrón de Next.js 15+)
 *   - Structured data (BreadcrumbList + ItemList) con textos traducidos
 *   - Renderiza <CategoryPage category="Aretes" />, el componente compartido
 *     que trae los productos de la categoría y pinta la cuadrícula, filtros,
 *     orden y paginación.
 *
 * El openGraph.title es lo que se ve cuando alguien comparte la URL de esta
 * página en WhatsApp, Facebook, etc.
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

  // Título y descripción de la categoría ARETES, traducidos según el idioma.
  const categoryTitle = tProduct("categories.Aretes");
  const metaDescription = tCatalog("metaDescriptions.Aretes");

  return {
    title: categoryTitle,
    description: metaDescription,
    alternates: {
      canonical: absoluteUrl("/aretes"),
    },
    openGraph: {
      /**
       * SITE_NAME viene de lib/seo.ts (ya rebrandeado a "MKatalina"), así el
       * nombre de marca se mantiene en un solo lugar.
       */
      title: `${categoryTitle} · ${SITE_NAME}`,
      description: metaDescription,
      url: absoluteUrl("/aretes"),
    },
  };
}

export default async function AretesPage() {
  const locale = await getLocale();
  const tProduct = await getTranslations({
    locale,
    namespace: "product",
  });
  const tBreadcrumb = await getTranslations({
    locale,
    namespace: "breadcrumb",
  });

  // Trae los 6 productos cuya categoría es "Aretes" (esta era la línea del bug).
  const products = getProductsByCategory("Aretes");

  const homeLabel = tBreadcrumb("home");
  const categoryTitle = tProduct("categories.Aretes");

  // Migas de pan para SEO: Inicio → Aretes.
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: homeLabel, url: SITE_URL },
    { name: categoryTitle, url: absoluteUrl("/aretes") },
  ]);

  // Lista de productos en formato de datos estructurados (para buscadores).
  const itemListJsonLd = itemListSchema(products, categoryTitle);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <CategoryPage category="Aretes" />
    </>
  );
}