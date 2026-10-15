/**
 * ============================================================================
 *  MKatalina · Paqueterías y números de guía · Fase 13 · Etapa 6B
 * ============================================================================
 *
 *  Única fuente de verdad sobre CÓMO se envían los pedidos y apartados:
 *
 *    - "estafeta" → Estafeta, con número de guía.
 *    - "dhl"      → DHL, con número de guía.
 *    - "local"    → Entrega local en Mazatlán (en persona, sin guía).
 *
 *  La usan:
 *    - El panel (pedidos y apartados): lista de paqueterías del formulario
 *      "Marcar como enviado".
 *    - Las acciones del admin (src/actions/admin.ts): validan con
 *      parseShipmentInput lo que manda el navegador.
 *    - Los correos de envío y "Mis pedidos": nombre de la paquetería y botón
 *      para rastrear (trackingUrl).
 *
 *  ENLACES DE RASTREO
 *    Ninguna de las dos paqueterías publica un formato oficial de enlace
 *    directo a una guía:
 *      - DHL: se usa el formato que emplea su propio sitio
 *        (rastreo.html?tracking-id=…). Si algún día dejara de llenar la guía
 *        solo, el cliente igual llega a la página de rastreo.
 *      - Estafeta: el enlace lleva a su página oficial de rastreo y el
 *        cliente pega ahí su número (pasteNumber = true hace que el correo
 *        y la página se lo indiquen).
 *
 *  Para agregar otra paquetería: un renglón más en CARRIERS.
 *  Sin secretos: se puede importar desde el navegador.
 * ============================================================================
 */

export type CarrierId = "estafeta" | "dhl" | "local";

interface CarrierInfo {
  /** Nombre visible en cada idioma. */
  label: { es: string; en: string };
  /** ¿Lleva número de guía? (la entrega local no). */
  needsTracking: boolean;
  /** Enlace para rastrear (si la paquetería tiene página de rastreo). */
  trackingUrl?: (trackingNumber: string) => string;
  /** true si el enlace NO llena la guía y el cliente debe pegarla. */
  pasteNumber?: boolean;
}

export const CARRIERS: Record<CarrierId, CarrierInfo> = {
  estafeta: {
    label: { es: "Estafeta", en: "Estafeta" },
    needsTracking: true,
    trackingUrl: () => "https://www.estafeta.com/rastrear-envio",
    pasteNumber: true,
  },
  dhl: {
    label: { es: "DHL", en: "DHL" },
    needsTracking: true,
    trackingUrl: (n) =>
      `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${encodeURIComponent(n)}&submit=1`,
  },
  local: {
    label: { es: "Entrega local en Mazatlán", en: "Local delivery in Mazatlán" },
    needsTracking: false,
  },
};

/** Orden en que aparecen en las listas. */
export const CARRIER_IDS: CarrierId[] = ["estafeta", "dhl", "local"];

export function isCarrierId(value: unknown): value is CarrierId {
  return typeof value === "string" && Object.hasOwn(CARRIERS, value);
}

/** Nombre visible de una paquetería guardada (o el texto tal cual si es desconocida). */
export function carrierLabel(carrier: string | null, locale: string): string {
  if (!carrier) return "";
  const lang = locale === "en" ? "en" : "es";
  return isCarrierId(carrier) ? CARRIERS[carrier].label[lang] : carrier;
}

/** Enlace de rastreo de una guía guardada, o null si no aplica. */
export function carrierTrackingUrl(
  carrier: string | null,
  trackingNumber: string | null,
): string | null {
  if (!isCarrierId(carrier) || !trackingNumber) return null;
  return CARRIERS[carrier].trackingUrl?.(trackingNumber) ?? null;
}

/** ¿El cliente debe copiar la guía en la página de la paquetería? */
export function carrierNeedsPaste(carrier: string | null): boolean {
  return isCarrierId(carrier) && CARRIERS[carrier].pasteNumber === true;
}

/** Datos de envío ya validados. */
export interface ShipmentData {
  carrier: CarrierId;
  /** null en entrega local. */
  trackingNumber: string | null;
}

/** Formato de una guía: letras, números y guiones, de 5 a 40 caracteres. */
const TRACKING_REGEX = /^[A-Za-z0-9-]{5,40}$/;

/**
 * Revisa lo que mandó el panel. Quita espacios de la guía (las guías se
 * copian a veces con espacios en medio). Devuelve null si no es válido.
 */
export function parseShipmentInput(raw: unknown): ShipmentData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;
  if (!isCarrierId(input.carrier)) return null;

  if (!CARRIERS[input.carrier].needsTracking) {
    return { carrier: input.carrier, trackingNumber: null };
  }

  const tracking =
    typeof input.trackingNumber === "string"
      ? input.trackingNumber.replace(/\s+/g, "").toUpperCase()
      : "";
  if (!TRACKING_REGEX.test(tracking)) return null;

  return { carrier: input.carrier, trackingNumber: tracking };
}