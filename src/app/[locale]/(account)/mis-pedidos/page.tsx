/**
 * ============================================================================
 * PAGE: /[locale]/(account)/mis-pedidos — MKATALINA (Fase 13 · detalle desde BD)
 * ============================================================================
 *
 * Lista TODOS los pedidos del usuario desde la base (acción getMyOrders).
 *
 * Cambio de esta etapa:
 *   - El botón "Ver detalle" ahora apunta a la nueva página de detalle
 *     (/mis-pedidos/[orderId]), que lee el pedido completo de la base. Antes
 *     apuntaba a la confirmación (sessionStorage), que solo servía para el
 *     pedido más reciente. Ahora cualquier pedido del historial muestra detalle.
 *
 * Lo que NO cambia:
 *   - La estructura visual (OrderCard, EmptyOrders) y las traducciones.
 *   - item.name ya es string (nameSnapshot), sin defensive parsing.
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
import type { Locale } from "@/i18n/routing";
import { getMyOrders } from "@/actions/orders";

// El tipo de un pedido se infiere de lo que devuelve la acción (sin duplicar).
type OrderSummary = Awaited<ReturnType<typeof getMyOrders>>[number];

export default function MyOrdersPage() {
  const t = useTranslations("myOrders");

  // null = todavía cargando; [] = cargado y sin pedidos.
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    // La acción resuelve al usuario en el servidor (por la cookie de sesión),
    // así que basta con llamarla una vez al montar.
    getMyOrders()
      .then((rows) => setOrders(rows))
      .catch(() => setOrders([]));
  }, []);

  const isLoading = orders === null;
  const isEmpty = !isLoading && orders.length === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
          {t("title")}
        </h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {isEmpty ? t("subtitleEmpty") : t("subtitleWithOrders")}
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="h-64" aria-hidden="true" />
      ) : isEmpty ? (
        <EmptyOrders />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * OrderCard — un pedido con resumen de renglones.
 */
function OrderCard({ order }: { order: OrderSummary }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("myOrders.card");

  const intlLocale = locale === "es" ? "es-MX" : "en-US";
  const orderDate = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(order.createdAt));

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="border border-border rounded-md bg-card overflow-hidden">
      {/* Header del pedido */}
      <header
        className={cn(
          "px-6 py-4 border-b border-border",
          "bg-muted/30",
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        )}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">
            {t("orderEyebrow")}
          </p>
          <p className="font-mono text-sm font-medium tabular-nums">
            {order.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
              "bg-success/10 text-success",
              "text-xs font-medium",
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
          {totalItems}{" "}
          {totalItems === 1 ? t("productsSingular") : t("productsPlural")}
        </p>

        <ul className="space-y-2">
          {order.items.slice(0, 3).map((item) => (
            <li
              key={item.slug}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="flex-1 min-w-0 truncate">
                {item.quantity} × {item.name}
              </span>
              <span className="font-medium tabular-nums whitespace-nowrap">
                {formatPrice(item.lineTotal)}
              </span>
            </li>
          ))}

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
          "flex items-center justify-between gap-4",
        )}
      >
        <div>
          <p className="text-xs text-muted-foreground">{t("totalLabel")}</p>
          <p className="text-lg font-medium tabular-nums">
            {formatPrice(order.total)}
          </p>
        </div>

        {/*
         * "Ver detalle" ahora va a la página de detalle que lee de la base,
         * no a la confirmación (sessionStorage). Funciona para CUALQUIER pedido.
         */}
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href={`/mis-pedidos/${order.id}`}>
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

      <p className={cn("text-sm text-muted-foreground", "max-w-md mx-auto mb-8")}>
        {t("description")}
      </p>

      <Button asChild size="lg">
        <Link href="/aretes">{t("ctaButton")}</Link>
      </Button>
    </div>
  );
}