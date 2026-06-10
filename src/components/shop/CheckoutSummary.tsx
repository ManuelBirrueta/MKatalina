/**
 * ============================================================================
 * CHECKOUT SUMMARY — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server Component a Client Component (necesita useLocale +
 *     useTranslations)
 *   - item.product.name se resuelve con getLocalized() en cada iteración
 *     del map de items
 *   - Textos hardcoded ("Resumen del pedido", "Cantidad:", "Subtotal",
 *     "Total", "Procesando...", aviso de seguridad) ahora vienen de
 *     messages.json bajo el namespace checkout.summary
 *   - El aria-label del botón PayPal también traducido
 *
 * Lo que NO cambia:
 *   - El layout visual: misma estructura, mismos colores, mismas dimensiones
 *   - shippingMethod.label: se sigue renderizando tal cual (asumimos string;
 *     si es LocalizedString habría que ajustar también, pero por ahora
 *     mantenemos como en la versión anterior)
 *   - Los colores PayPal #FFC439 / #003087: oficiales, no se traducen
 *
 * Sobre por qué pasa a Client Component:
 *   En el Turno 3A vimos el patrón: para que un componente pueda usar
 *   useLocale + useTranslations, debe ser Client. La página padre que lo
 *   renderiza (el checkout) puede seguir siendo Server, este componente
 *   se "hidrata" como isla.
 *
 *   Como CheckoutSummary ya tenía interactividad (el botón onPay, el
 *   estado isProcessing), seguramente la página padre ya lo trataba como
 *   componente que requería bundle del cliente. No es regresión real.
 * ============================================================================
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { CartItemWithProduct } from "@/hooks/use-cart";
import type { ShippingMethod } from "@/types/checkout";

interface CheckoutSummaryProps {
  items: CartItemWithProduct[];
  subtotal: number;
  shippingMethod: ShippingMethod;
  total: number;
  onPay: () => void;
  isProcessing: boolean;
}

export function CheckoutSummary({
  items,
  subtotal,
  shippingMethod,
  total,
  onPay,
  isProcessing,
}: CheckoutSummaryProps) {
  /**
   * Hooks de i18n:
   *   - locale: idioma activo, para resolver getLocalized()
   *   - t: traducciones bajo namespace checkout.summary
   */
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout.summary");

  return (
    <div
      className={cn(
        "border border-border rounded-md p-6 bg-card",
        "space-y-5"
      )}
    >
      {/* Header */}
      <h2 className="text-xs uppercase tracking-[0.2em] font-medium">
        {t("title")}
      </h2>

      {/* Lista compacta de items */}
      <ul className="space-y-3 max-h-[300px] overflow-y-auto -mx-1 px-1">
        {items.map((item) => {
          const isPlaceholder =
            item.product.images[0]?.src.startsWith("/placeholder") ?? true;

          /**
           * Resolver el nombre del producto al locale activo.
           * Cada iteración del map necesita su propia resolución porque
           * cada item es un producto distinto.
           */
          const productName = getLocalized(item.product.name, locale);

          return (
            <li key={item.slug} className="flex gap-3">
              {/* Mini imagen del producto */}
              <div
                className={cn(
                  "relative w-12 h-15 flex-shrink-0",
                  "bg-secondary-subtle overflow-hidden"
                )}
              >
                {isPlaceholder ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
                      {/*
                       * Primera letra de la categoría (enum en español).
                       * Es un placeholder visual mínimo, no es texto crítico.
                       */}
                      {item.product.category[0]}
                    </span>
                  </div>
                ) : (
                  <Image
                    src={item.product.images[0].src}
                    alt={item.product.images[0].alt}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                )}
              </div>

              {/* Nombre + cantidad */}
              <div className="flex-1 min-w-0">
                {/*
                 * productName ya resuelto al locale activo.
                 * Antes: {item.product.name} → "[object Object]" cuando es LocalizedString.
                 */}
                <p className="text-sm font-medium truncate">{productName}</p>
                <p className="text-xs text-muted-foreground">
                  {t("quantity")} {item.quantity}
                </p>
              </div>

              {/* Total de la línea */}
              <p className="text-sm font-medium tabular-nums whitespace-nowrap">
                {formatPrice(item.lineTotal)}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Separador */}
      <div className="border-t border-border" />

      {/* Cálculos */}
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t("subtotal")}</dt>
          <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
        </div>

        <div className="flex items-center justify-between">
          {/*
           * shippingMethod.label se mantiene como en la versión anterior.
           *
           * Asumimos que es string. Si en types/checkout.ts cambió a
           * LocalizedString, daría error en runtime y habría que resolverlo:
           *   {typeof shippingMethod.label === "string"
           *     ? shippingMethod.label
           *     : getLocalized(shippingMethod.label, locale)}
           */}
          <dt className="text-muted-foreground">{shippingMethod.label}</dt>
          <dd className="font-medium tabular-nums">
            {formatPrice(shippingMethod.price)}
          </dd>
        </div>
      </dl>

      {/* Separador */}
      <div className="border-t border-border" />

      {/* Total */}
      <div className="flex items-baseline justify-between">
        <span className="text-base font-medium">{t("total")}</span>
        <span className="text-xl font-medium tabular-nums">
          {formatPrice(total)}
        </span>
      </div>

      {/*
       * ─── BOTÓN PAYPAL SIMULADO ───
       *
       * El texto "Pagar con" / "Pay with" viene traducido.
       * "PayPal" en sí mismo es marca, NO se traduce.
       * "Procesando..." / "Processing..." también traducido.
       */}
      <button
        onClick={onPay}
        disabled={isProcessing}
        className={cn(
          "w-full h-12 rounded-md",
          "bg-[#FFC439] hover:bg-[#FFB700] active:bg-[#F4A700]",
          "text-[#003087] font-semibold text-sm",
          "transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "cursor-pointer",
          "flex items-center justify-center gap-2"
        )}
        aria-label={t("payButtonAriaLabel")}
      >
        {isProcessing ? (
          t("processing")
        ) : (
          <>
            {t("payButton")} <span className="font-bold italic">PayPal</span>
          </>
        )}
      </button>

      {/* Aviso de seguridad debajo del botón */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
        <p>{t("securityNotice")}</p>
      </div>
    </div>
  );
}