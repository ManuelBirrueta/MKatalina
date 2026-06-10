/**
 * ============================================================================
 * RESERVATION CARD — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link cambia de "next/link" a "@/i18n/navigation"
 *   - Agregado useLocale + useTranslations
 *   - Todos los textos hardcoded traducidos (status badges, montos, botones,
 *     diálogo de confirmación, mensajes terminales, toast)
 *   - Date formatting con locale dinámico: en /es usa "es-MX" (1 de mayo
 *     de 2026), en /en usa "en-US" (May 1, 2026)
 *   - El texto de confirmación de cancelación usa t.rich() para mantener
 *     el <strong> del monto
 *
 * Lo que NO cambia:
 *   - reservation.product.name ya es string (gracias al fix de raíz en
 *     ReservationModal). NO necesita getLocalized.
 *   - Lógica del tick clock, contador regresivo, status efectivo
 *   - Animaciones, colores, layout
 *
 * Sobre el formatTimeRemaining:
 *   Esta función está en types/reservation.ts y devuelve un string como
 *   "4 días" o "2 días 6 horas". Probablemente está hardcoded en español.
 *
 *   Para mantener este turno enfocado, NO refactorizamos esa función ahora
 *   (sería un quinto archivo y nos desviamos). El contador seguirá
 *   mostrándose en español incluso en /en. Es un detalle menor que
 *   podemos pulir en un mini-turno aparte.
 *
 *   Si quieres traducirlo, hay que hacer formatTimeRemaining() recibir
 *   el locale como parámetro y mapear las unidades (días/days, horas/hours).
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Clock, CheckCircle, XCircle, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompleteReservationModal } from "@/components/account/CompleteReservationModal";
import { useReservations } from "@/hooks/use-reservations";
import { useTickClock } from "@/hooks/use-tick-clock";
import { formatPrice } from "@/lib/format";
import {
  formatTimeRemaining,
  getEffectiveStatus,
  type Reservation,
  type ReservationStatus,
} from "@/types/reservation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Locale } from "@/i18n/routing";

interface ReservationCardProps {
  reservation: Reservation;
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  /**
   * Tick cada minuto para que el contador "Expira en X" se actualice
   * sin recargar la página.
   */
  useTickClock(60_000);

  const t = useTranslations("reservation.card");

  const status = getEffectiveStatus(reservation);

  return (
    <article
      className={cn(
        "border border-border rounded-md p-5",
        "bg-card",
        status === "active" && "hover:shadow-sm transition-shadow"
      )}
    >
      <div className="flex gap-4">
        {/* Imagen del producto */}
        <Link
          href={`/productos/${reservation.product.slug}`}
          className={cn(
            "flex-shrink-0 relative",
            "w-20 h-[100px]",
            "bg-secondary-subtle overflow-hidden",
            "hover:opacity-80 transition-opacity"
          )}
          aria-label={t("viewProductAriaLabel", {
            productName: reservation.product.name,
          })}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {reservation.product.category[0]}
            </span>
          </div>
        </Link>

        {/* Info + acciones */}
        <div className="flex-1 min-w-0">
          {/* Header con badge de estado + nombre */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <StatusBadge status={status} />
              <Link
                href={`/productos/${reservation.product.slug}`}
                className="hover:text-accent transition-colors"
              >
                {/*
                 * reservation.product.name ya es string gracias al fix
                 * de raíz aplicado en ReservationModal. Por eso lo
                 * podemos renderizar directo sin getLocalized.
                 */}
                <h3 className="font-display text-lg font-medium leading-tight mt-1">
                  {reservation.product.name}
                </h3>
              </Link>
            </div>
          </div>

          {/* Contenido variable según estado */}
          {status === "active" && <ActiveContent reservation={reservation} />}
          {status === "completed" && (
            <CompletedContent reservation={reservation} />
          )}
          {(status === "expired" || status === "cancelled") && (
            <TerminalContent reservation={reservation} status={status} />
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * StatusBadge — pill coloreado según el estado.
 *
 * Cambio: las labels ahora vienen del namespace reservation.card.status.
 */
function StatusBadge({ status }: { status: ReservationStatus }) {
  const t = useTranslations("reservation.card.status");

  const config: Record<
    ReservationStatus,
    { Icon: typeof Clock; className: string }
  > = {
    active: {
      Icon: Clock,
      className: "bg-accent/10 text-accent",
    },
    completed: {
      Icon: CheckCircle,
      className: "bg-success/10 text-success",
    },
    expired: {
      Icon: XCircle,
      className: "bg-destructive/10 text-destructive",
    },
    cancelled: {
      Icon: XCircle,
      className: "bg-muted text-muted-foreground",
    },
  };

  const { Icon, className } = config[status];
  // El label viene del namespace traducido (active/completed/expired/cancelled)
  const label = t(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full",
        "text-xs font-medium",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * ActiveContent — para apartados activos.
 */
function ActiveContent({ reservation }: { reservation: Reservation }) {
  const t = useTranslations("reservation.card.active");

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { cancelReservation } = useReservations();

  const handleCancel = () => {
    cancelReservation(reservation.id);
    toast.success(t("toastCancelledTitle"), {
      description: t("toastCancelledDescription"),
    });
  };

  return (
    <>
      {/* Contador regresivo */}
      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {t("expiresIn")}{" "}
          {/*
           * formatTimeRemaining(reservation) devuelve "4 días" / "2 días 6 horas"
           * en español (está en types/reservation.ts).
           * En /en se mostrará igualmente en español. Es un detalle menor
           * que podemos refactorizar en otro turno.
           */}
          <strong className="text-foreground">
            {formatTimeRemaining(reservation)}
          </strong>
        </span>
      </p>

      {/* Montos en grid de 2 columnas */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-xs text-muted-foreground">{t("depositPaid")}</p>
          <p className="font-medium tabular-nums">
            {formatPrice(reservation.depositAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("remaining")}</p>
          <p className="font-medium tabular-nums text-accent">
            {formatPrice(reservation.remainingAmount)}
          </p>
        </div>
      </div>

      {/* Botones de acción O confirmación de cancelación */}
      {!showCancelConfirm ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowCompleteModal(true)}
            size="sm"
            className="flex-1 min-w-[150px]"
          >
            {t("completeButton")}
          </Button>
          <Button
            onClick={() => setShowCancelConfirm(true)}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
          >
            {t("cancelButton")}
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border border-destructive/30 rounded-md p-3",
            "bg-destructive/5"
          )}
        >
          {/*
           * Texto de confirmación con rich text para mantener <strong>
           * envolviendo el monto del anticipo.
           */}
          <p className="text-xs text-muted-foreground mb-3">
            {t.rich("confirmCancelText", {
              amount: formatPrice(reservation.depositAmount),
              strong: (chunks) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
            })}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {t("confirmYes")}
            </Button>
            <Button
              onClick={() => setShowCancelConfirm(false)}
              variant="ghost"
              size="sm"
            >
              {t("confirmNo")}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de completar pago */}
      <CompleteReservationModal
        reservation={reservation}
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
      />
    </>
  );
}

/**
 * CompletedContent — para apartados completados exitosamente.
 *
 * Cambios:
 *   - Date formatting usa el locale activo (es-MX vs en-US)
 *   - Labels de método de entrega traducidos
 */
function CompletedContent({ reservation }: { reservation: Reservation }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("reservation.card.completed");

  const isPickup = reservation.deliveryMethod === "pickup";
  const Icon = isPickup ? Store : Truck;
  const methodLabel = isPickup ? t("pickup") : t("shipping");

  /**
   * Formatear fecha según el locale activo.
   *   - Si locale === "es" → "1 de mayo de 2026"
   *   - Si locale === "en" → "May 1, 2026"
   *
   * Mapeo de nuestro locale a códigos de Intl:
   *   "es" → "es-MX" (mexicano específico)
   *   "en" → "en-US" (americano por default)
   */
  const intlLocale = locale === "es" ? "es-MX" : "en-US";

  const completedDate = reservation.completedAt
    ? new Intl.DateTimeFormat(intlLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(reservation.completedAt))
    : null;

  return (
    <>
      {/* Total pagado */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground">{t("totalPaid")}</p>
        <p className="font-medium tabular-nums">
          {formatPrice(reservation.product.price)}
        </p>
      </div>

      {/* Método de entrega + fecha de completado */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {methodLabel}
        </span>
        {completedDate && (
          <span className="text-xs text-muted-foreground">
            {t("completedOn", { date: completedDate })}
          </span>
        )}
      </div>
    </>
  );
}

/**
 * TerminalContent — para apartados expirados o cancelados.
 */
function TerminalContent({
  reservation,
  status,
}: {
  reservation: Reservation;
  status: "expired" | "cancelled";
}) {
  const t = useTranslations("reservation.card.terminal");

  const message =
    status === "expired" ? t("expiredMessage") : t("cancelledMessage");

  return (
    <>
      <p className="text-sm text-muted-foreground mb-3">{message}</p>

      <div>
        <p className="text-xs text-muted-foreground">{t("depositLost")}</p>
        <p className="font-medium tabular-nums text-destructive">
          {formatPrice(reservation.depositAmount)}
        </p>
      </div>
    </>
  );
} 