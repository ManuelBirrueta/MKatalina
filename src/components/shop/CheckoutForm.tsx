/**
 * ============================================================================
 * CHECKOUT FORM — KATALINA (Fase 12 Turno 3B.3: bilingüe completo)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *
 *   1) validateField ahora recibe `t` como 3er parámetro:
 *      `validateField(name, value, t)`
 *      Los mensajes de error se resuelven con `t("checkoutForm.errors.X")`.
 *      El padre (checkout/page.tsx) ahora debe pasarle `t` cuando llame
 *      a esta función desde fuera (handleFieldBlur, validateAll).
 *
 *   2) SHIPPING_METHODS ya no se importa de @/types/checkout con labels
 *      hardcoded. Ahora usamos `getShippingMethodsResolved(t)` que devuelve
 *      los métodos con label/description ya traducidos al locale activo.
 *
 *   3) Todos los textos hardcoded en español traducidos vía useTranslations:
 *      - Headers de las 4 secciones
 *      - Labels de los 10+ campos
 *      - Placeholders, hints, marcadores (opcional)
 *      - Texto del dropdown de estados
 *
 *   4) MEXICAN_STATES se mantiene en español (nombres propios oficiales)
 *
 * Lo que NO cambia:
 *   - Estructura visual del form (grid, espaciados, secciones)
 *   - Lógica de validación (sigue siendo a través de validateField)
 *   - autoComplete tokens (siguen siendo estándar de browsers)
 *   - Estado lifted en el padre (formData, errors viven en page.tsx)
 *
 * ─── ¿POR QUÉ validateField RECIBE t COMO PARÁMETRO? ───────────────────
 *
 * validateField NO es un hook React (es una función pura). No podemos
 * meter useTranslations dentro porque eso solo funciona en componentes
 * o en otros hooks.
 *
 * Opciones que consideré:
 *   A) ✅ Recibir `t` como parámetro → SIMPLE, sin refactor mayor
 *   B) Devolver códigos de error y traducir afuera → más limpio pero
 *      requiere cambio en el padre y en formData[errors]
 *   C) Convertir validateField en un hook (useFieldValidator) → no
 *      compatible con uso de validateField fuera del componente
 *
 * Elegí Opción A porque es la de menor disrupción y sigue manteniendo
 * UNA fuente de verdad para las reglas de validación.
 *
 * ─── COMPATIBILIDAD ──────────────────────────────────────────────────
 *
 * Cualquier código que llame `validateField(field, value)` SIN pasar `t`
 * recibirá error de TypeScript (parámetro `t` requerido). Esto es
 * intencional — fuerza al caller a actualizar para tener mensajes
 * traducidos.
 *
 * Si por alguna razón quisieras un fallback "sin traducir", podrías
 * hacer `t` opcional y usar mensajes hardcoded en español como default.
 * Pero eso oculta el bug, mejor que TypeScript te avise.
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import {
  getShippingMethodsResolved,
  type CheckoutFormData,
  type FormErrors,
  type ShippingMethodId,
} from "@/types/checkout";

/**
 * Type helper para la función de traducción. Coincide con el patrón usado
 * en types/checkout.ts. La firma es laxa porque next-intl exporta tipos
 * complejos con genéricos que no necesitamos repetir aquí.
 */
type Translator = (key: string) => string;

/**
 * Estados mexicanos para el selector. Es un array fijo — México tiene
 * 32 entidades federativas y el catálogo no cambia.
 *
 * NO se traducen porque son nombres propios oficiales (incluso en /en/
 * decimos "Estado de México", "Ciudad de México", "Nuevo León"...).
 *
 * Sin tildes en algunos casos porque así viene en los catálogos oficiales
 * del SAT y de paqueterías. Es mejor mantener consistencia con esos
 * sistemas para no tener que normalizar después al integrar envíos.
 */
const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

/**
 * validateField — valida un único campo y devuelve mensaje de error si aplica.
 *
 * AHORA recibe `t` como 3er parámetro para traducir los mensajes de error.
 *
 * `t` debe estar bound al namespace "checkoutForm" en el caller:
 *   const t = useTranslations("checkoutForm");
 *   validateField("email", "abc", t);
 *
 * Internamente usamos t("errors.X") porque ese es el sub-namespace.
 *
 * Reglas por campo (mismas que antes):
 *   - email: requerido + formato válido (regex simple)
 *   - firstName, lastName: requeridos, mínimo 2 chars
 *   - phone: requerido, exactamente 10 dígitos numéricos (formato MX)
 *   - address, neighborhood, city, state, postalCode: requeridos
 *   - postalCode: 5 dígitos exactos
 *   - addressLine2 y notes: opcionales, no validamos
 *
 * Devuelve string (mensaje traducido) o undefined (campo válido).
 */
export function validateField(
  name: keyof CheckoutFormData,
  value: string,
  t: Translator
): string | undefined {
  // Trim para que espacios en blanco no engañen al validador
  const trimmed = value.trim();

  switch (name) {
    case "email": {
      if (!trimmed) return t("errors.emailRequired");
      // Regex simple: algo@algo.algo. Detecta errores obvios sin ser restrictivo.
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return t("errors.emailInvalid");
      return undefined;
    }

    case "firstName":
      if (!trimmed) return t("errors.firstNameRequired");
      if (trimmed.length < 2) return t("errors.minChars");
      return undefined;

    case "lastName":
      if (!trimmed) return t("errors.lastNameRequired");
      if (trimmed.length < 2) return t("errors.minChars");
      return undefined;

    case "phone": {
      if (!trimmed) return t("errors.phoneRequired");
      // Solo dígitos, exactamente 10 (formato mexicano)
      const phoneDigits = trimmed.replace(/\D/g, "");
      if (phoneDigits.length !== 10) return t("errors.phoneInvalid");
      return undefined;
    }

    case "address":
      if (!trimmed) return t("errors.addressRequired");
      return undefined;

    case "neighborhood":
      if (!trimmed) return t("errors.neighborhoodRequired");
      return undefined;

    case "city":
      if (!trimmed) return t("errors.cityRequired");
      return undefined;

    case "state":
      if (!trimmed) return t("errors.stateRequired");
      return undefined;

    case "postalCode": {
      if (!trimmed) return t("errors.postalCodeRequired");
      const cpDigits = trimmed.replace(/\D/g, "");
      if (cpDigits.length !== 5) return t("errors.postalCodeInvalid");
      return undefined;
    }

    // Campos opcionales: nunca dan error
    case "addressLine2":
    case "notes":
      return undefined;

    default:
      return undefined;
  }
}

interface CheckoutFormProps {
  formData: CheckoutFormData;
  errors: FormErrors;
  shippingMethod: ShippingMethodId;
  /** Llamado cuando el usuario escribe en cualquier campo */
  onChange: (field: keyof CheckoutFormData, value: string) => void;
  /** Llamado cuando el usuario sale de un campo (para validar) */
  onBlur: (field: keyof CheckoutFormData) => void;
  /** Llamado cuando el usuario cambia el método de envío */
  onShippingMethodChange: (method: ShippingMethodId) => void;
}

export function CheckoutForm({
  formData,
  errors,
  shippingMethod,
  onChange,
  onBlur,
  onShippingMethodChange,
}: CheckoutFormProps) {
  /**
   * Hook de traducciones bound al namespace "checkoutForm" para todos
   * los textos del formulario.
   */
  const t = useTranslations("checkoutForm");

  /**
   * Hook separado para los métodos de envío. El sub-namespace
   * "checkout.shippingMethods" tiene la estructura:
   *   estandar: { label, description }
   *   express: { label, description }
   *
   * Lo pasamos a getShippingMethodsResolved que itera sobre los IDs y
   * resuelve cada label/description.
   */
  const tShipping = useTranslations("checkout.shippingMethods");

  /**
   * Construir el array de métodos de envío con labels traducidos.
   * Se re-construye en cada render (es barato — 2 strings).
   */
  const shippingMethods = getShippingMethodsResolved(tShipping);

  /**
   * Helper para clases del input — agrega borde rojo si hay error.
   * Centraliza el styling para no repetir el className enorme en cada input.
   */
  const inputClass = (field: keyof CheckoutFormData) =>
    cn(
      "w-full h-10 px-3",
      "bg-background border border-input rounded-md",
      "text-sm",
      "focus:outline-none focus:border-ring transition-colors",
      errors[field] && "border-destructive"
    );

  /**
   * Helper para mostrar error debajo del campo.
   * Si no hay error, devuelve null (no renderiza nada).
   */
  const fieldError = (field: keyof CheckoutFormData) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1" role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="space-y-10">
      {/* ═══════ SECCIÓN 1: CONTACTO ═══════ */}
      <section aria-labelledby="contact-heading">
        <h2
          id="contact-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          {t("contactHeading")}
        </h2>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1.5"
          >
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
          <p className="text-xs text-muted-foreground mt-1">
            {t("fields.emailHint")}
          </p>
        </div>
      </section>

      {/* ═══════ SECCIÓN 2: DATOS PERSONALES ═══════ */}
      <section aria-labelledby="personal-heading">
        <h2
          id="personal-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          {t("personalDataHeading")}
        </h2>

        <div className="space-y-4">
          {/* Nombre + Apellido lado a lado en desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium mb-1.5"
              >
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
              <label
                htmlFor="lastName"
                className="block text-sm font-medium mb-1.5"
              >
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

          {/* Teléfono */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium mb-1.5"
            >
              {t("fields.phoneLabel")}
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={formData.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              onBlur={() => onBlur("phone")}
              placeholder={t("fields.phonePlaceholder")}
              className={inputClass("phone")}
            />
            {fieldError("phone")}
            <p className="text-xs text-muted-foreground mt-1">
              {t("fields.phoneHint")}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ SECCIÓN 3: DIRECCIÓN DE ENVÍO ═══════ */}
      <section aria-labelledby="address-heading">
        <h2
          id="address-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          {t("addressHeading")}
        </h2>

        <div className="space-y-4">
          {/* Calle y número */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium mb-1.5"
            >
              {t("fields.addressLabel")}
            </label>
            <input
              id="address"
              type="text"
              autoComplete="shipping address-line1"
              value={formData.address}
              onChange={(e) => onChange("address", e.target.value)}
              onBlur={() => onBlur("address")}
              placeholder={t("fields.addressPlaceholder")}
              className={inputClass("address")}
            />
            {fieldError("address")}
          </div>

          {/* Interior / Depto (opcional) */}
          <div>
            <label
              htmlFor="addressLine2"
              className="block text-sm font-medium mb-1.5"
            >
              {t("fields.addressLine2Label")}{" "}
              <span className="text-muted-foreground font-normal">
                {t("optionalMarker")}
              </span>
            </label>
            <input
              id="addressLine2"
              type="text"
              autoComplete="shipping address-line2"
              value={formData.addressLine2}
              onChange={(e) => onChange("addressLine2", e.target.value)}
              placeholder={t("fields.addressLine2Placeholder")}
              className={inputClass("addressLine2")}
            />
          </div>

          {/* Colonia */}
          <div>
            <label
              htmlFor="neighborhood"
              className="block text-sm font-medium mb-1.5"
            >
              {t("fields.neighborhoodLabel")}
            </label>
            <input
              id="neighborhood"
              type="text"
              autoComplete="shipping address-level3"
              value={formData.neighborhood}
              onChange={(e) => onChange("neighborhood", e.target.value)}
              onBlur={() => onBlur("neighborhood")}
              className={inputClass("neighborhood")}
            />
            {fieldError("neighborhood")}
          </div>

          {/* CP + Ciudad lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
            <div>
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium mb-1.5"
              >
                {t("fields.postalCodeLabel")}
              </label>
              <input
                id="postalCode"
                type="text"
                inputMode="numeric"
                autoComplete="shipping postal-code"
                maxLength={5}
                value={formData.postalCode}
                onChange={(e) => onChange("postalCode", e.target.value)}
                onBlur={() => onBlur("postalCode")}
                placeholder={t("fields.postalCodePlaceholder")}
                className={inputClass("postalCode")}
              />
              {fieldError("postalCode")}
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium mb-1.5"
              >
                {t("fields.cityLabel")}
              </label>
              <input
                id="city"
                type="text"
                autoComplete="shipping address-level2"
                value={formData.city}
                onChange={(e) => onChange("city", e.target.value)}
                onBlur={() => onBlur("city")}
                className={inputClass("city")}
              />
              {fieldError("city")}
            </div>
          </div>

          {/* Estado (dropdown) */}
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium mb-1.5"
            >
              {t("fields.stateLabel")}
            </label>
            <select
              id="state"
              autoComplete="shipping address-level1"
              value={formData.state}
              onChange={(e) => onChange("state", e.target.value)}
              onBlur={() => onBlur("state")}
              className={cn(
                inputClass("state"),
                "cursor-pointer pr-8"
              )}
            >
              <option value="">{t("selectStatePlaceholder")}</option>
              {MEXICAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {fieldError("state")}
          </div>

          {/* Notas (opcional, textarea) */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium mb-1.5"
            >
              {t("fields.notesLabel")}{" "}
              <span className="text-muted-foreground font-normal">
                {t("optionalMarker")}
              </span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder={t("fields.notesPlaceholder")}
              className={cn(
                "w-full px-3 py-2",
                "bg-background border border-input rounded-md",
                "text-sm resize-none",
                "focus:outline-none focus:border-ring transition-colors"
              )}
            />
          </div>
        </div>
      </section>

      {/* ═══════ SECCIÓN 4: MÉTODO DE ENVÍO ═══════ */}
      <section aria-labelledby="shipping-heading">
        <h2
          id="shipping-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          {t("shippingMethodHeading")}
        </h2>

        <div
          className="space-y-3"
          role="radiogroup"
          aria-label={t("shippingMethodAriaLabel")}
        >
          {/*
           * Iterar sobre shippingMethods YA RESUELTOS.
           * Cada method tiene id (enum), label (traducido), description (traducido), price.
           */}
          {shippingMethods.map((method) => {
            const isSelected = shippingMethod === method.id;
            return (
              <label
                key={method.id}
                className={cn(
                  "flex items-center gap-4 p-4",
                  "border rounded-md cursor-pointer",
                  "transition-colors",
                  isSelected
                    ? "border-accent bg-accent-subtle"
                    : "border-input hover:border-border-strong"
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {method.description}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatPrice(method.price)}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}