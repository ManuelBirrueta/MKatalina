/**
 * ============================================================================
 * PAGE: /[locale]/politicas — KATALINA (Fase 12: bilingüe)
 * ============================================================================
 *
 * Página de políticas (envíos, devoluciones, garantías).
 *
 * Cambios respecto a la versión anterior:
 *   - Server Component async (para usar getLocale + generateMetadata async)
 *   - generateMetadata es ahora async y resuelve title/description con
 *     getLocalized según el locale activo
 *   - Pasa los datos al LegalPageLayout con LocalizedString intactos
 *     (el layout los resuelve internamente con useLocale)
 *
 * Sobre el contenido legal:
 *   En el Turno 3A reestructuramos static-content.ts para soportar
 *   bilingüe, pero el contenido en inglés aún es placeholder con texto
 *   en español. Esto se traduce profesionalmente en el Turno 3C después
 *   de revisión por abogado.
 *
 *   Mientras tanto, /en/politicas mostrará el contenido en español como
 *   fallback. Eso es intencional y mejor que romper la página.
 * ============================================================================
 */

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPageLayout } from "@/components/static/LegalPageLayout";
import { policiesContent } from "@/data/static-content";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;

  return {
    title: getLocalized(policiesContent.hero.title, locale),
    description: getLocalized(policiesContent.hero.subtitle, locale),
  };
}

export default function PoliciesPage() {
  return (
    <LegalPageLayout
      hero={policiesContent.hero}
      lastUpdated={policiesContent.lastUpdated}
      sections={policiesContent.sections}
    />
  );
}