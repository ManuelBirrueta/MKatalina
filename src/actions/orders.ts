/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: PEDIDOS (lectura) · Fase 13 · Etapas 3C, 6B y 7
 * ============================================================================
 *
 *  getMyOrders  → lista los pedidos del usuario actual (para "Mis pedidos").
 *  getOrderById → un pedido completo, solo si es del usuario (detalle).
 *
 *  ETAPA 7: getOrderById devuelve también el país de entrega.
 *
 *  ETAPA 6B: getOrderById devuelve también los datos de envío (paquetería,
 *  número de guía, fechas de envío y entrega) para mostrarlos en el detalle.
 *
 *  CAMBIO DE LA ETAPA 3C — SE ELIMINÓ createOrder:
 *    Era de la época del pago simulado: creaba un pedido marcado como PAGADO
 *    sin cobrar nada. El checkout ya no la usaba (los pedidos se crean en
 *    capturePaypalOrder, src/actions/paypal.ts, ligados al cobro real), pero
 *    una Server Action es un punto de entrada público: cualquiera podía
 *    llamarla y crear pedidos "pagados" falsos. Por eso se quitó.
 *
 *  SEGURIDAD: el usuario se resuelve SIEMPRE en el servidor. Ambas funciones
 *  solo devuelven pedidos del usuario logueado (filtran por profileId).
 *  Un pedido es un DOCUMENTO inmutable: muestra las copias congeladas
 *  (nombre, precio, envío) guardadas al comprar.
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";

// ── Tipos de salida para la lista (no exportados; la página usa ReturnType) ──
interface OrderListItem {
  slug: string;
  name: string;
  quantity: number;
  lineTotal: number;
}

interface OrderSummary {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderListItem[];
}

/**
 * Devuelve los pedidos del usuario actual (más reciente primero), con un
 * resumen de sus renglones. Vacío si no hay sesión.
 */
export async function getMyOrders(): Promise<OrderSummary[]> {
  const user = await getOptionalUser();
  if (!user) return [];

  const rows = await prisma.order.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return rows.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    total: order.total,
    items: order.items.map((item) => ({
      slug: item.productSlug,
      name: item.nameSnapshot,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  }));
}

/**
 * getOrderById — devuelve UN pedido con sus renglones, SOLO si pertenece al
 * usuario con sesión. Si no hay sesión, o el pedido no existe, o es de otra
 * persona, devuelve null (nadie ve pedidos ajenos adivinando el id).
 */
export async function getOrderById(orderId: string) {
  const user = await getOptionalUser();
  if (!user) return null;

  const order = await prisma.order.findFirst({
    // findFirst con profileId = user.id: si el pedido no es suyo, no lo trae.
    where: { id: orderId, profileId: user.id },
    include: { items: true },
  });

  if (!order) return null;

  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    // Contacto
    email: order.email,
    phone: order.phone,
    // Envío
    firstName: order.firstName,
    lastName: order.lastName,
    address: order.address,
    addressLine2: order.addressLine2,
    neighborhood: order.neighborhood,
    city: order.city,
    state: order.state,
    postalCode: order.postalCode,
    // País de entrega (Etapa 7)
    country: order.country,
    notes: order.notes,
    shippingLabel: order.shippingLabel,
    shippingCost: order.shippingCost,
    // Seguimiento del envío (Etapa 6B)
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    // Montos
    subtotal: order.subtotal,
    total: order.total,
    // Renglones
    items: order.items.map((item) => ({
      slug: item.productSlug,
      name: item.nameSnapshot,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      image: item.imageSnapshot,
      category: item.categorySnapshot,
    })),
  };
}