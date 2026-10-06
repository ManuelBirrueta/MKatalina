/**
 * ============================================================================
 * PAYPAL CHECKOUT BUTTON — MKATALINA · Fase 13 · Etapa 4
 * ============================================================================
 *
 * El botón real de PayPal (reemplaza al botón simulado del checkout). Flujo:
 *   1. onClick     → valida el formulario; si hay errores, no abre PayPal.
 *   2. createOrder → llama a createPaypalOrder (servidor) y devuelve el id de
 *                    la orden de PayPal.
 *   3. onApprove   → el cliente aprobó: llama a capturePaypalOrder (servidor),
 *                    que cobra y crea el pedido; luego avisa a la página con
 *                    onSuccess(orderId).
 *
 * DETALLE TÉCNICO: datos siempre frescos sin recargar el botón.
 *   La página del checkout se re-renderiza en cada tecla (cambia el formulario).
 *   Para que el botón de PayPal NO se recargue en cada tecla (lo que se vería
 *   como un parpadeo), guardamos los props en un ref y los callbacks son
 *   estables (useCallback). Así el botón se monta una vez, pero al pagar lee
 *   SIEMPRE los datos más recientes desde el ref.
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
import { createPaypalOrder, capturePaypalOrder } from "@/actions/paypal";
import type { CheckoutFormData, ShippingMethodId } from "@/types/checkout";

export interface PreparedOrderItem {
  slug: string;
  quantity: number;
  nameSnapshot: string;
  imageSnapshot: string;
  categorySnapshot: string;
}

interface PaypalCheckoutButtonProps {
  items: PreparedOrderItem[];
  shippingMethodId: ShippingMethodId;
  shippingLabel: string;
  formData: CheckoutFormData;
  locale: string;
  /** Valida el formulario antes de abrir PayPal; true si está OK. */
  validate: () => boolean;
  /** Se llama tras un pago capturado, con el id del pedido creado. */
  onSuccess: (orderId: string) => void;
}

export function PaypalCheckoutButton(props: PaypalCheckoutButtonProps) {
  // Ref con los props más recientes (ver nota de la cabecera).
  const propsRef = useRef(props);
  propsRef.current = props;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const options = useMemo<ReactPayPalScriptOptions>(
    () => ({ clientId: clientId ?? "", currency: "MXN", intent: "capture" }),
    [clientId],
  );

  const onClick = useCallback<
    NonNullable<PayPalButtonsComponentProps["onClick"]>
  >((_data, actions) => {
    return propsRef.current.validate() ? actions.resolve() : actions.reject();
  }, []);

  const createOrder = useCallback<
    NonNullable<PayPalButtonsComponentProps["createOrder"]>
  >(async () => {
    const p = propsRef.current;
    const res = await createPaypalOrder({
      items: p.items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      shippingMethodId: p.shippingMethodId,
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
    const res = await capturePaypalOrder(data.orderID, {
      formData: p.formData,
      shippingMethodId: p.shippingMethodId,
      shippingLabel: p.shippingLabel,
      locale: p.locale,
      items: p.items,
    });
    if (res.success && res.orderId) {
      p.onSuccess(res.orderId);
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

  // Sin credenciales no renderizamos el botón (evita un error del SDK).
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
        onClick={onClick}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
}