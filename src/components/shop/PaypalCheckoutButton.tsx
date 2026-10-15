/**
 * ============================================================================
 * PAYPAL CHECKOUT BUTTON — MKATALINA · Fase 13 · Etapas 3C y 7
 * ============================================================================
 *
 * El botón real de PayPal del checkout. Flujo:
 *   1. onClick     → valida el formulario; si hay errores, no abre PayPal.
 *   2. createOrder → createPaypalOrder (servidor): verifica disponibilidad y
 *                    calcula el total con precios de la base.
 *   3. onApprove   → capturePaypalOrder (servidor): aparta las piezas, cobra
 *                    y crea el pedido; luego avisa con onSuccess(orderId).
 *
 * CAMBIO DE LA ETAPA 3C — MENSAJES CLAROS:
 *   El servidor ahora dice POR QUÉ no se pudo (sin piezas, pago rechazado…)
 *   y aquí se muestra ese motivo exacto (src/lib/checkout-errors.ts) en vez
 *   de un "no se pudo completar el pago" genérico.
 *
 *   Detalle técnico: si createOrder falla, PayPal además llama a onError.
 *   Para no mostrar DOS avisos, createOrder marca handledErrorRef y onError
 *   se salta su aviso genérico esa vez.
 *
 * CAMBIOS DE LA ETAPA 7:
 *   - Botones en este orden: "Tarjeta de débito o crédito" ARRIBA y PayPal
 *     abajo (PaypalButtonsStack).
 *   - createOrder manda el PAÍS de entrega: el envío se cobra según el país
 *     (src/lib/shipping-rates.ts). El nombre del método ya no se manda: lo
 *     pone el servidor.
 *
 * DATOS SIEMPRE FRESCOS: los props se guardan en un ref y los callbacks son
 * estables, para que el botón no se recargue en cada tecla del formulario.
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
import { createPaypalOrder, capturePaypalOrder } from "@/actions/paypal";
import { checkoutErrorMessage } from "@/lib/checkout-errors";
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
  formData: CheckoutFormData;
  locale: string;
  validate: () => boolean;
  onSuccess: (orderId: string) => void;
}

export function PaypalCheckoutButton(props: PaypalCheckoutButtonProps) {
  const propsRef = useRef(props);
  propsRef.current = props;

  // true cuando createOrder ya mostró su propio aviso (evita uno duplicado).
  const handledErrorRef = useRef(false);

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
      country: p.formData.country,
    });
    if (!res.paypalOrderId) {
      handledErrorRef.current = true;
      toast.error(checkoutErrorMessage(res.error, p.locale));
      throw new Error(res.error ?? "createPaypalOrder failed");
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
      locale: p.locale,
      items: p.items,
    });
    if (res.success && res.orderId) {
      p.onSuccess(res.orderId);
    } else {
      toast.error(checkoutErrorMessage(res.error, p.locale));
    }
  }, []);

  const onError = useCallback<
    NonNullable<PayPalButtonsComponentProps["onError"]>
  >((err) => {
    // Si createOrder ya avisó del motivo, no repetimos un aviso genérico.
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
        onClick={onClick}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
}