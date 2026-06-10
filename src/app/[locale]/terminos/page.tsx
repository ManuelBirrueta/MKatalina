/**
 * ============================================================================
 * PAGE: /[locale]/terminos — KATALINA (Fase 12: bilingüe)
 * ============================================================================
 *
 * Página de términos y condiciones. Igual patrón que las otras dos
 * páginas legales — pasa los datos al LegalPageLayout que resuelve
 * el locale internamente.
 *
 * IMPORTANTE: los términos y condiciones tienen implicaciones legales
 * reales. El contenido es un punto de partida razonable basado en
 * prácticas comunes de e-commerce mexicano, pero un abogado debe
 * revisarlo antes de usar el sitio comercialmente.
 *
 * Especialmente importante revisar:
 *   - Limitación de responsabilidad (puede ser inválida si es muy amplia)
 *   - Jurisdicción aplicable (si vendes a otros estados/países)
 *   - Cláusulas sobre garantía (la LFPC tiene mínimos obligatorios)
 *   - Política de devoluciones (también regulada por la LFPC)
 *
 * El contenido en inglés está pendiente de traducción profesional.
 * Por ahora muestra el texto en español como fallback en /en/terminos.
 * ============================================================================
 */

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPageLayout } from "@/components/static/LegalPageLayout";
import { termsContent } from "@/data/static-content";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;

  return {
    title: getLocalized(termsContent.hero.title, locale),
    description: getLocalized(termsContent.hero.subtitle, locale),
  };
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      hero={termsContent.hero}
      lastUpdated={termsContent.lastUpdated}
      sections={termsContent.sections}
    />
  );
}