/**
 * ============================================================================
 *  MKatalina · Tarifas de envío por país · Fase 13 · Etapa 7
 * ============================================================================
 *
 *  ⭐ AQUÍ SE CAMBIAN LOS PRECIOS DE ENVÍO ⭐
 *  Para subir o bajar una tarifa, cambia el número en NATIONAL_PRICES o en
 *  ZONES y vuelve a publicar. Todo el sitio (checkout, apartados, servidor,
 *  correos) lee los precios de aquí.
 *
 *  ENVÍOS NACIONALES (México): Estándar $99 o Express $199, como antes.
 *
 *  ENVÍOS INTERNACIONALES: un solo método, "Envío internacional DHL
 *  Express" (2 a 5 días hábiles), con precio según la ZONA del país. Las
 *  zonas son las de la guía oficial de DHL Express México 2026 (exportación):
 *    1 Norteamérica · 2 Latinoamérica · 3 Caribe · 4 Europa ·
 *    5 Asia-Pacífico (principales economías) · 6 Resto del mundo
 *  Precios aprobados (octubre 2026): calculados con la tarifa de lista de DHL
 *  para un paquete de 0.5 kg y el dólar a $18.37, ligeramente por debajo de
 *  lista, contando con los descuentos de las plataformas de guías.
 *  Cualquier país que no esté en las listas de abajo cae en la zona 6.
 *
 *  ¿Por qué el servidor recalcula el envío? Porque el precio que se cobra en
 *  PayPal nunca se toma del navegador: src/actions/paypal.ts llama a
 *  getShippingCost() con el país y el método que eligió el cliente.
 *
 *  Sin secretos: se puede importar desde el navegador.
 * ============================================================================
 */

import { DEFAULT_COUNTRY } from "@/lib/countries";

/** Métodos de envío posibles. */
export type ShippingMethodId = "estandar" | "express" | "internacional";

/* ─────────────────────────── Precios (MXN) ─────────────────────────── */

/** Envíos dentro de México. */
export const NATIONAL_PRICES = {
  estandar: 99,
  express: 199,
} as const;

/** Zonas internacionales con su precio. */
export const ZONES = {
  1: { price: 1190, name: { es: "Norteamérica", en: "North America" } },
  2: { price: 1590, name: { es: "Latinoamérica", en: "Latin America" } },
  3: { price: 1690, name: { es: "Caribe", en: "Caribbean" } },
  4: { price: 1790, name: { es: "Europa", en: "Europe" } },
  5: { price: 2090, name: { es: "Asia-Pacífico", en: "Asia-Pacific" } },
  6: { price: 3190, name: { es: "Resto del mundo", en: "Rest of the world" } },
} as const;

export type ZoneId = keyof typeof ZONES;

/**
 * Países por zona (guía DHL Express México 2026). Zona 6 = todos los demás.
 * DHL usa códigos propios para algunas islas del Caribe (XB, XC, XN, XY, XE,
 * XM); aquí van con su código oficial ISO (BQ, CW, KN, BL, SX, MF).
 */
const ZONE_COUNTRIES: Record<Exclude<ZoneId, 6>, string[]> = {
  1: ["CA", "US", "PR"],
  2: ["AR", "BZ", "BO", "BR", "CL", "CO", "CR", "EC", "SV", "GT", "HN", "NI", "PA", "PY", "PE", "UY", "VE"],
  3: [
    "AI", "AG", "AW", "BS", "BB", "BM", "BQ", "KY", "CW", "DM", "GD", "GP", "GY", "GF", "HT",
    "TC", "VG", "VI", "JM", "MQ", "MS", "BL", "KN", "SX", "MF", "VC", "LC", "SR", "TT", "DO",
  ],
  4: [
    "DE", "AD", "BE", "AT", "BG", "CY", "HR", "DK", "SK", "SI", "ES", "EE", "FI", "FR", "GR",
    "GG", "HU", "IS", "IT", "LV", "LI", "LT", "LU", "MT", "MC", "NO", "NL", "PL", "PT", "GB",
    "CZ", "RO", "IE", "SM", "SE", "CH", "VA",
  ],
  5: ["AU", "CN", "KR", "HK", "IN", "JP", "MY", "NZ", "PH", "SG", "TW", "TH", "VN"],
};

/** Mapa país → zona, armado una sola vez. */
const ZONE_BY_COUNTRY = new Map<string, ZoneId>();
for (const [zone, countries] of Object.entries(ZONE_COUNTRIES)) {
  for (const country of countries) ZONE_BY_COUNTRY.set(country, Number(zone) as ZoneId);
}

/* ─────────────────────────── Funciones ─────────────────────────── */

/** ¿El envío es al extranjero? */
export function isInternational(country: string): boolean {
  return country !== DEFAULT_COUNTRY;
}

/** Zona DHL de un país (6 si no está en ninguna lista). */
export function shippingZone(country: string): ZoneId {
  return ZONE_BY_COUNTRY.get(country) ?? 6;
}

/** Métodos que se pueden elegir para un país, en orden. */
export function shippingMethodsFor(country: string): ShippingMethodId[] {
  return isInternational(country) ? ["internacional"] : ["estandar", "express"];
}

/** ¿Es un id de método que existe? */
export function isShippingMethodId(value: unknown): value is ShippingMethodId {
  return value === "estandar" || value === "express" || value === "internacional";
}

/**
 * Costo del envío en pesos, o null si ese método no aplica a ese país
 * (por ejemplo, "express" nacional con una dirección en España).
 */
export function getShippingCost(country: string, method: string): number | null {
  if (!shippingMethodsFor(country).includes(method as ShippingMethodId)) return null;
  if (method === "internacional") return ZONES[shippingZone(country)].price;
  return NATIONAL_PRICES[method as keyof typeof NATIONAL_PRICES];
}

/** Textos de cada método, en ambos idiomas (los mismos del checkout). */
const METHOD_TEXT = {
  estandar: {
    label: { es: "Envío estándar", en: "Standard shipping" },
    description: { es: "3-5 días hábiles", en: "3-5 business days" },
  },
  express: {
    label: { es: "Envío express", en: "Express shipping" },
    description: { es: "1-2 días hábiles", en: "1-2 business days" },
  },
  internacional: {
    label: { es: "Envío internacional DHL Express", en: "International shipping · DHL Express" },
    description: { es: "2-5 días hábiles", en: "2-5 business days" },
  },
} as const;

/** Un método listo para mostrar. */
export interface ShippingOption {
  id: ShippingMethodId;
  label: string;
  description: string;
  price: number;
}

/**
 * Métodos de envío para un país, con nombre, descripción y precio en el
 * idioma indicado. En internacionales, la descripción incluye la zona
 * (ej. "2-5 días hábiles · Europa").
 */
export function getShippingOptions(country: string, locale: string): ShippingOption[] {
  const lang = locale === "en" ? "en" : "es";
  return shippingMethodsFor(country).map((id) => {
    const text = METHOD_TEXT[id];
    const zoneName =
      id === "internacional" ? ` · ${ZONES[shippingZone(country)].name[lang]}` : "";
    return {
      id,
      label: text.label[lang],
      description: `${text.description[lang]}${zoneName}`,
      price: getShippingCost(country, id) ?? 0,
    };
  });
}

/** Nombre de un método guardado (para correos, panel y pedidos). */
export function shippingMethodLabel(method: string | null | undefined, locale: string): string {
  if (!method || !isShippingMethodId(method)) return method ?? "";
  return METHOD_TEXT[method].label[locale === "en" ? "en" : "es"];
}

/** Aviso de impuestos de importación (solo envíos al extranjero). */
export const CUSTOMS_NOTICE = {
  es: "Envío internacional: tu país puede cobrar impuestos o aranceles de importación al recibir el paquete. Esos cargos los cubre quien recibe.",
  en: "International shipping: your country may charge import taxes or duties when the package arrives. Those charges are paid by the recipient.",
} as const;