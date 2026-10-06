/**
 * ============================================================================
 * PAGE: /[locale]/admin/apartados — MKATALINA · Fase 13 · Apartados (admin)
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
 * Casos de uso: el cliente pagó el resto en persona → COMPLETADO; se cancela
 * el apartado → CANCELADO.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { getAllReservations, updateReservationStatus } from "@/actions/admin";
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
    colStatus: "Estado",
    saved: "Estado actualizado",
    error: "No se pudo actualizar el estado",
    expiredTag: "Vencido",
  },
  en: {
    empty: "No reservations yet.",
    colId: "Reservation",
    colDate: "Date",
    colCustomer: "Customer",
    colProduct: "Product",
    colDeposit: "Deposit",
    colRemaining: "Remaining",
    colStatus: "Status",
    saved: "Status updated",
    error: "Could not update status",
    expiredTag: "Expired",
  },
} as const;

export default function AdminReservationsPage() {
  const locale = useLocale() as Locale;
  const lang = locale === "en" ? "en" : "es";
  const t = COPY[lang];

  const [items, setItems] = useState<AdminReservation[] | null>(null);

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
      toast.success(t.saved);
    } else {
      setItems(previous ?? null);
      toast.error(t.error);
    }
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

            return (
              <tr
                key={r.id}
                className="border-b border-border/60 hover:bg-muted/40"
              >
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}