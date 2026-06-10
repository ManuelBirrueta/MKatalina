/**
 * ============================================================================
 * PAGE: /[locale]/privacidad — KATALINA (Fase 12: bilingüe)
 * ============================================================================
 *
 * Página de aviso de privacidad. Mismo patrón que /politicas.
 *
 * IMPORTANTE: el contenido aquí cumple con los lineamientos generales de
 * la LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión
 * de los Particulares) mexicana, pero antes de producción debe ser
 * revisado por un abogado especializado en protección de datos.
 *
 * Si tu negocio recopila datos de personas en otros países, también
 * necesitas considerar GDPR (Europa), CCPA (California), LGPD (Brasil),
 * entre otras regulaciones.
 *
 * El contenido en inglés está pendiente de traducción profesional.
 * Por ahora muestra el texto en español como fallback en /en/privacidad.
 * ============================================================================
 */

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPageLayout } from "@/components/static/LegalPageLayout";
import { privacyContent } from "@/data/static-content";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;

  return {
    title: getLocalized(privacyContent.hero.title, locale),
    description: getLocalized(privacyContent.hero.subtitle, locale),
  };
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      hero={privacyContent.hero}
      lastUpdated={privacyContent.lastUpdated}
      sections={privacyContent.sections}
    />
  );
}