/**
 * ============================================================================
 * CHECKOUT TYPES — MKATALINA (Fase 13 · Etapa 7: envíos internacionales)
 * ============================================================================
 *
 * Tipos del formulario de compra.
 *
 * CAMBIOS DE LA ETAPA 7:
 *   - CheckoutFormData ahora es "correo + dirección internacional"
 *     (ShippingAddress de src/lib/address.ts): suma país de entrega y país de
 *     la lada del teléfono.
 *   - Los métodos y precios de envío se mudaron a src/lib/shipping-rates.ts,
 *     porque ahora dependen del país (México: estándar/express;
 *     extranjero: DHL Express con precio por zona). Por eso se quitaron
 *     SHIPPING_METHOD_IDS, SHIPPING_METHOD_PRICES, getShippingMethodsResolved,
 *     getShippingMethodResolved y el viejo SHIPPING_METHODS.
 *   - ShippingMethodId se sigue exportando desde aquí (reexportado) para no
 *     romper los imports existentes.
 * ============================================================================
 */

import { EMPTY_SHIPPING_ADDRESS, type ShippingAddress } from "@/lib/address";
import type { ShippingMethodId } from "@/lib/shipping-rates";

export type { ShippingMethodId };

/**
 * ShippingMethod — un método de envío ya "resuelto": nombre y descripción en
 * el idioma activo y precio para el país elegido. Es lo que muestran el
 * resumen del checkout y la confirmación.
 */
export interface ShippingMethod {
  id: ShippingMethodId;
  label: string;
  description: string;
  /** Precio en pesos mexicanos. */
  price: number;
}

/** Todos los campos del formulario de compra. */
export interface CheckoutFormData extends ShippingAddress {
  /** Correo para la confirmación del pedido. */
  email: string;
}

/** Valores iniciales del formulario (país: México). */
export const EMPTY_FORM_DATA: CheckoutFormData = {
  email: "",
  ...EMPTY_SHIPPING_ADDRESS,
};

/** Mensajes de error por campo (ya traducidos). */
export type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;