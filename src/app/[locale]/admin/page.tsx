/**
 * ============================================================================
 * PAGE: /[locale]/admin — MKATALINA · Fase 13 · Pedidos (admin) · Etapa 6B
 * ============================================================================
 *
 * Tabla de TODOS los pedidos, con un selector para cambiar el estado de cada
 * uno. Protegida por el layout de admin (requireAdmin). Además, las acciones
 * de src/actions/admin.ts revalidan el rol en el servidor.
 *
 * CAMBIOS DE LA ETAPA 6B — ENVÍOS:
 *   - Elegir "Enviado" en el selector ya NO cambia el estado de inmediato:
 *     despliega debajo de la fila el formulario ShipmentForm (paquetería +
 *     número de guía + "Avisar al cliente por correo"). Al guardar se llama a
 *     shipOrder, que cambia el estado y, si se pidió, manda el correo
 *     "Tu pedido va en camino".
 *   - Elegir "Entregado" despliega una confirmación con la casilla "Avisar
 *     al cliente"; al confirmar, updateOrderStatus guarda el estado y manda
 *     "Tu pedido fue entregado".
 *   - Los pedidos enviados muestran su paquetería y guía (con enlace para
 *     rastrear) y un botón "Editar guía" para corregirla (por defecto sin
 *     volver a avisar al cliente).
 *   - Los demás estados (Pendiente, Pagado, Procesando, Cancelado) cambian
 *     al instante como antes (optimista: si falla, se revierte).
 *
 * Los textos van en un objeto {es, en} aquí mismo (autónomo).
 * ============================================================================
 */

"use client";

import { Fragment, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { getAllOrders, updateOrderStatus, shipOrder } from "@/actions/admin";
import { ShipmentForm } from "@/components/admin/ShipmentForm";
import { carrierLabel, carrierTrackingUrl } from "@/lib/shipping-carriers";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

type AdminOrder = Awaited<ReturnType<typeof getAllOrders>>[number];

// Estados posibles (coinciden con el enum del esquema).
const ORDER_STATUSES = [
  "PENDIENTE",
  "PAGADO",
  "PROCESANDO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
] as const;

// Etiquetas bilingües de cada estado.
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
    empty: "Aún no hay pedidos.",
    colOrder: "Pedido",
    colDate: "Fecha",
    colCustomer: "Cliente",
    colItems: "Artículos",
    colTotal: "Total",
    colStatus: "Estado",
    saved: "Estado actualizado",
    error: "No se pudo actualizar el estado",
    stockShortage:
      "Estado guardado, pero no había stock suficiente para ajustarlo. Revisa el inventario.",
    shipTitle: "Marcar como enviado",
    editShipTitle: "Editar datos de envío",
    shipped: "Envío guardado",
    shippedNotified: "Envío guardado. Le avisamos al cliente por correo.",
    invalidShipment: "Revisa la paquetería y el número de guía.",
    editTracking: "Editar guía",
    track: "Rastrear",
    deliverTitle: "Marcar como entregado",
    deliverNotify: "Avisar al cliente por correo",
    confirm: "Confirmar",
    cancel: "Cancelar",
    delivered: "Pedido marcado como entregado",
    deliveredNotified: "Pedido entregado. Le avisamos al cliente por correo.",
  },
  en: {
    empty: "No orders yet.",
    colOrder: "Order",
    colDate: "Date",
    colCustomer: "Customer",
    colItems: "Items",
    colTotal: "Total",
    colStatus: "Status",
    saved: "Status updated",
    error: "Could not update status",
    stockShortage:
      "Status saved, but there wasn't enough stock to adjust it. Please check inventory.",
    shipTitle: "Mark as shipped",
    editShipTitle: "Edit shipment details",
    shipped: "Shipment saved",
    shippedNotified: "Shipment saved. We emailed the customer.",
    invalidShipment: "Please check the carrier and tracking number.",
    editTracking: "Edit tracking",
    track: "Track",
    deliverTitle: "Mark as delivered",
    deliverNotify: "Email the customer",
    confirm: "Confirm",
    cancel: "Cancel",
    delivered: "Order marked as delivered",
    deliveredNotified: "Order delivered. We emailed the customer.",
  },
} as const;

/** Bloque desplegado debajo de una fila. */
type Panel =
  | { orderId: string; type: "ship"; editing: boolean }
  | { orderId: string; type: "deliver" }
  | null;

export default function AdminOrdersPage() {
  const locale = useLocale() as Locale;
  const lang = locale === "en" ? "en" : "es";
  const t = COPY[lang];

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [deliverNotify, setDeliverNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllOrders()
      .then((rows) => setOrders(rows))
      .catch(() => setOrders([]));
  }, []);

  /** Cambia los datos de una fila en la tabla local. */
  const patchOrder = (orderId: string, changes: Partial<AdminOrder>) =>
    setOrders(
      (cur) => cur?.map((o) => (o.id === orderId ? { ...o, ...changes } : o)) ?? cur,
    );

  /** El admin eligió un estado en el selector. */
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Enviado y Entregado piden datos antes de guardar.
    if (newStatus === "ENVIADO") {
      setPanel({ orderId, type: "ship", editing: false });
      return;
    }
    if (newStatus === "ENTREGADO") {
      setDeliverNotify(true);
      setPanel({ orderId, type: "deliver" });
      return;
    }

    setPanel(null);
    const previous = orders;
    patchOrder(orderId, { status: newStatus }); // optimista

    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      if (res.stockShortage) toast.warning(t.stockShortage);
      else toast.success(t.saved);
    } else {
      setOrders(previous ?? null); // revertir
      toast.error(t.error);
    }
  };

  /** Guarda el formulario de envío (shipOrder). */
  const handleShip = async (
    orderId: string,
    shipment: { carrier: string; trackingNumber: string | null },
    notify: boolean,
  ): Promise<boolean> => {
    const res = await shipOrder(orderId, shipment, notify);
    if (!res.success) {
      toast.error(res.error === "invalidShipment" ? t.invalidShipment : t.error);
      return false;
    }
    patchOrder(orderId, {
      status: "ENVIADO",
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      shippedAt: new Date().toISOString(),
    });
    setPanel(null);
    if (res.stockShortage) toast.warning(t.stockShortage);
    else toast.success(notify ? t.shippedNotified : t.shipped);
    return true;
  };

  /** Confirma "Entregado". */
  const handleDeliver = async (orderId: string) => {
    setSaving(true);
    const res = await updateOrderStatus(orderId, "ENTREGADO", { notify: deliverNotify });
    setSaving(false);
    if (!res.success) {
      toast.error(t.error);
      return;
    }
    patchOrder(orderId, { status: "ENTREGADO", deliveredAt: new Date().toISOString() });
    setPanel(null);
    if (res.stockShortage) toast.warning(t.stockShortage);
    else toast.success(deliverNotify ? t.deliveredNotified : t.delivered);
  };

  const intlLocale = lang === "en" ? "en-US" : "es-MX";

  if (orders === null) {
    return <div className="h-64" aria-hidden="true" />;
  }

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">{t.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <th className="py-3 pr-4 font-medium">{t.colOrder}</th>
            <th className="py-3 pr-4 font-medium">{t.colDate}</th>
            <th className="py-3 pr-4 font-medium">{t.colCustomer}</th>
            <th className="py-3 pr-4 font-medium text-center">{t.colItems}</th>
            <th className="py-3 pr-4 font-medium text-right">{t.colTotal}</th>
            <th className="py-3 font-medium">{t.colStatus}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const date = new Intl.DateTimeFormat(intlLocale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(order.createdAt));

            const rowPanel = panel?.orderId === order.id ? panel : null;
            const hasShipment = order.carrier !== null;
            const trackingUrl = carrierTrackingUrl(order.carrier, order.trackingNumber);

            return (
              <Fragment key={order.id}>
                <tr className="border-b border-border/60 hover:bg-muted/40">
                  <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">
                    {order.id}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                    {date}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.email}</div>
                  </td>
                  <td className="py-3 pr-4 text-center tabular-nums">
                    {order.itemCount}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-3 min-w-[180px]">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={cn(
                        "h-9 px-2 rounded-md border border-input bg-background",
                        "text-sm cursor-pointer focus:outline-none focus:border-ring",
                      )}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]?.[lang] ?? status}
                        </option>
                      ))}
                    </select>

                    {/* Guía del envío (pedidos enviados o entregados) */}
                    {hasShipment && (order.status === "ENVIADO" || order.status === "ENTREGADO") && (
                      <div className="mt-1 text-xs text-muted-foreground space-x-2">
                        <span>
                          {carrierLabel(order.carrier, lang)}
                          {order.trackingNumber && (
                            <span className="font-mono"> · {order.trackingNumber}</span>
                          )}
                        </span>
                        {trackingUrl && (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            {t.track} ↗
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPanel({ orderId: order.id, type: "ship", editing: true })
                          }
                          className="text-accent hover:underline"
                        >
                          {t.editTracking}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* Bloque desplegado: formulario de envío */}
                {rowPanel?.type === "ship" && (
                  <tr className="border-b border-border/60 bg-muted/30">
                    <td colSpan={6} className="py-4 px-4">
                      <ShipmentForm
                        lang={lang}
                        title={rowPanel.editing ? t.editShipTitle : t.shipTitle}
                        initialCarrier={order.carrier}
                        initialTracking={order.trackingNumber}
                        defaultNotify={!rowPanel.editing}
                        onSubmit={(shipment, notify) => handleShip(order.id, shipment, notify)}
                        onCancel={() => setPanel(null)}
                      />
                    </td>
                  </tr>
                )}

                {/* Bloque desplegado: confirmar entregado */}
                {rowPanel?.type === "deliver" && (
                  <tr className="border-b border-border/60 bg-muted/30">
                    <td colSpan={6} className="py-4 px-4">
                      <div className="rounded-md border border-border bg-background p-4 space-y-3 max-w-xl">
                        <p className="text-xs uppercase tracking-[0.15em] font-medium">
                          {t.deliverTitle}
                        </p>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deliverNotify}
                            onChange={(e) => setDeliverNotify(e.target.checked)}
                            disabled={saving}
                            className="h-4 w-4 accent-accent"
                          />
                          {t.deliverNotify}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDeliver(order.id)}
                            disabled={saving}
                            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                          >
                            {t.confirm}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPanel(null)}
                            disabled={saving}
                            className="h-9 px-4 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-50"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}