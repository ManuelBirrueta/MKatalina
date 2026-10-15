/**
 * ============================================================================
 * PAYPAL RESERVATION BUTTON — MKATALINA · Fase 13 · Etapas 3C y 7
 *
 * Etapa 7: botón de tarjeta ARRIBA y PayPal abajo (PaypalButtonsStack),
 * igual que en el checkout.
 * ============================================================================
 *
 * Botón real de PayPal para pagar el ANTICIPO de un apartado:
 *   createOrder → createPaypalReservationOrder (servidor): exige sesión,
 *                 verifica que haya una pieza disponible y cobra el 20% del
 *                 precio vigente de la base.
 *   onApprove   → capturePaypalReservationOrder: crea el apartado (bloquea la
 *                 pieza), cobra y, si el cobro falla, lo deshace; luego avisa
 *                 con onSuccess(reservationId).
 *
 * CAMBIO DE LA ETAPA 3C: muestra el motivo exacto cuando no se puede apartar
 * (pieza ya apartada o agotada, sesión vencida, pago rechazado…), con los
 * mismos textos que el checkout (src/lib/checkout-errors.ts). Igual que en el
 * checkout, handledErrorRef evita un segundo aviso genérico de onError.
 *
 * Muestra PayPal + tarjeta. Usa ref para datos frescos y callbacks estables.
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
  createPaypalReservationOrder,
  capturePaypalReservationOrder,
} from "@/actions/paypal";
import { checkoutErrorMessage } from "@/lib/checkout-errors";
import type { ProductSnapshot } from "@/types/reservation";

interface PaypalReservationButtonProps {
  productSnapshot: ProductSnapshot;
  locale: string;
  onSuccess: (reservationId: string) => void;
}

export function PaypalReservationButton(props: PaypalReservationButtonProps) {
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
    const res = await createPaypalReservationOrder({
      slug: p.productSnapshot.slug,
    });
    if (!res.paypalOrderId) {
      handledErrorRef.current = true;
      toast.error(checkoutErrorMessage(res.error, p.locale));
      throw new Error(res.error ?? "createPaypalReservationOrder failed");
    }
    return res.paypalOrderId;
  }, []);

  const onApprove = useCallback<
    NonNullable<PayPalButtonsComponentProps["onApprove"]>
  >(async (data) => {
    const p = propsRef.current;
    const res = await capturePaypalReservationOrder(data.orderID, {
      productSnapshot: p.productSnapshot,
      locale: p.locale,
    });
    if (res.success && res.reservationId) {
      p.onSuccess(res.reservationId);
    } else {
      toast.error(checkoutErrorMessage(res.error, p.locale));
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