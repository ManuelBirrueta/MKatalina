/**
 * ============================================================================
 * PAGE: /[locale]/admin/apartados — MKATALINA · Fase 13 · Etapas 5, 6B y 7
 * ============================================================================
 *
 * Tabla de TODOS los apartados, con selector para cambiar el estado.
 * Protegida por el layout de admin. Mismo patrón que la tabla de pedidos.
 *
 * Detalle de estados:
 *   - Se MUESTRA el estado efectivo (incluye "Vencido" cuando pasaron los 5
 *     días estando activo).
 *   - El selector deja cambiar solo entre ACTIVO / COMPLETADO / CANCELADO
 *     (los que se guardan). "Vencido" se calcula por fecha, no se pone a mano.
 *
 * Casos de uso: el cliente pagó el resto en persona → COMPLETADO a mano; se
 * cancela el apartado → CANCELADO.
 *
 * CAMBIOS DE LA ETAPA 5:
 *   - Columna "Entrega": cómo se entrega cada apartado completado (recoger en
 *     tienda o envío, con método y costo) y si el resto se pagó EN LÍNEA
 *     (PayPal) o se marcó completado A MANO.
 *   - "Ver dirección" despliega, debajo de la fila, la dirección de envío que
 *     el cliente capturó al pagar (nombre, teléfono, calle, colonia, CP,
 *     ciudad, estado y notas para el repartidor).
 *   - Si un cambio de estado no pudo mover el stock (stockShortage, ver
 *     src/actions/admin.ts), se avisa para revisarlo a mano.
 *
 * CAMBIO DE LA ETAPA 7: la dirección desplegada muestra el PAÍS, y el
 * nombre del método de envío sale de src/lib/shipping-rates.ts (incluye
 * "Envío internacional DHL Express").
 *
 * CAMBIO DE LA ETAPA 6B — ENVÍO DE LA PIEZA:
 *   En los apartados COMPLETADOS con envío a domicilio aparece "Marcar como
 *   enviado". Despliega ShipmentForm (paquetería + guía + "Avisar al
 *   cliente"); al guardar, shipReservation registra el envío y, si se pidió,
 *   manda el correo "Tu pieza va en camino". Una vez enviado, se muestra la
 *   guía con enlace para rastrear y "Editar guía" para corregirla.
 * ============================================================================
 */

"use client";

import { Fragment, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  getAllReservations,
  updateReservationStatus,
  shipReservation,
} from "@/actions/admin";
import { ShipmentForm } from "@/components/admin/ShipmentForm";
import { carrierLabel, carrierTrackingUrl } from "@/lib/shipping-carriers";
import { shippingMethodLabel } from "@/lib/shipping-rates";
import { countryName } from "@/lib/countries";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

type AdminReservation = Awaited<
  ReturnType<typeof getAllReservations>
>[number];

// Estados editables (los que se guardan).
const RESERVATION_STATUSES = ["ACTIVO", "COMPLETADO", "CANCELADO"] as const;

// Etiquetas bilingües (incluye EXPIRADO solo para mostrar).
const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  ACTIVO: { es: "Activo", en: "Active" },
  COMPLETADO: { es: "Completado", en: "Completed" },
  CANCELADO: { es: "Cancelado", en: "Cancelled" },
  EXPIRADO: { es: "Vencido", en: "Expired" },
};


const COPY = {
  es: {
    empty: "Aún no hay apartados.",
    colId: "Apartado",
    colDate: "Fecha",
    colCustomer: "Cliente",
    colProduct: "Producto",
    colDeposit: "Anticipo",
    colRemaining: "Restante",
    colDelivery: "Entrega",
    colStatus: "Estado",
    saved: "Estado actualizado",
    error: "No se pudo actualizar el estado",
    stockShortage:
      "Estado guardado, pero no había stock suficiente para ajustarlo. Revisa el inventario del producto.",
    expiredTag: "Vencido",
    pickup: "Recoger en tienda",
    paidOnline: "Pagado en línea",
    markedManually: "Marcado a mano",
    showAddress: "Ver dirección",
    hideAddress: "Ocultar dirección",
    phone: "Tel.",
    notes: "Notas",
    markShipped: "Marcar como enviado",
    shipTitle: "Marcar como enviado",
    editShipTitle: "Editar datos de envío",
    shippedTag: "Enviado",
    editTracking: "Editar guía",
    track: "Rastrear",
    shipped: "Envío guardado",
    shippedNotified: "Envío guardado. Le avisamos al cliente por correo.",
    invalidShipment: "Revisa la paquetería y el número de guía.",
    notShippable: "Solo se pueden enviar apartados completados con envío a domicilio.",
  },
  en: {
    empty: "No reservations yet.",
    colId: "Reservation",
    colDate: "Date",
    colCustomer: "Customer",
    colProduct: "Product",
    colDeposit: "Deposit",
    colRemaining: "Remaining",
    colDelivery: "Delivery",
    colStatus: "Status",
    saved: "Status updated",
    error: "Could not update status",
    stockShortage:
      "Status saved, but there wasn't enough stock to adjust it. Please check the product's inventory.",
    expiredTag: "Expired",
    pickup: "Store pickup",
    paidOnline: "Paid online",
    markedManually: "Marked manually",
    showAddress: "Show address",
    hideAddress: "Hide address",
    phone: "Phone",
    notes: "Notes",
    markShipped: "Mark as shipped",
    shipTitle: "Mark as shipped",
    editShipTitle: "Edit shipment details",
    shippedTag: "Shipped",
    editTracking: "Edit tracking",
    track: "Track",
    shipped: "Shipment saved",
    shippedNotified: "Shipment saved. We emailed the customer.",
    invalidShipment: "Please check the carrier and tracking number.",
    notShippable: "Only completed reservations with home delivery can be shipped.",
  },
} as const;

export default function AdminReservationsPage() {
  const locale = useLocale() as Locale;
  const lang = locale === "en" ? "en" : "es";
  const t = COPY[lang];

  const [items, setItems] = useState<AdminReservation[] | null>(null);
  // Fila con la dirección desplegada (solo una a la vez).
  const [openAddressId, setOpenAddressId] = useState<string | null>(null);
  // Fila con el formulario de envío desplegado (Etapa 6B).
  const [shipPanel, setShipPanel] = useState<{ id: string; editing: boolean } | null>(null);

  useEffect(() => {
    getAllReservations()
      .then((rows) => setItems(rows))
      .catch(() => setItems([]));
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const previous = items;
    // Optimista: actualizamos status y recalculamos el efectivo simple.
    setItems(
      (cur) =>
        cur?.map((r) =>
          r.id === id
            ? { ...r, status: newStatus, effectiveStatus: newStatus }
            : r,
        ) ?? cur,
    );

    const res = await updateReservationStatus(id, newStatus);
    if (res.success) {
      if (res.stockShortage) toast.warning(t.stockShortage);
      else toast.success(t.saved);
    } else {
      setItems(previous ?? null);
      toast.error(t.error);
    }
  };

  /** Guarda el formulario de envío (shipReservation). */
  const handleShip = async (
    id: string,
    shipment: { carrier: string; trackingNumber: string | null },
    notify: boolean,
  ): Promise<boolean> => {
    const res = await shipReservation(id, shipment, notify);
    if (!res.success) {
      toast.error(
        res.error === "invalidShipment"
          ? t.invalidShipment
          : res.error === "notShippable"
            ? t.notShippable
            : t.error,
      );
      return false;
    }
    setItems(
      (cur) =>
        cur?.map((r) =>
          r.id === id
            ? {
                ...r,
                carrier: shipment.carrier,
                trackingNumber: shipment.trackingNumber,
                shippedAt: new Date().toISOString(),
              }
            : r,
        ) ?? cur,
    );
    setShipPanel(null);
    toast.success(notify ? t.shippedNotified : t.shipped);
    return true;
  };

  const intlLocale = lang === "en" ? "en-US" : "es-MX";

  if (items === null) {
    return <div className="h-64" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">{t.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <th className="py-3 pr-4 font-medium">{t.colId}</th>
            <th className="py-3 pr-4 font-medium">{t.colDate}</th>
            <th className="py-3 pr-4 font-medium">{t.colCustomer}</th>
            <th className="py-3 pr-4 font-medium">{t.colProduct}</th>
            <th className="py-3 pr-4 font-medium text-right">{t.colDeposit}</th>
            <th className="py-3 pr-4 font-medium text-right">{t.colRemaining}</th>
            <th className="py-3 pr-4 font-medium">{t.colDelivery}</th>
            <th className="py-3 font-medium">{t.colStatus}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const date = new Intl.DateTimeFormat(intlLocale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(r.createdAt));

            const isExpired = r.effectiveStatus === "EXPIRADO";
            const isCompleted = r.status === "COMPLETADO";
            const address = r.shippingAddress;
            const addressOpen = openAddressId === r.id && address !== null;
            const shipOpen = shipPanel?.id === r.id ? shipPanel : null;
            const canShip = isCompleted && r.deliveryMethod === "shipping";
            const trackingUrl = carrierTrackingUrl(r.carrier, r.trackingNumber);

            return (
              <Fragment key={r.id}>
                <tr className="border-b border-border/60 hover:bg-muted/40">
                  <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">
                    {r.id}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                    {date}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{r.customerName}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="py-3 pr-4">{r.productName}</td>
                  <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                    {formatPrice(r.depositAmount)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                    {formatPrice(r.remainingAmount)}
                  </td>

                  {/* Entrega (solo tiene datos cuando el apartado se completó) */}
                  <td className="py-3 pr-4 min-w-[170px]">
                    {r.deliveryMethod === "shipping" ? (
                      <div>
                        <div>
                          {shippingMethodLabel(r.shippingMethodId, lang)}{" "}
                          · {formatPrice(r.shippingCost)}
                        </div>
                        {address && (
                          <button
                            type="button"
                            onClick={() =>
                              setOpenAddressId(addressOpen ? null : r.id)
                            }
                            className="text-xs text-accent hover:underline"
                          >
                            {addressOpen ? t.hideAddress : t.showAddress}
                          </button>
                        )}
                      </div>
                    ) : r.deliveryMethod === "pickup" ? (
                      <div>{t.pickup}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {isCompleted && (
                      <div
                        className={cn(
                          "text-[10px] uppercase tracking-wider mt-1",
                          r.paidOnline ? "text-accent" : "text-muted-foreground",
                        )}
                      >
                        {r.paidOnline ? t.paidOnline : t.markedManually}
                      </div>
                    )}

                    {/* Envío de la pieza (Etapa 6B) */}
                    {canShip &&
                      (r.shippedAt ? (
                        <div className="mt-1 text-xs text-muted-foreground space-x-2">
                          <span>
                            {t.shippedTag} · {carrierLabel(r.carrier, lang)}
                            {r.trackingNumber && (
                              <span className="font-mono"> · {r.trackingNumber}</span>
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
                            onClick={() => setShipPanel({ id: r.id, editing: true })}
                            className="text-accent hover:underline"
                          >
                            {t.editTracking}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShipPanel({ id: r.id, editing: false })}
                          className="mt-2 h-8 px-3 rounded-md border border-accent text-xs text-accent hover:bg-accent/10"
                        >
                          {t.markShipped}
                        </button>
                      ))}
                  </td>

                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          handleStatusChange(r.id, e.target.value)
                        }
                        className={cn(
                          "h-9 px-2 rounded-md border border-input bg-background",
                          "text-sm cursor-pointer focus:outline-none focus:border-ring",
                        )}
                      >
                        {RESERVATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]?.[lang] ?? status}
                          </option>
                        ))}
                      </select>
                      {/* Aviso de vencido (el estado guardado sigue siendo ACTIVO) */}
                      {isExpired && (
                        <span className="text-[10px] uppercase tracking-wider text-destructive">
                          {t.expiredTag}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Formulario de envío desplegado debajo de la fila */}
                {shipOpen && (
                  <tr className="border-b border-border/60 bg-muted/30">
                    <td colSpan={8} className="py-4 px-4">
                      <ShipmentForm
                        lang={lang}
                        title={shipOpen.editing ? t.editShipTitle : t.shipTitle}
                        initialCarrier={r.carrier}
                        initialTracking={r.trackingNumber}
                        defaultNotify={!shipOpen.editing}
                        onSubmit={(shipment, notify) => handleShip(r.id, shipment, notify)}
                        onCancel={() => setShipPanel(null)}
                      />
                    </td>
                  </tr>
                )}

                {/* Dirección de envío desplegada debajo de la fila */}
                {addressOpen && address && (
                  <tr className="border-b border-border/60 bg-muted/30">
                    <td colSpan={8} className="py-3 px-4">
                      <div className="text-sm space-y-0.5">
                        <p className="font-medium">
                          {address.firstName} {address.lastName} · {t.phone}{" "}
                          {address.phone}
                        </p>
                        <p>
                          {address.address}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                          {address.neighborhood && `, ${address.neighborhood}`}
                        </p>
                        <p>
                          {[address.postalCode, address.city, address.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {/* País (las direcciones anteriores a la Etapa 7 son de México) */}
                        <p className="font-medium">
                          {countryName(address.country || "MX", lang)}
                        </p>
                        {address.notes && (
                          <p className="text-muted-foreground">
                            {t.notes}: {address.notes}
                          </p>
                        )}
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