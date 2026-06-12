/**
 * ============================================================================
 * RESERVATION TYPES — KATALINA (Fase 12 Turno 3B.4: formatTimeRemaining bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - `formatTimeRemaining(reservation)` cambia firma a
 *     `formatTimeRemaining(reservation, t)` donde `t` es la función traductora
 *     de useTranslations para el namespace "reservation.card.active.timeRemaining".
 *   - Los textos "Expirado", "X día(s) Y hora(s)", "X hora(s) Y minuto(s)",
 *     "X minuto(s)" se construyen con t() en lugar de strings hardcoded.
 *
 * Lo que NO cambia:
 *   - Todos los demás tipos y funciones (Reservation, getEffectiveStatus,
 *     isReservationExpired, getTimeRemaining)
 *   - La lógica de cálculo de tiempo (totalMinutes, totalHours, totalDays)
 *
 * ─── POR QUÉ RECIBE t COMO PARÁMETRO ──────────────────────────────────
 *
 * formatTimeRemaining es una función PURA — no es un componente React,
 * por lo tanto NO puede llamar a hooks como useTranslations directamente.
 * Las funciones puras no tienen acceso al contexto de React.
 *
 * La solución es recibir las traducciones desde el caller (que SÍ es un
 * componente React que ha llamado a useTranslations).
 *
 * Patrón equivalente al que ya usamos en validateField (CheckoutForm,
 * ReviewForm) y getShippingMethodResolved (checkout). Consistencia ✓.
 *
 * ─── TIPADO DE LA FUNCIÓN t ────────────────────────────────────────────
 *
 * Usamos un type genérico `TranslateFn` que acepta una clave y devuelve
 * string. Esto es más liberal que el tipo estricto de next-intl que sería
 * `ReturnType<typeof useTranslations<"reservation.card.active.timeRemaining">>`
 * — pero más estricto sería frágil porque obligaría al caller a tener
 * exactamente ese namespace.
 *
 * Mantenemos la firma simple: el caller pasa cualquier `(key, values?) => string`
 * y nosotros confiamos en que tiene las claves correctas.
 * ─────────────────────────────────────────────────────────────────────
 */

/**
 * Constantes del sistema (sin cambios).
 */
export const RESERVATION_DURATION_DAYS = 5;
export const RESERVATION_DEPOSIT_PERCENTAGE = 0.20; // 20%

export type ReservationStatus = "active" | "completed" | "expired" | "cancelled";

export type DeliveryMethod = "pickup" | "shipping" | null;

export interface ProductSnapshot {
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  material: string;
  color: string;
  image: string;
}

export interface Reservation {
  id: string;
  userId: string;
  product: ProductSnapshot;
  depositAmount: number;
  remainingAmount: number;
  createdAt: string;
  expiresAt: string;
  status: "active" | "completed" | "cancelled";
  deliveryMethod: DeliveryMethod;
  completedAt: string | null;
}

/**
 * Tipo de la función traductora que recibe formatTimeRemaining.
 *
 * Acepta una clave (string) y opcionalmente valores para interpolación.
 * Devuelve el texto traducido.
 *
 * Liberal a propósito: cualquier función con esa firma sirve, sin importar
 * de qué namespace específico venga.
 */
type TranslateFn = (
  key: string,
  values?: Record<string, string | number>
) => string;

/**
 * Helper sin cambios: detecta si un apartado está expirado.
 */
export function isReservationExpired(reservation: Reservation): boolean {
  if (reservation.status !== "active") return false;
  return Date.now() > new Date(reservation.expiresAt).getTime();
}

/**
 * Helper sin cambios: obtiene el status efectivo combinando persistido + expiración.
 */
export function getEffectiveStatus(
  reservation: Reservation
): ReservationStatus {
  if (reservation.status === "completed") return "completed";
  if (reservation.status === "cancelled") return "cancelled";
  if (isReservationExpired(reservation)) return "expired";
  return "active";
}

/**
 * Helper sin cambios: tiempo restante en milisegundos.
 */
export function getTimeRemaining(reservation: Reservation): number {
  return new Date(reservation.expiresAt).getTime() - Date.now();
}

/**
 * Helper bilingüe: formatear tiempo restante como texto legible.
 *
 * @param reservation - El apartado a formatear
 * @param t - Función traductora para el namespace "reservation.card.active.timeRemaining"
 *
 * Ejemplos de salida en /es:
 *   - "Expirado"
 *   - "4 días 12 horas"
 *   - "1 día 3 horas"
 *   - "5 horas 30 minutos"
 *   - "15 minutos"
 *
 * Ejemplos de salida en /en:
 *   - "Expired"
 *   - "4 days 12 hours"
 *   - "1 day 3 hours"
 *   - "5 hours 30 minutes"
 *   - "15 minutes"
 *
 * Las claves que t() debe poder resolver:
 *   - expired
 *   - day (singular)
 *   - days (plural)
 *   - hour (singular)
 *   - hours (plural)
 *   - minute (singular)
 *   - minutes (plural)
 *
 * La lógica de pluralización se hace AQUÍ (no en messages.json) porque
 * son palabras simples sin interpolación compleja. Si en el futuro
 * necesitamos pluralización compleja (ej. ruso con 3 formas plurales),
 * lo migramos a `t.plural()` de next-intl.
 */
export function formatTimeRemaining(
  reservation: Reservation,
  t: TranslateFn
): string {
  const ms = getTimeRemaining(reservation);

  // Caso 1: expirado (devuelve el label traducido)
  if (ms <= 0) return t("expired");

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Caso 2: >= 1 día → muestra "X día/s Y hora/s"
  if (totalDays >= 1) {
    const remainingHours = totalHours - totalDays * 24;
    const dayWord = totalDays === 1 ? t("day") : t("days");
    const hourWord = remainingHours === 1 ? t("hour") : t("hours");
    return `${totalDays} ${dayWord} ${remainingHours} ${hourWord}`;
  }

  // Caso 3: 1-24 horas → muestra "X hora/s Y minuto/s"
  if (totalHours >= 1) {
    const remainingMinutes = totalMinutes - totalHours * 60;
    const hourWord = totalHours === 1 ? t("hour") : t("hours");
    const minuteWord = remainingMinutes === 1 ? t("minute") : t("minutes");
    return `${totalHours} ${hourWord} ${remainingMinutes} ${minuteWord}`;
  }

  // Caso 4: < 1 hora → solo minutos
  const minuteWord = totalMinutes === 1 ? t("minute") : t("minutes");
  return `${totalMinutes} ${minuteWord}`;
}