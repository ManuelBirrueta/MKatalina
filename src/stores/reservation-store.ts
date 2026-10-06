/**
 * ============================================================================
 * RESERVATION STORE — MKATALINA (Fase 13 · Etapa 3: caché de la base de datos)
 * ============================================================================
 *
 * Igual que con la wishlist: antes guardaba TODOS los apartados de todos los
 * usuarios en localStorage; ahora la fuente de verdad es la BASE DE DATOS y
 * este store es solo una CACHÉ EN MEMORIA de los apartados del usuario actual.
 * Ya NO persiste en localStorage.
 *
 * El `status` + beginLoad() son el mismo cerrojo atómico de la wishlist, para
 * traer los apartados de la base UNA sola vez aunque varios componentes usen
 * el hook a la vez.
 * ============================================================================
 */

import { create } from "zustand";
import type { Reservation } from "@/types/reservation";

type CacheStatus = "unloaded" | "loading" | "loaded";

interface ReservationState {
  /** Apartados del usuario actual (más reciente primero). */
  reservations: Reservation[];
  /** En qué punto de la carga desde la base estamos. */
  status: CacheStatus;

  /** Cerrojo atómico: devuelve true solo al primero que carga. */
  beginLoad: () => boolean;
  /** Guarda los apartados traídos de la base y marca "loaded". */
  finishLoad: (reservations: Reservation[]) => void;

  /** Agrega un apartado al inicio (optimista, al crear). */
  addReservation: (reservation: Reservation) => void;
  /** Quita un apartado por id (para revertir un create fallido). */
  removeReservation: (id: string) => void;
  /** Reemplaza un apartado por su id (para completar/cancelar y sus rollbacks). */
  replaceReservation: (reservation: Reservation) => void;

  /** Reinicia la caché (al cerrar sesión). Idempotente. */
  reset: () => void;
}

export const useReservationStore = create<ReservationState>()((set, get) => ({
  reservations: [],
  status: "unloaded",

  beginLoad: () => {
    if (get().status !== "unloaded") return false;
    set({ status: "loading" });
    return true;
  },

  finishLoad: (reservations) => set({ reservations, status: "loaded" }),

  addReservation: (reservation) =>
    set((state) => ({ reservations: [reservation, ...state.reservations] })),

  removeReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.filter((r) => r.id !== id),
    })),

  replaceReservation: (reservation) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservation.id ? reservation : r,
      ),
    })),

  reset: () =>
    set((state) =>
      // Si ya está limpio, no re-renderizar (evita churn entre instancias).
      state.status === "unloaded" && state.reservations.length === 0
        ? state
        : { reservations: [], status: "unloaded" },
    ),
}));