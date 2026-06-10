/**
 * ============================================================================
 * RESERVATION TYPES — KATALINA
 * ============================================================================
 *
 * Tipos del sistema de apartado de productos.
 *
 * Reglas del negocio (decididas con el cliente):
 *   - Duración: 5 días desde la creación
 *   - Anticipo: 20% del precio del producto
 *   - Solo productos en stock se pueden apartar
 *   - 1 producto por apartado
 *   - Al expirar, pierde el anticipo y el producto vuelve a inventario
 *   - Al completar el pago, cliente elige recoger en tienda o envío
 *
 * En Fase 12 con backend:
 *   - Los apartados viven en una tabla `reservations` con FK al usuario y al producto
 *   - El backend maneja la lógica de expiración con un cron job
 *   - El "bloqueo de inventario" se hace en una tabla `product_stock_holds`
 * ============================================================================
 */

/**
 * Constantes del sistema.
 *
 * Las centralizamos aquí para que sea fácil cambiar las reglas del negocio
 * en un solo lugar. Si en el futuro decides cambiar a 7 días o 25% de
 * anticipo, solo cambias estos valores.
 */
export const RESERVATION_DURATION_DAYS = 5;
export const RESERVATION_DEPOSIT_PERCENTAGE = 0.20; // 20%

/**
 * Status de un apartado.
 *
 * Estados posibles:
 *   - active: apartado vigente, todavía dentro del plazo de 5 días
 *   - completed: el cliente pagó el restante, apartado cerrado exitosamente
 *   - expired: pasaron los 5 días sin pago, apartado cancelado, anticipo perdido
 *   - cancelled: el cliente canceló voluntariamente antes de expirar
 *     (mantiene la opción legal de cancelar; el anticipo NO se devuelve)
 *
 * Nota: el status "expired" se determina dinámicamente al renderizar
 * (comparando fechaExpiracion vs Date.now()) en lugar de marcarlo con un
 * timer. Esto es más robusto y no requiere mantener procesos corriendo.
 */
export type ReservationStatus = "active" | "completed" | "expired" | "cancelled";

/**
 * DeliveryMethod — cómo recibe el producto al completar el pago.
 *
 * null mientras no haya completado el pago (todavía no eligió).
 * Se asigna al pagar el restante.
 */
export type DeliveryMethod = "pickup" | "shipping" | null;

/**
 * ProductSnapshot — captura del producto al momento de apartar.
 *
 * Por qué guardamos un snapshot en lugar de solo el slug:
 *   - Si el precio del producto cambia después de crear el apartado, el
 *     cliente debe ver el precio que pactó al apartar, no el actual.
 *   - Si el producto se elimina del catálogo, el apartado sigue siendo
 *     legible (tiene toda la info necesaria).
 *   - Igual que con OrderSnapshot en la fase de checkout: una vez creado,
 *     el registro es inmutable.
 */
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

/**
 * Reservation — el record completo de un apartado.
 */
export interface Reservation {
  /** ID único del apartado (generado al crear) */
  id: string;

  /** ID del usuario que creó el apartado */
  userId: string;

  /** Snapshot del producto apartado (inmutable después de crear) */
  product: ProductSnapshot;

  /**
   * Monto del anticipo en MXN.
   * Calculado al crear como producto.price × RESERVATION_DEPOSIT_PERCENTAGE.
   * Se guarda en el record para que sea inmutable (si cambia la regla del
   * porcentaje, los apartados viejos mantienen su anticipo original).
   */
  depositAmount: number;

  /** Monto restante por pagar (= producto.price - depositAmount) */
  remainingAmount: number;

  /** Fecha de creación en formato ISO */
  createdAt: string;

  /** Fecha de expiración en formato ISO (= createdAt + 5 días) */
  expiresAt: string;

  /**
   * Status del apartado. NO incluye "expired" porque ese se calcula
   * dinámicamente. Los valores aquí son los persistidos:
   *   - active: vigente (puede o no estar expirado dinámicamente)
   *   - completed: cliente pagó el resto
   *   - cancelled: cliente lo canceló voluntariamente
   */
  status: "active" | "completed" | "cancelled";

  /**
   * Método de entrega elegido al completar el pago.
   * null mientras el apartado esté active.
   * Asignado solo cuando status pasa a "completed".
   */
  deliveryMethod: DeliveryMethod;

  /**
   * Fecha en que se completó el pago, si aplica.
   * null mientras status === "active" o "cancelled".
   */
  completedAt: string | null;
}

/**
 * Helper: calcular si un apartado está expirado.
 *
 * Compara expiresAt vs Date.now(). Esta función se llama al renderizar
 * la UI para mostrar el status efectivo (active vs expired) sin tener que
 * mutar el record en el store.
 *
 * Nota importante: si el status es "completed" o "cancelled", devuelve
 * false aunque haya pasado la fecha. Solo los apartados active pueden
 * estar expirados.
 */
export function isReservationExpired(reservation: Reservation): boolean {
  if (reservation.status !== "active") return false;
  return Date.now() > new Date(reservation.expiresAt).getTime();
}

/**
 * Helper: obtener el status efectivo (combina el persistido + expiración).
 *
 * Esta es la función que usa la UI para decidir cómo mostrar el apartado.
 * Devuelve uno de: "active", "completed", "expired", "cancelled".
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
 * Helper: calcular tiempo restante en milisegundos.
 *
 * Devuelve la diferencia entre expiresAt y ahora. Si es negativo,
 * el apartado ya expiró. La UI usa esto para mostrar contadores
 * regresivos ("Expira en 2 días 14 horas").
 */
export function getTimeRemaining(reservation: Reservation): number {
  return new Date(reservation.expiresAt).getTime() - Date.now();
}

/**
 * Helper: formatear tiempo restante como texto legible.
 *
 * Ejemplos de salida:
 *   - "4 días 12 horas"
 *   - "1 día 3 horas"
 *   - "5 horas 30 minutos"
 *   - "15 minutos"
 *   - "Expirado"
 *
 * La unidad más grande dictada por el tiempo restante:
 *   - >= 24 horas: muestra días + horas
 *   - 1-24 horas: muestra horas + minutos
 *   - < 1 hora: solo minutos
 */
export function formatTimeRemaining(reservation: Reservation): string {
  const ms = getTimeRemaining(reservation);

  if (ms <= 0) return "Expirado";

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    const remainingHours = totalHours - totalDays * 24;
    return `${totalDays} ${totalDays === 1 ? "día" : "días"} ${remainingHours} ${remainingHours === 1 ? "hora" : "horas"}`;
  }

  if (totalHours >= 1) {
    const remainingMinutes = totalMinutes - totalHours * 60;
    return `${totalHours} ${totalHours === 1 ? "hora" : "horas"} ${remainingMinutes} ${remainingMinutes === 1 ? "minuto" : "minutos"}`;
  }

  return `${totalMinutes} ${totalMinutes === 1 ? "minuto" : "minutos"}`;
}