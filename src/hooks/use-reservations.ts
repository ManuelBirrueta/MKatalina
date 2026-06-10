/**
 * ============================================================================
 * USE RESERVATIONS — KATALINA
 * ============================================================================
 *
 * Hook que expone API limpia sobre el reservation-store.
 *
 * Patrón idéntico a useCart y useWishlist: el componente no conoce Zustand,
 * solo consume este hook con tipos claros.
 *
 * Cuando llegue el backend en Fase 12:
 *   - Reemplazamos la implementación por queries/mutations (TanStack Query)
 *   - Los componentes que consumen el hook NO cambian
 *
 * Comportamiento sin sesión:
 *   - reservations devuelve []
 *   - createReservation no-op
 *   - Componentes que llaman create deben verificar sesión antes (igual
 *     que con wishlist)
 *
 * Filtrado automático por status:
 *   El hook expone arrays filtrados para conveniencia: activeReservations,
 *   completedReservations, expiredReservations. Esto evita que cada
 *   componente reimplemente la lógica de filtrado.
 * ============================================================================
 */

"use client";

import { useReservationStore } from "@/stores/reservation-store";
import { useAuth } from "@/hooks/use-auth";
import {
  RESERVATION_DURATION_DAYS,
  RESERVATION_DEPOSIT_PERCENTAGE,
  getEffectiveStatus,
  type Reservation,
  type DeliveryMethod,
  type ProductSnapshot,
} from "@/types/reservation";

/**
 * Input para crear un apartado.
 * El hook se encarga de generar id, fechas, montos.
 */
export interface CreateReservationInput {
  product: ProductSnapshot;
}

interface UseReservationsReturn {
  /** Todas las reservaciones del usuario (sin filtrar) */
  reservations: Reservation[];

  /** Apartados vigentes (no expirados, no completados, no cancelados) */
  activeReservations: Reservation[];

  /** Apartados completados (pago final realizado) */
  completedReservations: Reservation[];

  /** Apartados expirados (pasaron 5 días sin pagar) */
  expiredReservations: Reservation[];

  /** Apartados cancelados voluntariamente */
  cancelledReservations: Reservation[];

  /**
   * Cantidad de apartados ACTIVOS (los que necesitan atención).
   * Es lo que mostramos como badge en el sidebar de cuenta.
   */
  activeCount: number;

  /**
   * Crear un apartado nuevo. Requiere sesión.
   * Devuelve el apartado creado o null si falló (sin sesión).
   */
  createReservation: (input: CreateReservationInput) => Reservation | null;

  /**
   * Completar un apartado (pagar el resto).
   * No-op si el usuario no es dueño del apartado.
   */
  completeReservation: (
    reservationId: string,
    deliveryMethod: DeliveryMethod
  ) => void;

  /** Cancelar un apartado voluntariamente */
  cancelReservation: (reservationId: string) => void;

  /** Buscar un apartado por ID */
  getReservationById: (id: string) => Reservation | undefined;
}

export function useReservations(): UseReservationsReturn {
  const { user } = useAuth();

  const reservationsByUserId = useReservationStore(
    (state) => state.reservationsByUserId
  );
  const createInStore = useReservationStore((state) => state.createReservation);
  const completeInStore = useReservationStore(
    (state) => state.completeReservation
  );
  const cancelInStore = useReservationStore((state) => state.cancelReservation);

  // Apartados del usuario actual (o array vacío si no hay sesión)
  const reservations = user
    ? (reservationsByUserId[user.id] ?? [])
    : [];

  /**
   * Filtrar por status efectivo (que combina persistido + expiración).
   * Esto es importante: un apartado con status "active" en la DB puede
   * estar realmente "expired" si pasaron 5 días. getEffectiveStatus
   * encapsula esa lógica.
   */
  const activeReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "active"
  );
  const completedReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "completed"
  );
  const expiredReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "expired"
  );
  const cancelledReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "cancelled"
  );

  /**
   * Crear apartado: genera id, fechas, calcula montos.
   */
  const createReservation = (
    input: CreateReservationInput
  ): Reservation | null => {
    if (!user) return null;

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + RESERVATION_DURATION_DAYS);

    // Calcular anticipo (20% del precio del producto)
    // Math.round porque pesos mexicanos no usan decimales
    const depositAmount = Math.round(
      input.product.price * RESERVATION_DEPOSIT_PERCENTAGE
    );
    const remainingAmount = input.product.price - depositAmount;

    const reservation: Reservation = {
      id: `res-${Date.now().toString(36).toUpperCase()}${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
      userId: user.id,
      product: input.product,
      depositAmount,
      remainingAmount,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "active",
      deliveryMethod: null,
      completedAt: null,
    };

    createInStore(user.id, reservation);
    return reservation;
  };

  const completeReservation = (
    reservationId: string,
    deliveryMethod: DeliveryMethod
  ) => {
    if (!user) return;
    completeInStore(user.id, reservationId, deliveryMethod);
  };

  const cancelReservation = (reservationId: string) => {
    if (!user) return;
    cancelInStore(user.id, reservationId);
  };

  const getReservationById = (id: string): Reservation | undefined => {
    return reservations.find((r) => r.id === id);
  };

  return {
    reservations,
    activeReservations,
    completedReservations,
    expiredReservations,
    cancelledReservations,
    activeCount: activeReservations.length,
    createReservation,
    completeReservation,
    cancelReservation,
    getReservationById,
  };
}