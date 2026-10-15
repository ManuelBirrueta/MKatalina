/**
 * ============================================================================
 * CHECKOUT FORM — MKATALINA (Fase 13 · Etapa 7: compras desde cualquier país)
 * ============================================================================
 *
 * Formulario del checkout, en 4 secciones:
 *   1. Contacto ........ correo
 *   2. Datos personales  nombre, apellido y teléfono con lada (PhoneField)
 *   3. Dirección ....... país + dirección internacional (AddressFields) + notas
 *   4. Método de envío . según el país: México → estándar / express;
 *                        extranjero → DHL Express con precio por zona, más el
 *                        aviso de impuestos de importación.
 *
 * CAMBIOS DE LA ETAPA 7 (antes solo aceptaba direcciones de México):
 *   - País de entrega con TODOS los países; la lada del teléfono lo sigue
 *     mientras el cliente no la cambie a mano (eso lo maneja la página).
 *   - Teléfono sin el límite fijo de 10 dígitos; código postal sin límite de
 *     dígitos (acepta letras); estados/provincias según el país.
 *   - Las reglas viven en src/lib/address.ts (las mismas que revisa el
 *     servidor antes de cobrar). validateCheckoutField las aplica y devuelve
 *     el mensaje ya traducido.
 *   - Los métodos de envío y precios vienen de src/lib/shipping-rates.ts.
 *
 * Los valores y errores viven en la página (checkout/page.tsx); este
 * componente solo los dibuja y avisa de los cambios.
 * ============================================================================
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { AddressFields } from "@/components/shop/AddressFields";
import { PhoneField } from "@/components/shop/PhoneField";
import {
  addressErrorText,
  validateAddressField,
  type AddressField,
  type AddressValidationOptions,
} from "@/lib/address";
import {
  CUSTOMS_NOTICE,
  isInternational,
  type ShippingOption,
} from "@/lib/shipping-rates";
import type {
  CheckoutFormData,
  FormErrors,
  ShippingMethodId,
} from "@/types/checkout";

/** Textos nuevos de esta etapa. */
const COPY = {
  es: {
    emailRequired: "El correo es obligatorio",
    emailInvalid: "Escribe un correo válido",
    phonePlaceholder: "Número sin lada",
  },
  en: {
    emailRequired: "Email is required",
    emailInvalid: "Enter a valid email",
    phonePlaceholder: "Number without country code",
  },
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Revisa UN campo del checkout y devuelve el mensaje de error traducido, o
 * undefined si está bien. Las reglas de dirección son las de
 * src/lib/address.ts (las mismas del servidor).
 */
export function validateCheckoutField(
  field: keyof CheckoutFormData,
  formData: CheckoutFormData,
  locale: string,
  options: AddressValidationOptions = {},
): string | undefined {
  const lang = locale === "en" ? "en" : "es";

  if (field === "email") {
    const value = formData.email.trim();
    if (!value) return COPY[lang].emailRequired;
    return EMAIL_REGEX.test(value) ? undefined : COPY[lang].emailInvalid;
  }

  const code = validateAddressField(field as AddressField, formData, options);
  return code ? addressErrorText(code, locale) : undefined;
}

interface CheckoutFormProps {
  formData: CheckoutFormData;
  errors: FormErrors;
  shippingMethod: ShippingMethodId;
  /** Métodos disponibles para el país elegido (con precio). */
  shippingOptions: ShippingOption[];
  /** Estados / provincias del país elegido (vacía = texto libre). */
  subdivisions: string[];
  subdivisionsLoading: boolean;
  onChange: (field: keyof CheckoutFormData, value: string) => void;
  onBlur: (field: keyof CheckoutFormData) => void;
  onShippingMethodChange: (method: ShippingMethodId) => void;
}

export function CheckoutForm({
  formData,
  errors,
  shippingMethod,
  shippingOptions,
  subdivisions,
  subdivisionsLoading,
  onChange,
  onBlur,
  onShippingMethodChange,
}: CheckoutFormProps) {
  const t = useTranslations("checkoutForm");
  const locale = useLocale();
  const copy = locale === "en" ? COPY.en : COPY.es;
  const international = isInternational(formData.country);

  const inputClass = (field: keyof CheckoutFormData) =>
    cn(
      "w-full h-10 px-3",
      "bg-background border border-input rounded-md",
      "text-sm",
      "focus:outline-none focus:border-ring transition-colors",
      errors[field] && "border-destructive",
    );

  const fieldError = (field: keyof CheckoutFormData) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1" role="alert">
        {errors[field]}
      </p>
    ) : null;

  const sectionTitle = "text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border";

  return (
    <div className="space-y-10">
      {/* ═══════ SECCIÓN 1: CONTACTO ═══════ */}
      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className={sectionTitle}>
          {t("contactHeading")}
        </h2>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            {t("fields.emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
            placeholder={t("fields.emailPlaceholder")}
            className={inputClass("email")}
          />
          {fieldError("email")}
          <p className="text-xs text-muted-foreground mt-1">{t("fields.emailHint")}</p>
        </div>
      </section>

      {/* ═══════ SECCIÓN 2: DATOS PERSONALES ═══════ */}
      <section aria-labelledby="personal-heading">
        <h2 id="personal-heading" className={sectionTitle}>
          {t("personalDataHeading")}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1.5">
                {t("fields.firstNameLabel")}
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
                onBlur={() => onBlur("firstName")}
                className={inputClass("firstName")}
              />
              {fieldError("firstName")}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1.5">
                {t("fields.lastNameLabel")}
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
                onBlur={() => onBlur("lastName")}
                className={inputClass("lastName")}
              />
              {fieldError("lastName")}
            </div>
          </div>

          {/* Teléfono con lada internacional */}
          <PhoneField
            id="phone"
            label={t("fields.phoneLabel")}
            phoneCountry={formData.phoneCountry}
            phone={formData.phone}
            error={errors.phone}
            hint={t("fields.phoneHint")}
            placeholder={copy.phonePlaceholder}
            onPhoneCountryChange={(value) => onChange("phoneCountry", value)}
            onPhoneChange={(value) => onChange("phone", value)}
            onBlur={() => onBlur("phone")}
          />
        </div>
      </section>

      {/* ═══════ SECCIÓN 3: DIRECCIÓN DE ENVÍO ═══════ */}
      <section aria-labelledby="address-heading">
        <h2 id="address-heading" className={sectionTitle}>
          {t("addressHeading")}
        </h2>
        <div className="space-y-4">
          <AddressFields
            values={formData}
            errors={errors}
            subdivisions={subdivisions}
            subdivisionsLoading={subdivisionsLoading}
            onChange={onChange}
            onBlur={onBlur}
          />

          {/* Notas (opcional) */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1.5">
              {t("fields.notesLabel")}{" "}
              <span className="text-muted-foreground font-normal">{t("optionalMarker")}</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={300}
              value={formData.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder={t("fields.notesPlaceholder")}
              className={cn(
                "w-full px-3 py-2",
                "bg-background border border-input rounded-md",
                "text-sm resize-none",
                "focus:outline-none focus:border-ring transition-colors",
              )}
            />
          </div>
        </div>
      </section>

      {/* ═══════ SECCIÓN 4: MÉTODO DE ENVÍO ═══════ */}
      <section aria-labelledby="shipping-heading">
        <h2 id="shipping-heading" className={sectionTitle}>
          {t("shippingMethodHeading")}
        </h2>

        <div className="space-y-3" role="radiogroup" aria-label={t("shippingMethodAriaLabel")}>
          {shippingOptions.map((method) => {
            const isSelected = shippingMethod === method.id;
            return (
              <label
                key={method.id}
                className={cn(
                  "flex items-center gap-4 p-4",
                  "border rounded-md cursor-pointer transition-colors",
                  isSelected
                    ? "border-accent bg-accent-subtle"
                    : "border-input hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name="shipping-method"
                  value={method.id}
                  checked={isSelected}
                  onChange={() => onShippingMethodChange(method.id)}
                  className="h-4 w-4 accent-secondary cursor-pointer"
                />
                <div className="flex-1 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatPrice(method.price)}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Aviso de impuestos de importación (solo al extranjero) */}
        {international && (
          <p className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
            <span>{CUSTOMS_NOTICE[locale === "en" ? "en" : "es"]}</span>
          </p>
        )}
      </section>
    </div>
  );
}