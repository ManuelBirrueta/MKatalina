/**
 * ============================================================================
 *  MKatalina · Estados de la República Mexicana · Fase 13 · Etapa 5
 * ============================================================================
 *
 *  Lista oficial de los 32 estados, en español (son nombres propios: no se
 *  traducen ni en /en).
 *
 *  La usan:
 *    - CompleteReservationModal: el selector de estado de la dirección de
 *      envío al completar un apartado.
 *    - src/lib/reservation-delivery.ts: el SERVIDOR revisa que el estado
 *      recibido sea uno de estos (no confía en lo que mande el navegador).
 *
 *  CheckoutForm.tsx tiene hoy su propia copia de esta lista (MEXICAN_STATES).
 *  Más adelante conviene que también importe esta, para tener una sola.
 * ============================================================================
 */

export const MEXICAN_STATES = [
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
] as const;

export type MexicanState = (typeof MEXICAN_STATES)[number];

/** ¿El texto es exactamente uno de los 32 estados? */
export function isMexicanState(value: string): value is MexicanState {
  return (MEXICAN_STATES as readonly string[]).includes(value);
}