/**
 * ============================================================================
 * RESERVATION MODAL — MKATALINA (Fase 13 · Etapa 4: anticipo real con PayPal)
 * ============================================================================
 *
 * El anticipo del 20% se cobra con el botón real de PayPal. El apartado se crea
 * EN EL SERVIDOR cuando el pago se confirma (capturePaypalReservationOrder).
 *
 * FIX (caché): como el apartado se crea en el servidor, la caché en memoria de
 * "Mis apartados" no se entera sola. Por eso, al tener éxito, INVALIDAMOS esa
 * caché (reset del reservation-store) antes de redirigir; así "Mis apartados"
 * vuelve a consultar la base y muestra el apartado nuevo.
 *
 * Snapshot inmutable: el nombre del producto se resuelve al idioma activo antes
 * de enviarlo (factura histórica).
 * ============================================================================
 */

"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { X, ShieldCheck, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaypalReservationButton } from "@/components/shop/PaypalReservationButton";
import { useReservationStore } from "@/stores/reservation-store";
import { formatPrice } from "@/lib/format";
import {
  RESERVATION_DURATION_DAYS,
  RESERVATION_DEPOSIT_PERCENTAGE,
} from "@/types/reservation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";

interface ReservationModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ReservationModal({
  product,
  isOpen,
  onClose,
}: ReservationModalProps) {
  const router = useRouter();

  const locale = useLocale() as Locale;
  const t = useTranslations("reservation.modal");

  // Para invalidar la caché de apartados tras crear uno nuevo.
  const resetReservations = useReservationStore((s) => s.reset);

  const productName = getLocalized(product.name, locale);

  const depositAmount = Math.round(
    product.price * RESERVATION_DEPOSIT_PERCENTAGE,
  );
  const remainingAmount = product.price - depositAmount;
  const depositPercentage = Math.round(RESERVATION_DEPOSIT_PERCENTAGE * 100);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const productSnapshot = {
    slug: product.slug,
    name: productName,
    price: product.price,
    originalPrice: product.originalPrice,
    category: product.category,
    material: product.material,
    color: product.color,
    image: product.images[0]?.src ?? "",
  };

  /**
   * handleSuccess — tras cobrar el anticipo (el apartado ya se creó en el
   * servidor): invalidamos la caché para que "Mis apartados" lo traiga de la
   * base, avisamos, cerramos y navegamos.
   */
  const handleSuccess = () => {
    resetReservations(); // invalida la caché → se vuelve a consultar la base

    toast.success(t("toast.successTitle"), {
      description: t("toast.successDescription", {
        days: RESERVATION_DURATION_DAYS,
      }),
    });
    onClose();
    router.push("/mis-apartados");
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "bg-foreground/40 backdrop-blur-sm",
        "flex items-center justify-center",
        "p-4",
        "animate-in fade-in duration-200",
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-background border border-border rounded-md",
          "w-full max-w-md",
          "max-h-[90vh] overflow-y-auto",
          "shadow-xl",
          "animate-in zoom-in-95 slide-in-from-bottom-2 duration-300",
        )}
      >
        {/* Header */}
        <header
          className={cn(
            "flex items-start justify-between gap-4 p-6",
            "border-b border-border",
          )}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-1">
              {t("eyebrow")}
            </p>
            <h2
              id="reservation-modal-title"
              className="font-display text-xl font-medium leading-tight"
            >
              {productName}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label={t("closeButton")}
            className={cn(
              "p-1 -m-1 rounded",
              "text-muted-foreground hover:text-foreground",
              "transition-colors cursor-pointer",
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Cuerpo */}
        <div className="p-6 space-y-6">
          {/* Reglas del apartado */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.15em] font-medium">
              {t("rules.title")}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <ShieldCheck className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <span>
                  {t.rich("rules.depositLine", {
                    amount: formatPrice(depositAmount),
                    percentage: depositPercentage,
                    strong: (chunks) => (
                      <strong className="text-foreground">{chunks}</strong>
                    ),
                  })}
                </span>
              </li>
              <li className="flex gap-3">
                <Calendar className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <span>
                  {t.rich("rules.durationLine", {
                    days: RESERVATION_DURATION_DAYS,
                    strong: (chunks) => (
                      <strong className="text-foreground">{chunks}</strong>
                    ),
                  })}
                </span>
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <span>
                  {t.rich("rules.expirationLine", {
                    strong: (chunks) => (
                      <strong className="text-foreground">{chunks}</strong>
                    ),
                  })}
                </span>
              </li>
            </ul>
          </div>

          {/* Resumen de montos */}
          <div className={cn("bg-muted/30 rounded-md p-4", "space-y-2 text-sm")}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("summary.totalPrice")}
              </span>
              <span className="font-medium tabular-nums">
                {formatPrice(product.price)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("summary.depositToday")}
              </span>
              <span className="font-medium tabular-nums text-accent">
                {formatPrice(depositAmount)}
              </span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("summary.remaining", { days: RESERVATION_DURATION_DAYS })}
              </span>
              <span className="font-medium tabular-nums">
                {formatPrice(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <PaypalReservationButton
              productSnapshot={productSnapshot}
              locale={locale}
              onSuccess={handleSuccess}
            />

            <Button onClick={onClose} variant="outline" className="w-full">
              {t("cancelButton")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}