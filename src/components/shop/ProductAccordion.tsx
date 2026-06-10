/**
 * ============================================================================
 * PRODUCT ACCORDION — KATALINA (Fase 12 Turno 3B.2: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - MATERIAL_LABELS y COLOR_LABELS ya no son constantes — usan t() del
 *     namespace product.materials y product.colors
 *   - product.description: se resuelve con getLocalized() antes del split
 *   - product.careInstructions: se resuelve con getLocalizedArray()
 *   - product.dimensions.notes: se resuelve con getLocalized() si existe
 *   - Títulos de secciones ("Descripción", "Detalles", "Cuidados", etc.)
 *     se traducen vía namespace product.accordion
 *   - Labels de campos ("Material", "Largo", "Ancho", etc.) vía product.fields
 *   - Texto de envíos/devoluciones vía product.shipping y product.returns
 *     (que son arrays de líneas)
 *
 * El componente seguía siendo Client Component, así que useTranslations
 * funciona directamente.
 *
 * Animaciones del acordeón (grid-rows 0fr→1fr) sin cambios.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocalized, getLocalizedArray } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { ProductDetail } from "@/types/product";

interface ProductAccordionProps {
  product: ProductDetail;
}

/**
 * AccordionSection — sin cambios en lógica.
 * Recibe el title como string ya traducido del padre.
 */
function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between py-5",
          "text-left",
          "text-sm uppercase tracking-[0.15em] font-medium",
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
          "grid transition-all duration-300",
          isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function ProductAccordion({ product }: ProductAccordionProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("product");

  /**
   * Resolver los campos del producto al locale activo.
   */
  const description = getLocalized(product.description, locale);
  const careInstructions = getLocalizedArray(product.careInstructions, locale);
  const dimensionNotes = product.dimensions.notes
    ? getLocalized(product.dimensions.notes, locale)
    : undefined;

  /**
   * Líneas de envíos y devoluciones desde messages.json.
   *
   * Usamos t.raw() porque las claves contienen ARRAYS de strings.
   * t() devolvería un string, pero t.raw() devuelve el valor crudo del
   * JSON sin procesar — exactamente lo que necesitamos para iterar.
   */
  const shippingLines = t.raw("shipping.lines") as string[];
  const returnsLines = t.raw("returns.lines") as string[];

  /**
   * Unidad "cm" y "g" traducidas (en realidad son idénticas en es/en,
   * pero las dejamos en el namespace por consistencia y por si en el
   * futuro queremos sistemas imperiales para mercados anglo).
   */
  const cmUnit = t("fields.cm");
  const gUnit = t("fields.g");

  return (
    <div className="border-t border-border">
      {/* Descripción — abierta por defecto */}
      <AccordionSection title={t("accordion.description")} defaultOpen>
        <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
          {description.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </AccordionSection>

      {/* Detalles del producto */}
      <AccordionSection title={t("accordion.details")}>
        <dl className="space-y-3 text-sm">
          {/*
           * Material: traducido vía namespace product.materials.
           * Ejemplo: t("materials.plata-925") → "Plata 925 (Sterling Silver)" / "Sterling Silver 925"
           */}
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <dt className="text-muted-foreground">{t("fields.material")}</dt>
            <dd className="text-foreground">
              {t(`materials.${product.material}`)}
            </dd>
          </div>

          {/*
           * Acabado (color): traducido vía namespace product.colors.
           */}
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <dt className="text-muted-foreground">{t("fields.finish")}</dt>
            <dd className="text-foreground">
              {t(`colors.${product.color}`)}
            </dd>
          </div>

          {/* Dimensiones — solo lo que aplique */}
          {product.dimensions.length !== undefined && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <dt className="text-muted-foreground">{t("fields.length")}</dt>
              <dd className="text-foreground">
                {product.dimensions.length} {cmUnit}
              </dd>
            </div>
          )}

          {product.dimensions.width !== undefined && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <dt className="text-muted-foreground">{t("fields.width")}</dt>
              <dd className="text-foreground">
                {product.dimensions.width} {cmUnit}
              </dd>
            </div>
          )}

          {product.dimensions.height !== undefined && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <dt className="text-muted-foreground">{t("fields.height")}</dt>
              <dd className="text-foreground">
                {product.dimensions.height} {cmUnit}
              </dd>
            </div>
          )}

          {product.dimensions.weight !== undefined && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <dt className="text-muted-foreground">{t("fields.weight")}</dt>
              <dd className="text-foreground">
                {product.dimensions.weight} {gUnit}
              </dd>
            </div>
          )}

          {/*
           * Notas: dimensionNotes ya está resuelto a string si existe.
           */}
          {dimensionNotes && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <dt className="text-muted-foreground">{t("fields.notes")}</dt>
              <dd className="text-foreground">{dimensionNotes}</dd>
            </div>
          )}
        </dl>
      </AccordionSection>

      {/* Cuidados */}
      <AccordionSection title={t("accordion.care")}>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {/*
           * careInstructions ya está resuelto a string[] del locale activo.
           */}
          {careInstructions.map((instruction, index) => (
            <li key={index} className="flex gap-3">
              <span className="text-accent mt-1.5 flex-shrink-0">●</span>
              <span className="leading-relaxed">{instruction}</span>
            </li>
          ))}
        </ul>
      </AccordionSection>

      {/*
       * Envíos y devoluciones — contenido genérico traducido.
       * Los arrays vienen de t.raw() que devuelve el valor crudo del JSON.
       */}
      <AccordionSection title={t("accordion.shippingReturns")}>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h4 className="text-foreground font-medium mb-2">
              {t("shipping.title")}
            </h4>
            <ul className="space-y-1">
              {shippingLines.map((line, index) => (
                <li key={index}>• {line}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-medium mb-2">
              {t("returns.title")}
            </h4>
            <ul className="space-y-1">
              {returnsLines.map((line, index) => (
                <li key={index}>• {line}</li>
              ))}
            </ul>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}