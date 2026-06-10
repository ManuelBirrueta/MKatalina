/**
 * ============================================================================
 * SORT BAR — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Eliminada la constante SORT_OPTIONS hardcoded en español
 *   - Las opciones se construyen dinámicamente con los enums + labels
 *     traducidos desde catalog.sortBar.options
 *   - Contador "X producto/productos" pluralizado bilingüe
 *   - Label "Ordenar:" traducido
 *
 * Lo que NO cambia:
 *   - Los VALORES de los enums se quedan en español: "nuevos",
 *     "precio_asc", "precio_desc", "nombre". Estos van a la URL y son
 *     compartibles entre idiomas.
 *   - La lógica de URL params (sort) y reset de paginación
 *   - El layout responsive con MobileFilters embebido
 *
 * ─── PATRÓN DE ENUMS + LABELS ───────────────────────────────────────────
 * Los enums de sort se quedan en español:
 *   URL: ?sort=precio_asc  (idéntico en /es y /en)
 *
 * El label visible cambia con el idioma:
 *   ES: "Precio menor a mayor"
 *   EN: "Price low to high"
 *
 * Esto permite que compartir una URL filtrada/ordenada funcione sin
 * importar el idioma del receptor.
 * ────────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MobileFilters } from "@/components/shop/MobileFilters";
import { cn } from "@/lib/utils";

/**
 * Lista de los enums de sort disponibles.
 * Los labels visibles se resuelven con tSort(`options.${enum}`).
 */
const SORT_ENUMS = [
  "nuevos",
  "precio_asc",
  "precio_desc",
  "nombre",
] as const;

type SortEnum = (typeof SORT_ENUMS)[number];

interface SortBarProps {
  visibleCount: number;
}

export function SortBar({ visibleCount }: SortBarProps) {
  const t = useTranslations("catalog.sortBar");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentSort = (searchParams.get("sort") ?? "nuevos") as SortEnum;

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSort === "nuevos") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }

    params.delete("p"); // Reset a página 1

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b border-border">
      {/* Lado izquierdo: botón Filtros (móvil) + contador de productos */}
      <div className="flex items-center gap-3">
        <MobileFilters visibleCount={visibleCount} />

        {/*
         * Contador de productos.
         * Singular/plural según visibleCount.
         */}
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{visibleCount}</span>{" "}
          {visibleCount === 1 ? t("productSingular") : t("productPlural")}
        </p>
      </div>

      {/* Lado derecho: dropdown de ordenamiento */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="sort-select"
          className="text-xs uppercase tracking-[0.15em] text-muted-foreground hidden sm:inline"
        >
          {t("sortLabel")}
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className={cn(
            "h-9 px-3 pr-8",
            "bg-background border border-input rounded-md",
            "text-sm cursor-pointer",
            "focus:outline-none focus:border-ring transition-colors"
          )}
        >
          {/*
           * Las opciones se generan desde SORT_ENUMS.
           * El value es el enum (lo que va a la URL), el texto visible
           * viene de t(`options.${enum}`).
           */}
          {SORT_ENUMS.map((sortEnum) => (
            <option key={sortEnum} value={sortEnum}>
              {t(`options.${sortEnum}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}