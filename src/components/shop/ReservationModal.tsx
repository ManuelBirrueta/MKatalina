/**
 * ============================================================================
 * RESERVATION MODAL — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import useRouter de "@/i18n/navigation" para mantener prefijo de locale
 *   - useLocale + useTranslations agregados
 *   - product.name se resuelve con getLocalized() para usar en el header
 *     y en la "factura" guardada en el store
 *   - Las reglas usan t.rich() para soportar <strong> dentro del texto
 *     traducido (next-intl maneja esto con API específica)
 *   - Todos los textos hardcoded ahora vienen de messages.json bajo
 *     namespace reservation.modal
 *
 * Patrón "factura inmutable":
 *   Al crear la reservación, guardamos `name` ya resuelto al locale activo
 *   en lugar del LocalizedString completo. Igual que con el orderSnapshot
 *   del checkout. Si el usuario cambia idioma después, la reservación
 *   guardada NO cambia su nombre (es un documento histórico).
 *
 *   Esto también evita que ReservationCard tenga que hacer defensive
 *   parsing — siempre verá un string.
 *
 * Sobre t.rich() (rich text):
 *   next-intl tiene una API especial t.rich(key, { tagName: (chunks) => <jsx> })
 *   para traducciones que contienen tags HTML. Ejemplo:
 *
 *     // En messages.json:
 *     "rule": "Pagas <strong>{amount}</strong> como anticipo"
 *
 *     // En el componente:
 *     t.rich("rule", {
 *       amount: "$178",
 *       strong: (chunks) => <strong>{chunks}</strong>
 *     })
 *
 *   Esto evita tener que partir la frase en piezas separadas para meter
 *   el <strong> y permite que el traductor reordene la frase libremente
 *   en otros idiomas.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { X, ShieldCheck, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservations } from "@/hooks/use-reservations";
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
  const { createReservation } = useReservations();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Hooks de i18n:
   *   - locale: idioma activo, para resolver product.name al locale
   *     antes de guardar la reservación (factura inmutable)
   *   - t: traducciones bajo namespace reservation.modal
   */
  const locale = useLocale() as Locale;
  const t = useTranslations("reservation.modal");

  /**
   * Resolver el nombre del producto al locale activo.
   * Lo usamos en el header del modal Y al guardar la reservación.
   * Resolvemos UNA vez, reutilizamos.
   */
  const productName = getLocalized(product.name, locale);

  /**
   * Calcular montos del apartado. Math.round porque pesos no usan decimales.
   */
  const depositAmount = Math.round(
    product.price * RESERVATION_DEPOSIT_PERCENTAGE
  );
  const remainingAmount = product.price - depositAmount;
  const depositPercentage = Math.round(RESERVATION_DEPOSIT_PERCENTAGE * 100);

  /**
   * Manejar tecla Esc para cerrar + bloquear scroll del body.
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

  /**
   * handleConfirm — simula el pago del anticipo y crea la reservación.
   *
   * CAMBIO IMPORTANTE: al construir el snapshot que se guarda en el store,
   * pasamos `name: productName` (string ya resuelto) en lugar de
   * `product.name` (LocalizedString). Esto convierte la reservación en
   * un documento histórico inmutable, igual que orderSnapshot del checkout.
   */
  const handleConfirm = async () => {
    setIsProcessing(true);

    // Simular latencia de PayPal
    await new Promise((resolve) => setTimeout(resolve, 1500));

    /**
     * Crear el apartado con name ya resuelto al locale activo.
     * Si el usuario apartó en /es, queda "Aretes Camelia" para siempre.
     * Si apartó en /en, queda "Camelia Earrings" para siempre.
     */
    const reservation = createReservation({
      product: {
        slug: product.slug,
        name: productName, // ← string resuelto, no LocalizedString
        price: product.price,
        originalPrice: product.originalPrice,
        category: product.category,
        material: product.material,
        color: product.color,
        image: product.images[0]?.src ?? "",
      },
    });

    if (!reservation) {
      // No debería pasar (el botón solo se muestra si hay sesión).
      toast.error(t("toast.errorTitle"), {
        description: t("toast.errorDescription"),
      });
      setIsProcessing(false);
      return;
    }

    // Toast de éxito + navegación
    toast.success(t("toast.successTitle"), {
      description: t("toast.successDescription", {
        days: RESERVATION_DURATION_DAYS,
      }),
    });

    onClose();
    /**
     * router.push de @/i18n/navigation mantiene el prefijo de locale
     * automático. Si el usuario está en /en, va a /en/mis-apartados.
     */
    router.push("/mis-apartados");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* BACKDROP — overlay oscuro detrás del modal */}
      <div
        className={cn(
          "fixed inset-0 z-50",
          "bg-foreground/40 backdrop-blur-sm",
          "flex items-center justify-center",
          "p-4",
          "animate-in fade-in duration-200"
        )}
        onClick={() => !isProcessing && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-modal-title"
      >
        {/* MODAL CONTENT */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-background border border-border rounded-md",
            "w-full max-w-md",
            "max-h-[90vh] overflow-y-auto",
            "shadow-xl",
            "animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
          )}
        >
          {/* Header del modal */}
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
               * productName ya resuelto al locale activo.
               * Antes era {product.name} → "[object Object]" cuando LocalizedString.
               */}
              <h2
                id="reservation-modal-title"
                className="font-display text-xl font-medium leading-tight"
              >
                {productName}
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

          {/* Cuerpo del modal */}
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
                    {/*
                     * t.rich() renderiza el texto con el componente strong
                     * inyectado donde el JSON tiene <strong>...</strong>.
                     * Esto permite que la traducción contenga formato
                     * sin necesidad de partirla en pedazos.
                     */}
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
            <div
              className={cn(
                "bg-muted/30 rounded-md p-4",
                "space-y-2 text-sm"
              )}
            >
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
                  {t("summary.remaining", {
                    days: RESERVATION_DURATION_DAYS,
                  })}
                </span>
                <span className="font-medium tabular-nums">
                  {formatPrice(remainingAmount)}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
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
                  amount: formatPrice(depositAmount),
                })}
              >
                {isProcessing ? (
                  t("processing")
                ) : (
                  <>
                    {t("payButton", {
                      amount: formatPrice(depositAmount),
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
    </>
  );
}