/**
 * ============================================================================
 * BREADCRUMB — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link de "next/link" → "@/i18n/navigation" (mantiene prefijo
 *     de locale al navegar)
 *   - "Inicio" hardcoded → t("breadcrumb.home")
 *   - aria-label "Breadcrumb" traducido (también con valor de respaldo
 *     porque el padre puede pasar uno custom)
 *   - Pasa de Server Component a Client Component (necesario por
 *     useTranslations). Es aceptable porque Breadcrumb es muy ligero.
 *
 * Lo que NO cambia:
 *   - El componente recibe `items` ya con labels traducidos (CategoryPage
 *     pasa categoryTitle ya resuelto, por ejemplo)
 *   - Solo "Inicio" se traduce internamente (es universal en todos los
 *     breadcrumbs)
 *   - Layout, separador ChevronRight, estilos
 *
 * Convención del componente:
 *   Quien usa Breadcrumb pasa labels intermedios YA traducidos.
 *   El propio Breadcrumb solo se encarga de:
 *     1. Anteponer "Inicio" / "Home" automáticamente
 *     2. Renderizar el chain con separadores
 *
 *   Ejemplo de uso desde CategoryPage:
 *     <Breadcrumb items={[{ label: categoryTitle }]} />
 *                                  // ↑ ya traducido por el padre
 *
 *   El resultado:  Inicio › Aretes     (en /es)
 *                  Home › Earrings     (en /en)
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  /** Si no se provee, se renderiza como texto plano (página actual) */
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const t = useTranslations("breadcrumb");

  /**
   * "Inicio" / "Home" siempre va al principio.
   * Si en el futuro necesitamos omitirlo, se agregaría una prop hideHome.
   */
  const fullChain: BreadcrumbItem[] = [
    { label: t("home"), href: "/" },
    ...items,
  ];

  return (
    <nav
      aria-label={t("ariaLabel")}
      className={cn("py-4 text-xs tracking-wide", className)}
    >
      {/* <ol> porque el orden importa */}
      <ol className="inline-flex flex-wrap items-center gap-2">
        {fullChain.map((item, index) => {
          const isLast = index === fullChain.length - 1;

          return (
            <li key={index} className="inline-flex items-center gap-2">
              {isLast || !item.href ? (
                <span
                  className="text-foreground font-medium"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-muted-foreground",
                    "hover:text-accent transition-colors duration-200"
                  )}
                >
                  {item.label}
                </Link>
              )}

              {!isLast && (
                <ChevronRight
                  className="h-3 w-3 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}