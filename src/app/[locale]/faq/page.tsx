/**
 * ============================================================================
 * PAGE: /[locale]/faq — KATALINA (Fase 12 Turno 3A)
 * ============================================================================
 *
 * Página de Preguntas Frecuentes con contenido bilingüe.
 *
 * Estrategia:
 *   - Server Component
 *   - Pasa las categorías SIN resolver (con LocalizedString intacto) al
 *     FaqAccordion → el accordion las resuelve internamente con useLocale
 *   - Los textos del UI (placeholder, "No encontramos", CTA) los
 *     resolvemos aquí y los pasamos como prop `uiText`
 *
 * Por qué el FaqAccordion mantiene el formato bilingüe en lugar de
 * recibirlo ya resuelto:
 *   - El accordion necesita buscar en el texto del idioma activo
 *   - Si le pasáramos strings ya resueltos, perdería la capacidad de
 *     actualizar la búsqueda cuando cambia el locale dinámicamente
 *
 * Sobre el structured data:
 *   El FAQPage JSON-LD usa las preguntas en el locale activo. Cada
 *   versión (es/en) tiene su propio FAQ schema, lo cual es lo correcto
 *   para SEO bilingüe.
 * ============================================================================
 */

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/static/PageHero";
import { FaqAccordion } from "@/components/static/FaqAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqContent } from "@/data/static-content";
import { faqPageSchema } from "@/lib/jsonld";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;

  return {
    title: getLocalized(faqContent.hero.title, locale),
    description: getLocalized(faqContent.hero.subtitle, locale),
  };
}

export default async function FaqPage() {
  const locale = (await getLocale()) as Locale;

  /**
   * Resolver textos del Hero y UI.
   * El array de categorías se mantiene con LocalizedString para que
   * el accordion lo procese internamente según el locale activo.
   */
  const hero = {
    eyebrow: getLocalized(faqContent.hero.eyebrow, locale),
    title: getLocalized(faqContent.hero.title, locale),
    subtitle: getLocalized(faqContent.hero.subtitle, locale),
  };

  /**
   * uiText: todos los strings de UI que necesita el FaqAccordion.
   * Los resolvemos aquí porque el accordion no debería tener lógica
   * de "qué decir al usuario", solo de "cómo mostrar".
   */
  const uiText = {
    searchPlaceholder: getLocalized(faqContent.searchPlaceholder, locale),
    noResultsTitle: getLocalized(faqContent.noResults.title, locale),
    noResultsDescription: getLocalized(
      faqContent.noResults.description,
      locale
    ),
    searchingFor: getLocalized(faqContent.searchingFor, locale),
    ctaTitle: getLocalized(faqContent.cta.title, locale),
    ctaDescription: getLocalized(faqContent.cta.description, locale),
    ctaButton: getLocalized(faqContent.cta.button, locale),
    contactHref: "/contacto",
  };

  /**
   * Generar JSON-LD para FAQPage en el idioma actual.
   *
   * faqPageSchema convierte las categorías (con LocalizedString) en
   * un objeto JSON con las preguntas/respuestas del idioma activo.
   */
  const faqJsonLd = faqPageSchema(faqContent.categories, locale);

  return (
    <>
      {/* Structured data para rich snippets de Google */}
      <JsonLd data={faqJsonLd} />

      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      <section className="py-12 lg:py-16">
        <Container>
          <FaqAccordion
            categories={faqContent.categories}
            uiText={uiText}
          />
        </Container>
      </section>
    </>
  );
}