/**
 * ============================================================================
 * RESERVATION STORE — KATALINA
 * ============================================================================
 *
 * Store de Zustand para apartados de productos.
 *
 * Estructura: igual que wishlist-store, los apartados son POR-USUARIO:
 *
 *   {
 *     "user-mock-001": [reservation1, reservation2],
 *     "user-mock-002": [reservation3]
 *   }
 *
 * Por qué guardar todas las reservaciones juntas:
 *   - Misma razón que wishlist: si el usuario A cierra sesión, sus
 *     apartados siguen ahí cuando vuelva
 *   - Si el usuario B inicia sesión en el mismo navegador, solo ve los suyos
 *
 * Acciones expuestas:
 *   - createReservation: crea un apartado nuevo
 *   - completeReservation: marca como completed (paga el restante)
 *   - cancelReservation: marca como cancelled
 *
 * Nota: NO hay acción "expireReservation" porque la expiración se calcula
 * dinámicamente al renderizar (ver getEffectiveStatus en types/reservation.ts).
 *
 * En Fase 12 con backend:
 *   - Tabla reservations con FK al usuario y al producto
 *   - Endpoint POST /api/reservations crea con validación de stock
 *   - Cron job marca como expired las que pasaron 5 días sin pago
 *   - El producto se "bloquea" durante el apartado vía product_stock_holds
 * ============================================================================
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Reservation, DeliveryMethod } from "@/types/reservation";

interface ReservationState {
  /** Mapa userId → array de reservaciones */
  reservationsByUserId: Record<string, Reservation[]>;

  /**
   * Crear un apartado nuevo. Lo agrega al array del usuario.
   *
   * El ID se genera al llamar esta acción (no se pasa como parámetro)
   * para garantizar unicidad. Mismo patrón que en cart-store con los items.
   */
  createReservation: (userId: string, reservation: Reservation) => void;

  /**
   * Completar el pago de un apartado. Lo marca como "completed" y guarda
   * el método de entrega elegido.
   */
  completeReservation: (
    userId: string,
    reservationId: string,
    deliveryMethod: DeliveryMethod
  ) => void;

  /**
   * Cancelar un apartado voluntariamente.
   * El anticipo NO se devuelve (regla del negocio).
   */
  cancelReservation: (userId: string, reservationId: string) => void;
}

export const useReservationStore = create<ReservationState>()(
  persist(
    (set) => ({
      reservationsByUserId: {},

      createReservation: (userId, reservation) => {
        set((state) => {
          const currentList = state.reservationsByUserId[userId] ?? [];
          return {
            reservationsByUserId: {
              ...state.reservationsByUserId,
              // Nuevos apartados al inicio (más reciente primero)
              [userId]: [reservation, ...currentList],
            },
          };
        });
      },

      completeReservation: (userId, reservationId, deliveryMethod) => {
        set((state) => {
          const currentList = state.reservationsByUserId[userId] ?? [];
          return {
            reservationsByUserId: {
              ...state.reservationsByUserId,
              [userId]: currentList.map((r) =>
                r.id === reservationId
                  ? {
                      ...r,
                      status: "completed" as const,
                      deliveryMethod,
                      completedAt: new Date().toISOString(),
                    }
                  : r
              ),
            },
          };
        });
      },

      cancelReservation: (userId, reservationId) => {
        set((state) => {
          const currentList = state.reservationsByUserId[userId] ?? [];
          return {
            reservationsByUserId: {
              ...state.reservationsByUserId,
              [userId]: currentList.map((r) =>
                r.id === reservationId
                  ? { ...r, status: "cancelled" as const }
                  : r
              ),
            },
          };
        });
      },
    }),
    {
      name: "katalina-reservations-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);