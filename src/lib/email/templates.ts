/**
 * ============================================================================
 *  MKatalina · Plantillas de correos al cliente · Fase 13 · Etapas 6A, 6B y 7
 * ============================================================================
 *
 *  Tres correos para el CLIENTE, cada uno en español o inglés según el idioma
 *  en que compró:
 *
 *    orderConfirmationEmail       → pedido pagado (carrito).
 *    reservationDepositEmail      → anticipo del 20% pagado (apartado creado).
 *    reservationCompletedEmail    → apartado liquidado (80% + envío).
 *
 *  Etapa 6B (avisos de envío, los dispara el admin desde el panel):
 *    shipmentEmail                → pedido o pieza de apartado ENVIADO, con
 *                                   paquetería, guía y botón para rastrear.
 *    orderDeliveredEmail          → pedido ENTREGADO.
 *
 *  Cada función recibe datos SIMPLES (no filas de Prisma) y devuelve
 *  { subject, html, text }. No consultan la base ni envían nada: eso lo hace
 *  src/lib/email/transactional.ts. Separarlo así permite probar cómo se ve
 *  un correo sin base de datos ni Resend.
 *
 *  Etapa 7: las direcciones muestran el PAÍS (para envíos al extranjero) y
 *  el teléfono ya viene con lada ("+1 2125551234").
 *
 *  El diseño viene de src/lib/email/layout.ts. Los textos del cliente
 *  (nombres, dirección, notas) se escapan allí; aquí se usa escapeHtml en los
 *  pocos lugares donde se arma HTML a mano.
 * ============================================================================
 */

import {
  type EmailLocale,
  amountsTable,
  button,
  escapeHtml,
  formatDateTime,
  formatMoney,
  heading,
  infoBox,
  label,
  paragraph,
  renderLayout,
} from "./layout";
import { countryName } from "@/lib/countries";

/** Resultado de una plantilla. */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Dirección de envío (pedido o apartado con envío). */
export interface EmailAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  addressLine2: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string | null;
  /** País (ISO, ej. "MX"). null en datos anteriores a la Etapa 7 = México. */
  country: string | null;
}

/** Líneas legibles de una dirección (para el correo HTML y el de texto). */
function addressLines(a: EmailAddress, locale: EmailLocale): string[] {
  const phoneLabel = locale === "en" ? "Phone" : "Tel.";
  const notesLabel = locale === "en" ? "Notes" : "Notas";
  return [
    `${a.firstName} ${a.lastName}`,
    `${a.address}${a.addressLine2 ? `, ${a.addressLine2}` : ""}`,
    [a.neighborhood, a.postalCode].filter(Boolean).join(", "),
    [a.city, a.state].filter(Boolean).join(", "),
    countryName(a.country || "MX", locale),
    `${phoneLabel} ${a.phone}`,
    a.notes ? `${notesLabel}: ${a.notes}` : "",
  ].filter(Boolean);
}

/** Saludo con el nombre si lo tenemos. */
function greeting(firstName: string | null, locale: EmailLocale): string {
  const name = firstName?.trim();
  if (locale === "en") return name ? `Hi ${name},` : "Hi,";
  return name ? `Hola ${name}:` : "Hola:";
}

/* ═══════════════════════════ 1) PEDIDO PAGADO ═══════════════════════════ */

export interface OrderEmailData {
  id: string;
  createdAt: Date;
  firstName: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  shippingLabel: string;
  shippingCost: number;
  total: number;
  address: EmailAddress;
  /** true si compró con cuenta: se incluye el botón "Ver mi pedido". */
  hasAccount: boolean;
}

const ORDER_TEXT = {
  es: {
    subject: (id: string) => `Confirmamos tu pedido ${id} · MKatalina`,
    preheader: "Recibimos tu pago. Te avisaremos cuando enviemos tu pedido.",
    title: "¡Gracias por tu compra!",
    intro: "Recibimos tu pago y ya estamos preparando tu pedido. Te avisaremos por correo en cuanto lo enviemos.",
    orderNumber: "Número de pedido",
    date: "Fecha",
    products: "Tu pedido",
    subtotal: "Subtotal",
    total: "Total pagado",
    shipTo: "Enviaremos a",
    viewOrder: "Ver mi pedido",
    keep: "Guarda este correo: es tu comprobante de compra.",
    paidWith: "Pagado con PayPal.",
  },
  en: {
    subject: (id: string) => `Your order ${id} is confirmed · MKatalina`,
    preheader: "We received your payment. We'll let you know when your order ships.",
    title: "Thank you for your purchase!",
    intro: "We received your payment and we're already preparing your order. We'll email you as soon as it ships.",
    orderNumber: "Order number",
    date: "Date",
    products: "Your order",
    subtotal: "Subtotal",
    total: "Total paid",
    shipTo: "Shipping to",
    viewOrder: "View my order",
    keep: "Keep this email: it's your proof of purchase.",
    paidWith: "Paid with PayPal.",
  },
} as const;

export function orderConfirmationEmail(
  data: OrderEmailData,
  locale: EmailLocale,
  siteUrl: string,
): RenderedEmail {
  const t = ORDER_TEXT[locale];
  const money = (n: number) => formatMoney(n, locale);
  const orderUrl = `${siteUrl}/${locale}/mis-pedidos/${encodeURIComponent(data.id)}`;

  const rows = [
    ...data.items.map((item) => ({
      label: `${item.name} × ${item.quantity}`,
      value: money(item.lineTotal),
    })),
    { label: t.subtotal, value: money(data.subtotal), muted: true },
    { label: data.shippingLabel, value: money(data.shippingCost), muted: true },
    { label: t.total, value: money(data.total), strong: true },
  ];

  const body = [
    heading(t.title),
    paragraph(escapeHtml(greeting(data.firstName, locale))),
    paragraph(escapeHtml(t.intro)),
    paragraph(
      `<strong>${escapeHtml(t.orderNumber)}:</strong> ${escapeHtml(data.id)}<br>` +
        `<strong>${escapeHtml(t.date)}:</strong> ${escapeHtml(formatDateTime(data.createdAt, locale))}`,
    ),
    label(t.products),
    amountsTable(rows),
    paragraph(escapeHtml(t.paidWith), { muted: true }),
    label(t.shipTo),
    infoBox(addressLines(data.address, locale)),
    data.hasAccount ? button(t.viewOrder, orderUrl) : "",
    paragraph(escapeHtml(t.keep), { muted: true }),
  ].join("");

  const text = [
    t.title,
    "",
    greeting(data.firstName, locale),
    t.intro,
    "",
    `${t.orderNumber}: ${data.id}`,
    `${t.date}: ${formatDateTime(data.createdAt, locale)}`,
    "",
    `${t.products}:`,
    ...data.items.map((i) => `- ${i.name} × ${i.quantity}: ${money(i.lineTotal)}`),
    `${t.subtotal}: ${money(data.subtotal)}`,
    `${data.shippingLabel}: ${money(data.shippingCost)}`,
    `${t.total}: ${money(data.total)}`,
    "",
    `${t.shipTo}:`,
    ...addressLines(data.address, locale),
    "",
    data.hasAccount ? `${t.viewOrder}: ${orderUrl}` : "",
    t.keep,
  ].join("\n");

  return {
    subject: t.subject(data.id),
    html: renderLayout({ locale, siteUrl, preheader: t.preheader, bodyHtml: body }),
    text,
  };
}

/* ════════════════════════ 2) ANTICIPO DE APARTADO ════════════════════════ */

export interface ReservationDepositEmailData {
  id: string;
  firstName: string | null;
  productName: string;
  productPrice: number;
  depositAmount: number;
  remainingAmount: number;
  expiresAt: Date;
}

const DEPOSIT_TEXT = {
  es: {
    subject: (product: string) => `Apartaste ${product} · MKatalina`,
    preheader: "Tu pieza quedó apartada. Tienes 5 días para liquidarla.",
    title: "¡Tu pieza está apartada!",
    intro: "Recibimos tu anticipo y la pieza ya está reservada para ti. Nadie más puede comprarla mientras tu apartado esté vigente.",
    reservationNumber: "Número de apartado",
    product: "Producto",
    price: "Precio del producto",
    deposit: "Anticipo pagado (20%)",
    remaining: "Por pagar",
    deadlineTitle: "Fecha límite para liquidar",
    deadline: (date: string) =>
      `Tienes hasta el <strong>${date}</strong> para pagar el resto desde “Mis apartados”. Ahí también eliges si la recoges en tienda o te la enviamos.`,
    policy: "Si no se liquida antes de esa fecha, el apartado vence, la pieza vuelve a la tienda y el anticipo no es reembolsable.",
    cta: "Ver mis apartados",
  },
  en: {
    subject: (product: string) => `You reserved ${product} · MKatalina`,
    preheader: "Your piece is on hold. You have 5 days to pay the balance.",
    title: "Your piece is on hold!",
    intro: "We received your deposit and the piece is now reserved for you. No one else can buy it while your reservation is active.",
    reservationNumber: "Reservation number",
    product: "Product",
    price: "Product price",
    deposit: "Deposit paid (20%)",
    remaining: "Balance due",
    deadlineTitle: "Payment deadline",
    deadline: (date: string) =>
      `You have until <strong>${date}</strong> to pay the balance from “My reservations”. There you'll also choose store pickup or shipping.`,
    policy: "If the balance isn't paid by then, the reservation expires, the piece goes back on sale, and the deposit is non-refundable.",
    cta: "View my reservations",
  },
} as const;

export function reservationDepositEmail(
  data: ReservationDepositEmailData,
  locale: EmailLocale,
  siteUrl: string,
): RenderedEmail {
  const t = DEPOSIT_TEXT[locale];
  const money = (n: number) => formatMoney(n, locale);
  const deadline = formatDateTime(data.expiresAt, locale);
  const url = `${siteUrl}/${locale}/mis-apartados`;

  const body = [
    heading(t.title),
    paragraph(escapeHtml(greeting(data.firstName, locale))),
    paragraph(escapeHtml(t.intro)),
    paragraph(
      `<strong>${escapeHtml(t.reservationNumber)}:</strong> ${escapeHtml(data.id)}<br>` +
        `<strong>${escapeHtml(t.product)}:</strong> ${escapeHtml(data.productName)}`,
    ),
    amountsTable([
      { label: t.price, value: money(data.productPrice), muted: true },
      { label: t.deposit, value: money(data.depositAmount) },
      { label: t.remaining, value: money(data.remainingAmount), strong: true },
    ]),
    label(t.deadlineTitle),
    paragraph(t.deadline(escapeHtml(deadline))),
    paragraph(escapeHtml(t.policy), { muted: true }),
    button(t.cta, url),
  ].join("");

  const text = [
    t.title,
    "",
    greeting(data.firstName, locale),
    t.intro,
    "",
    `${t.reservationNumber}: ${data.id}`,
    `${t.product}: ${data.productName}`,
    `${t.price}: ${money(data.productPrice)}`,
    `${t.deposit}: ${money(data.depositAmount)}`,
    `${t.remaining}: ${money(data.remainingAmount)}`,
    "",
    `${t.deadlineTitle}: ${deadline}`,
    t.policy,
    "",
    `${t.cta}: ${url}`,
  ].join("\n");

  return {
    subject: t.subject(data.productName),
    html: renderLayout({ locale, siteUrl, preheader: t.preheader, bodyHtml: body }),
    text,
  };
}

/* ════════════════════════ 3) APARTADO LIQUIDADO ════════════════════════ */

export interface ReservationCompletedEmailData {
  id: string;
  firstName: string | null;
  productName: string;
  productPrice: number;
  depositAmount: number;
  remainingAmount: number;
  deliveryMethod: "pickup" | "shipping";
  /** Nombre del método de envío ya traducido (solo si es envío). */
  shippingLabel: string | null;
  shippingCost: number;
  /** Dirección de envío (solo si es envío). */
  address: EmailAddress | null;
}

const COMPLETED_TEXT = {
  es: {
    subject: (product: string) => `Apartado liquidado: ${product} · MKatalina`,
    preheader: "Recibimos el pago de tu apartado.",
    title: "¡Liquidaste tu apartado!",
    intro: "Recibimos tu pago. La pieza ya es tuya.",
    reservationNumber: "Número de apartado",
    product: "Producto",
    deposit: "Anticipo pagado antes",
    remaining: "Resto del producto",
    paidNow: "Pagado hoy",
    delivery: "Entrega",
    pickup: "Recoger en tienda. Te escribiremos para coordinar el día y la hora.",
    shipping: "Te avisaremos por correo cuando enviemos tu pieza.",
    shipTo: "Enviaremos a",
    cta: "Ver mis apartados",
  },
  en: {
    subject: (product: string) => `Reservation paid in full: ${product} · MKatalina`,
    preheader: "We received your reservation payment.",
    title: "Your reservation is paid in full!",
    intro: "We received your payment. The piece is all yours.",
    reservationNumber: "Reservation number",
    product: "Product",
    deposit: "Deposit paid earlier",
    remaining: "Remaining balance",
    paidNow: "Paid today",
    delivery: "Delivery",
    pickup: "Store pickup. We'll contact you to arrange the day and time.",
    shipping: "We'll email you when your piece ships.",
    shipTo: "Shipping to",
    cta: "View my reservations",
  },
} as const;

export function reservationCompletedEmail(
  data: ReservationCompletedEmailData,
  locale: EmailLocale,
  siteUrl: string,
): RenderedEmail {
  const t = COMPLETED_TEXT[locale];
  const money = (n: number) => formatMoney(n, locale);
  const url = `${siteUrl}/${locale}/mis-apartados`;
  const isShipping = data.deliveryMethod === "shipping";
  const paidNow = data.remainingAmount + data.shippingCost;

  const rows = [
    { label: t.deposit, value: money(data.depositAmount), muted: true },
    { label: t.remaining, value: money(data.remainingAmount) },
    ...(isShipping && data.shippingLabel
      ? [{ label: data.shippingLabel, value: money(data.shippingCost) }]
      : []),
    { label: t.paidNow, value: money(paidNow), strong: true },
  ];

  const body = [
    heading(t.title),
    paragraph(escapeHtml(greeting(data.firstName, locale))),
    paragraph(escapeHtml(t.intro)),
    paragraph(
      `<strong>${escapeHtml(t.reservationNumber)}:</strong> ${escapeHtml(data.id)}<br>` +
        `<strong>${escapeHtml(t.product)}:</strong> ${escapeHtml(data.productName)}`,
    ),
    amountsTable(rows),
    label(t.delivery),
    paragraph(escapeHtml(isShipping ? t.shipping : t.pickup)),
    isShipping && data.address
      ? label(t.shipTo) + infoBox(addressLines(data.address, locale))
      : "",
    button(t.cta, url),
  ].join("");

  const text = [
    t.title,
    "",
    greeting(data.firstName, locale),
    t.intro,
    "",
    `${t.reservationNumber}: ${data.id}`,
    `${t.product}: ${data.productName}`,
    ...rows.map((r) => `${r.label}: ${r.value}`),
    "",
    `${t.delivery}: ${isShipping ? t.shipping : t.pickup}`,
    ...(isShipping && data.address
      ? ["", `${t.shipTo}:`, ...addressLines(data.address, locale)]
      : []),
    "",
    `${t.cta}: ${url}`,
  ].join("\n");

  return {
    subject: t.subject(data.productName),
    html: renderLayout({ locale, siteUrl, preheader: t.preheader, bodyHtml: body }),
    text,
  };
}

/* ═════════════════════ 4) ENVIADO (pedido o apartado) ═════════════════════ */

export interface ShipmentEmailData {
  /** "order" = pedido del carrito; "reservation" = pieza de un apartado. */
  kind: "order" | "reservation";
  id: string;
  firstName: string | null;
  /** Productos que van en el paquete (nombre × cantidad). */
  items: { name: string; quantity: number }[];
  /** Nombre visible de la paquetería (ya en el idioma del correo). */
  carrierName: string;
  /** null en entrega local. */
  trackingNumber: string | null;
  /** Enlace para rastrear (null si no hay). */
  trackingUrl: string | null;
  /** true si el cliente debe pegar la guía en la página de la paquetería. */
  pasteNumber: boolean;
  address: EmailAddress | null;
  /** Enlace a su cuenta (Mis pedidos / Mis apartados), si tiene cuenta. */
  accountUrl: string | null;
}

const SHIPPED_TEXT = {
  es: {
    subject: (kind: "order" | "reservation", id: string) =>
      kind === "order"
        ? `Tu pedido ${id} va en camino · MKatalina`
        : `Tu pieza del apartado ${id} va en camino · MKatalina`,
    preheader: "Tu paquete ya salió. Aquí está tu número de guía.",
    title: "¡Tu pedido va en camino!",
    titleReservation: "¡Tu pieza va en camino!",
    intro: "Ya enviamos tu paquete. Estos son los datos para que le des seguimiento:",
    introLocal: "Tu pedido va en camino con nuestro repartidor en Mazatlán. Te contactaremos si hace falta coordinar la entrega.",
    number: (kind: "order" | "reservation") =>
      kind === "order" ? "Número de pedido" : "Número de apartado",
    carrier: "Paquetería",
    tracking: "Número de guía",
    track: "Rastrear mi paquete",
    paste: "En la página de la paquetería, copia y pega tu número de guía para ver dónde va tu paquete.",
    contents: "Contenido del paquete",
    shipTo: "Dirección de entrega",
    account: "Ver en mi cuenta",
  },
  en: {
    subject: (kind: "order" | "reservation", id: string) =>
      kind === "order"
        ? `Your order ${id} is on its way · MKatalina`
        : `Your piece from reservation ${id} is on its way · MKatalina`,
    preheader: "Your package has shipped. Here's your tracking number.",
    title: "Your order is on its way!",
    titleReservation: "Your piece is on its way!",
    intro: "Your package has shipped. Here are the details to track it:",
    introLocal: "Your order is on its way with our courier in Mazatlán. We'll contact you if we need to coordinate the delivery.",
    number: (kind: "order" | "reservation") =>
      kind === "order" ? "Order number" : "Reservation number",
    carrier: "Carrier",
    tracking: "Tracking number",
    track: "Track my package",
    paste: "On the carrier's page, copy and paste your tracking number to see where your package is.",
    contents: "Package contents",
    shipTo: "Delivery address",
    account: "View in my account",
  },
} as const;

export function shipmentEmail(
  data: ShipmentEmailData,
  locale: EmailLocale,
  siteUrl: string,
): RenderedEmail {
  const t = SHIPPED_TEXT[locale];
  const isLocal = data.trackingNumber === null;
  const title = data.kind === "order" ? t.title : t.titleReservation;

  const details =
    `<strong>${escapeHtml(t.number(data.kind))}:</strong> ${escapeHtml(data.id)}<br>` +
    `<strong>${escapeHtml(t.carrier)}:</strong> ${escapeHtml(data.carrierName)}` +
    (data.trackingNumber
      ? `<br><strong>${escapeHtml(t.tracking)}:</strong> <span style="font-family:monospace;font-size:16px;">${escapeHtml(data.trackingNumber)}</span>`
      : "");

  const body = [
    heading(title),
    paragraph(escapeHtml(greeting(data.firstName, locale))),
    paragraph(escapeHtml(isLocal ? t.introLocal : t.intro)),
    paragraph(details),
    data.trackingUrl ? button(t.track, data.trackingUrl) : "",
    data.trackingUrl && data.pasteNumber ? paragraph(escapeHtml(t.paste), { muted: true }) : "",
    label(t.contents),
    paragraph(
      data.items
        .map((i) => `${escapeHtml(i.name)} × ${i.quantity}`)
        .join("<br>"),
    ),
    data.address ? label(t.shipTo) + infoBox(addressLines(data.address, locale)) : "",
    data.accountUrl ? button(t.account, data.accountUrl) : "",
  ].join("");

  const text = [
    title,
    "",
    greeting(data.firstName, locale),
    isLocal ? t.introLocal : t.intro,
    "",
    `${t.number(data.kind)}: ${data.id}`,
    `${t.carrier}: ${data.carrierName}`,
    data.trackingNumber ? `${t.tracking}: ${data.trackingNumber}` : "",
    data.trackingUrl ? `${t.track}: ${data.trackingUrl}` : "",
    data.trackingUrl && data.pasteNumber ? t.paste : "",
    "",
    `${t.contents}:`,
    ...data.items.map((i) => `- ${i.name} × ${i.quantity}`),
    ...(data.address ? ["", `${t.shipTo}:`, ...addressLines(data.address, locale)] : []),
    data.accountUrl ? `\n${t.account}: ${data.accountUrl}` : "",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");

  return {
    subject: t.subject(data.kind, data.id),
    html: renderLayout({ locale, siteUrl, preheader: t.preheader, bodyHtml: body }),
    text,
  };
}

/* ═══════════════════════════ 5) PEDIDO ENTREGADO ═══════════════════════════ */

export interface DeliveredEmailData {
  id: string;
  firstName: string | null;
  items: { name: string; quantity: number }[];
  /** Enlace a Mis pedidos (si compró con cuenta). */
  accountUrl: string | null;
}

const DELIVERED_TEXT = {
  es: {
    subject: (id: string) => `Tu pedido ${id} fue entregado · MKatalina`,
    preheader: "Esperamos que disfrutes tus piezas.",
    title: "¡Tu pedido fue entregado!",
    intro: "Nos da mucho gusto que tus piezas ya estén contigo. Cada una está hecha a mano con mucho cariño; esperamos que las disfrutes.",
    number: "Número de pedido",
    contents: "Tu pedido",
    review: "Si te gustaron, nos ayudaría muchísimo que dejes una reseña en la página del producto. Y si algo no está bien, responde a este correo y lo resolvemos.",
    account: "Ver mis pedidos",
  },
  en: {
    subject: (id: string) => `Your order ${id} was delivered · MKatalina`,
    preheader: "We hope you enjoy your pieces.",
    title: "Your order was delivered!",
    intro: "We're so happy your pieces are with you. Each one is handmade with care; we hope you enjoy them.",
    number: "Order number",
    contents: "Your order",
    review: "If you love them, a review on the product page would help us a lot. And if anything isn't right, just reply to this email and we'll fix it.",
    account: "View my orders",
  },
} as const;

export function orderDeliveredEmail(
  data: DeliveredEmailData,
  locale: EmailLocale,
  siteUrl: string,
): RenderedEmail {
  const t = DELIVERED_TEXT[locale];

  const body = [
    heading(t.title),
    paragraph(escapeHtml(greeting(data.firstName, locale))),
    paragraph(escapeHtml(t.intro)),
    paragraph(`<strong>${escapeHtml(t.number)}:</strong> ${escapeHtml(data.id)}`),
    label(t.contents),
    paragraph(data.items.map((i) => `${escapeHtml(i.name)} × ${i.quantity}`).join("<br>")),
    paragraph(escapeHtml(t.review), { muted: true }),
    data.accountUrl ? button(t.account, data.accountUrl) : "",
  ].join("");

  const text = [
    t.title,
    "",
    greeting(data.firstName, locale),
    t.intro,
    "",
    `${t.number}: ${data.id}`,
    `${t.contents}:`,
    ...data.items.map((i) => `- ${i.name} × ${i.quantity}`),
    "",
    t.review,
    data.accountUrl ? `${t.account}: ${data.accountUrl}` : "",
  ].join("\n");

  return {
    subject: t.subject(data.id),
    html: renderLayout({ locale, siteUrl, preheader: t.preheader, bodyHtml: body }),
    text,
  };
}