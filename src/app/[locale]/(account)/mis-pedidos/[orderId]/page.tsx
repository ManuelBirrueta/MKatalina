/**
 * ============================================================================
 * PAGE: /[locale]/(account)/mis-pedidos/[orderId] — MKATALINA · Fase 13 · Etapa 6B
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
 * ETAPA 6B (corrección): la etiqueta del estado usa OrderStatusBadge, con un
 * color por estado (antes todo salía en verde).
 *
 * ETAPA 6B: si el pedido ya se envió, aparece la sección "Seguimiento" con la
 * paquetería, el número de guía (con botón para copiarlo), las fechas de
 * envío/entrega y el botón "Rastrear mi paquete" (src/lib/shipping-carriers.ts).
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
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import {
  carrierLabel,
  carrierNeedsPaste,
  carrierTrackingUrl,
} from "@/lib/shipping-carriers";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

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
    tracking: "Seguimiento",
    carrier: "Paquetería",
    trackingNumber: "Número de guía",
    shippedOn: "Enviado el",
    deliveredOn: "Entregado el",
    track: "Rastrear mi paquete",
    copy: "Copiar",
    copied: "Copiado",
    paste: "En la página de la paquetería, pega tu número de guía.",
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
    tracking: "Tracking",
    carrier: "Carrier",
    trackingNumber: "Tracking number",
    shippedOn: "Shipped on",
    deliveredOn: "Delivered on",
    track: "Track my package",
    copy: "Copy",
    copied: "Copied",
    paste: "On the carrier's page, paste your tracking number.",
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
  // true un par de segundos después de copiar la guía.
  const [copied, setCopied] = useState(false);

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


  // Seguimiento (Etapa 6B)
  const formatDay = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  const trackingUrl = carrierTrackingUrl(order.carrier, order.trackingNumber);

  /** Copia la guía al portapapeles (útil para pegarla en Estafeta). */
  const copyTracking = async () => {
    if (!order.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el número sigue visible para copiarlo a mano.
    }
  };

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

        <OrderStatusBadge status={order.status} className="self-start" />
      </header>

      {/* Seguimiento del envío (solo si ya se envió) */}
      {order.carrier && order.shippedAt && (
        <section className="border border-border rounded-md bg-card p-6 space-y-3">
          <h2 className="text-xs uppercase tracking-[0.15em] font-medium">
            {t.tracking}
          </h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs">{t.carrier}</dt>
              <dd>{carrierLabel(order.carrier, lang)}</dd>
            </div>
            {order.trackingNumber && (
              <div>
                <dt className="text-muted-foreground text-xs">{t.trackingNumber}</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono">{order.trackingNumber}</span>
                  <button
                    type="button"
                    onClick={() => void copyTracking()}
                    className="text-xs text-accent hover:underline"
                  >
                    {copied ? t.copied : t.copy}
                  </button>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-xs">{t.shippedOn}</dt>
              <dd>{formatDay(order.shippedAt)}</dd>
            </div>
            {order.deliveredAt && (
              <div>
                <dt className="text-muted-foreground text-xs">{t.deliveredOn}</dt>
                <dd>{formatDay(order.deliveredAt)}</dd>
              </div>
            )}
          </dl>
          {trackingUrl && (
            <div className="space-y-1">
              <Button asChild size="sm">
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  {t.track} ↗
                </a>
              </Button>
              {carrierNeedsPaste(order.carrier) && (
                <p className="text-xs text-muted-foreground">{t.paste}</p>
              )}
            </div>
          )}
        </section>
      )}

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