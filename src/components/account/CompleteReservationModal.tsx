/**
 * ============================================================================
 * COMPLETE RESERVATION MODAL — MKATALINA (Fase 13 · Etapas 5 y 7)
 * ============================================================================
 *
 * Modal de "Mis apartados" para liquidar un apartado: el cliente paga el 80%
 * restante con tarjeta o PayPal y elige cómo recibir su pieza. Lo abre
 * ReservationCard (props: reservation, isOpen, onClose).
 *
 *   PASO 1 · "details": elegir entrega.
 *     - Recoger en tienda → sin costo.
 *     - Envío a domicilio → dirección + método de envío. El envío se suma.
 *   PASO 2 · "pay": resumen de la entrega + botones de pago
 *     (PaypalCompletionButton: tarjeta arriba, PayPal abajo). El servidor
 *     recalcula el monto, cobra y marca el apartado COMPLETADO; la tarjeta
 *     del apartado se actualiza sola (markReservationCompleted).
 *   "Editar" en el paso 2 regresa al paso 1 sin perder lo escrito.
 *
 * CAMBIOS DE LA ETAPA 7 — ENVÍO A CUALQUIER PAÍS (igual que el checkout):
 *   - La dirección usa AddressFields (país, estados según el país, código
 *     postal libre) y PhoneField (lada internacional), los mismos del
 *     checkout, con las reglas de src/lib/address.ts.
 *   - Los métodos y precios de envío dependen del país
 *     (src/lib/shipping-rates.ts): México → estándar/express; extranjero →
 *     DHL Express por zona, con el aviso de impuestos de importación.
 *   - La lada sigue al país de entrega mientras el cliente no la cambie.
 *
 * TEXTOS: los que ya existían salen de messages (reservation.completeModal y
 * checkoutForm); los nuevos viven en COPY (es/en) dentro de este archivo.
 * ============================================================================
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, X, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useReservations } from "@/hooks/use-reservations";
import { useSubdivisions } from "@/hooks/use-subdivisions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddressFields } from "@/components/shop/AddressFields";
import { PhoneField } from "@/components/shop/PhoneField";
import { PaypalCompletionButton } from "@/components/shop/PaypalCompletionButton";
import {
  ADDRESS_FIELDS,
  EMPTY_SHIPPING_ADDRESS,
  addressErrorText,
  validateAddressField,
  type AddressField,
} from "@/lib/address";
import { countryName, dialCode } from "@/lib/countries";
import {
  CUSTOMS_NOTICE,
  getShippingOptions,
  isInternational,
  type ShippingMethodId,
} from "@/lib/shipping-rates";
import {
  completionShippingCost,
  type CompletionDelivery,
  type DeliveryAddress,
} from "@/lib/reservation-delivery";
import type { Reservation } from "@/types/reservation";

/** Textos nuevos (los demás vienen de messages/*.json). */
const COPY = {
  es: {
    pickupDescription: "Sin costo · Te avisamos cuando esté lista",
    shippingDescription: "A México o al extranjero · el envío se suma al total",
    remaining: "Resto del producto (80%)",
    shipping: "Envío",
    totalNow: "Total a pagar ahora",
    shippingMethodTitle: "Método de envío",
    addressTitle: "Dirección de envío",
    continue: "Continuar al pago",
    fixErrors: "Revisa los datos marcados",
    deliveryTitle: "Entrega",
    pickupSummary: "Recoger en tienda",
    edit: "Editar",
    payHint: "Paga con tarjeta de débito/crédito o con tu cuenta PayPal.",
    processing: "Procesando tu pago… no cierres esta ventana.",
    phonePlaceholder: "Número sin lada",
  },
  en: {
    pickupDescription: "Free · We'll let you know when it's ready",
    shippingDescription: "To Mexico or abroad · shipping is added to the total",
    remaining: "Remaining balance (80%)",
    shipping: "Shipping",
    totalNow: "Total to pay now",
    shippingMethodTitle: "Shipping method",
    addressTitle: "Shipping address",
    continue: "Continue to payment",
    fixErrors: "Please review the highlighted fields",
    deliveryTitle: "Delivery",
    pickupSummary: "Store pickup",
    edit: "Edit",
    payHint: "Pay with a debit/credit card or with your PayPal account.",
    processing: "Processing your payment… please don't close this window.",
    phonePlaceholder: "Number without country code",
  },
} as const;

type AddressErrors = Partial<Record<AddressField, string>>;

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
  const tForm = useTranslations("checkoutForm");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "es";
  const copy = COPY[lang];

  const { markReservationCompleted } = useReservations();

  const [step, setStep] = useState<"details" | "pay">("details");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping" | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>("estandar");
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_SHIPPING_ADDRESS);
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);
  const [errors, setErrors] = useState<AddressErrors>({});
  // true mientras el servidor cobra (no se deja cerrar el modal).
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados / provincias del país elegido (obligatorio si hay lista).
  const { subdivisions, isLoading: subdivisionsLoading } = useSubdivisions(address.country);
  const validationOptions = { stateRequired: subdivisions.length > 0 };

  // Métodos de envío para el país de la dirección.
  const shippingOptions = getShippingOptions(address.country, locale);
  const selectedShipping =
    shippingOptions.find((o) => o.id === shippingMethodId) ?? shippingOptions[0];

  /** Reinicia todo cuando el modal se cierra. */
  useEffect(() => {
    if (!isOpen) {
      setStep("details");
      setDeliveryMethod(null);
      setShippingMethodId("estandar");
      setAddress(EMPTY_SHIPPING_ADDRESS);
      setPhoneCountryTouched(false);
      setErrors({});
      setIsProcessing(false);
    }
  }, [isOpen]);

  /** Cierre con Esc + bloqueo del scroll de la página detrás del modal. */
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

  /** La entrega elegida, en el formato que espera el servidor. */
  const delivery = useMemo<CompletionDelivery | null>(() => {
    if (deliveryMethod === "pickup") return { method: "pickup" };
    if (deliveryMethod === "shipping") {
      return { method: "shipping", shippingMethodId: selectedShipping.id, address };
    }
    return null;
  }, [deliveryMethod, selectedShipping.id, address]);

  // Montos que se MUESTRAN (el servidor los vuelve a calcular al cobrar).
  const shippingCost = delivery ? completionShippingCost(delivery) : 0;
  const totalNow = reservation.remainingAmount + shippingCost;

  /** Cambia un campo de la dirección y borra su error. */
  const setField = (field: AddressField, value: string) => {
    if (field === "country") {
      // Nuevo país: estado vacío, primer método disponible y (si no se tocó)
      // la lada del mismo país.
      setAddress((prev) => ({
        ...prev,
        country: value,
        state: "",
        phoneCountry: phoneCountryTouched ? prev.phoneCountry : value,
      }));
      setShippingMethodId(getShippingOptions(value, locale)[0].id);
      setErrors(({ country: _c, state: _s, neighborhood: _n, postalCode: _p, ...rest }) => rest);
      return;
    }
    if (field === "phoneCountry") setPhoneCountryTouched(true);

    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(({ [field]: _removed, ...rest }) => rest);
    }
  };

  /** Valida un campo al salir de él (mismas reglas que el checkout). */
  const validateOne = (field: AddressField) => {
    const code = validateAddressField(field, address, validationOptions);
    setErrors((prev) => {
      const next = { ...prev };
      if (code) next[field] = addressErrorText(code, locale);
      else delete next[field];
      return next;
    });
  };

  /** Paso 1 → paso 2: revisa todo antes de mostrar los botones de pago. */
  const handleContinue = () => {
    if (!deliveryMethod) return;

    if (deliveryMethod === "shipping") {
      const found: AddressErrors = {};
      for (const field of ADDRESS_FIELDS) {
        const code = validateAddressField(field, address, validationOptions);
        if (code) found[field] = addressErrorText(code, locale);
      }
      setErrors(found);
      if (Object.keys(found).length > 0) {
        toast.error(copy.fixErrors);
        return;
      }
    }
    setStep("pay");
  };

  /** El servidor confirmó el cobro. */
  const handleSuccess = (completedAt: string) => {
    if (!deliveryMethod) return;
    markReservationCompleted(reservation.id, deliveryMethod, completedAt);

    toast.success(t("toast.successTitle"), {
      description:
        deliveryMethod === "pickup"
          ? t("toast.successDescriptionPickup")
          : t("toast.successDescriptionShipping"),
    });

    onClose();
  };

  if (!isOpen) return null;

  const nameInputClass = (field: AddressField) =>
    cn(
      "w-full h-10 px-3 rounded-md border bg-background text-sm",
      "focus:outline-none focus:border-ring",
      errors[field] ? "border-destructive" : "border-input",
    );
  const fieldError = (field: AddressField) =>
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "bg-foreground/40 backdrop-blur-sm",
        "flex items-center justify-center p-4",
        "animate-in fade-in duration-200",
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
          "animate-in zoom-in-95 slide-in-from-bottom-2 duration-300",
        )}
      >
        {/* Encabezado */}
        <header className="flex items-start justify-between gap-4 p-6 border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-1">{t("eyebrow")}</p>
            <h2 id="complete-modal-title" className="font-display text-xl font-medium leading-tight">
              {reservation.product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            aria-label={t("closeButton")}
            className={cn(
              "p-1 -m-1 rounded text-muted-foreground hover:text-foreground",
              "transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Resumen de pagos */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.15em] font-medium">{t("summary.title")}</h3>
            <div className="bg-muted/30 rounded-md p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("summary.depositPaid")}</span>
                <span className="tabular-nums">{formatPrice(reservation.depositAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{copy.remaining}</span>
                <span className="tabular-nums">{formatPrice(reservation.remainingAmount)}</span>
              </div>
              {deliveryMethod === "shipping" && (
                <div className="flex items-center justify-between">
                  <span>{copy.shipping}</span>
                  <span className="tabular-nums">{formatPrice(shippingCost)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
                <span className="font-medium">{copy.totalNow}</span>
                <span className="font-medium tabular-nums text-accent">{formatPrice(totalNow)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("summary.productTotal")}</span>
                <span className="tabular-nums">{formatPrice(reservation.product.price)}</span>
              </div>
            </div>
          </div>

          {step === "details" ? (
            <>
              {/* ── PASO 1: ¿cómo lo quieres recibir? ── */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-[0.15em] font-medium">{t("deliveryQuestion")}</h3>
                <div className="space-y-2" role="radiogroup" aria-label={t("deliveryAriaLabel")}>
                  <OptionCard
                    name="delivery-method"
                    value="pickup"
                    Icon={Store}
                    label={t("pickup.label")}
                    description={copy.pickupDescription}
                    selected={deliveryMethod === "pickup"}
                    onSelect={() => setDeliveryMethod("pickup")}
                  />
                  <OptionCard
                    name="delivery-method"
                    value="shipping"
                    Icon={Truck}
                    label={t("shipping.label")}
                    description={copy.shippingDescription}
                    selected={deliveryMethod === "shipping"}
                    onSelect={() => setDeliveryMethod("shipping")}
                  />
                </div>
              </div>

              {deliveryMethod === "shipping" && (
                <>
                  {/* Dirección (país primero: decide el envío) */}
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.15em] font-medium">{copy.addressTitle}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="complete-firstName" className="block text-xs font-medium mb-1.5">
                          {tForm("fields.firstNameLabel")}
                        </label>
                        <input
                          id="complete-firstName"
                          type="text"
                          autoComplete="given-name"
                          value={address.firstName}
                          onChange={(e) => setField("firstName", e.target.value)}
                          onBlur={() => validateOne("firstName")}
                          className={nameInputClass("firstName")}
                        />
                        {fieldError("firstName")}
                      </div>
                      <div>
                        <label htmlFor="complete-lastName" className="block text-xs font-medium mb-1.5">
                          {tForm("fields.lastNameLabel")}
                        </label>
                        <input
                          id="complete-lastName"
                          type="text"
                          autoComplete="family-name"
                          value={address.lastName}
                          onChange={(e) => setField("lastName", e.target.value)}
                          onBlur={() => validateOne("lastName")}
                          className={nameInputClass("lastName")}
                        />
                        {fieldError("lastName")}
                      </div>
                    </div>

                    <PhoneField
                      id="complete-phone"
                      label={tForm("fields.phoneLabel")}
                      phoneCountry={address.phoneCountry}
                      phone={address.phone}
                      error={errors.phone}
                      placeholder={copy.phonePlaceholder}
                      onPhoneCountryChange={(value) => setField("phoneCountry", value)}
                      onPhoneChange={(value) => setField("phone", value)}
                      onBlur={() => validateOne("phone")}
                    />

                    <AddressFields
                      idPrefix="complete-"
                      compact
                      values={address}
                      errors={errors}
                      subdivisions={subdivisions}
                      subdivisionsLoading={subdivisionsLoading}
                      onChange={setField}
                      onBlur={validateOne}
                    />

                    <div>
                      <label htmlFor="complete-notes" className="block text-xs font-medium mb-1.5">
                        {tForm("fields.notesLabel")}
                        <span className="text-muted-foreground font-normal"> {tForm("optionalMarker")}</span>
                      </label>
                      <textarea
                        id="complete-notes"
                        rows={2}
                        maxLength={300}
                        value={address.notes}
                        onChange={(e) => setField("notes", e.target.value)}
                        placeholder={tForm("fields.notesPlaceholder")}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:border-ring"
                      />
                    </div>
                  </div>

                  {/* Método de envío (según el país) */}
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.15em] font-medium">{copy.shippingMethodTitle}</h3>
                    <div className="space-y-2" role="radiogroup" aria-label={copy.shippingMethodTitle}>
                      {shippingOptions.map((option) => (
                        <OptionCard
                          key={option.id}
                          name="shipping-method"
                          value={option.id}
                          label={option.label}
                          description={option.description}
                          price={formatPrice(option.price)}
                          selected={selectedShipping.id === option.id}
                          onSelect={() => setShippingMethodId(option.id)}
                        />
                      ))}
                    </div>
                    {isInternational(address.country) && (
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                        <span>{CUSTOMS_NOTICE[lang]}</span>
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Botones del paso 1 */}
              <div className="space-y-3">
                <Button onClick={handleContinue} disabled={!deliveryMethod} className="w-full h-12">
                  {copy.continue}
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  {t("cancelButton")}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* ── PASO 2: resumen de entrega + pago ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-[0.15em] font-medium">{copy.deliveryTitle}</h3>
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    disabled={isProcessing}
                    className="text-xs text-accent hover:underline disabled:opacity-50"
                  >
                    {copy.edit}
                  </button>
                </div>
                <div className="rounded-md border border-border p-4 text-sm space-y-1">
                  {deliveryMethod === "pickup" ? (
                    <p>{copy.pickupSummary}</p>
                  ) : (
                    <>
                      <p className="font-medium">
                        {selectedShipping.label} · {formatPrice(selectedShipping.price)}
                      </p>
                      <p>
                        {address.firstName} {address.lastName} · +{dialCode(address.phoneCountry)}{" "}
                        {address.phone}
                      </p>
                      <p className="text-muted-foreground">
                        {address.address}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                        {address.neighborhood && `, ${address.neighborhood}`}
                      </p>
                      <p className="text-muted-foreground">
                        {[address.postalCode, address.city, address.state].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-muted-foreground">{countryName(address.country, locale)}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{copy.payHint}</p>
                {delivery && (
                  <PaypalCompletionButton
                    reservationId={reservation.id}
                    delivery={delivery}
                    locale={locale}
                    onSuccess={handleSuccess}
                    onProcessingChange={setIsProcessing}
                  />
                )}
                {isProcessing && (
                  <p className="text-xs text-center text-muted-foreground animate-pulse">{copy.processing}</p>
                )}
                <Button onClick={onClose} disabled={isProcessing} variant="outline" className="w-full">
                  {t("cancelButton")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de opción con radio (entrega o método de envío).
 * Recibe los textos ya traducidos: no sabe nada de idiomas.
 */
function OptionCard({
  name,
  value,
  Icon,
  label,
  description,
  price,
  selected,
  onSelect,
}: {
  name: string;
  value: string;
  Icon?: typeof Store;
  label: string;
  description: string;
  price?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-3",
        "border rounded-md transition-colors cursor-pointer",
        selected ? "border-accent bg-accent-subtle" : "border-input hover:border-border",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="h-4 w-4 mt-0.5 accent-secondary cursor-pointer flex-shrink-0"
      />
      {Icon && (
        <Icon
          className={cn("h-5 w-5 flex-shrink-0 mt-0.5", selected ? "text-accent" : "text-muted-foreground")}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {price && <span className="text-sm tabular-nums">{price}</span>}
    </label>
  );
}