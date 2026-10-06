/**
 * ============================================================================
 * CHECKOUT SUMMARY — MKATALINA (Fase 13 · Etapa 4: botón de pago como slot)
 * ============================================================================
 *
 * Cambio de esta etapa:
 *   - Ya no recibe onPay/isProcessing ni renderiza un botón simulado. Ahora
 *     recibe `paymentButton` (un ReactNode) y lo renderiza donde iba el botón.
 *     La página del checkout le pasa el botón real de PayPal. Así este
 *     componente queda desacoplado del método de pago.
 *
 * Lo que NO cambia:
 *   - El resumen (lista de items, subtotal, envío, total) y el aviso de
 *     seguridad.
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
  /** El botón de pago (PayPal). Lo arma la página del checkout. */
  paymentButton: React.ReactNode;
}

export function CheckoutSummary({
  items,
  subtotal,
  shippingMethod,
  total,
  paymentButton,
}: CheckoutSummaryProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout.summary");

  return (
    <div className={cn("border border-border rounded-md p-6 bg-card", "space-y-5")}>
      {/* Header */}
      <h2 className="text-xs uppercase tracking-[0.2em] font-medium">
        {t("title")}
      </h2>

      {/* Lista compacta de items */}
      <ul className="space-y-3 max-h-[300px] overflow-y-auto -mx-1 px-1">
        {items.map((item) => {
          const isPlaceholder =
            item.product.images[0]?.src.startsWith("/placeholder") ?? true;
          const productName = getLocalized(item.product.name, locale);

          return (
            <li key={item.slug} className="flex gap-3">
              <div
                className={cn(
                  "relative w-12 h-15 flex-shrink-0",
                  "bg-secondary-subtle overflow-hidden",
                )}
              >
                {isPlaceholder ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
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

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{productName}</p>
                <p className="text-xs text-muted-foreground">
                  {t("quantity")} {item.quantity}
                </p>
              </div>

              <p className="text-sm font-medium tabular-nums whitespace-nowrap">
                {formatPrice(item.lineTotal)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border" />

      {/* Cálculos */}
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t("subtotal")}</dt>
          <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{shippingMethod.label}</dt>
          <dd className="font-medium tabular-nums">
            {formatPrice(shippingMethod.price)}
          </dd>
        </div>
      </dl>

      <div className="border-t border-border" />

      {/* Total */}
      <div className="flex items-baseline justify-between">
        <span className="text-base font-medium">{t("total")}</span>
        <span className="text-xl font-medium tabular-nums">
          {formatPrice(total)}
        </span>
      </div>

      {/* Botón de pago (PayPal) — provisto por la página del checkout */}
      <div>{paymentButton}</div>

      {/* Aviso de seguridad */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
        <p>{t("securityNotice")}</p>
      </div>
    </div>
  );
}