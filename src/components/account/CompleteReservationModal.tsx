/**
 * ============================================================================
 * COMPLETE RESERVATION MODAL — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Agregado useTranslations con namespace reservation.completeModal
 *   - Todos los textos hardcoded traducidos (header, resumen, opciones de
 *     entrega, botones, toasts)
 *   - DeliveryOption recibe label y description ya traducidos como props
 *
 * Lo que NO cambia:
 *   - reservation.product.name ya es string → se renderiza directo
 *   - La lógica del modal: bloqueo de scroll, cierre con Esc, simulación
 *     de pago, reset de estado al cerrar
 *   - Layout, colores, animaciones
 *
 * El componente DeliveryOption se mantiene como sub-componente local pero
 * ya no tiene strings hardcoded — recibe label y description como props
 * desde el componente padre que las obtiene del namespace traducido.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservations } from "@/hooks/use-reservations";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Reservation, DeliveryMethod } from "@/types/reservation";

interface CompleteReservationModalProps {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
}

export function CompleteReservationModal({
  reservation,
  isOpen,
  onClose,
}: CompleteReservationModalProps) {
  const t = useTranslations("reservation.completeModal");

  const { completeReservation } = useReservations();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Reset del estado cuando el modal se cierra.
   */
  useEffect(() => {
    if (!isOpen) {
      setDeliveryMethod(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  /**
   * Cierre con Esc + bloqueo de scroll.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, isProcessing, onClose]);

  const handlePay = async () => {
    if (!deliveryMethod) return;

    setIsProcessing(true);

    // Simular latencia de PayPal
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Marcar apartado como completado con el método elegido
    completeReservation(reservation.id, deliveryMethod);

    toast.success(t("toast.successTitle"), {
      description:
        deliveryMethod === "pickup"
          ? t("toast.successDescriptionPickup")
          : t("toast.successDescriptionShipping"),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "bg-foreground/40 backdrop-blur-sm",
        "flex items-center justify-center p-4",
        "animate-in fade-in duration-200"
      )}
      onClick={() => !isProcessing && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-background border border-border rounded-md",
          "w-full max-w-md max-h-[90vh] overflow-y-auto",
          "shadow-xl",
          "animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
        )}
      >
        {/* Header */}
        <header
          className={cn(
            "flex items-start justify-between gap-4 p-6",
            "border-b border-border"
          )}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-1">
              {t("eyebrow")}
            </p>
            {/*
             * reservation.product.name ya es string (factura inmutable
             * aplicada en ReservationModal). Por eso render directo.
             */}
            <h2
              id="complete-modal-title"
              className="font-display text-xl font-medium leading-tight"
            >
              {reservation.product.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            aria-label={t("closeButton")}
            className={cn(
              "p-1 -m-1 rounded",
              "text-muted-foreground hover:text-foreground",
              "transition-colors cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Resumen de pagos */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.15em] font-medium">
              {t("summary.title")}
            </h3>
            <div className={cn("bg-muted/30 rounded-md p-4 space-y-2 text-sm")}>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("summary.depositPaid")}</span>
                <span className="tabular-nums">
                  {formatPrice(reservation.depositAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("summary.payNow")}</span>
                <span className="font-medium tabular-nums text-accent">
                  {formatPrice(reservation.remainingAmount)}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
                <span className="font-medium">{t("summary.productTotal")}</span>
                <span className="font-medium tabular-nums">
                  {formatPrice(reservation.product.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de método de entrega */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.15em] font-medium">
              {t("deliveryQuestion")}
            </h3>

            <div
              className="space-y-2"
              role="radiogroup"
              aria-label={t("deliveryAriaLabel")}
            >
              <DeliveryOption
                method="pickup"
                Icon={Store}
                label={t("pickup.label")}
                description={t("pickup.description")}
                selected={deliveryMethod === "pickup"}
                onSelect={() => setDeliveryMethod("pickup")}
                disabled={isProcessing}
              />

              <DeliveryOption
                method="shipping"
                Icon={Truck}
                label={t("shipping.label")}
                description={t("shipping.description")}
                selected={deliveryMethod === "shipping"}
                onSelect={() => setDeliveryMethod("shipping")}
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={handlePay}
              disabled={isProcessing || !deliveryMethod}
              className={cn(
                "w-full h-12 rounded-md",
                "bg-[#FFC439] hover:bg-[#FFB700] active:bg-[#F4A700]",
                "text-[#003087] font-semibold text-sm",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "cursor-pointer",
                "flex items-center justify-center gap-2"
              )}
              aria-label={t("payButtonAriaLabel", {
                amount: formatPrice(reservation.remainingAmount),
              })}
            >
              {isProcessing ? (
                t("processing")
              ) : (
                <>
                  {t("payButton", {
                    amount: formatPrice(reservation.remainingAmount),
                  })}{" "}
                  <span className="font-bold italic">PayPal</span>
                </>
              )}
            </button>

            <Button
              onClick={onClose}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              {t("cancelButton")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DeliveryOption — sub-componente.
 *
 * Ahora recibe label y description como props (ya traducidos).
 * El componente NO sabe nada de i18n — solo de visual + interacción.
 */
function DeliveryOption({
  method,
  Icon,
  label,
  description,
  selected,
  onSelect,
  disabled,
}: {
  method: string;
  Icon: typeof Store;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-3",
        "border rounded-md transition-colors",
        "cursor-pointer",
        selected
          ? "border-accent bg-accent-subtle"
          : "border-input hover:border-border",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="radio"
        name="delivery-method"
        value={method}
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        className="h-4 w-4 mt-0.5 accent-secondary cursor-pointer flex-shrink-0"
      />

      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          selected ? "text-accent" : "text-muted-foreground"
        )}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </label>
  );
}