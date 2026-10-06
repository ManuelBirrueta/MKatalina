/**
 * ============================================================================
 * PAYPAL RESERVATION BUTTON — MKATALINA · Fase 13 · Etapa 4
 * ============================================================================
 *
 * Botón real de PayPal para pagar el ANTICIPO de un apartado. Mismo patrón que
 * el botón del checkout:
 *   createOrder → createPaypalReservationOrder (cobra el 20%, calculado en el
 *                 servidor) y devuelve el id de la orden de PayPal.
 *   onApprove   → capturePaypalReservationOrder: captura el anticipo y, si
 *                 quedó completado, crea el apartado en la base; luego avisa
 *                 con onSuccess(reservationId).
 *
 * Muestra PayPal + tarjeta (sin fundingSource). Usa ref para datos frescos y
 * callbacks estables (no recarga el botón innecesariamente).
 * ============================================================================
 */

"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  type PayPalButtonsComponentProps,
  type ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";
import { toast } from "sonner";
import {
  createPaypalReservationOrder,
  capturePaypalReservationOrder,
} from "@/actions/paypal";
import type { ProductSnapshot } from "@/types/reservation";

interface PaypalReservationButtonProps {
  productSnapshot: ProductSnapshot;
  locale: string;
  onSuccess: (reservationId: string) => void;
}

export function PaypalReservationButton(props: PaypalReservationButtonProps) {
  const propsRef = useRef(props);
  propsRef.current = props;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const options = useMemo<ReactPayPalScriptOptions>(
    () => ({ clientId: clientId ?? "", currency: "MXN", intent: "capture" }),
    [clientId],
  );

  const createOrder = useCallback<
    NonNullable<PayPalButtonsComponentProps["createOrder"]>
  >(async () => {
    const res = await createPaypalReservationOrder({
      slug: propsRef.current.productSnapshot.slug,
    });
    if (!res.paypalOrderId) {
      throw new Error("No se pudo crear la orden de PayPal");
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
      toast.error(
        p.locale === "en"
          ? "Payment could not be completed."
          : "No se pudo completar el pago.",
      );
    }
  }, []);

  const onError = useCallback<
    NonNullable<PayPalButtonsComponentProps["onError"]>
  >((err) => {
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
      <PayPalButtons
        style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
}