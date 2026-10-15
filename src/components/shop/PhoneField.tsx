/**
 * ============================================================================
 * PHONE FIELD — MKATALINA · Fase 13 · Etapa 7
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
 * TRUCO VISUAL DEL SELECTOR: la lista de países es un <select> normal (así
 * funciona con teclado, lectores de pantalla y en celulares), pero está
 * transparente ENCIMA de una etiqueta que solo dice "+52 ▾". Al tocarlo se
 * abre la lista completa con nombres ("México +52"); cerrado, ocupa poco.
 *
 * Lo usan CheckoutForm.tsx y CompleteReservationModal.tsx.
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import { dialCode, getCountryOptions } from "@/lib/countries";
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
  const locale = useLocale();
  const options = useMemo(() => getCountryOptions(locale), [locale]);
  const code = dialCode(phoneCountry);

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
        {/* Lada: etiqueta visible + <select> transparente encima */}
        <div className="relative flex items-center gap-1 pl-3 pr-2 border-r border-input text-sm tabular-nums">
          <span>+{code}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <select
            value={phoneCountry}
            onChange={(e) => onPhoneCountryChange(e.target.value)}
            aria-label={locale === "en" ? "Country calling code" : "Lada del país"}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          >
            {options.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} +{c.dial}
              </option>
            ))}
          </select>
        </div>
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