/**
 * ============================================================================
 * PAGE: /[locale]/(account)/mis-pedidos/[orderId] — MKATALINA · Fase 13
 * ============================================================================
 *
 * Detalle completo de UN pedido, leído de la base (acción getOrderById).
 * Vive bajo la sección de cuenta, así que ya está protegida por login. Además,
 * getOrderById solo devuelve el pedido si es del usuario (verificación de dueño).
 *
 * Reemplaza la vieja "Ver detalle" que dependía de sessionStorage: ahora
 * cualquier pedido del historial se puede ver, no solo el más reciente.
 *
 * Estados:
 *   - order === undefined → cargando
 *   - order === null      → no existe o no es del usuario (mensaje + volver)
 *   - order (objeto)      → detalle completo
 *
 * Textos en un objeto {es, en} aquí mismo (autónomo, sin tocar messages.json).
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/actions/orders";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

// Etiquetas de estado (bilingües).
const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  PENDIENTE: { es: "Pendiente", en: "Pending" },
  PAGADO: { es: "Pagado", en: "Paid" },
  PROCESANDO: { es: "Procesando", en: "Processing" },
  ENVIADO: { es: "Enviado", en: "Shipped" },
  ENTREGADO: { es: "Entregado", en: "Delivered" },
  CANCELADO: { es: "Cancelado", en: "Cancelled" },
};

const COPY = {
  es: {
    back: "Volver a mis pedidos",
    eyebrow: "Pedido",
    products: "Productos",
    qty: "Cantidad",
    summary: "Resumen",
    subtotal: "Subtotal",
    total: "Total",
    shippingAddress: "Dirección de envío",
    contact: "Contacto",
    notesLabel: "Notas",
    notFoundTitle: "Pedido no encontrado",
    notFoundText: "No encontramos este pedido, o no pertenece a tu cuenta.",
    loading: "Cargando…",
  },
  en: {
    back: "Back to my orders",
    eyebrow: "Order",
    products: "Products",
    qty: "Quantity",
    summary: "Summary",
    subtotal: "Subtotal",
    total: "Total",
    shippingAddress: "Shipping address",
    contact: "Contact",
    notesLabel: "Notes",
    notFoundTitle: "Order not found",
    notFoundText: "We couldn't find this order, or it isn't on your account.",
    loading: "Loading…",
  },
} as const;

export default function OrderDetailPage() {
  const locale = useLocale() as Locale;
  const lang = locale === "en" ? "en" : "es";
  const t = COPY[lang];

  const params = useParams();
  const orderId = String(params.orderId);

  // undefined = cargando; null = no encontrado; objeto = cargado
  const [order, setOrder] = useState<OrderDetail | null | undefined>(undefined);

  useEffect(() => {
    getOrderById(orderId)
      .then((row) => setOrder(row))
      .catch(() => setOrder(null));
  }, [orderId]);

  // Enlace "volver" reutilizado
  const backLink = (
    <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2 mb-4">
      <Link href="/mis-pedidos">
        <ChevronLeft className="h-4 w-4" />
        {t.back}
      </Link>
    </Button>
  );

  if (order === undefined) {
    return <div className="h-64" aria-hidden="true" />;
  }

  if (order === null) {
    return (
      <div className="space-y-4">
        {backLink}
        <div className="border border-border rounded-md bg-card p-8 text-center">
          <h1 className="font-display text-2xl font-medium mb-2">
            {t.notFoundTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.notFoundText}</p>
        </div>
      </div>
    );
  }

  const intlLocale = lang === "en" ? "en-US" : "es-MX";
  const orderDate = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(order.createdAt));

  const statusLabel = STATUS_LABELS[order.status]?.[lang] ?? order.status;

  return (
    <div className="space-y-6">
      {backLink}

      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {t.eyebrow}
          </p>
          <h1 className="font-mono text-xl font-medium tabular-nums">
            {order.id}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{orderDate}</p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full self-start",
            "bg-success/10 text-success text-xs font-medium",
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          {statusLabel}
        </span>
      </header>

      {/* Productos */}
      <section className="border border-border rounded-md bg-card overflow-hidden">
        <h2 className="px-6 py-4 border-b border-border bg-muted/30 text-xs uppercase tracking-[0.15em] font-medium">
          {t.products}
        </h2>
        <ul className="divide-y divide-border">
          {order.items.map((item) => {
            const isPlaceholder =
              !item.image || item.image.startsWith("/placeholder");
            return (
              <li key={item.slug} className="flex items-center gap-4 px-6 py-4">
                {/* Miniatura (placeholder con inicial de categoría) */}
                <div className="relative w-12 h-14 flex-shrink-0 bg-secondary-subtle overflow-hidden rounded-sm">
                  {isPlaceholder ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.category?.[0] ?? "·"}
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image ?? ""}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.qty}: {item.quantity} · {formatPrice(item.unitPrice)}
                  </p>
                </div>

                <p className="text-sm font-medium tabular-nums whitespace-nowrap">
                  {formatPrice(item.lineTotal)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Resumen de montos */}
      <section className="border border-border rounded-md bg-card p-6">
        <h2 className="text-xs uppercase tracking-[0.15em] font-medium mb-4">
          {t.summary}
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t.subtotal}</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{order.shippingLabel}</dt>
            <dd className="tabular-nums">{formatPrice(order.shippingCost)}</dd>
          </div>
          <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
            <dt className="font-medium">{t.total}</dt>
            <dd className="text-lg font-medium tabular-nums">
              {formatPrice(order.total)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Envío + contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section className="border border-border rounded-md bg-card p-6">
          <h2 className="text-xs uppercase tracking-[0.15em] font-medium mb-3">
            {t.shippingAddress}
          </h2>
          <address className="not-italic text-sm text-muted-foreground space-y-0.5">
            <p className="text-foreground">
              {order.firstName} {order.lastName}
            </p>
            <p>{order.address}</p>
            {order.addressLine2 && <p>{order.addressLine2}</p>}
            <p>{order.neighborhood}</p>
            <p>
              {order.city}, {order.state} {order.postalCode}
            </p>
            <p>{order.phone}</p>
          </address>

          {order.notes && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {t.notesLabel}
              </p>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </section>

        <section className="border border-border rounded-md bg-card p-6">
          <h2 className="text-xs uppercase tracking-[0.15em] font-medium mb-3">
            {t.contact}
          </h2>
          <p className="text-sm text-muted-foreground">{order.email}</p>
        </section>
      </div>
    </div>
  );
}