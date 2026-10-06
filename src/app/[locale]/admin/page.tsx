/**
 * ============================================================================
 * PAGE: /[locale]/admin — MKATALINA · Fase 13 · Pedidos (admin)
 * ============================================================================
 *
 * Tabla de TODOS los pedidos, con un selector para cambiar el estado de cada uno.
 * Protegida por el layout de admin (requireAdmin). Además, las acciones
 * getAllOrders/updateOrderStatus revalidan el rol en el servidor.
 *
 * El cambio de estado es optimista: la tabla se actualiza al instante y se
 * persiste en segundo plano; si falla, se revierte.
 *
 * Los textos van en un objeto {es, en} aquí mismo (autónomo).
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { getAllOrders, updateOrderStatus } from "@/actions/admin";
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
  },
} as const;

export default function AdminOrdersPage() {
  const locale = useLocale() as Locale;
  const lang = locale === "en" ? "en" : "es";
  const t = COPY[lang];

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);

  useEffect(() => {
    getAllOrders()
      .then((rows) => setOrders(rows))
      .catch(() => setOrders([]));
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const previous = orders;
    // Optimista
    setOrders(
      (cur) =>
        cur?.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)) ??
        cur,
    );

    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      toast.success(t.saved);
    } else {
      setOrders(previous ?? null); // revertir
      toast.error(t.error);
    }
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

            return (
              <tr
                key={order.id}
                className="border-b border-border/60 hover:bg-muted/40"
              >
                <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">
                  {order.id}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                  {date}
                </td>
                <td className="py-3 pr-4">
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.email}
                  </div>
                </td>
                <td className="py-3 pr-4 text-center tabular-nums">
                  {order.itemCount}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                  {formatPrice(order.total)}
                </td>
                <td className="py-3">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}