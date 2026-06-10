/**
 * ============================================================================
 * MOBILE FILTERS — KATALINA (Fase 12 Turno 3B.3: bilingüe + fix typo)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - FIX DEL TYPO: el archivo terminaba con "}1" en lugar de "}". El "1"
 *     suelto no causaba error de TypeScript pero podía causar problemas
 *     de parsing. Lo arreglamos aquí aprovechando el refactor.
 *   - Agregado useTranslations para todos los textos visibles
 *   - Botón disparador, header del Sheet, descripción accesible, footer
 *     con "Limpiar" y "Ver X productos" totalmente traducidos
 *
 * Lo que NO cambia:
 *   - El uso del hook compartido useFilterState desde FilterSidebar
 *   - La lógica de contador de filtros activos
 *   - La estructura del Sheet (drawer lateral derecho)
 *   - El comportamiento de hideHeader en FilterSidebar embebido
 *
 * Sobre el "viewProducts" dinámico:
 *   El texto del CTA cambia según visibleCount:
 *     - 0    → "Sin productos" / "No products"
 *     - 1    → "Ver 1 producto" / "View 1 product"
 *     - 2+   → "Ver X productos" / "View X products"
 *
 *   Usamos tres claves separadas en messages.json en lugar de ICU plural
 *   para mantenerlo legible.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  FilterSidebar,
  useFilterState,
} from "@/components/shop/FilterSidebar";
import { cn } from "@/lib/utils";

interface MobileFiltersProps {
  visibleCount: number;
}

export function MobileFilters({ visibleCount }: MobileFiltersProps) {
  const t = useTranslations("catalog.filters");

  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  /**
   * Hook compartido con FilterSidebar. clearAllFilters y hasActiveFilters
   * vienen de aquí para el footer del drawer.
   */
  const { clearAllFilters, hasActiveFilters } = useFilterState();

  /**
   * Contador de filtros activos para el badge del botón disparador.
   * Cada material cuenta 1, cada color cuenta 1, rango precio cuenta 1
   * (sin importar si es min/max/ambos), en_stock cuenta 1.
   */
  const activeFiltersCount = (() => {
    let count = 0;

    const materials = searchParams.get("material");
    if (materials) count += materials.split(",").length;

    const colors = searchParams.get("color");
    if (colors) count += colors.split(",").length;

    if (searchParams.get("precio_min") || searchParams.get("precio_max")) {
      count += 1;
    }

    if (searchParams.get("en_stock") === "true") count += 1;

    return count;
  })();

  /**
   * Texto del botón CTA "Ver X productos" según count.
   * Singular/plural/zero con claves separadas para mejor legibilidad.
   */
  const viewProductsLabel =
    visibleCount === 0
      ? t("viewProductsZero")
      : visibleCount === 1
        ? t("viewProductsSingular")
        : t("viewProductsPlural", { count: visibleCount });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Botón disparador — solo visible en móvil */}
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden gap-2"
          aria-label={t("openFilters")}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>{t("filtersTrigger")}</span>

          {/* Badge con contador si hay filtros activos */}
          {activeFiltersCount > 0 && (
            <span
              className={cn(
                "ml-1 px-1.5 py-0.5",
                "text-[10px] font-medium",
                "bg-accent text-accent-foreground",
                "rounded-sm"
              )}
            >
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      {/*
       * SheetContent: panel del drawer.
       * side="right" diferencia del MobileNav que abre por la izquierda.
       * flex flex-col permite que el footer use mt-auto.
       */}
      <SheetContent
        side="right"
        className="w-[85vw] sm:w-[400px] bg-background p-0 flex flex-col"
      >
        {/* Header del Sheet — ÚNICO header (el FilterSidebar interno lo oculta) */}
        <SheetHeader className="p-6 pb-4 border-b border-border text-left">
          <SheetTitle className="text-sm uppercase tracking-[0.2em] font-medium">
            {t("title")}
          </SheetTitle>

          {/* SheetDescription requerido por accesibilidad (oculto visualmente) */}
          <SheetDescription className="sr-only">
            {t("drawerDescription")}
          </SheetDescription>
        </SheetHeader>

        {/*
         * Cuerpo: FilterSidebar con hideHeader=true.
         * flex-1 + overflow-y-auto para que scrollee si hay muchos filtros.
         */}
        <div className="flex-1 overflow-y-auto px-6">
          <FilterSidebar hideHeader />
        </div>

        {/*
         * Footer del drawer con DOS acciones:
         *   1. "Limpiar" (solo si hay filtros activos)
         *   2. "Ver X productos" (CTA principal)
         */}
        <div
          className={cn(
            "p-6 border-t border-border",
            "flex items-center gap-3"
          )}
        >
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="default"
              onClick={clearAllFilters}
              className="gap-1"
            >
              <X className="h-3.5 w-3.5" />
              {t("clear")}
            </Button>
          )}

          <Button
            onClick={() => setOpen(false)}
            className="flex-1"
            size="default"
          >
            {viewProductsLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}