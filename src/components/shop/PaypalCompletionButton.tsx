/**
 * ============================================================================
 * PAYPAL COMPLETION BUTTON — MKATALINA · Fase 13 · Etapas 5, 6A y 7
 *
 * Etapa 7: botón de tarjeta ARRIBA y PayPal abajo (PaypalButtonsStack),
 * igual que en el checkout.
 *
 * Etapa 6A: al cobrar también manda el idioma (locale) para que el correo de
 * confirmación de la liquidación llegue en el idioma del cliente.
 * ============================================================================
 *
 * Botón real de PayPal para COMPLETAR un apartado (pagar el 80% restante,
 * más el envío si el cliente eligió envío a domicilio). Lo muestra
 * CompleteReservationModal cuando el cliente ya eligió cómo recibir su pieza.
 *
 *   createOrder → createPaypalCompletionOrder (servidor): revisa que el
 *                 apartado sea del cliente, siga ACTIVO y no haya vencido, y
 *                 crea la orden por el resto + envío (montos de la base).
 *   onApprove   → capturePaypalCompletionOrder: marca el apartado COMPLETADO,
 *                 resta la pieza del stock, confirma el monto con PayPal y
 *                 cobra; si el cobro falla, lo deshace. Al terminar avisa con
 *                 onSuccess(completedAt).
 *
 * Mismo diseño que PaypalReservationButton (anticipo):
 *   - Muestra PayPal + tarjeta (pago como invitado de PayPal).
 *   - Los errores salen con los textos compartidos de
 *     src/lib/checkout-errors.ts, en el idioma del cliente.
 *   - handledErrorRef evita un segundo aviso genérico cuando createOrder ya
 *     mostró el motivo.
 *   - propsRef: los callbacks leen siempre los datos más recientes (entrega y
 *     dirección) sin recrearse, porque PayPal no acepta callbacks nuevos una
 *     vez que dibujó sus botones.
 * ============================================================================
 */

"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  PayPalScriptProvider,
  type PayPalButtonsComponentProps,
  type ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";
import { PaypalButtonsStack } from "@/components/shop/PaypalButtonsStack";
import { toast } from "sonner";
import {
  createPaypalCompletionOrder,
  capturePaypalCompletionOrder,
} from "@/actions/paypal";
import { checkoutErrorMessage } from "@/lib/checkout-errors";
import type { CompletionDelivery } from "@/lib/reservation-delivery";

interface PaypalCompletionButtonProps {
  reservationId: string;
  delivery: CompletionDelivery;
  locale: string;
  /** Se llama cuando el cobro salió bien, con la fecha de completado. */
  onSuccess: (completedAt: string) => void;
  /** Avisa si el cobro está en curso (el modal bloquea el cierre). */
  onProcessingChange?: (processing: boolean) => void;
}

export function PaypalCompletionButton(props: PaypalCompletionButtonProps) {
  const propsRef = useRef(props);
  propsRef.current = props;

  // true cuando createOrder ya mostró su propio aviso (evita uno duplicado).
  const handledErrorRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const options = useMemo<ReactPayPalScriptOptions>(
    () => ({ clientId: clientId ?? "", currency: "MXN", intent: "capture" }),
    [clientId],
  );

  const createOrder = useCallback<
    NonNullable<PayPalButtonsComponentProps["createOrder"]>
  >(async () => {
    const p = propsRef.current;
    const res = await createPaypalCompletionOrder({
      reservationId: p.reservationId,
      delivery: p.delivery,
    });
    if (!res.paypalOrderId) {
      handledErrorRef.current = true;
      toast.error(checkoutErrorMessage(res.error, p.locale));
      throw new Error(res.error ?? "createPaypalCompletionOrder failed");
    }
    return res.paypalOrderId;
  }, []);

  const onApprove = useCallback<
    NonNullable<PayPalButtonsComponentProps["onApprove"]>
  >(async (data) => {
    const p = propsRef.current;
    p.onProcessingChange?.(true);
    try {
      const res = await capturePaypalCompletionOrder(data.orderID, {
        reservationId: p.reservationId,
        delivery: p.delivery,
        locale: p.locale,
      });
      if (res.success && res.completedAt) {
        p.onSuccess(res.completedAt);
      } else {
        toast.error(checkoutErrorMessage(res.error, p.locale));
      }
    } finally {
      p.onProcessingChange?.(false);
    }
  }, []);

  const onError = useCallback<
    NonNullable<PayPalButtonsComponentProps["onError"]>
  >((err) => {
    if (handledErrorRef.current) {
      handledErrorRef.current = false;
      return;
    }
    console.error("PayPal error:", err);
    const p = propsRef.current;
    toast.error(
      p.locale === "en"
        ? "There was a problem with PayPal."
        : "Hubo un problema con PayPal.",
    );
  }, []);

  if (!clientId) {
    return (
      <p className="text-xs text-destructive">
        PayPal no está configurado (falta NEXT_PUBLIC_PAYPAL_CLIENT_ID en .env).
      </p>
    );
  }

  return (
    <PayPalScriptProvider options={options}>
      <PaypalButtonsStack
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
}