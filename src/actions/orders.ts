/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: PEDIDOS · Fase 13 · Etapa 4
 * ============================================================================
 *
 *  createOrder    → persiste un pedido nuevo (cabecera + renglones).
 *  getMyOrders    → lista los pedidos del usuario actual (para "Mis pedidos").
 *
 *  Un pedido es un DOCUMENTO inmutable: guarda copias congeladas (nombre
 *  resuelto al idioma, precio, etiqueta de envío). El pago sigue SIMULADO en
 *  esta etapa (el cobro real con PayPal viene después), por eso el pedido se
 *  crea con estado PAGADO.
 *
 *  SEGURIDAD: el usuario se resuelve SIEMPRE en el servidor. getMyOrders solo
 *  devuelve pedidos del usuario logueado (filtra por profileId). Al crear, los
 *  montos se recalculan desde los precios reales.
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";
import { productsData } from "@/data/products";
import {
  SHIPPING_METHOD_PRICES,
  type ShippingMethodId,
  type CheckoutFormData,
} from "@/types/checkout";

// ── Tipos de entrada para crear (no exportados) ──
interface CreateOrderItemInput {
  slug: string;
  quantity: number;
  nameSnapshot: string;
  imageSnapshot?: string;
  categorySnapshot?: string;
}

interface CreateOrderInput {
  orderId: string;
  formData: CheckoutFormData;
  shippingMethodId: ShippingMethodId;
  shippingLabel: string;
  locale: string;
  items: CreateOrderItemInput[];
}

// ── Tipos de salida para la lista (no exportados; el page usa ReturnType) ──
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
 * Crea un pedido en la base (cabecera + renglones). Recalcula montos por
 * seguridad. Asocia al usuario si hay sesión; si no, queda como invitado.
 */
export async function createOrder(input: CreateOrderInput): Promise<void> {
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

  const f = input.formData;

  await prisma.order.create({
    data: {
      id: input.orderId,
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
      items: { create: itemsData },
    },
  });
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

/* ════════════════════════════════════════════════════════════════════════
 *  AÑADIR AL FINAL DE  src/actions/orders.ts
 * ────────────────────────────────────────────────────────────────────────
 *  No reemplaces el archivo: solo pega ESTA función al final. Reutiliza los
 *  imports que ya tiene orders.ts (prisma y getOptionalUser — getMyOrders ya
 *  los usa). Si por alguna razón no estuvieran, agrégalos:
 *      import { prisma } from "@/lib/prisma";
 *      import { getOptionalUser } from "@/lib/auth";
 * ════════════════════════════════════════════════════════════════════════ */

/**
 * getOrderById — devuelve UN pedido con sus renglones, SOLO si pertenece al
 * usuario con sesión. Si no hay sesión, o el pedido no existe, o es de otra
 * persona, devuelve null (seguridad: nadie ve pedidos ajenos adivinando el id).
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
    notes: order.notes,
    shippingLabel: order.shippingLabel,
    shippingCost: order.shippingCost,
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