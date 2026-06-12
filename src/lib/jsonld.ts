/**
 * ============================================================================
 * JSON-LD HELPERS — MKATALINA (rebrand: contact info actualizada)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - organizationSchema():
 *     * contactPoint.email: "hola@katalina.mx" → "hola@mkatalina.mx"
 *     * sameAs URLs: instagram/facebook.com/katalina.mx → mkatalina.mx
 *
 * Lo que NO cambia:
 *   - El nombre Katalina ya viene de SITE_NAME (importado de lib/seo.ts)
 *     que ya fue actualizado a "MKatalina" en este mismo rebrand
 *   - SITE_URL, SITE_DESCRIPTION también vienen de seo.ts (ya actualizados)
 *   - Toda la lógica de schemas (Organization, WebSite, Product, etc.)
 *   - faqPageSchema con bilingüe
 *   - itemListSchema, breadcrumbSchema
 *
 * ─── POR QUÉ ESTOS CAMBIOS SON IMPORTANTES PARA SEO ────────────────────
 *
 * Los URLs en sameAs[] le dicen a Google "estas son las cuentas oficiales
 * de esta marca en otras plataformas". Si Google ve URLs viejas (katalina.mx)
 * mientras tu marca real es @mkatalina.mx, podría:
 *   - No conectar tu sitio con tus perfiles sociales
 *   - Confundirse y no construir el knowledge graph correctamente
 *   - Mostrar info inconsistente en resultados
 *
 * Por eso es crítico que estos URLs estén actualizados desde el inicio.
 *
 * El email en contactPoint es info que Google muestra en el knowledge
 * panel (panel lateral derecho cuando alguien busca "MKatalina joyería").
 * Tener el email correcto evita que clientes contacten al email viejo.
 * ─────────────────────────────────────────────────────────────────────
 */

import type { Product } from "@/types/product";
import type { Review, ReviewStats } from "@/types/review";
import type { FaqCategory } from "@/data/static-content";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_LANG,
  absoluteUrl,
} from "@/lib/seo";
import { getLocalized, getLocalizedArray } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

type JsonLdObject = Record<string, unknown>;

/**
 * ─── ORGANIZATION ─────────────────────────────────────────────────────────
 *
 * Cambios: email + sameAs URLs actualizados al rebrand.
 */
export function organizationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/og-default.svg"),
      width: 1200,
      height: 630,
    },
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. del Mar 1234, Local 7",
      addressLocality: "Mazatlán",
      addressRegion: "Sinaloa",
      postalCode: "82000",
      addressCountry: "MX",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-669-123-4567",
      contactType: "customer service",
      // Email actualizado al rebrand
      email: "hola@mkatalina.mx",
      areaServed: "MX",
      availableLanguage: ["es", "en"],
    },
    /**
     * sameAs: URLs actualizadas al rebrand.
     * Si los handles reales son diferentes en redes (ej. @mkatalinajoyeria
     * por longitud), ajustar aquí.
     */
    sameAs: [
      "https://instagram.com/mkatalina.mx",
      "https://facebook.com/mkatalina.mx",
    ],
  };
}

/**
 * ─── WEBSITE ──────────────────────────────────────────────────────────────
 * Sin cambios funcionales: SITE_URL y SITE_NAME ya están rebrandeados
 * desde lib/seo.ts.
 */
export function websiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}#organization`,
    },
    inLanguage: SITE_LANG,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * ─── PRODUCT ──────────────────────────────────────────────────────────────
 * Sin cambios funcionales: SITE_NAME y SITE_URL ya rebrandeados.
 * "brand.name" automáticamente refleja "MKatalina".
 */
export function productSchema(
  product: Product,
  reviews: Review[],
  stats: ReviewStats,
  description: string
): JsonLdObject {
  const productUrl = absoluteUrl(`/productos/${product.slug}`);
  const imageUrl = product.images[0]?.src.startsWith("/")
    ? absoluteUrl(product.images[0].src)
    : product.images[0]?.src ?? absoluteUrl("/og-default.svg");

  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description,
    image: [imageUrl],
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "MXN",
      price: product.price.toString(),
      priceValidUntil: getOneYearFromNow(),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        "@id": `${SITE_URL}#organization`,
      },
    },
  };

  if (stats.totalReviews > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.averageRating.toFixed(1),
      reviewCount: stats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };

    schema.review = reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.userName,
      },
      datePublished: review.createdAt,
      reviewBody: review.comment,
      name: review.title,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }));
  }

  return schema;
}

function getOneYearFromNow(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

/**
 * ─── BREADCRUMB LIST ─────────────────────────────────────────────────────
 * Sin cambios. Recibe items que ya vienen con strings traducidos.
 */
export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * ─── FAQ PAGE ─────────────────────────────────────────────────────────────
 * Bilingüe. Sin cambios funcionales: el contenido viene de static-content.ts
 * que ya fue rebrandeado en el Turno 1.
 */
export function faqPageSchema(
  categories: FaqCategory[],
  locale: Locale
): JsonLdObject {
  const allQuestions = categories.flatMap((category) => category.questions);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "es" ? "es-MX" : "en-US",
    mainEntity: allQuestions.map((q) => ({
      "@type": "Question",
      name: getLocalized(q.question, locale),
      acceptedAnswer: {
        "@type": "Answer",
        text: getLocalizedArray(q.answer, locale).join("\n\n"),
      },
    })),
  };
}

/**
 * ─── ITEM LIST (para páginas de categoría) ───────────────────────────────
 * Sin cambios.
 */
export function itemListSchema(
  products: Product[],
  listName: string
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/productos/${product.slug}`),
      name: product.name,
    })),
  };
}