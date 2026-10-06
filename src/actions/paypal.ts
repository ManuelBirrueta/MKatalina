/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: PAGOS PAYPAL · Fase 13 · Etapa 4
 * ============================================================================
 *
 *  PEDIDOS (carrito):
 *    - createPaypalOrder  / capturePaypalOrder
 *  APARTADOS (anticipo 20%):
 *    - createPaypalReservationOrder / capturePaypalReservationOrder
 *
 *  Patrón común: el monto se calcula EN EL SERVIDOR (precios reales), PayPal
 *  cobra, y SOLO si el pago queda completado se crea el registro en la base
 *  (pedido o apartado) con su id y el paypalOrderId. Nada se guarda sin pago.
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";
import { productsData } from "@/data/products";
import { Prisma } from "@prisma/client";
import {
  SHIPPING_METHOD_PRICES,
  type ShippingMethodId,
  type CheckoutFormData,
} from "@/types/checkout";
import {
  RESERVATION_DEPOSIT_PERCENTAGE,
  RESERVATION_DURATION_DAYS,
  type ProductSnapshot,
} from "@/types/reservation";
import { createPaypalOrderApi, capturePaypalOrderApi } from "@/lib/paypal";

/* ══════════════════════════════ PEDIDOS ══════════════════════════════ */

function computeOrderTotals(
  items: { slug: string; quantity: number }[],
  shippingMethodId: ShippingMethodId,
) {
  let subtotal = 0;
  for (const item of items) {
    const product = productsData.find((p) => p.slug === item.slug);
    subtotal += (product?.price ?? 0) * item.quantity;
  }
  const shippingCost = SHIPPING_METHOD_PRICES[shippingMethodId] ?? 0;
  return { subtotal, shippingCost, total: subtotal + shippingCost };
}

interface CreateOrderInput {
  items: { slug: string; quantity: number }[];
  shippingMethodId: ShippingMethodId;
}

export async function createPaypalOrder(
  input: CreateOrderInput,
): Promise<{ paypalOrderId: string | null }> {
  try {
    const { total } = computeOrderTotals(input.items, input.shippingMethodId);
    if (total <= 0) return { paypalOrderId: null };
    const paypalOrderId = await createPaypalOrderApi(total);
    return { paypalOrderId };
  } catch (error) {
    console.error("createPaypalOrder:", error);
    return { paypalOrderId: null };
  }
}

interface CaptureOrderItemInput {
  slug: string;
  quantity: number;
  nameSnapshot: string;
  imageSnapshot?: string;
  categorySnapshot?: string;
}

interface CaptureOrderInput {
  formData: CheckoutFormData;
  shippingMethodId: ShippingMethodId;
  shippingLabel: string;
  locale: string;
  items: CaptureOrderItemInput[];
}

export async function capturePaypalOrder(
  paypalOrderId: string,
  input: CaptureOrderInput,
): Promise<{ success: boolean; orderId?: string }> {
  try {
    const captured = await capturePaypalOrderApi(paypalOrderId);
    if (!captured) return { success: false };

    const user = await getOptionalUser();

    const itemsData = input.items.map((item) => {
      const product = productsData.find((p) => p.slug === item.slug);
      const unitPrice = product?.price ?? 0;
      return {
        productSlug: item.slug,
        nameSnapshot: item.nameSnapshot,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        imageSnapshot: item.imageSnapshot ?? null,
        categorySnapshot: item.categorySnapshot ?? null,
      };
    });

    const subtotal = itemsData.reduce((sum, i) => sum + i.lineTotal, 0);
    const shippingCost = SHIPPING_METHOD_PRICES[input.shippingMethodId] ?? 0;
    const total = subtotal + shippingCost;

    const orderId = `MKTL-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const f = input.formData;

    await prisma.order.create({
      data: {
        id: orderId,
        profileId: user?.id ?? null,
        email: f.email,
        phone: f.phone,
        firstName: f.firstName,
        lastName: f.lastName,
        address: f.address,
        addressLine2: f.addressLine2 || null,
        neighborhood: f.neighborhood,
        city: f.city,
        state: f.state,
        postalCode: f.postalCode,
        notes: f.notes || null,
        shippingMethodId: input.shippingMethodId,
        shippingLabel: input.shippingLabel,
        shippingCost,
        subtotal,
        total,
        status: "PAGADO",
        locale: input.locale,
        paypalOrderId,
        items: { create: itemsData },
      },
    });

    return { success: true, orderId };
  } catch (error) {
    console.error("capturePaypalOrder:", error);
    return { success: false };
  }
}

/* ════════════════════════════ APARTADOS ════════════════════════════ */

/**
 * Crea la orden de PayPal por el ANTICIPO (20% del precio), calculado en el
 * servidor desde el precio real del producto.
 */
export async function createPaypalReservationOrder(input: {
  slug: string;
}): Promise<{ paypalOrderId: string | null }> {
  try {
    const product = productsData.find((p) => p.slug === input.slug);
    const price = product?.price ?? 0;
    const deposit = Math.round(price * RESERVATION_DEPOSIT_PERCENTAGE);
    if (deposit <= 0) return { paypalOrderId: null };

    const paypalOrderId = await createPaypalOrderApi(deposit);
    return { paypalOrderId };
  } catch (error) {
    console.error("createPaypalReservationOrder:", error);
    return { paypalOrderId: null };
  }
}

/**
 * Captura el anticipo y, si quedó completado, crea el apartado en la base.
 * Los apartados REQUIEREN sesión (profileId obligatorio).
 */
export async function capturePaypalReservationOrder(
  paypalOrderId: string,
  input: { productSnapshot: ProductSnapshot; locale: string },
): Promise<{ success: boolean; reservationId?: string }> {
  try {
    const captured = await capturePaypalOrderApi(paypalOrderId);
    if (!captured) return { success: false };

    const user = await getOptionalUser();
    if (!user) return { success: false }; // apartar requiere cuenta

    // Montos desde el precio real (seguridad).
    const product = productsData.find(
      (p) => p.slug === input.productSnapshot.slug,
    );
    const price = product?.price ?? input.productSnapshot.price;
    const depositAmount = Math.round(price * RESERVATION_DEPOSIT_PERCENTAGE);
    const remainingAmount = price - depositAmount;

    // Vencimiento = ahora + 5 días.
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + RESERVATION_DURATION_DAYS);

    const reservationId = `APTD-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    // Snapshot limpio (sin undefined, que Prisma no acepta en JSON).
    const snapshot = JSON.parse(
      JSON.stringify(input.productSnapshot),
    ) as Prisma.InputJsonValue;

    await prisma.reservation.create({
      data: {
        id: reservationId,
        profileId: user.id,
        productSnapshot: snapshot,
        depositAmount,
        remainingAmount,
        status: "ACTIVO",
        deliveryMethod: null,
        expiresAt,
        completedAt: null,
        createdAt: now,
        paypalOrderId,
      },
    });

    return { success: true, reservationId };
  } catch (error) {
    console.error("capturePaypalReservationOrder:", error);
    return { success: false };
  }
}