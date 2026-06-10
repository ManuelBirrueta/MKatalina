/**
 * ============================================================================
 * JSON-LD HELPERS — KATALINA
 * ============================================================================
 *
 * Funciones que generan objetos JSON-LD según el vocabulario de schema.org.
 *
 * Cada función toma datos de la app y devuelve un objeto plano que puede
 * serializarse a JSON. El componente JsonLd se encarga de renderizarlo
 * como <script type="application/ld+json">.
 *
 * Esquemas implementados:
 *   - Organization: identidad de la marca
 *   - WebSite: el sitio web con SearchAction
 *   - Product: cada producto con precio, disponibilidad, reseñas
 *   - FAQPage: preguntas frecuentes
 *   - BreadcrumbList: rutas de navegación
 *
 * Por qué objetos planos en lugar de clases:
 *   - JSON-LD necesita ser serializable a JSON
 *   - Las clases no se serializan bien (métodos, prototype chain)
 *   - Objetos planos son simples, predecibles y debuggeable
 *
 * Validación:
 *   - Usa https://search.google.com/test/rich-results para verificar
 *     que el JSON-LD es correcto
 *   - Pega la URL de tu página y Google te dice si los rich snippets
 *     son válidos y si hay errores/warnings
 *
 * Documentación oficial:
 *   - schema.org/Product: https://schema.org/Product
 *   - Google Search Central: https://developers.google.com/search/docs/appearance/structured-data
 * ============================================================================
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

/**
 * Tipo genérico para cualquier objeto JSON-LD.
 * Lo usamos como tipo de retorno común para todas las funciones generadoras.
 */
type JsonLdObject = Record<string, unknown>;

/**
 * ─── ORGANIZATION ─────────────────────────────────────────────────────────
 *
 * Representa a Katalina como organización. Se renderiza en el layout raíz.
 *
 * Beneficios para SEO:
 *   - Google construye un "knowledge graph" sobre la marca
 *   - Cuando alguien busca "Katalina joyería" aparece un panel con info
 *     de la marca a la derecha de los resultados
 *   - Las redes sociales se conectan oficialmente al sitio
 *
 * Schema: https://schema.org/Organization
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
    /**
     * Datos de contacto y ubicación física.
     * Ayuda a Google Maps a indexar el negocio.
     */
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
      email: "hola@katalina.mx",
      areaServed: "MX",
      availableLanguage: ["es", "en"],
    },
    /**
     * sameAs: enlaces a perfiles oficiales en otras plataformas.
     * Google usa esto para verificar que es la cuenta oficial de la marca.
     */
    sameAs: [
      "https://instagram.com/katalina.mx",
      "https://facebook.com/katalina.mx",
    ],
  };
}

/**
 * ─── WEBSITE ──────────────────────────────────────────────────────────────
 *
 * Representa el sitio web como entidad. Incluye un SearchAction que le dice
 * a Google "este sitio tiene búsqueda interna en esta URL".
 *
 * Cuando Google muestra tu sitio en resultados, a veces incluye una cajita
 * de búsqueda directamente debajo. Útil para sitios con mucho contenido.
 *
 * Schema: https://schema.org/WebSite
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
    /**
     * SearchAction: define cómo se busca en el sitio.
     *
     * Por ahora apuntamos a /buscar?q={search_term_string} aunque esa
     * página NO existe todavía. Es OK — Google solo lo usa como hint.
     * Cuando implementemos búsqueda real, esto funcionará automáticamente.
     */
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
 *
 * El schema más importante para e-commerce. Habilita los rich snippets
 * de productos: estrellas, precio, disponibilidad directamente en Google.
 *
 * Schema: https://schema.org/Product
 *
 * Campos clave:
 *   - offers: precio, moneda, disponibilidad
 *   - brand: marca del producto
 *   - aggregateRating: rating promedio + cantidad de reseñas (rich snippet)
 *   - review: array de reseñas individuales (mejora la confianza)
 *   - image: URL absoluta de la imagen principal
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
    sku: product.slug, // SKU = slug por ahora; en backend será código real
    /**
     * Marca: referencia a la organization definida en el layout.
     * Usando @id para vincular en lugar de duplicar la info.
     */
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    /**
     * Categoría del producto. Google la usa para clasificar en Merchant Center.
     */
    category: product.category,
    /**
     * Offer: el "ofrecimiento" del producto — precio, moneda, stock.
     *
     * priceValidUntil: opcional pero recomendado. Google muestra warning
     * si el precio no tiene fecha de validez. Le ponemos 1 año a partir
     * de hoy. En producción con backend, vendría de la DB.
     *
     * availability: enum de schema.org. Valores válidos:
     *   - InStock: hay stock
     *   - OutOfStock: agotado
     *   - PreOrder: en pre-venta
     *   - BackOrder: bajo pedido
     *   - LimitedAvailability: stock limitado
     */
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

  /**
   * aggregateRating + review: solo se agregan si hay reseñas reales.
   *
   * Si agregamos aggregateRating con 0 reviews, Google rechaza el schema
   * y NO muestra rich snippets. Mejor no incluirlo si no hay datos.
   */
  if (stats.totalReviews > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.averageRating.toFixed(1),
      reviewCount: stats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };

    /**
     * Reseñas individuales. Limitamos a las 5 más recientes para no
     * inflar el JSON-LD demasiado. Google solo muestra unas pocas
     * en rich snippets de cualquier forma.
     */
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

/**
 * Helper: devuelve una fecha 1 año en el futuro en formato ISO YYYY-MM-DD.
 * Usado para priceValidUntil en Product schema.
 */
function getOneYearFromNow(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

/**
 * ─── BREADCRUMB LIST ─────────────────────────────────────────────────────
 *
 * Representa la ruta de navegación. Google muestra los breadcrumbs en lugar
 * de la URL fea en los resultados de búsqueda.
 *
 * Antes:    katalina.mx › productos › aretes-camelia
 * Después:  Inicio › Aretes › Aretes Camelia
 *
 * Schema: https://schema.org/BreadcrumbList
 *
 * @param items - Array de { name, url } en orden de navegación.
 *                El primer item es el más general (Inicio), el último
 *                el más específico (la página actual).
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
 * ============================================================================
 * SNIPPET — Reemplazar `faqPageSchema` en src/lib/jsonld.ts
 * ============================================================================
 *
 * El archivo lib/jsonld.ts ya existe (generado en Fase 11 Turno 2).
 * Este snippet REEMPLAZA solo la función `faqPageSchema` dentro de ese archivo.
 *
 * Cambios:
 *   - Antes: faqPageSchema(categories: FaqCategory[]): JsonLdObject
 *     Esperaba que `categories[].questions[].question` y `.answer` fueran
 *     strings directos.
 *
 *   - Ahora: faqPageSchema(categories: FaqCategory[], locale: Locale): JsonLdObject
 *     Recibe el locale para resolver LocalizedString → string.
 *
 * Por qué es necesario:
 *   En el Turno 3A reestructuramos static-content.ts para que cada
 *   pregunta/respuesta sea LocalizedString { es, en }. La función
 *   faqPageSchema necesita el locale para extraer los strings correctos
 *   que pondrá en el JSON-LD.
 *
 * SEO: cada idioma tendrá su propio FAQ structured data, lo cual es
 * exactamente lo que Google espera para sitios multilingües.
 *
 * ============================================================================
 * INSTRUCCIONES:
 *   1. Abre tu archivo src/lib/jsonld.ts
 *   2. Busca la función `export function faqPageSchema(categories: FaqCategory[])`
 *   3. Reemplázala COMPLETAMENTE con la función de abajo
 *   4. Agrega los imports nuevos al inicio del archivo:
 *        import { getLocalized, getLocalizedArray } from "@/lib/i18n-helpers";
 *        import type { Locale } from "@/i18n/routing";
 * ============================================================================
 */

/**
 * FAQPage schema bilingüe.
 *
 * Genera structured data de FAQ en el idioma indicado.
 *
 * @param categories - Array de categorías con LocalizedString en preguntas
 *                     y respuestas
 * @param locale - Locale activo ("es" o "en") para resolver las traducciones
 */
export function faqPageSchema(
  categories: FaqCategory[],
  locale: Locale
): JsonLdObject {
  // Aplanar todas las preguntas de todas las categorías
  const allQuestions = categories.flatMap((category) => category.questions);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    /**
     * inLanguage le dice a Google en qué idioma está el FAQ.
     * Esto refuerza la señal de que /es/faq y /en/faq son versiones
     * separadas (no contenido duplicado).
     */
    inLanguage: locale === "es" ? "es-MX" : "en-US",
    mainEntity: allQuestions.map((q) => ({
      "@type": "Question",
      // Resolver pregunta al locale activo
      name: getLocalized(q.question, locale),
      acceptedAnswer: {
        "@type": "Answer",
        // Resolver respuesta (array) y unirla con saltos de línea
        text: getLocalizedArray(q.answer, locale).join("\n\n"),
      },
    })),
  };
}

/**
 * ─── ITEM LIST (para páginas de categoría) ───────────────────────────────
 *
 * Lista de productos en una página de categoría. Ayuda a Google a entender
 * qué productos están listados y posiblemente mostrar carousel de productos.
 *
 * Schema: https://schema.org/ItemList
 *
 * Es más simple que el Product schema individual porque solo da info básica
 * para que Google sepa "aquí hay 16 productos, estos son sus links".
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