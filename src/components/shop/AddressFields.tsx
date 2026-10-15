/**
 * ============================================================================
 * ADDRESS FIELDS — MKATALINA · Fase 13 · Etapa 7
 * ============================================================================
 *
 * Campos de una dirección de envío INTERNACIONAL, en este orden:
 *   País · Calle y número · Interior · Colonia/Barrio · Código postal ·
 *   Ciudad · Estado/Provincia
 *
 * Cómo cambia según el país elegido:
 *   - Colonia: obligatoria en México; en otros países se llama "Barrio /
 *     distrito" y es opcional.
 *   - Código postal: sin límite de dígitos (acepta letras, como en Canadá o
 *     Reino Unido); opcional en países que no lo usan.
 *   - Estado / provincia: lista del país (hook useSubdivisions, que la pide a
 *     /api/subdivisions). México: los 32 estados oficiales. Otros países:
 *     su lista + "Otro (escribir)" al final, por si la región del cliente no
 *     aparece. Países sin lista: campo de texto libre.
 *
 * Este componente solo DIBUJA los campos: los valores, errores y la
 * validación los maneja quien lo usa (checkout o modal de apartados), con
 * las reglas de src/lib/address.ts. La lista de estados también la recibe
 * por props (`subdivisions`), porque quien valida necesita saber si existe
 * para exigir el estado.
 *
 * Textos: reutiliza los del checkout (namespace checkoutForm) y agrega los
 * nuevos de esta etapa en COPY (es/en).
 * ============================================================================
 */

"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getCountryOptions, postalCodeRequired } from "@/lib/countries";
import type { AddressField, ShippingAddress } from "@/lib/address";
import { cn } from "@/lib/utils";

const COPY = {
  es: {
    country: "País",
    neighborhoodIntl: "Barrio / distrito",
    stateIntl: "Estado / provincia / región",
    stateChoose: "Elige…",
    stateOther: "Otro (escribir)",
    stateOtherPlaceholder: "Escribe tu estado o provincia",
    loading: "Cargando…",
    optional: "(opcional)",
  },
  en: {
    country: "Country",
    neighborhoodIntl: "Neighborhood / district",
    stateIntl: "State / province / region",
    stateChoose: "Choose…",
    stateOther: "Other (type it)",
    stateOtherPlaceholder: "Type your state or province",
    loading: "Loading…",
    optional: "(optional)",
  },
} as const;

/** Valor especial del <select> de estado para "Otro (escribir)". */
const OTHER = "__other__";

type AddressPart = Pick<
  ShippingAddress,
  "country" | "address" | "addressLine2" | "neighborhood" | "postalCode" | "city" | "state"
>;

export function AddressFields({
  idPrefix = "",
  values,
  errors,
  subdivisions,
  subdivisionsLoading,
  onChange,
  onBlur,
  compact = false,
}: {
  /** Prefijo para los id de los campos (evita ids repetidos en una página). */
  idPrefix?: string;
  values: AddressPart;
  /** Mensajes de error ya traducidos, por campo. */
  errors: Partial<Record<AddressField, string>>;
  /** Estados / provincias del país elegido (vacía = texto libre). */
  subdivisions: string[];
  subdivisionsLoading: boolean;
  onChange: (field: AddressField, value: string) => void;
  onBlur: (field: AddressField) => void;
  /** Versión compacta (modal): etiquetas y campos un poco más chicos. */
  compact?: boolean;
}) {
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "es";
  const copy = COPY[lang];
  const t = useTranslations("checkoutForm");

  const countries = useMemo(() => getCountryOptions(locale), [locale]);
  const isMexico = values.country === "MX";

  // "Otro (escribir)": el cliente eligió escribir su estado a mano.
  const [otherState, setOtherState] = useState(false);
  const stateInList = subdivisions.includes(values.state);
  const showStateText =
    !subdivisionsLoading &&
    (subdivisions.length === 0 || (!isMexico && (otherState || (values.state !== "" && !stateInList))));

  const id = (field: string) => `${idPrefix}${field}`;

  const labelClass = cn("block font-medium mb-1.5", compact ? "text-xs" : "text-sm");
  const inputClass = (field: AddressField) =>
    cn(
      "w-full h-10 px-3 bg-background border rounded-md text-sm",
      "focus:outline-none focus:border-ring transition-colors",
      errors[field] ? "border-destructive" : "border-input",
    );
  const errorText = (field: AddressField) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1" role="alert">
        {errors[field]}
      </p>
    ) : null;
  const optional = <span className="text-muted-foreground font-normal"> {copy.optional}</span>;

  return (
    <div className="space-y-4">
      {/* País */}
      <div>
        <label htmlFor={id("country")} className={labelClass}>
          {copy.country}
        </label>
        <select
          id={id("country")}
          autoComplete="shipping country"
          value={values.country}
          onChange={(e) => {
            setOtherState(false);
            onChange("country", e.target.value);
          }}
          className={cn(inputClass("country"), "cursor-pointer")}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {errorText("country")}
      </div>

      {/* Calle y número */}
      <div>
        <label htmlFor={id("address")} className={labelClass}>
          {t("fields.addressLabel")}
        </label>
        <input
          id={id("address")}
          type="text"
          autoComplete="shipping address-line1"
          value={values.address}
          onChange={(e) => onChange("address", e.target.value)}
          onBlur={() => onBlur("address")}
          placeholder={isMexico ? t("fields.addressPlaceholder") : undefined}
          className={inputClass("address")}
        />
        {errorText("address")}
      </div>

      {/* Interior (opcional) */}
      <div>
        <label htmlFor={id("addressLine2")} className={labelClass}>
          {t("fields.addressLine2Label")}
          {optional}
        </label>
        <input
          id={id("addressLine2")}
          type="text"
          autoComplete="shipping address-line2"
          value={values.addressLine2}
          onChange={(e) => onChange("addressLine2", e.target.value)}
          placeholder={t("fields.addressLine2Placeholder")}
          className={inputClass("addressLine2")}
        />
      </div>

      {/* Colonia (México) / Barrio (otros países, opcional) */}
      <div>
        <label htmlFor={id("neighborhood")} className={labelClass}>
          {isMexico ? t("fields.neighborhoodLabel") : copy.neighborhoodIntl}
          {!isMexico && optional}
        </label>
        <input
          id={id("neighborhood")}
          type="text"
          autoComplete="shipping address-level3"
          value={values.neighborhood}
          onChange={(e) => onChange("neighborhood", e.target.value)}
          onBlur={() => onBlur("neighborhood")}
          className={inputClass("neighborhood")}
        />
        {errorText("neighborhood")}
      </div>

      {/* Código postal + ciudad */}
      <div className={cn("grid gap-4", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-[160px_1fr]")}>
        <div>
          <label htmlFor={id("postalCode")} className={labelClass}>
            {t("fields.postalCodeLabel")}
            {!postalCodeRequired(values.country) && optional}
          </label>
          <input
            id={id("postalCode")}
            type="text"
            autoComplete="shipping postal-code"
            value={values.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            onBlur={() => onBlur("postalCode")}
            className={inputClass("postalCode")}
          />
          {errorText("postalCode")}
        </div>
        <div>
          <label htmlFor={id("city")} className={labelClass}>
            {t("fields.cityLabel")}
          </label>
          <input
            id={id("city")}
            type="text"
            autoComplete="shipping address-level2"
            value={values.city}
            onChange={(e) => onChange("city", e.target.value)}
            onBlur={() => onBlur("city")}
            className={inputClass("city")}
          />
          {errorText("city")}
        </div>
      </div>

      {/* Estado / provincia */}
      <div>
        <label htmlFor={id("state")} className={labelClass}>
          {isMexico ? t("fields.stateLabel") : copy.stateIntl}
          {!isMexico && !subdivisionsLoading && subdivisions.length === 0 && optional}
        </label>

        {subdivisionsLoading ? (
          <div className={cn(inputClass("state"), "flex items-center text-muted-foreground")}>
            {copy.loading}
          </div>
        ) : showStateText ? (
          <div className="space-y-2">
            <input
              id={id("state")}
              type="text"
              autoComplete="shipping address-level1"
              value={values.state}
              onChange={(e) => onChange("state", e.target.value)}
              onBlur={() => onBlur("state")}
              placeholder={copy.stateOtherPlaceholder}
              className={inputClass("state")}
            />
            {/* Regresar a la lista, si el país tiene una */}
            {subdivisions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOtherState(false);
                  onChange("state", "");
                }}
                className="text-xs text-accent hover:underline"
              >
                ← {copy.stateChoose}
              </button>
            )}
          </div>
        ) : (
          <select
            id={id("state")}
            autoComplete="shipping address-level1"
            value={stateInList ? values.state : ""}
            onChange={(e) => {
              if (e.target.value === OTHER) {
                setOtherState(true);
                onChange("state", "");
              } else {
                onChange("state", e.target.value);
              }
            }}
            onBlur={() => onBlur("state")}
            className={cn(inputClass("state"), "cursor-pointer")}
          >
            <option value="">{isMexico ? t("selectStatePlaceholder") : copy.stateChoose}</option>
            {subdivisions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            {!isMexico && <option value={OTHER}>{copy.stateOther}</option>}
          </select>
        )}
        {errorText("state")}
      </div>
    </div>
  );
}