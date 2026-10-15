/**
 * ============================================================================
 *  MKatalina · Mensajes de error del cobro · Fase 13 · Etapas 3C y 5
 * ============================================================================
 *
 *  Traduce el motivo de fallo que devuelven las acciones de PayPal
 *  (CheckoutError, src/actions/paypal.ts) a un texto para el cliente, en su
 *  idioma. Lo usan los tres botones de PayPal (checkout, anticipo de apartado
 *  y, desde la Etapa 5, completar apartado), así los mensajes son idénticos.
 *
 *  Etapa 5: nuevos motivos "expired" y "reservationUnavailable" (completar
 *  un apartado).
 *
 *  Importante: en "unavailable" y "paymentFailed" se le dice al cliente que
 *  NO se le cobró, y es cierto: en esos casos el cobro nunca se realiza (ver
 *  el orden "apartar piezas → cobrar" en capturePaypalOrder).
 * ============================================================================
 */

import type { CheckoutError } from "@/actions/paypal";

const MESSAGES: Record<CheckoutError, { es: string; en: string }> = {
  unavailable: {
    es: "Uno o más productos ya no están disponibles en la cantidad elegida. No se realizó ningún cargo. Revisa tu carrito.",
    en: "One or more items are no longer available in the selected quantity. You were not charged. Please review your cart.",
  },
  invalid: {
    es: "Revisa tu pedido e inténtalo de nuevo.",
    en: "Please review your order and try again.",
  },
  notAuthenticated: {
    es: "Inicia sesión para continuar.",
    en: "Please sign in to continue.",
  },
  paymentFailed: {
    es: "PayPal no pudo completar el pago. No se realizó ningún cargo.",
    en: "PayPal couldn't complete the payment. You were not charged.",
  },
  expired: {
    es: "Este apartado ya venció, así que no se puede completar. No se realizó ningún cargo.",
    en: "This reservation has expired, so it can no longer be completed. You were not charged.",
  },
  reservationUnavailable: {
    es: "No pudimos confirmar tu pieza en inventario. No se realizó ningún cargo; escríbenos y lo resolvemos.",
    en: "We couldn't confirm your piece in our inventory. You were not charged; please contact us and we'll sort it out.",
  },
  serverError: {
    es: "Ocurrió un problema al procesar tu pago. Inténtalo de nuevo en unos minutos.",
    en: "Something went wrong while processing your payment. Please try again in a few minutes.",
  },
};

/** Texto para el cliente según el motivo y el idioma. */
export function checkoutErrorMessage(
  error: CheckoutError | undefined,
  locale: string,
): string {
  const lang = locale === "en" ? "en" : "es";
  return MESSAGES[error ?? "serverError"][lang];
}