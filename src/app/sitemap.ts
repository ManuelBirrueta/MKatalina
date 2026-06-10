/**
 * ============================================================================
 * SITEMAP — KATALINA (Fase 12 Turno 3A: multilingüe)
 * ============================================================================
 *
 * Generador de sitemap.xml dinámico que se sirve en /sitemap.xml.
 *
 * Cambios respecto a la versión anterior:
 *   - Cada URL aparece en AMBOS idiomas (/es/... y /en/...)
 *   - Cada entrada incluye `alternates.languages` que genera tags
 *     <xhtml:link rel="alternate" hreflang="..."> en el XML
 *   - Resultado: el sitemap declara explícitamente a Google qué versiones
 *     bilingues existen de cada página
 *
 * Estructura del sitemap.xml resultante:
 *
 *   <url>
 *     <loc>https://katalina.mx/es/aretes</loc>
 *     <lastmod>2026-06-04</lastmod>
 *     <xhtml:link rel="alternate" hreflang="es" href="https://katalina.mx/es/aretes" />
 *     <xhtml:link rel="alternate" hreflang="en" href="https://katalina.mx/en/aretes" />
 *     <xhtml:link rel="alternate" hreflang="x-default" href="https://katalina.mx/es/aretes" />
 *   </url>
 *   <url>
 *     <loc>https://katalina.mx/en/aretes</loc>
 *     ... (mismas alternates)
 *   </url>
 *
 * Google usa este sitemap para:
 *   - Descubrir todas las URLs del sitio
 *   - Entender la relación bilingüe entre URLs
 *   - Decidir qué versión mostrar a cada usuario según su idioma
 *
 * Volumen del sitemap:
 *   - 4 categorías × 2 idiomas = 8 URLs
 *   - 24 productos × 2 idiomas = 48 URLs
 *   - 6 páginas estáticas × 2 idiomas = 12 URLs
 *   - 2 homes (es y en) = 2 URLs
 *   Total: ~70 URLs. Bien dentro del límite de 50,000 URLs/sitemap.
 * ============================================================================
 */

import type { MetadataRoute } from "next";
import { productsData } from "@/data/products";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

/**
 * Helper: construye el mapping de alternates para una path canónico.
 *
 * Recibe un path como "/aretes" y devuelve:
 *   {
 *     es: "https://katalina.mx/es/aretes",
 *     en: "https://katalina.mx/en/aretes"
 *   }
 *
 * Cuando se pasa este objeto en `alternates.languages`, Next.js
 * automáticamente genera los tags xhtml:link en el XML.
 */
function buildLanguageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  routing.locales.forEach((locale) => {
    alternates[locale] = `${SITE_URL}/${locale}${path}`;
  });
  return alternates;
}

/**
 * Genera una entrada del sitemap para CADA locale soportado.
 *
 * Por cada path canónico (ej. "/aretes"), genera N entradas:
 *   - /es/aretes
 *   - /en/aretes
 *
 * Cada entrada incluye sus alternates apuntando a todas las versiones.
 */
function generateEntriesForPath(
  path: string,
  options: {
    priority?: number;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  } = {}
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

export default function sitemap(): MetadataRoute.Sitemap {
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
    generateEntriesForPath(path, { priority: 0.9, changeFrequency: "daily" })
  );

  /* ─── PRODUCTOS individuales ─── */
  const productEntries = productsData.flatMap((product) =>
    generateEntriesForPath(`/productos/${product.slug}`, {
      priority: 0.8,
      changeFrequency: "weekly",
    })
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
    generateEntriesForPath(path, { priority: 0.5, changeFrequency: "monthly" })
  );

  return [
    ...homeEntries,
    ...categoryEntries,
    ...productEntries,
    ...staticEntries,
  ];
}