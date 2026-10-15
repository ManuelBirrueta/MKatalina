/**
 * ============================================================================
 *  MKatalina · Entrega al completar un apartado · Fase 13 · Etapas 5 y 7
 * ============================================================================
 *
 *  Reglas de CÓMO recibe el cliente su pieza cuando paga el 80% restante:
 *
 *    - "pickup"   → recoge en tienda. Sin costo, sin dirección.
 *    - "shipping" → envío a domicilio, en México o (desde la Etapa 7) en
 *                   cualquier país. Necesita un método de envío válido PARA
 *                   ESE PAÍS y una dirección completa. El envío se SUMA al
 *                   cobro con las mismas tarifas del checkout
 *                   (src/lib/shipping-rates.ts):
 *                     México → estándar $99 / express $199
 *                     Extranjero → DHL Express con precio por zona
 *
 *  Lo usan los dos lados:
 *    - El modal (CompleteReservationModal) arma el objeto con estos tipos y
 *      calcula el total que muestra con completionShippingCost().
 *    - El servidor (acciones de src/actions/paypal.ts) lo vuelve a revisar
 *      con parseCompletionDelivery() y calcula el monto a cobrar por su
 *      cuenta: nunca usa un total que venga del navegador.
 *
 *  CAMBIO DE LA ETAPA 7: la dirección es la internacional de
 *  src/lib/address.ts (país, lada, estado/provincia y código postal libres),
 *  la misma del checkout, con las mismas reglas.
 *
 *  Sin secretos: se puede importar desde el navegador.
 * ============================================================================
 */

import { validateAddress, type ShippingAddress } from "@/lib/address";
import {
  getShippingCost,
  isShippingMethodId,
  type ShippingMethodId,
} from "@/lib/shipping-rates";

/** Dirección de envío de un apartado (la misma forma que la del checkout). */
export type DeliveryAddress = ShippingAddress;

/** Cómo se entrega la pieza al completar el apartado. */
export type CompletionDelivery =
  | { method: "pickup" }
  | {
      method: "shipping";
      shippingMethodId: ShippingMethodId;
      address: DeliveryAddress;
    };

/**
 * Costo del envío en pesos (0 si recoge en tienda, o si el método no aplica
 * al país; en ese caso parseCompletionDelivery ya lo habría rechazado).
 */
export function completionShippingCost(delivery: CompletionDelivery): number {
  if (delivery.method !== "shipping") return 0;
  return getShippingCost(delivery.address.country, delivery.shippingMethodId) ?? 0;
}

/**
 * Revisa lo que mandó el navegador. Devuelve la entrega limpia (teléfono ya
 * con lada), o null si no es válida (el servidor responde "invalid" y NO
 * cobra).
 */
export function parseCompletionDelivery(raw: unknown): CompletionDelivery | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;

  if (input.method === "pickup") return { method: "pickup" };

  if (input.method === "shipping") {
    if (!isShippingMethodId(input.shippingMethodId)) return null;

    const checked = validateAddress(input.address);
    if (!checked.ok) return null;

    // El método debe existir para ESE país (ej. "express" solo en México).
    if (getShippingCost(checked.data.country, input.shippingMethodId) === null) {
      return null;
    }

    return {
      method: "shipping",
      shippingMethodId: input.shippingMethodId,
      address: checked.data,
    };
  }

  return null;
}