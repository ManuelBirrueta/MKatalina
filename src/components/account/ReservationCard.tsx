/**
 * ============================================================================
 * RESERVATION CARD — KATALINA (Fase 12 Turno 3B.4: timeRemaining bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - ActiveContent ahora pasa `t` a `formatTimeRemaining(reservation, t)`.
 *     El `t` viene del namespace "reservation.card.active.timeRemaining".
 *
 * Lo que NO cambia:
 *   - Toda la estructura visual del card
 *   - StatusBadge, ActiveContent, CompletedContent, TerminalContent
 *   - El formateo de fechas con Intl.DateTimeFormat según locale
 *   - Las traducciones de status, montos, botones, etc.
 *   - El comportamiento del tick clock cada 60 segundos
 *
 * ─── DETALLE DEL CAMBIO ────────────────────────────────────────────────
 *
 * ActiveContent ya tiene `useTranslations("reservation.card.active")`
 * pero esa función solo resuelve claves bajo "active" (expiresIn, depositPaid,
 * remaining, etc.). Para resolver claves bajo "active.timeRemaining.*"
 * (expired, day, days, hour, hours, minute, minutes) necesitamos un t
 * separado.
 *
 * Por qué un t separado en vez de extender el t actual:
 *   - useTranslations(namespace) devuelve un t que solo resuelve dentro
 *     de ese namespace exacto. No puedes hacer t("timeRemaining.day").
 *   - Tenemos 2 opciones:
 *     A) Subir un nivel: useTranslations("reservation.card.active") y
 *        usar t("timeRemaining.day"). PROBLEMA: cambia todas las llamadas
 *        existentes (t("expiresIn") deja de funcionar).
 *     B) Llamar useTranslations 2 veces con namespaces diferentes:
 *        tActive("expiresIn") y tTime("day"). ← Elegida
 *
 * El costo de llamar useTranslations 2 veces es cero (es solo lookup en
 * un contexto React). Más limpio que refactorizar todas las claves.
 * ─────────────────────────────────────────────────────────────────────
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

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <StatusBadge status={status} />
              <Link
                href={`/productos/${reservation.product.slug}`}
                className="hover:text-accent transition-colors"
              >
                <h3 className="font-display text-lg font-medium leading-tight mt-1">
                  {reservation.product.name}
                </h3>
              </Link>
            </div>
          </div>

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

function StatusBadge({ status }: { status: ReservationStatus }) {
  const t = useTranslations("reservation.card.status");

  const config: Record<
    ReservationStatus,
    { Icon: typeof Clock; className: string }
  > = {
    active: { Icon: Clock, className: "bg-accent/10 text-accent" },
    completed: { Icon: CheckCircle, className: "bg-success/10 text-success" },
    expired: { Icon: XCircle, className: "bg-destructive/10 text-destructive" },
    cancelled: { Icon: XCircle, className: "bg-muted text-muted-foreground" },
  };

  const { Icon, className } = config[status];
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
 *
 * Cambio principal: pasa tTime a formatTimeRemaining para que el contador
 * "X días Y horas" se traduzca al locale activo.
 */
function ActiveContent({ reservation }: { reservation: Reservation }) {
  const t = useTranslations("reservation.card.active");
  /**
   * Segundo t para el sub-namespace "timeRemaining".
   * Sirve para resolver: expired, day, days, hour, hours, minute, minutes.
   * Lo pasamos a formatTimeRemaining como parámetro.
   */
  const tTime = useTranslations("reservation.card.active.timeRemaining");

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
      {/*
       * Contador regresivo bilingüe.
       *
       * formatTimeRemaining(reservation, tTime) devuelve:
       *   - "4 días 12 horas" en /es
       *   - "4 days 12 hours" en /en
       *   - "Expirado" / "Expired"
       */}
      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {t("expiresIn")}{" "}
          <strong className="text-foreground">
            {formatTimeRemaining(reservation, tTime)}
          </strong>
        </span>
      </p>

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

      <CompleteReservationModal
        reservation={reservation}
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
      />
    </>
  );
}

function CompletedContent({ reservation }: { reservation: Reservation }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("reservation.card.completed");

  const isPickup = reservation.deliveryMethod === "pickup";
  const Icon = isPickup ? Store : Truck;
  const methodLabel = isPickup ? t("pickup") : t("shipping");

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
      <div className="mb-3">
        <p className="text-xs text-muted-foreground">{t("totalPaid")}</p>
        <p className="font-medium tabular-nums">
          {formatPrice(reservation.product.price)}
        </p>
      </div>

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