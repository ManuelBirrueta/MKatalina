/**
 * ============================================================================
 * PHONE FIELD — MKATALINA · Fase 13 · Etapa 7 (+ 7.1: banderas)
 * ============================================================================
 *
 * Teléfono internacional: a la izquierda la LADA (selector de país que
 * muestra "+52", "+1", "+34"…) y a la derecha el número.
 *
 *   - Sin límite fijo de dígitos (antes exigía exactamente 10, formato
 *     mexicano). Solo se pide que tenga de 6 a 20 dígitos
 *     (src/lib/countries.ts).
 *   - La lada sigue al país de entrega mientras el cliente no la cambie a
 *     mano (eso lo decide quien usa el componente: checkout y modal de
 *     apartados).
 *
 * SELECTOR DE LADA (Etapa 7.1): es CountrySelect en su forma "dial".
 * Cerrado muestra solo la bandera y la lada ("🇲🇽 +52 ▾") para ocupar poco;
 * abierto muestra el buscador y la lista completa con bandera, nombre y lada
 * de cada país ("🇪🇸 España  +34"). Antes era un <select> transparente, que
 * no podía mostrar banderas.
 *
 * Lo usan CheckoutForm.tsx y CompleteReservationModal.tsx.
 * ============================================================================
 */

"use client";

import { CountrySelect } from "@/components/shop/CountrySelect";
import { cn } from "@/lib/utils";

export function PhoneField({
  id,
  label,
  phoneCountry,
  phone,
  error,
  hint,
  placeholder,
  onPhoneCountryChange,
  onPhoneChange,
  onBlur,
}: {
  /** id del input del número (para el <label> y para enfocar errores). */
  id: string;
  label: string;
  phoneCountry: string;
  phone: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  onPhoneCountryChange: (country: string) => void;
  onPhoneChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <div
        className={cn(
          "flex h-10 rounded-md border bg-background",
          "focus-within:border-ring transition-colors",
          error ? "border-destructive" : "border-input",
        )}
      >
        {/* Lada: bandera + "+52", abre la lista de países (CountrySelect) */}
        <CountrySelect
          id={`${id}-country`}
          variant="dial"
          value={phoneCountry}
          onChange={onPhoneCountryChange}
        />
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 bg-transparent text-sm focus:outline-none"
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive mt-1" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      ) : null}
    </div>
  );
}