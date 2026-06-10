/**
 * ============================================================================
 * PAGINATION — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - aria-label "Paginación" → traducido
 *   - aria-label "Página anterior" / "Página siguiente" → traducido
 *   - aria-label "Ir a página X" → traducido con interpolación del número
 *
 * Lo que NO cambia:
 *   - La lógica de cálculo de páginas con elipsis inteligente
 *   - El scroll suave al cambiar de página
 *   - URL handling con query param `p`
 *
 * Por qué es importante traducir aria-labels:
 *   Los aria-labels los leen los lectores de pantalla (screen readers).
 *   Si un usuario hispanohablante navega en /es y oye "Page next" sería
 *   inconsistente. Estos textos NO son visibles pero son cruciales para
 *   accesibilidad.
 * ============================================================================
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const t = useTranslations("catalog.pagination");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (page === 1) {
      params.delete("p"); // URL limpia para página 1
    } else {
      params.set("p", page.toString());
    }

    router.push(`${pathname}?${params.toString()}`);

    // Scroll suave al inicio del grid (no al top de la página completa)
    setTimeout(() => {
      const grid = document.getElementById("products-grid");
      if (grid) {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  /**
   * Calcula qué números mostrar con elipsis inteligente.
   * Si hay ≤ 5 páginas muestra todas. Si hay más:
   *   - Cerca del inicio: 1 2 3 4 … N
   *   - En el medio:      1 … prev curr next … N
   *   - Cerca del final:  1 … N-3 N-2 N-1 N
   */
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label={t("ariaLabel")}
      className="flex items-center justify-center gap-2 py-8"
    >
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t("previous")}
        className={cn(
          "h-9 w-9 flex items-center justify-center rounded-md",
          "border border-border text-foreground",
          "hover:border-accent hover:text-accent transition-colors",
          "disabled:opacity-30 disabled:pointer-events-none"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageNumbers.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="text-muted-foreground px-2"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page)}
            // Interpolación del número de página en el aria-label
            aria-label={t("goToPage", { page })}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-md text-sm",
              "border transition-colors",
              page === currentPage
                ? "border-accent text-accent font-medium"
                : "border-border text-foreground hover:border-accent hover:text-accent"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t("next")}
        className={cn(
          "h-9 w-9 flex items-center justify-center rounded-md",
          "border border-border text-foreground",
          "hover:border-accent hover:text-accent transition-colors",
          "disabled:opacity-30 disabled:pointer-events-none"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}