/**
 * ============================================================================
 * USE RESERVATIONS — MKATALINA (Fase 13 · Etapa 5: completar con cobro real)
 * ============================================================================
 *
 * Los apartados del usuario: leerlos, reflejar los completados y cancelarlos.
 * Los usan "Mis apartados", ReservationCard y CompleteReservationModal.
 *
 * CAMBIO DE LA ETAPA 5 — completeReservation → markReservationCompleted:
 *   Antes, completeReservation marcaba el apartado como pagado (optimista) y
 *   llamaba a completeReservationAction, que lo guardaba SIN cobrar el 80%.
 *   Ahora el cobro y el cambio en la base los hace el servidor
 *   (capturePaypalCompletionOrder, src/actions/paypal.ts). Cuando el cobro
 *   sale bien, el modal llama a markReservationCompleted para que la tarjeta
 *   cambie al instante, sin recargar. Ya no es optimista: solo se marca
 *   DESPUÉS de que el servidor confirmó el cobro.
 *
 * CAMBIO DE LA ETAPA 3D — SE RETIRÓ createReservation:
 *   Creaba el apartado desde el navegador sin cobrar el anticipo (época del
 *   pago simulado). Hoy los apartados SOLO se crean en el servidor junto con
 *   el cobro real del anticipo (capturePaypalReservationOrder, desde
 *   ReservationModal → PaypalReservationButton). Por eso se quitaron también
 *   CreateReservationInput y los imports que solo ella usaba.
 *
 * PATRÓN
 * ------
 *   - Espera a que la sesión se resuelva (if authLoading return): evita el
 *     bucle infinito entre instancias que sufrimos con la wishlist.
 *   - Trae los apartados de la base una vez y los guarda en el store.
 *   - Cancelar es OPTIMISTA: la UI cambia al instante y se persiste en
 *     segundo plano; si la base falla, se revierte.
 * ============================================================================
 */

"use client";

import { useEffect } from "react";
import { useReservationStore } from "@/stores/reservation-store";
import { useAuth } from "@/hooks/use-auth";
import {
  getEffectiveStatus,
  type Reservation,
  type DeliveryMethod,
} from "@/types/reservation";
import {
  getMyReservations,
  cancelReservationAction,
} from "@/actions/reservations";

interface UseReservationsReturn {
  reservations: Reservation[];
  activeReservations: Reservation[];
  completedReservations: Reservation[];
  expiredReservations: Reservation[];
  cancelledReservations: Reservation[];
  activeCount: number;
  /** True mientras se traen los apartados de la base por primera vez. */
  isLoading: boolean;
  /**
   * Refleja en pantalla un apartado que el SERVIDOR ya completó y cobró
   * (lo llama CompleteReservationModal tras un cobro exitoso).
   */
  markReservationCompleted: (
    reservationId: string,
    deliveryMethod: Exclude<DeliveryMethod, null>,
    completedAt: string,
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

  const markReservationCompleted = (
    reservationId: string,
    deliveryMethod: Exclude<DeliveryMethod, null>,
    completedAt: string,
  ) => {
    const prev = reservations.find((r) => r.id === reservationId);
    if (!prev) return;
    // Sin llamada al servidor: el cobro y el guardado ya ocurrieron allá.
    replaceReservation({
      ...prev,
      status: "completed",
      deliveryMethod,
      completedAt,
    });
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
    markReservationCompleted,
    cancelReservation,
    getReservationById,
  };
}