/**
 * ============================================================================
 * PAGE: /[locale]/aretes — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *
 *   1. SUPER SIMPLIFICACIÓN:
 *      Antes el archivo tenía ~80 líneas con descripción hardcoded, lista
 *      de productos, structured data, etc.
 *      Ahora son ~50 líneas porque toda la lógica vive en CategoryPage.
 *      Solo declaramos: <CategoryPage category="Aretes" />.
 *
 *   2. METADATA ASYNC:
 *      Antes: `export const metadata: Metadata = { ... }` (estático)
 *      Ahora: `export async function generateMetadata({ params }) { ... }`
 *
 *      Razón: la metadata estática NO conoce el locale. Si el usuario
 *      navega a /en/aretes con metadata estática, el <title> y meta
 *      description seguirían siendo "Aretes - Aretes hechos a mano en
 *      plata 925...". Con generateMetadata async, podemos resolver al
 *      locale del request y devolver metadata bilingüe correcta.
 *
 *   3. params es Promise<>:
 *      En Next.js 15+, `params` en el segundo argumento de page y
 *      generateMetadata es un Promise. Hay que awaitarlo antes de usar.
 *      Es el patrón estándar de Next.js 15/16.
 *
 *   4. STRUCTURED DATA (JSON-LD):
 *      Si tenías BreadcrumbList e ItemList schemas, los mantengo pero
 *      con labels traducidos al locale activo. Esto es importante para
 *      que Google entienda que la misma página tiene versión en cada
 *      idioma y muestre el resultado correcto al usuario según su locale.
 *
 * ─── PATRÓN PARA REPLICAR EN OTRAS 3 PÁGINAS ──────────────────────────
 *
 * Las páginas /collares, /pulseras, /gargantillas son IDÉNTICAS a esta
 * salvo por el valor de la prop `category`. Para replicar:
 *
 *   1. Copia este archivo
 *   2. Cambia "Aretes" por "Collares" / "Pulseras" / "Gargantillas"
 *      (incluyendo en absoluteUrl, breadcrumbSchema y itemListSchema)
 *   3. Listo
 *
 * El namespace catalog.categoryDescriptions y catalog.metaDescriptions
 * ya tiene las 4 categorías definidas en ES y EN, así que las traducciones
 * funcionan automáticamente.
 * ─────────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { CategoryPage } from "@/components/shop/CategoryPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductsByCategory } from "@/data/products";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { breadcrumbSchema, itemListSchema } from "@/lib/jsonld";

/**
 * generateMetadata async — resuelve metadata según el locale activo.
 *
 * params en Next.js 15+ es un Promise<{ locale }>. Hay que await.
 *
 * getTranslations({ locale, namespace }) es la versión Server Component
 * de useTranslations. Funciona en archivos sin "use client".
 *
 * El title y description ahora cambian según el idioma:
 *   - /es/aretes → "Aretes" + descripción en español
 *   - /en/aretes → "Earrings" + descripción en inglés
 *
 * El canonical sigue siendo /aretes (no /en/aretes) porque las URLs
 * canonical apuntan al recurso "primario" — Next.js + next-intl maneja
 * las alternates locale via el layout root con hreflang.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Cargar las traducciones del namespace product (para "Aretes" / "Earrings")
  const tProduct = await getTranslations({
    locale,
    namespace: "product",
  });

  // Cargar las traducciones del namespace catalog (para meta description)
  const tCatalog = await getTranslations({
    locale,
    namespace: "catalog",
  });

  // Resolver el título traducido
  const categoryTitle = tProduct("categories.Aretes");
  // Resolver la meta description traducida
  const metaDescription = tCatalog("metaDescriptions.Aretes");

  return {
    title: categoryTitle,
    description: metaDescription,
    alternates: {
      canonical: absoluteUrl("/aretes"),
    },
    openGraph: {
      title: `${categoryTitle} · Katalina`,
      description: metaDescription,
      url: absoluteUrl("/aretes"),
    },
  };
}

/**
 * Page component.
 *
 * Como CategoryPage es Client Component (necesita searchParams + hooks),
 * esta page wrapper puede ser Server por composición — pero como
 * generamos JsonLd inline y necesitamos getLocale, también es async.
 *
 * No usamos "use client" arriba porque toda la interactividad la maneja
 * CategoryPage internamente.
 */
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

  // Obtener productos para los structured data
  const products = getProductsByCategory("Aretes");

  // Labels traducidos para BreadcrumbList schema
  const homeLabel = tBreadcrumb("home");
  const categoryTitle = tProduct("categories.Aretes");

  /**
   * Structured data:
   *   - BreadcrumbList con labels traducidos al locale activo
   *   - ItemList con productos (los nombres se resuelven dentro de
   *     itemListSchema si éste sabe del locale; si no, se quedan en es).
   */
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: homeLabel, url: SITE_URL },
    { name: categoryTitle, url: absoluteUrl("/aretes") },
  ]);

  const itemListJsonLd = itemListSchema(products, categoryTitle);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      {/*
       * UNA SOLA LÍNEA.
       * CategoryPage resuelve internamente título, descripción, productos
       * filtrados, ordenamiento y paginación. Todo a partir del enum.
       */}
      <CategoryPage category="Aretes" />
    </>
  );
}