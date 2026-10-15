/**
 * ============================================================================
 *  MKatalina · Reglas de una dirección de envío (México y extranjero) · Etapa 7
 * ============================================================================
 *
 *  Una sola definición de "dirección válida", usada en DOS lados:
 *    - El navegador (AddressFields.tsx) marca errores campo por campo.
 *    - El servidor (src/actions/paypal.ts y src/lib/reservation-delivery.ts)
 *      vuelve a revisar TODO antes de cobrar y guardar. Antes de esta etapa
 *      el servidor guardaba la dirección del checkout sin revisarla.
 *
 *  REGLAS (dependen del país, ver src/lib/countries.ts):
 *    país ............ uno de los ~245 reconocidos
 *    nombre/apellido . 2 a 60 caracteres
 *    teléfono ........ lada de cualquier país + 6 a 20 dígitos
 *    calle y número .. obligatorio
 *    interior ........ opcional
 *    colonia ......... obligatoria SOLO en México (en otros países, opcional)
 *    ciudad .......... obligatoria
 *    estado .......... México: uno de los 32 oficiales.
 *                      Otros: obligatorio si el país tiene lista de estados
 *                      (lo indica el formulario con stateRequired); el
 *                      servidor solo exige que no sea un texto gigante.
 *    código postal ... letras/números/espacios/guiones, 2 a 12 caracteres;
 *                      opcional en países que no usan código postal.
 *    notas ........... opcional, hasta 300 caracteres
 *
 *  Los errores se devuelven como CÓDIGOS ("required", "invalidPhone"…); el
 *  formulario los traduce (ADDRESS_ERROR_TEXT, abajo) al idioma del cliente.
 *
 *  Sin secretos: se puede importar desde el navegador.
 * ============================================================================
 */

import { isMexicanState } from "@/data/mexican-states";
import {
  DEFAULT_COUNTRY,
  fullPhone,
  isCountryCode,
  isValidPhone,
  isValidPostalCode,
  postalCodeRequired,
} from "@/lib/countries";

/** Lo que se captura de una dirección de envío. */
export interface ShippingAddress {
  /** País de entrega (ISO de 2 letras, ej. "MX", "US"). */
  country: string;
  firstName: string;
  lastName: string;
  /** País de la lada del teléfono (puede ser distinto al de entrega). */
  phoneCountry: string;
  /**
   * Teléfono. En el formulario: lo que escribe el cliente (sin lada).
   * Ya validado (validateAddress): completo con lada, ej. "+52 6691234567".
   */
  phone: string;
  /** Calle y número. */
  address: string;
  /** Interior / depto (opcional). */
  addressLine2: string;
  /** Colonia / barrio (obligatoria solo en México). */
  neighborhood: string;
  city: string;
  /** Estado / provincia / región. */
  state: string;
  postalCode: string;
  /** Notas para el repartidor (opcional). */
  notes: string;
}

export type AddressField = keyof ShippingAddress;

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  country: DEFAULT_COUNTRY,
  firstName: "",
  lastName: "",
  phoneCountry: DEFAULT_COUNTRY,
  phone: "",
  address: "",
  addressLine2: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  notes: "",
};

/** Motivos de error de un campo. */
export type AddressErrorCode =
  | "required"
  | "minChars"
  | "tooLong"
  | "invalidCountry"
  | "invalidPhone"
  | "invalidPostalCode"
  | "invalidState";

/** Largo máximo de cada campo (protección del servidor). */
const MAX_LENGTH: Record<AddressField, number> = {
  country: 2,
  firstName: 60,
  lastName: 60,
  phoneCountry: 2,
  phone: 30,
  address: 120,
  addressLine2: 60,
  neighborhood: 80,
  city: 80,
  state: 80,
  postalCode: 12,
  notes: 300,
};

/** Opciones que solo conoce el formulario. */
export interface AddressValidationOptions {
  /** true si el país eligió tiene lista de estados (el estado es obligatorio). */
  stateRequired?: boolean;
}

/**
 * Revisa UN campo. Devuelve el código de error o null si está bien.
 * `values` es la dirección completa porque varias reglas dependen del país.
 */
export function validateAddressField(
  field: AddressField,
  values: ShippingAddress,
  options: AddressValidationOptions = {},
): AddressErrorCode | null {
  const value = (values[field] ?? "").trim();
  if (value.length > MAX_LENGTH[field]) return "tooLong";

  const isMexico = values.country === DEFAULT_COUNTRY;

  switch (field) {
    case "country":
    case "phoneCountry":
      return isCountryCode(value) ? null : "invalidCountry";

    case "firstName":
    case "lastName":
      if (!value) return "required";
      return value.length < 2 ? "minChars" : null;

    case "phone":
      if (!value) return "required";
      return isValidPhone(value) ? null : "invalidPhone";

    case "address":
    case "city":
      return value ? null : "required";

    case "neighborhood":
      return isMexico && !value ? "required" : null;

    case "state":
      if (isMexico) {
        if (!value) return "required";
        return isMexicanState(value) ? null : "invalidState";
      }
      return options.stateRequired && !value ? "required" : null;

    case "postalCode":
      if (!value) return postalCodeRequired(values.country) ? "required" : null;
      return isValidPostalCode(value) ? null : "invalidPostalCode";

    case "addressLine2":
    case "notes":
      return null;
  }
}

/** Campos en el orden en que se revisan (y en que aparecen). */
export const ADDRESS_FIELDS: AddressField[] = [
  "country",
  "firstName",
  "lastName",
  "phoneCountry",
  "phone",
  "address",
  "addressLine2",
  "neighborhood",
  "postalCode",
  "city",
  "state",
  "notes",
];

/**
 * Revisa y LIMPIA una dirección completa (recorta espacios y arma el
 * teléfono con lada). Lo usa el servidor antes de cobrar.
 */
export function validateAddress(
  raw: unknown,
  options: AddressValidationOptions = {},
):
  | { ok: true; data: ShippingAddress }
  | { ok: false; errors: Partial<Record<AddressField, AddressErrorCode>> } {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const values = {} as ShippingAddress;
  for (const field of ADDRESS_FIELDS) {
    const v = source[field];
    values[field] = typeof v === "string" ? v.trim() : "";
  }
  // Valores por defecto para direcciones guardadas antes de la Etapa 7.
  if (!values.country) values.country = DEFAULT_COUNTRY;
  if (!values.phoneCountry) values.phoneCountry = values.country;
  values.country = values.country.toUpperCase();
  values.phoneCountry = values.phoneCountry.toUpperCase();

  const errors: Partial<Record<AddressField, AddressErrorCode>> = {};
  for (const field of ADDRESS_FIELDS) {
    const error = validateAddressField(field, values, options);
    if (error) errors[field] = error;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: { ...values, phone: fullPhone(values.phoneCountry, values.phone) },
  };
}

/** Textos de cada error (es/en) para los formularios. */
export const ADDRESS_ERROR_TEXT: Record<AddressErrorCode, { es: string; en: string }> = {
  required: { es: "Este campo es obligatorio", en: "This field is required" },
  minChars: { es: "Mínimo 2 caracteres", en: "At least 2 characters" },
  tooLong: { es: "Texto demasiado largo", en: "Text is too long" },
  invalidCountry: { es: "Elige un país", en: "Choose a country" },
  invalidPhone: { es: "Escribe un teléfono válido (solo números)", en: "Enter a valid phone number (digits only)" },
  invalidPostalCode: { es: "Código postal no válido", en: "Invalid postal code" },
  invalidState: { es: "Elige un estado de la lista", en: "Choose a state from the list" },
};

/** Texto de un error en el idioma indicado. */
export function addressErrorText(code: AddressErrorCode, locale: string): string {
  return ADDRESS_ERROR_TEXT[code][locale === "en" ? "en" : "es"];
}