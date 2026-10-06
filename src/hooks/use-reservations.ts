/**
 * ============================================================================
 * USE RESERVATIONS — MKATALINA (Fase 13 · Etapa 3: persistencia real)
 * ============================================================================
 *
 * QUÉ CAMBIÓ
 * ----------
 * El motor pasó de localStorage a la BASE DE DATOS (acciones de servidor). La
 * API que consume la UI es la MISMA de antes (mismos arrays filtrados, mismo
 * createReservation/completeReservation/cancelReservation, activeCount), más un
 * `isLoading` nuevo (aditivo). Por eso mis-apartados y ReservationCard siguen
 * funcionando casi igual.
 *
 * PATRÓN
 * ------
 *   - Espera a que la sesión se resuelva (if authLoading return) — evita el
 *     bucle infinito entre instancias que sufrimos con la wishlist.
 *   - Trae los apartados de la base una vez y los cachea en el store.
 *   - Crear/completar/cancelar son OPTIMISTAS: la UI cambia al instante y se
 *     persiste en segundo plano; si la base falla, se revierte.
 *
 * NOTA SOBRE EL PAGO (Etapa 4)
 * ----------------------------
 * En esta etapa el pago del anticipo sigue SIMULADO. El apartado se guarda como
 * "activo". Cuando conectemos PayPal real (Etapa 4), el cobro del anticipo y la
 * generación del apartado se moverán al servidor.
 * ============================================================================
 */

"use client";

import { useEffect } from "react";
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
import {
  getMyReservations,
  createReservationAction,
  completeReservationAction,
  cancelReservationAction,
} from "@/actions/reservations";

/** Input para crear un apartado (igual que antes). */
export interface CreateReservationInput {
  product: ProductSnapshot;
}

interface UseReservationsReturn {
  reservations: Reservation[];
  activeReservations: Reservation[];
  completedReservations: Reservation[];
  expiredReservations: Reservation[];
  cancelledReservations: Reservation[];
  activeCount: number;
  /** True mientras se traen los apartados de la base por primera vez. */
  isLoading: boolean;
  createReservation: (input: CreateReservationInput) => Reservation | null;
  completeReservation: (
    reservationId: string,
    deliveryMethod: DeliveryMethod,
  ) => void;
  cancelReservation: (reservationId: string) => void;
  getReservationById: (id: string) => Reservation | undefined;
}

export function useReservations(): UseReservationsReturn {
  const { user, isLoading: authLoading } = useAuth();

  const reservations = useReservationStore((s) => s.reservations);
  const status = useReservationStore((s) => s.status);
  const beginLoad = useReservationStore((s) => s.beginLoad);
  const finishLoad = useReservationStore((s) => s.finishLoad);
  const addReservation = useReservationStore((s) => s.addReservation);
  const removeReservation = useReservationStore((s) => s.removeReservation);
  const replaceReservation = useReservationStore((s) => s.replaceReservation);
  const reset = useReservationStore((s) => s.reset);

  // Sincronización con la base (mismo patrón/gate que la wishlist).
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (status !== "unloaded") reset();
      return;
    }
    if (beginLoad()) {
      getMyReservations()
        .then((rows) => finishLoad(rows))
        .catch(() => finishLoad([]));
    }
  }, [authLoading, user, status, beginLoad, finishLoad, reset]);

  // Arrays filtrados por status EFECTIVO (incluye el cálculo de expiración).
  const activeReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "active",
  );
  const completedReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "completed",
  );
  const expiredReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "expired",
  );
  const cancelledReservations = reservations.filter(
    (r) => getEffectiveStatus(r) === "cancelled",
  );

  const createReservation = (
    input: CreateReservationInput,
  ): Reservation | null => {
    if (!user) return null;

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + RESERVATION_DURATION_DAYS);

    // Anticipo del 20% (pesos enteros). El servidor lo recalcula por seguridad;
    // como usa la misma fórmula y el mismo precio, el valor coincide.
    const depositAmount = Math.round(
      input.product.price * RESERVATION_DEPOSIT_PERCENTAGE,
    );
    const remainingAmount = input.product.price - depositAmount;

    const reservation: Reservation = {
      // Prefijo APTD- para distinguirlo de los pedidos (MKTL-).
      id: `APTD-${Date.now().toString(36).toUpperCase()}${Math.random()
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

    addReservation(reservation); // optimista
    void createReservationAction(reservation).catch((error) => {
      removeReservation(reservation.id); // rollback
      console.error("No se pudo crear el apartado:", error);
    });

    return reservation;
  };

  const completeReservation = (
    reservationId: string,
    deliveryMethod: DeliveryMethod,
  ) => {
    if (!user) return;
    const prev = reservations.find((r) => r.id === reservationId);
    if (!prev) return;

    const updated: Reservation = {
      ...prev,
      status: "completed",
      deliveryMethod,
      completedAt: new Date().toISOString(),
    };
    replaceReservation(updated); // optimista
    void completeReservationAction(reservationId, deliveryMethod).catch(
      (error) => {
        replaceReservation(prev); // rollback
        console.error("No se pudo completar el apartado:", error);
      },
    );
  };

  const cancelReservation = (reservationId: string) => {
    if (!user) return;
    const prev = reservations.find((r) => r.id === reservationId);
    if (!prev) return;

    const updated: Reservation = { ...prev, status: "cancelled" };
    replaceReservation(updated); // optimista
    void cancelReservationAction(reservationId).catch((error) => {
      replaceReservation(prev); // rollback
      console.error("No se pudo cancelar el apartado:", error);
    });
  };

  const getReservationById = (id: string): Reservation | undefined =>
    reservations.find((r) => r.id === id);

  return {
    reservations,
    activeReservations,
    completedReservations,
    expiredReservations,
    cancelledReservations,
    activeCount: activeReservations.length,
    isLoading: authLoading || (!!user && status !== "loaded"),
    createReservation,
    completeReservation,
    cancelReservation,
    getReservationById,
  };
}