/**
 * ============================================================================
 * CART SUMMARY — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component (necesario para useTranslations).
 *     El padre /carrito ya era Client, así que no hay regresión real.
 *   - import Link cambia a "@/i18n/navigation" (mantiene prefijo de locale
 *     automáticamente al navegar a /checkout y /aretes)
 *   - Todos los textos hardcoded traducidos vía useTranslations:
 *     * Header "Resumen del pedido"
 *     * Subtotal con sus 2 formas (simple vs detailed) según si hay 1 o
 *       varias unidades por producto
 *     * Envío + "Calculado en el checkout"
 *     * Total
 *     * Botón "Proceder al checkout"
 *     * Link "Seguir comprando"
 *     * Bullets de confianza (PayPal + devoluciones)
 *
 * Lo que NO cambia:
 *   - Lógica del subtotal (decide entre simple/detailed según uniqueCount === itemCount)
 *   - Layout visual: header, dl, total destacado, botón cacao, bullets
 *   - Diseño sticky (lo aplica el padre)
 *   - El formateo de precios (formatPrice) sigue igual
 *
 * ─── PLURALIZACIÓN DEL SUBTOTAL ────────────────────────────────────────
 *
 * El subtotal tiene 2 formatos posibles según el contexto:
 *
 *   FORMATO SIMPLE (cuando cada producto tiene cantidad 1):
 *     "Subtotal (3 productos)"
 *     "Subtotal (1 producto)"
 *
 *   FORMATO DETAILED (cuando hay productos con cantidad > 1):
 *     "Subtotal (2 productos · 5 unidades)"
 *     "Subtotal (1 producto · 3 unidades)"
 *
 * Construimos el texto usando interpolación de t() con las palabras
 * pluralizadas ya resueltas (productWord, unitWord). Esto da flexibilidad
 * sin generar 8+ claves separadas para todas las combinaciones.
 *
 * El padre (CartPage) usa el mismo patrón en el header del contador.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CartSummaryProps {
  /** Total de unidades en el carrito (suma de cantidades) */
  itemCount: number;
  /** Productos distintos en el carrito */
  uniqueCount: number;
  /** Suma de (precio × cantidad) de todos los items */
  subtotal: number;
}

export function CartSummary({
  itemCount,
  uniqueCount,
  subtotal,
}: CartSummaryProps) {
  const t = useTranslations("cart");

  /**
   * Determinar palabras pluralizadas para uniqueCount e itemCount.
   * Se reutilizan en varios lugares del componente (subtotal, etc.)
   */
  const productWord =
    uniqueCount === 1 ? t("page.productSingular") : t("page.productPlural");
  const unitWord =
    itemCount === 1 ? t("page.unitSingular") : t("page.unitPlural");

  /**
   * Texto del subtotal. Dos casos:
   *   - SIMPLE: cuando cada producto tiene cantidad 1
   *     (uniqueCount === itemCount). Mostramos solo X productos.
   *   - DETAILED: cuando hay productos con cantidad > 1.
   *     Mostramos X productos · Y unidades.
   *
   * Usamos t() con interpolación para construir el texto traducido.
   * Las claves de messages.json esperan los parámetros {count}/{uniqueCount}/
   * {itemCount}/{productWord}/{unitWord}.
   */
  const subtotalLabel =
    uniqueCount === itemCount
      ? t("summary.subtotalLabelSimple", {
          count: uniqueCount,
          productWord,
        })
      : t("summary.subtotalLabelDetailed", {
          uniqueCount,
          productWord,
          itemCount,
          unitWord,
        });

  return (
    <div
      className={cn(
        "border border-border rounded-md",
        "p-6",
        "bg-card"
      )}
    >
      {/* Header "Resumen del pedido" */}
      <h2 className="text-xs uppercase tracking-[0.2em] font-medium mb-6">
        {t("summary.title")}
      </h2>

      {/* Lista de cargos (subtotal + envío) */}
      <dl className="space-y-3 text-sm">
        {/* Subtotal con su contador pluralizado */}
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{subtotalLabel}</dt>
          <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
        </div>

        {/* Envío: texto explicativo (se calcula en el checkout) */}
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{t("summary.shippingLabel")}</dt>
          <dd className="text-xs text-muted-foreground text-right">
            {t("summary.shippingCalculated")}
          </dd>
        </div>
      </dl>

      {/* Separador visual */}
      <div className="my-4 border-t border-border" />

      {/* Total destacado */}
      <div className="flex items-baseline justify-between mb-6">
        <span className="text-base font-medium">{t("summary.totalLabel")}</span>
        <span className="text-xl font-medium tabular-nums">
          {formatPrice(subtotal)}
        </span>
      </div>

      {/*
       * Botón principal "Proceder al checkout".
       * Link de @/i18n/navigation mantiene el prefijo /es/ o /en/ automático.
       */}
      <Button asChild size="lg" className="w-full mb-3">
        <Link href="/checkout">
          {t("summary.checkoutButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      {/*
       * Link secundario "Seguir comprando".
       * Lleva a /aretes (categoría más popular). En el futuro podríamos
       * guardar la categoría desde donde vino el usuario y devolverlo ahí.
       */}
      <Link
        href="/aretes"
        className={cn(
          "block text-center text-xs uppercase tracking-[0.15em]",
          "text-muted-foreground hover:text-accent transition-colors",
          "py-2"
        )}
      >
        {t("summary.continueShoppingButton")}
      </Link>

      {/* Bullets de confianza al fondo */}
      <div className="mt-6 pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <span className="text-accent">●</span>
          {t("summary.paypalSecure")}
        </p>
        <p className="flex items-center gap-2">
          <span className="text-accent">●</span>
          {t("summary.freeReturns")}
        </p>
      </div>
    </div>
  );
}