/**
 * ============================================================================
 * FAQ ACCORDION — KATALINA (Fase 12 Turno 3A: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Recibe `categories` con LocalizedString en cada campo
 *   - Recibe el `locale` activo (vía useLocale) para resolver los textos
 *   - Helper interno `loc()` convierte LocalizedString → string del locale
 *   - Búsqueda funciona solo sobre los textos del idioma activo
 *   - Las claves de UI (placeholder, "No encontramos", "Escríbenos") vienen
 *     de prop `uiText` para mantener el patrón "el padre decide"
 *
 * Por qué el padre pasa las traducciones de UI en lugar de usar
 * useTranslations directamente:
 *   - Simplifica el componente — solo recibe lo que muestra
 *   - El padre (page.tsx) ya tiene contexto del contenido bilingüe
 *   - Mantiene la consistencia entre el contenido de FAQ y los labels
 *     del UI alrededor
 *
 * El resto (acordeón nativo <details>/<summary>, normalización de tildes,
 * empty state, CTA al final) se mantiene idéntico.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, ChevronDown, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLocalized, getLocalizedArray } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { FaqCategory, FaqQuestion } from "@/data/static-content";

interface FaqUiText {
  searchPlaceholder: string;
  noResultsTitle: string;
  noResultsDescription: string;
  searchingFor: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  contactHref: string;
}

interface FaqAccordionProps {
  categories: FaqCategory[];
  uiText: FaqUiText;
}

export function FaqAccordion({ categories, uiText }: FaqAccordionProps) {
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState("");

  /**
   * normalizeText — elimina tildes y normaliza a minúsculas.
   * Para que "como" matchee "cómo", "envio" matchee "envío", etc.
   */
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const normalizedQuery = normalizeText(query.trim());

  /**
   * matchesQuery — busca en pregunta + respuesta DEL IDIOMA ACTUAL.
   */
  const matchesQuery = (question: FaqQuestion): boolean => {
    if (!normalizedQuery) return true;

    const questionText = getLocalized(question.question, locale);
    const answerText = getLocalizedArray(question.answer, locale).join(" ");
    const haystack = normalizeText(`${questionText} ${answerText}`);

    return haystack.includes(normalizedQuery);
  };

  /**
   * Categorías filtradas según búsqueda.
   * Si una categoría queda sin preguntas que matcheen, no se renderiza.
   */
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(matchesQuery),
    }))
    .filter((category) => category.questions.length > 0);

  const hasResults = filteredCategories.length > 0;
  const isSearching = normalizedQuery.length > 0;

  return (
    <div className="space-y-8">
      {/* BARRA DE BÚSQUEDA */}
      <div className="relative max-w-xl mx-auto">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={uiText.searchPlaceholder}
          aria-label={uiText.searchPlaceholder}
          className={cn(
            "w-full h-12 pl-11 pr-12",
            "bg-background border border-input rounded-md",
            "text-sm",
            "focus:outline-none focus:border-ring transition-colors"
          )}
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label={uiText.searchPlaceholder}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "p-1.5 rounded-full",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors cursor-pointer"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mensaje de búsqueda activa */}
      {isSearching && hasResults && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          {uiText.searchingFor}{" "}
          <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
        </p>
      )}

      {/* CATEGORÍAS Y PREGUNTAS */}
      {hasResults ? (
        <div className="space-y-12">
          {filteredCategories.map((category) => (
            <section
              key={category.id}
              aria-labelledby={`category-${category.id}`}
            >
              <h2
                id={`category-${category.id}`}
                className="font-display text-2xl md:text-3xl font-medium mb-6 pb-3 border-b border-border"
              >
                {getLocalized(category.title, locale)}
              </h2>

              <div className="space-y-2">
                {category.questions.map((q) => (
                  <FaqItem key={q.id} question={q} locale={locale} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          query={query}
          title={uiText.noResultsTitle}
          description={uiText.noResultsDescription}
          ctaHref={uiText.contactHref}
          ctaLabel={uiText.ctaButton}
        />
      )}

      {/* CTA AL FINAL */}
      <div
        className={cn(
          "max-w-2xl mx-auto text-center",
          "border border-border rounded-md p-8 mt-12",
          "bg-secondary-subtle/30"
        )}
      >
        <MessageCircle
          className="h-8 w-8 text-accent mx-auto mb-3"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h3 className="font-display text-xl font-medium mb-2">
          {uiText.ctaTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          {uiText.ctaDescription}
        </p>
        <Button asChild>
          <Link href={uiText.contactHref}>{uiText.ctaButton}</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * FaqItem — pregunta individual con acordeón.
 *
 * Recibe locale para resolver pregunta y respuesta al idioma activo.
 */
function FaqItem({
  question,
  locale,
}: {
  question: FaqQuestion;
  locale: Locale;
}) {
  return (
    <details
      className={cn(
        "group",
        "border border-border rounded-md",
        "bg-card overflow-hidden",
        "transition-all duration-200"
      )}
    >
      <summary
        className={cn(
          "flex items-center justify-between gap-4",
          "px-5 py-4",
          "cursor-pointer",
          "list-none",
          "hover:bg-muted/30 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <span className="text-base font-medium text-foreground">
          {getLocalized(question.question, locale)}
        </span>

        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0",
            "text-muted-foreground",
            "transition-transform duration-200",
            "group-open:rotate-180"
          )}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </summary>

      <div className="px-5 pb-4 pt-2 border-t border-border space-y-3">
        {getLocalizedArray(question.answer, locale).map((paragraph, index) => (
          <p
            key={index}
            className="text-sm leading-relaxed text-foreground/85"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </details>
  );
}

/**
 * EmptyState — cuando no hay resultados de búsqueda.
 */
function EmptyState({
  query,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  query: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="py-12 text-center">
      <Search
        className="h-10 w-10 text-muted-foreground mx-auto mb-4"
        strokeWidth={1}
        aria-hidden="true"
      />

      <h2 className="font-display text-xl font-medium mb-2">{title}</h2>

      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        {description}{" "}
        <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}