/**
 * ============================================================================
 * LEGAL PAGE LAYOUT — KATALINA (Fase 12: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - hero recibe campos como LocalizedString, no strings
 *   - lastUpdated recibe LocalizedString, no string
 *   - sections recibe título y párrafos como LocalizedString/Array
 *   - Resolvemos internamente con useLocale + getLocalized/getLocalizedArray
 *   - Los textos hardcoded del UI ("En esta página", "Última actualización:")
 *     se traducen con useTranslations("legal")
 *
 * Por qué resolver internamente (en lugar de que las páginas lo hagan):
 *   - El componente sigue siendo Client (necesita IntersectionObserver)
 *   - Si el usuario cambia idioma sin recargar, este componente puede
 *     re-renderizar con los textos correctos automáticamente
 *   - Las páginas legales son simples: solo pasan datos, no procesan
 *
 * El resto se mantiene idéntico: scroll-spy con IntersectionObserver,
 * sticky sidebar en desktop, smooth scroll en clicks del TOC,
 * configuración de viewport central del 20%.
 * ============================================================================
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/static/PageHero";
import { cn } from "@/lib/utils";
import { getLocalized, getLocalizedArray } from "@/lib/i18n-helpers";
import type {
  LocalizedString,
  LocalizedStringArray,
} from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { LegalSection } from "@/data/static-content";

/**
 * Props bilingues.
 *
 * hero y lastUpdated llegan como LocalizedString para que el componente
 * los resuelva internamente según el locale activo. Las secciones también
 * tienen título y párrafos bilingues.
 */
interface LegalPageLayoutProps {
  hero: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    subtitle: LocalizedString;
  };
  lastUpdated: LocalizedString;
  sections: LegalSection[];
}

export function LegalPageLayout({
  hero,
  lastUpdated,
  sections,
}: LegalPageLayoutProps) {
  /**
   * useLocale devuelve el locale activo ("es" o "en").
   * Lo casteamos a Locale (tipo derivado de routing.locales).
   */
  const locale = useLocale() as Locale;

  /**
   * useTranslations para los textos UI del componente.
   * Vienen de messages/{es,en}.json bajo el namespace "legal".
   */
  const t = useTranslations("legal");

  /**
   * Resolver el hero al locale activo.
   * Lo hacemos UNA vez por render, no en cada lugar donde se use.
   */
  const resolvedHero = {
    eyebrow: getLocalized(hero.eyebrow, locale),
    title: getLocalized(hero.title, locale),
    subtitle: getLocalized(hero.subtitle, locale),
  };

  const resolvedLastUpdated = getLocalized(lastUpdated, locale);

  /**
   * ID de la sección actualmente "activa".
   */
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id ?? ""
  );

  /**
   * Ref que mapea ID → elemento DOM de cada sección.
   */
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /**
   * IntersectionObserver para scroll-spy.
   * Sin cambios respecto a la versión anterior.
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          const id = visible.target.getAttribute("data-section-id");
          if (id) setActiveSectionId(id);
        }
      },
      {
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      <PageHero
        eyebrow={resolvedHero.eyebrow}
        title={resolvedHero.title}
        subtitle={resolvedHero.subtitle}
      />

      <Container>
        {/*
         * Fecha de última actualización.
         * El label y la fecha vienen ambos traducidos.
         */}
        <div className="py-6 border-b border-border">
          <p className="text-xs text-muted-foreground">
            <span className="uppercase tracking-[0.15em]">
              {t("lastUpdated")}
            </span>{" "}
            <span className="text-foreground">{resolvedLastUpdated}</span>
          </p>
        </div>

        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12 items-start">
            {/* ─── ÍNDICE (LEFT SIDEBAR) ─── */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav aria-labelledby="toc-heading">
                <p
                  id="toc-heading"
                  className="text-xs uppercase tracking-[0.2em] font-medium mb-4"
                >
                  {t("tableOfContents")}
                </p>

                <ul className="space-y-1">
                  {sections.map((section) => {
                    const isActive = activeSectionId === section.id;
                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className={cn(
                            "block py-1.5 px-3 -mx-3",
                            "text-sm leading-relaxed",
                            "rounded-md",
                            "transition-colors",
                            isActive
                              ? "text-accent font-medium bg-accent-subtle/50"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          aria-current={isActive ? "location" : undefined}
                        >
                          {/*
                           * Resolver el título de la sección al locale.
                           * section.title es LocalizedString aquí.
                           */}
                          {getLocalized(section.title, locale)}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* ─── CONTENIDO (RIGHT) ─── */}
            <article className="max-w-prose space-y-12">
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  data-section-id={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="scroll-mt-24"
                  aria-labelledby={`heading-${section.id}`}
                >
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-accent mb-2 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2
                      id={`heading-${section.id}`}
                      className="font-display text-2xl md:text-3xl font-medium leading-tight"
                    >
                      {/*
                       * Resolver el título de la sección al locale.
                       */}
                      {getLocalized(section.title, locale)}
                    </h2>
                  </div>

                  {/*
                   * Párrafos de la sección.
                   * getLocalizedArray devuelve el array de strings del
                   * idioma activo. Luego .map() funciona como antes.
                   */}
                  <div className="space-y-4">
                    {getLocalizedArray(section.paragraphs, locale).map(
                      (paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className="text-base leading-relaxed text-foreground/90"
                        >
                          {paragraph}
                        </p>
                      )
                    )}
                  </div>
                </section>
              ))}
            </article>
          </div>
        </div>
      </Container>
    </>
  );
}