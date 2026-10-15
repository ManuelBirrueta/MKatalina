/**
 * ============================================================================
 *  MKatalina · Países, ladas y reglas de dirección · Fase 13 · Etapa 7
 * ============================================================================
 *
 *  Todo lo que depende del PAÍS al capturar una dirección o un teléfono:
 *
 *    - Lista de países (los ~245 que reconoce libphonenumber-js), con su
 *      nombre en el idioma del cliente (Intl.DisplayNames, que ya viene en el
 *      navegador y en Node: no hay que mantener traducciones).
 *    - Lada internacional de cada país (+52, +1, +34…).
 *    - Qué países NO usan código postal (ahí el campo es opcional).
 *    - Reglas de teléfono y código postal, iguales en el navegador y el
 *      servidor:
 *        · Teléfono: solo se cuentan los dígitos, de 6 a 20 (sin el formato
 *          fijo de 10 de México). 20 es un tope de seguridad; ningún
 *          número real del mundo pasa de 15 dígitos.
 *        · Código postal: letras, números, espacios y guiones, de 2 a 12
 *          caracteres (cubre "82000", "90210-1234", "K1A 0B1", "SW1A 1AA").
 *
 *  Lo usan: el formulario de compra (CheckoutForm), el modal para completar
 *  apartados, la validación del servidor (src/lib/address.ts), los correos y
 *  el panel (para mostrar el nombre del país).
 *
 *  Sin secretos: se puede importar desde el navegador.
 * ============================================================================
 */

import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/** País por defecto de la tienda. */
export const DEFAULT_COUNTRY = "MX";

/** Todos los códigos de país que reconocemos (ISO de 2 letras). */
const COUNTRY_CODES = new Set<string>(getCountries());

/** ¿Es un código de país válido? */
export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && COUNTRY_CODES.has(value);
}

/** Lada internacional sin "+" (ej. "52"). Cadena vacía si el país no existe. */
export function dialCode(country: string): string {
  return isCountryCode(country) ? getCountryCallingCode(country) : "";
}

/** Nombre del país en el idioma indicado ("México" / "Mexico"). */
export function countryName(country: string | null | undefined, locale: string): string {
  if (!country) return "";
  try {
    const names = new Intl.DisplayNames([locale === "en" ? "en" : "es"], {
      type: "region",
    });
    return names.of(country) ?? country;
  } catch {
    return country;
  }
}

export interface CountryOption {
  code: string;
  name: string;
  /** Lada sin "+". */
  dial: string;
}

/**
 * Lista de países para un <select>, ordenada por nombre en el idioma del
 * cliente, con México primero (la mayoría de las compras).
 */
export function getCountryOptions(locale: string): CountryOption[] {
  const collator = new Intl.Collator(locale === "en" ? "en" : "es");
  const all = [...COUNTRY_CODES].map((code) => ({
    code,
    name: countryName(code, locale),
    dial: dialCode(code),
  }));
  all.sort((a, b) => collator.compare(a.name, b.name));
  const mexico = all.find((c) => c.code === DEFAULT_COUNTRY);
  return mexico ? [mexico, ...all.filter((c) => c.code !== DEFAULT_COUNTRY)] : all;
}

/**
 * Países que no usan código postal (o donde casi nadie lo usa). En estos el
 * campo es opcional; en el resto, obligatorio.
 */
const NO_POSTAL_CODE = new Set<string>([
  "AE", "AG", "AN", "AO", "AW", "BF", "BI", "BJ", "BO", "BS", "BW", "BZ",
  "CD", "CF", "CG", "CI", "CK", "CM", "DJ", "DM", "ER", "FJ", "GA", "GD",
  "GH", "GM", "GQ", "GY", "HK", "HM", "JM", "KI", "KM", "KN", "KP", "LC",
  "ML", "MO", "MR", "MW", "NR", "NU", "QA", "RW", "SB", "SC", "SL", "SO",
  "SR", "ST", "SY", "TD", "TF", "TG", "TK", "TL", "TO", "TT", "TV", "UG",
  "VU", "YE", "ZW",
]);

/** ¿El código postal es obligatorio en este país? */
export function postalCodeRequired(country: string): boolean {
  return !NO_POSTAL_CODE.has(country);
}

/** Solo los dígitos de un teléfono. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** ¿El teléfono tiene una cantidad de dígitos razonable? (6 a 20) */
export function isValidPhone(raw: string): boolean {
  const digits = phoneDigits(raw);
  return digits.length >= 6 && digits.length <= 20;
}

/**
 * Teléfono completo para guardar y mostrar: "+52 6691234567".
 *
 * Quita el "0" que en muchos países se marca solo dentro del país
 * (Reino Unido "020 7946 0958" → "+44 2079460958"; Alemania, Francia…),
 * porque con la lada internacional sobra. Si la librería no reconoce el
 * número, se guardan los dígitos tal cual escribió el cliente.
 */
export function fullPhone(phoneCountry: string, raw: string): string {
  const code = dialCode(phoneCountry);
  let digits = phoneDigits(raw);
  if (isCountryCode(phoneCountry)) {
    const parsed = parsePhoneNumberFromString(raw, phoneCountry);
    if (parsed?.nationalNumber) digits = parsed.nationalNumber;
  }
  return code ? `+${code} ${digits}` : digits;
}

/** Formato de código postal internacional. */
const POSTAL_REGEX = /^[A-Za-z0-9][A-Za-z0-9 -]{0,10}[A-Za-z0-9]$/;

/** ¿El código postal tiene un formato aceptable? */
export function isValidPostalCode(raw: string): boolean {
  return POSTAL_REGEX.test(raw.trim());
}