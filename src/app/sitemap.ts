/**
 * ============================================================================
 * SITEMAP — MKATALINA (Fase 13 · Etapa 3: productos desde la base)
 * ============================================================================
 *
 * Generador de sitemap.xml dinámico que se sirve en /sitemap.xml. Cada URL
 * aparece en AMBOS idiomas (/es/... y /en/...) con sus `alternates.languages`
 * (tags <xhtml:link rel="alternate" hreflang="...">), para que Google entienda
 * qué versiones bilingües existen de cada página.
 *
 * CAMBIO DE ESTA ETAPA:
 *   - Los productos ya no salen de src/data/products.ts sino de la base
 *     (getAllProductSlugs de src/lib/products-db.ts): solo los VISIBLES.
 *     Un producto retirado desde el panel deja de anunciarse a Google.
 *   - Por eso la función ahora es `async`.
 *   - `revalidate = 3600`: el sitemap se regenera como máximo cada hora. Los
 *     buscadores lo leen de vez en cuando, así que no hace falta en cada visita.
 *
 * Lo demás (home, categorías, páginas estáticas, alternates) no cambia.
 * ============================================================================
 */

import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/products-db";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

// Regenerar como máximo cada hora (ver la cabecera).
export const revalidate = 3600;

/**
 * Construye el mapping de alternates para un path canónico.
 * "/aretes" → { es: "https://…/es/aretes", en: "https://…/en/aretes" }
 */
function buildLanguageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  routing.locales.forEach((locale) => {
    alternates[locale] = `${SITE_URL}/${locale}${path}`;
  });
  return alternates;
}

/**
 * Genera una entrada del sitemap por CADA idioma para un path canónico
 * (ej. "/aretes" → /es/aretes y /en/aretes), cada una con sus alternates.
 */
function generateEntriesForPath(
  path: string,
  options: {
    priority?: number;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  } = {},
): MetadataRoute.Sitemap {
  const { priority = 0.7, changeFrequency = "weekly" } = options;
  const alternates = buildLanguageAlternates(path);

  return routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: alternates,
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* ─── HOME por cada locale ─── */
  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
    alternates: {
      languages: buildLanguageAlternates(""),
    },
  }));

  /* ─── CATEGORÍAS de productos ─── */
  const categoryPaths = ["/aretes", "/collares", "/pulseras", "/gargantillas"];
  const categoryEntries = categoryPaths.flatMap((path) =>
    generateEntriesForPath(path, { priority: 0.9, changeFrequency: "daily" }),
  );

  /* ─── PRODUCTOS individuales (solo los visibles, desde la base) ─── */
  const productSlugs = await getAllProductSlugs();
  const productEntries = productSlugs.flatMap((slug) =>
    generateEntriesForPath(`/productos/${slug}`, {
      priority: 0.8,
      changeFrequency: "weekly",
    }),
  );

  /* ─── PÁGINAS ESTÁTICAS ─── */
  const staticPaths = [
    "/quienes-somos",
    "/contacto",
    "/faq",
    "/politicas",
    "/privacidad",
    "/terminos",
  ];
  const staticEntries = staticPaths.flatMap((path) =>
    generateEntriesForPath(path, { priority: 0.5, changeFrequency: "monthly" }),
  );

  return [
    ...homeEntries,
    ...categoryEntries,
    ...productEntries,
    ...staticEntries,
  ];
}