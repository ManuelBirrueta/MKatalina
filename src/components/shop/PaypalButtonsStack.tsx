/**
 * ============================================================================
 * PAYPAL BUTTONS STACK — MKATALINA · Fase 13 · Etapa 7
 * ============================================================================
 *
 * Los botones de pago, en este orden:
 *   1. "Tarjeta de débito o crédito" (negro) — pago como invitado de PayPal:
 *      el cliente escribe su tarjeta sin necesitar cuenta de PayPal.
 *   2. "PayPal" (dorado) — para quien tiene cuenta.
 *
 * ¿Por qué dos botones separados? Con un solo <PayPalButtons> PayPal decide
 * el orden y siempre pone su botón amarillo primero. Dibujando cada forma de
 * pago por separado (fundingSource) nosotros elegimos el orden: tarjeta
 * arriba, como se pidió.
 *
 * Los dos botones usan EXACTAMENTE las mismas funciones (createOrder,
 * onApprove…): el cobro es el mismo, solo cambia cómo paga el cliente.
 * Si la tarjeta no está disponible para ese comprador (PayPal lo decide
 * según su país y la configuración de la cuenta), ese botón simplemente no
 * aparece y queda el de PayPal.
 *
 * Debe ir dentro de un <PayPalScriptProvider>. Lo usan:
 *   PaypalCheckoutButton (compra), PaypalReservationButton (anticipo) y
 *   PaypalCompletionButton (liquidación de apartados).
 * ============================================================================
 */

"use client";

import {
  FUNDING,
  PayPalButtons,
  type PayPalButtonsComponentProps,
} from "@paypal/react-paypal-js";

type Handlers = Pick<
  PayPalButtonsComponentProps,
  "createOrder" | "onApprove" | "onError" | "onClick" | "onCancel"
>;

export function PaypalButtonsStack(handlers: Handlers) {
  return (
    <div className="space-y-2">
      {/* 1) Tarjeta de débito o crédito */}
      <PayPalButtons
        fundingSource={FUNDING.CARD}
        style={{ layout: "vertical", color: "black", shape: "rect" }}
        {...handlers}
      />
      {/* 2) Cuenta de PayPal */}
      <PayPalButtons
        fundingSource={FUNDING.PAYPAL}
        style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
        {...handlers}
      />
    </div>
  );
}