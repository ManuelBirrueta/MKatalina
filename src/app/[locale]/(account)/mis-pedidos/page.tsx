/**
 * ============================================================================
 * PAGE: /[locale]/(account)/mis-pedidos — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link de "next/link" → "@/i18n/navigation"
 *   - useLocale + useTranslations agregados
 *   - Todos los textos hardcoded traducidos (header, card, empty state,
 *     tooltips, botones)
 *   - DEFENSIVE PARSING en item.name: igual que hicimos en la página
 *     de confirmación. El item.name puede ser string (formato nuevo
 *     post fix-checkout) o LocalizedString (formato legacy si la orden
 *     se hizo antes del fix). getLocalizedSafe() resuelve ambos.
 *   - Date formatting con locale dinámico: es-MX vs en-US
 *
 * Lo que NO cambia:
 *   - Lectura de sessionStorage con key "katalina-last-order"
 *   - Mostramos solo el último pedido (limitación de sessionStorage)
 *   - Estructura del OrderCard con 3 secciones (header, body, footer)
 *
 * ─── DEFENSIVE PARSING ─────────────────────────────────────────────────
 *
 * El tipo OrderSnapshot declara `name: string` pero los datos reales
 * en sessionStorage pueden tener:
 *   - string puro (orden creada después del fix-checkout)
 *   - LocalizedString {es, en} (orden vieja antes del fix)
 *   - undefined (estructura corrupta o legacy)
 *
 * Para evitar crashes, usamos getLocalizedSafe() que tolera los 3 casos.
 *
 * Lo mismo aplica a shippingMethod.label, aunque este componente no lo
 * muestra. Si en el futuro lo mostráramos, también usaríamos defensive
 * parsing.
 * ─────────────────────────────────────────────────────────────────────
 *
 * ─── ROADMAP CUANDO LLEGUE EL BACKEND ──────────────────────────────────
 *
 * En Fase 12 con backend:
 *   - GET /api/orders?userId=X devuelve TODOS los pedidos del usuario
 *   - Esta página los muestra paginados, con filtros por estado
 *   - El componente OrderCard se vuelve más rico (estados, tracking, etc.)
 * ─────────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLocalizedSafe } from "@/lib/i18n-helpers";
import type { LocalizedString } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

/**
 * Forma del snapshot del pedido tal como vive en sessionStorage.
 *
 * NOTA: los campos name, shippingMethod.label y description PUEDEN ser
 * string o LocalizedString dependiendo de cuándo se creó la orden.
 * Defensive parsing en el render lo maneja.
 */
interface OrderSnapshot {
  orderId: string;
  formData: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  shippingMethod: {
    label: string | LocalizedString;
    description: string | LocalizedString;
    price: number;
  };
  items: Array<{
    slug: string;
    /** Puede ser string (formato nuevo) o LocalizedString (legacy) */
    name: string | LocalizedString;
    price: number;
    quantity: number;
    lineTotal: number;
    category: string;
  }>;
  subtotal: number;
  total: number;
  createdAt: string;
}

export default function MyOrdersPage() {
  const t = useTranslations("myOrders");

  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("katalina-last-order");
      if (raw) {
        const parsed: OrderSnapshot = JSON.parse(raw);
        setOrder(parsed);
      }
    } catch {
      // Si falla sessionStorage (modo incógnito Safari, etc.), sin pedidos.
    }
    setHasChecked(true);
  }, []);

  // Mientras leemos sessionStorage, placeholder vacío
  if (!hasChecked) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
            {t("title")}
          </h1>
        </header>
        <div className="h-64" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {order ? t("subtitleWithOrders") : t("subtitleEmpty")}
        </p>
      </header>

      {order ? <OrderCard order={order} /> : <EmptyOrders />}
    </div>
  );
}

/**
 * OrderCard — muestra un pedido individual con preview de items.
 *
 * Cambios principales:
 *   - Date formatting con locale dinámico (es-MX vs en-US)
 *   - Defensive parsing en item.name (puede ser string o LocalizedString)
 *   - Todos los textos del card traducidos
 */
function OrderCard({ order }: { order: OrderSnapshot }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("myOrders.card");

  /**
   * Formatear fecha del pedido según el locale activo.
   *   - es → "1 de mayo de 2026"
   *   - en → "May 1, 2026"
   *
   * Mapeo de nuestro locale a códigos de Intl:
   *   "es" → "es-MX"
   *   "en" → "en-US"
   */
  const intlLocale = locale === "es" ? "es-MX" : "en-US";

  const orderDate = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(order.createdAt));

  // Total de items en el pedido (suma de quantities)
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="border border-border rounded-md bg-card overflow-hidden">
      {/* Header del pedido */}
      <header
        className={cn(
          "px-6 py-4 border-b border-border",
          "bg-muted/30",
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        )}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">
            {t("orderEyebrow")}
          </p>
          <p className="font-mono text-sm font-medium tabular-nums">
            {order.orderId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
              "bg-success/10 text-success",
              "text-xs font-medium"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {t("statusConfirmed")}
          </span>

          <p className="text-xs text-muted-foreground">{orderDate}</p>
        </div>
      </header>

      {/* Body con items */}
      <div className="px-6 py-4">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
          {/*
           * Contador "X productos" con pluralización.
           * Mostramos solo el número junto a la palabra traducida.
           */}
          {totalItems}{" "}
          {totalItems === 1 ? t("productsSingular") : t("productsPlural")}
        </p>

        <ul className="space-y-2">
          {order.items.slice(0, 3).map((item) => {
            /**
             * DEFENSIVE PARSING:
             * item.name puede ser string (formato nuevo) o LocalizedString
             * (formato legacy). getLocalizedSafe() resuelve ambos.
             */
            const itemName = getLocalizedSafe(item.name, locale);

            return (
              <li
                key={item.slug}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="flex-1 min-w-0 truncate">
                  {item.quantity} × {itemName}
                </span>
                <span className="font-medium tabular-nums whitespace-nowrap">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            );
          })}

          {/*
           * Si hay más de 3 items, mostramos "y X producto/s más" abajo.
           * Pluralización con interpolación de count.
           */}
          {order.items.length > 3 && (
            <li className="text-xs text-muted-foreground pt-1">
              {order.items.length - 3 === 1
                ? t("moreSingular", { count: order.items.length - 3 })
                : t("morePlural", { count: order.items.length - 3 })}
            </li>
          )}
        </ul>
      </div>

      {/* Footer con total + CTA */}
      <footer
        className={cn(
          "px-6 py-4 border-t border-border",
          "flex items-center justify-between gap-4"
        )}
      >
        <div>
          <p className="text-xs text-muted-foreground">{t("totalLabel")}</p>
          <p className="text-lg font-medium tabular-nums">
            {formatPrice(order.total)}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href={`/checkout/confirmacion?orden=${order.orderId}`}>
            {t("viewDetailButton")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </footer>
    </article>
  );
}

/**
 * EmptyOrders — estado vacío amigable.
 */
function EmptyOrders() {
  const t = useTranslations("myOrders.empty");

  return (
    <div className="py-16 lg:py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-subtle mb-6">
        <Package
          className="h-7 w-7 text-accent"
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">
        {t("title")}
      </h2>

      <p
        className={cn(
          "text-sm text-muted-foreground",
          "max-w-md mx-auto mb-8"
        )}
      >
        {t("description")}
      </p>

      <Button asChild size="lg">
        <Link href="/aretes">{t("ctaButton")}</Link>
      </Button>
    </div>
  );
}