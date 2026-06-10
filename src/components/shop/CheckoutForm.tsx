/**
 * ============================================================================
 * CHECKOUT FORM — KATALINA
 * ============================================================================
 *
 * Formulario completo del checkout. Contiene tres secciones:
 *   1. Contacto (email)
 *   2. Datos personales (nombre, apellido, teléfono)
 *   3. Dirección de envío (calle, colonia, ciudad, estado, CP, notas)
 *
 * Plus: selector de método de envío al final.
 *
 * Estado del formulario:
 *   El estado vive en el COMPONENTE PADRE (la página /checkout) porque
 *   ese padre también necesita acceso al estado para:
 *     - Pasar el método de envío al CheckoutSummary (que calcula totales)
 *     - Validar todo al hacer clic en "Pagar"
 *     - Construir el objeto Order al simular el pago exitoso
 *
 *   Este componente recibe `formData`, `errors`, `shippingMethod` como props,
 *   y callbacks (`onChange`, `onBlur`, `onShippingMethodChange`) para
 *   actualizar el estado en el padre. Patrón "lifted state".
 *
 * Validación:
 *   La función `validateField` se exporta para que el padre la pueda usar
 *   al hacer submit final. Aquí dentro la llamamos en cada `onBlur` para
 *   feedback inmediato cuando el usuario sale de un campo.
 *
 * Diseño:
 *   - Campos en grid de 2 columnas en desktop donde aplica (nombre+apellido,
 *     ciudad+estado, CP+notas)
 *   - Labels arriba de cada input, no flotantes (mejor accesibilidad)
 *   - Error message rojo debajo del campo con borde rojo en el input
 *   - Campos requeridos NO marcados con asterisco (cada campo se valida)
 * ============================================================================
 */

"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import {
  SHIPPING_METHODS,
  type CheckoutFormData,
  type FormErrors,
  type ShippingMethodId,
} from "@/types/checkout";

/**
 * Estados mexicanos para el selector. Es un array fijo — México tiene
 * 32 entidades federativas y el catálogo no cambia.
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
 * Lo exportamos para que la página padre pueda usarlo al validar todo el
 * formulario antes del submit final. Mantener UNA fuente de verdad para
 * las reglas de validación evita inconsistencias entre validación inline
 * y validación final.
 *
 * Reglas por campo:
 *   - email: requerido + formato válido (regex simple, no perfecto pero
 *     suficiente para detectar errores de tipeo obvios)
 *   - firstName, lastName: requeridos, mínimo 2 chars
 *   - phone: requerido, exactamente 10 dígitos numéricos (formato mexicano)
 *   - address, neighborhood, city, state, postalCode: requeridos
 *   - postalCode: 5 dígitos exactos
 *   - addressLine2 y notes: opcionales, no validamos
 *
 * Devuelve string (mensaje de error) o undefined (campo válido).
 */
export function validateField(
  name: keyof CheckoutFormData,
  value: string
): string | undefined {
  // Trim para que espacios en blanco no engañen al validador
  const trimmed = value.trim();

  switch (name) {
    case "email": {
      if (!trimmed) return "El email es obligatorio";
      // Regex simple: algo@algo.algo. No es perfecto pero detecta errores
      // de tipeo obvios sin ser restrictivo.
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return "Formato de email inválido";
      return undefined;
    }

    case "firstName":
      if (!trimmed) return "El nombre es obligatorio";
      if (trimmed.length < 2) return "Mínimo 2 caracteres";
      return undefined;

    case "lastName":
      if (!trimmed) return "El apellido es obligatorio";
      if (trimmed.length < 2) return "Mínimo 2 caracteres";
      return undefined;

    case "phone": {
      if (!trimmed) return "El teléfono es obligatorio";
      // Solo dígitos, exactamente 10 (formato mexicano)
      const phoneDigits = trimmed.replace(/\D/g, "");
      if (phoneDigits.length !== 10) return "Debe tener 10 dígitos";
      return undefined;
    }

    case "address":
      if (!trimmed) return "La dirección es obligatoria";
      return undefined;

    case "neighborhood":
      if (!trimmed) return "La colonia es obligatoria";
      return undefined;

    case "city":
      if (!trimmed) return "La ciudad es obligatoria";
      return undefined;

    case "state":
      if (!trimmed) return "Selecciona un estado";
      return undefined;

    case "postalCode": {
      if (!trimmed) return "El código postal es obligatorio";
      const cpDigits = trimmed.replace(/\D/g, "");
      if (cpDigits.length !== 5) return "Debe tener 5 dígitos";
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
      {/*
       * ═══════ SECCIÓN 1: CONTACTO ═══════
       *
       * El email va primero porque:
       *   1. Es el dato más rápido de escribir (baja fricción)
       *   2. Es el más importante (lo usamos para enviar confirmación
       *      de compra y dar seguimiento al pedido)
       *   3. Si el usuario abandona el form, al menos tenemos su email
       *      para enviarle un recordatorio (con consentimiento implícito
       *      de la transacción iniciada)
       */}
      <section aria-labelledby="contact-heading">
        <h2
          id="contact-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          Contacto
        </h2>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
            placeholder="tu@email.com"
            className={inputClass("email")}
          />
          {fieldError("email")}
          <p className="text-xs text-muted-foreground mt-1">
            Te enviaremos la confirmación de tu pedido aquí
          </p>
        </div>
      </section>

      {/*
       * ═══════ SECCIÓN 2: DATOS PERSONALES ═══════
       *
       * Nombre + apellido en grid de 2 columnas en desktop, apilados en móvil.
       * Teléfono en su propia fila.
       *
       * autoComplete con tokens estándar para que el navegador autollene
       * desde direcciones guardadas del usuario. Esto reduce fricción
       * dramáticamente en móvil.
       */}
      <section aria-labelledby="personal-heading">
        <h2
          id="personal-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          Datos personales
        </h2>

        <div className="space-y-4">
          {/* Nombre + Apellido lado a lado en desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium mb-1.5"
              >
                Nombre
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
                Apellido
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
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={formData.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              onBlur={() => onBlur("phone")}
              placeholder="10 dígitos"
              className={inputClass("phone")}
            />
            {fieldError("phone")}
            <p className="text-xs text-muted-foreground mt-1">
              Para que la paquetería pueda contactarte
            </p>
          </div>
        </div>
      </section>

      {/*
       * ═══════ SECCIÓN 3: DIRECCIÓN DE ENVÍO ═══════
       *
       * Esta es la sección más larga. Ponemos los campos en el orden de
       * cómo se escribe una dirección en México:
       *   Calle → Interior → Colonia → CP → Ciudad → Estado
       *
       * autoComplete="shipping" en los campos para que el navegador asocie
       * la información con direcciones guardadas previamente como "envío".
       */}
      <section aria-labelledby="address-heading">
        <h2
          id="address-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          Dirección de envío
        </h2>

        <div className="space-y-4">
          {/* Calle y número */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium mb-1.5"
            >
              Calle y número
            </label>
            <input
              id="address"
              type="text"
              autoComplete="shipping address-line1"
              value={formData.address}
              onChange={(e) => onChange("address", e.target.value)}
              onBlur={() => onBlur("address")}
              placeholder="Av. Insurgentes Sur 1234"
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
              Interior / Depto{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </label>
            <input
              id="addressLine2"
              type="text"
              autoComplete="shipping address-line2"
              value={formData.addressLine2}
              onChange={(e) => onChange("addressLine2", e.target.value)}
              placeholder="Depto 304, Torre B"
              className={inputClass("addressLine2")}
            />
          </div>

          {/* Colonia */}
          <div>
            <label
              htmlFor="neighborhood"
              className="block text-sm font-medium mb-1.5"
            >
              Colonia
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
                Código postal
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
                placeholder="00000"
                className={inputClass("postalCode")}
              />
              {fieldError("postalCode")}
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium mb-1.5"
              >
                Ciudad
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
              Estado
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
              <option value="">Selecciona un estado</option>
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
              Notas para el repartidor{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="Referencias, instrucciones especiales..."
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

      {/*
       * ═══════ SECCIÓN 4: MÉTODO DE ENVÍO ═══════
       *
       * Dos opciones como tarjetas grandes con radio button visible. NO
       * usamos dropdown porque queremos que ambas opciones sean visibles
       * y comparables sin esfuerzo. El usuario decide entre velocidad vs precio.
       *
       * El radio button es un <input type="radio"> nativo (accesible) pero
       * lo envolvemos en una <label> grande para que toda la tarjeta sea
       * clickeable. Patrón estándar de accesibilidad: label envolviendo
       * el input.
       */}
      <section aria-labelledby="shipping-heading">
        <h2
          id="shipping-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border"
        >
          Método de envío
        </h2>

        <div className="space-y-3" role="radiogroup" aria-label="Método de envío">
          {SHIPPING_METHODS.map((method) => {
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
                {/*
                 * Radio button nativo, posicionado a la izquierda.
                 * Lo dejamos visible (no oculto con sr-only) porque es
                 * un control familiar y los usuarios saben qué significa.
                 *
                 * accent-secondary aplica el color rosa a los radio buttons
                 * cuando están seleccionados (en browsers que lo soportan).
                 */}
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