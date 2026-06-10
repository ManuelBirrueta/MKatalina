/**
 * ============================================================================
 * FILTER SIDEBAR — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Eliminadas las constantes MATERIAL_OPTIONS y COLOR_OPTIONS hardcoded
 *     en español. Ahora se construyen dinámicamente usando los enums (que
 *     se quedan en español) + el namespace product.materialsShort y
 *     product.colors para los labels visibles.
 *   - Agregado useTranslations para textos del sidebar (título, botón
 *     limpiar, grupos, placeholders, currency note)
 *
 * Lo que NO cambia:
 *   - El hook useFilterState exportado (lo siguen usando FilterSidebar y
 *     MobileFilters)
 *   - La lógica de URL params (precio_min, material, color, en_stock)
 *   - La estructura de FilterGroup con su animación colapsable
 *   - El prop hideHeader para uso dentro del drawer móvil
 *
 * ─── PATRÓN: ENUMS EN ESPAÑOL, LABELS BILINGÜES ────────────────────────
 *
 * Los ENUMS de material/color se quedan en español:
 *   - URL: ?material=plata-925,oro-rosa  (siempre así)
 *   - Filtros: product.material === "plata-925"  (siempre así)
 *
 * Solo los LABELS VISIBLES cambian con el idioma:
 *   - "Plata 925" en ES, "Sterling Silver 925" en EN
 *   - Vienen de t("product.materialsShort.plata-925") y t("product.colors.X")
 *
 * Beneficio:
 *   - Las URLs filtradas funcionan idénticamente en ambos idiomas
 *   - Compartir una URL como "?material=oro-rosa" funciona aunque el
 *     receptor esté en otro idioma
 *   - La data del backend siempre guarda "plata-925", no "sterling-silver"
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Las listas MATERIAL_ENUMS y COLOR_ENUMS son arrays de strings (los
 * valores literales del enum). Se mapean a labels en el render usando
 * tProduct(`materialsShort.${enum}`) y tProduct(`colors.${enum}`).
 * ============================================================================
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductMaterial, ProductColor } from "@/types/product";

/**
 * Lista de los enums disponibles para filtrado.
 * Estos son los VALORES que aparecen en la URL y en la base de datos.
 * Los LABELS visibles se resuelven con useTranslations en el render.
 */
const MATERIAL_ENUMS: ProductMaterial[] = [
  "plata-925",
  "oro-rosa",
  "acero-quirurgico",
  "piedras-naturales",
  "cuero",
  "terciopelo",
];

const COLOR_ENUMS: ProductColor[] = [
  "dorado",
  "plateado",
  "rosa",
  "negro",
  "multicolor",
];

/**
 * FilterGroup — sub-componente colapsable.
 * Solo recibe el title traducido como prop, no maneja i18n.
 */
function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between",
          "text-xs uppercase tracking-[0.15em] font-medium",
          "hover:text-accent transition-colors"
        )}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 pt-4" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * useFilterState — hook compartido por FilterSidebar y MobileFilters.
 *
 * Esta función NO cambió respecto a la versión anterior. La lógica de URL
 * params es independiente del idioma — los enums son siempre los mismos.
 */
export function useFilterState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Leer estado actual
  const activeMaterials = searchParams.get("material")?.split(",") ?? [];
  const activeColors = searchParams.get("color")?.split(",") ?? [];
  const activePriceMin = searchParams.get("precio_min") ?? "";
  const activePriceMax = searchParams.get("precio_max") ?? "";
  const onlyInStock = searchParams.get("en_stock") === "true";

  /** Actualiza la URL con nuevos valores. Si valor vacío → elimina param */
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    params.delete("p"); // Reset paginación al cambiar filtros
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /** Toggle de filtros tipo array (material, color) */
  const toggleArrayFilter = (
    paramName: string,
    value: string,
    currentArray: string[]
  ) => {
    const isActive = currentArray.includes(value);
    const newArray = isActive
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];

    updateFilters({
      [paramName]: newArray.length > 0 ? newArray.join(",") : undefined,
    });
  };

  /** Limpia todos los filtros navegando a la URL base sin query params */
  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
  };

  /** True si hay AL MENOS un filtro aplicado */
  const hasActiveFilters =
    activeMaterials.length > 0 ||
    activeColors.length > 0 ||
    activePriceMin !== "" ||
    activePriceMax !== "" ||
    onlyInStock;

  return {
    activeMaterials,
    activeColors,
    activePriceMin,
    activePriceMax,
    onlyInStock,
    updateFilters,
    toggleArrayFilter,
    clearAllFilters,
    hasActiveFilters,
  };
}

interface FilterSidebarProps {
  /**
   * Si es true, oculta el header interno con título "Filtros" + botón
   * "Limpiar". Usar dentro del drawer móvil que ya tiene su propio header.
   */
  hideHeader?: boolean;
}

export function FilterSidebar({ hideHeader = false }: FilterSidebarProps) {
  /**
   * Dos namespaces:
   *   - catalog.filters: textos del sidebar (título, grupos, placeholders)
   *   - product.materialsShort y product.colors: labels de los enums
   */
  const t = useTranslations("catalog.filters");
  const tProduct = useTranslations("product");

  const {
    activeMaterials,
    activeColors,
    activePriceMin,
    activePriceMax,
    onlyInStock,
    updateFilters,
    toggleArrayFilter,
    clearAllFilters,
    hasActiveFilters,
  } = useFilterState();

  return (
    <aside className="w-full">
      {/*
       * Header interno: SOLO si hideHeader=false.
       * En el drawer móvil (hideHeader=true), el SheetHeader ya muestra
       * "Filtros" y el botón "Limpiar" se renderiza en el footer.
       */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-sm uppercase tracking-[0.2em] font-medium">
            {t("title")}
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className={cn(
                "text-xs flex items-center gap-1",
                "text-muted-foreground hover:text-accent transition-colors"
              )}
            >
              <X className="h-3 w-3" />
              {t("clear")}
            </button>
          )}
        </div>
      )}

      {/* Precio */}
      <FilterGroup title={t("groups.price")}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={t("price.minPlaceholder")}
              value={activePriceMin}
              onChange={(e) =>
                updateFilters({ precio_min: e.target.value || undefined })
              }
              className={cn(
                "flex-1 h-9 px-3",
                "bg-background border border-input rounded-md",
                "text-sm",
                "focus:outline-none focus:border-ring transition-colors"
              )}
              aria-label={t("price.minAriaLabel")}
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="number"
              placeholder={t("price.maxPlaceholder")}
              value={activePriceMax}
              onChange={(e) =>
                updateFilters({ precio_max: e.target.value || undefined })
              }
              className={cn(
                "flex-1 h-9 px-3",
                "bg-background border border-input rounded-md",
                "text-sm",
                "focus:outline-none focus:border-ring transition-colors"
              )}
              aria-label={t("price.maxAriaLabel")}
            />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("price.currency")}
          </p>
        </div>
      </FilterGroup>

      {/* Material — labels traducidos dinámicamente */}
      <FilterGroup title={t("groups.material")}>
        <div className="space-y-2">
          {MATERIAL_ENUMS.map((materialEnum) => {
            const isActive = activeMaterials.includes(materialEnum);
            /**
             * Label visible se resuelve desde messages.json.
             * El enum (clave) se queda en español, el label cambia con
             * el idioma activo.
             */
            const label = tProduct(`materialsShort.${materialEnum}`);

            return (
              <label
                key={materialEnum}
                className={cn(
                  "flex items-center gap-3 cursor-pointer text-sm",
                  "hover:text-accent transition-colors",
                  isActive && "text-accent font-medium"
                )}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() =>
                    toggleArrayFilter("material", materialEnum, activeMaterials)
                  }
                  className="h-4 w-4 rounded-sm border border-input accent-secondary cursor-pointer"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      {/* Color — mismo patrón que Material */}
      <FilterGroup title={t("groups.color")}>
        <div className="space-y-2">
          {COLOR_ENUMS.map((colorEnum) => {
            const isActive = activeColors.includes(colorEnum);
            const label = tProduct(`colors.${colorEnum}`);

            return (
              <label
                key={colorEnum}
                className={cn(
                  "flex items-center gap-3 cursor-pointer text-sm",
                  "hover:text-accent transition-colors",
                  isActive && "text-accent font-medium"
                )}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() =>
                    toggleArrayFilter("color", colorEnum, activeColors)
                  }
                  className="h-4 w-4 rounded-sm border border-input accent-secondary cursor-pointer"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      {/* Disponibilidad */}
      <FilterGroup title={t("groups.availability")}>
        <label className="flex items-center gap-3 cursor-pointer text-sm hover:text-accent transition-colors">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) =>
              updateFilters({
                en_stock: e.target.checked ? "true" : undefined,
              })
            }
            className="h-4 w-4 rounded-sm border border-input accent-secondary cursor-pointer"
          />
          <span>{t("availability.onlyInStock")}</span>
        </label>
      </FilterGroup>
    </aside>
  );
}