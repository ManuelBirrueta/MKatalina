/**
 * ============================================================================
 *  MKatalina · Diseño base de los correos · Fase 13 · Etapa 6A
 * ============================================================================
 *
 *  El "marco" que comparten todos los correos (encabezado con la marca,
 *  cuerpo y pie) más piezas reutilizables: botón, tabla de importes, bloque
 *  de dirección, formato de dinero y fechas.
 *
 *  ¿POR QUÉ TABLAS Y ESTILOS EN LÍNEA?
 *    Los programas de correo (Gmail, Outlook, Apple Mail) NO son navegadores
 *    modernos: ignoran hojas de estilo, Tailwind, flexbox y grid, y Outlook
 *    usa el motor de Word. Lo único que respetan todos es HTML con <table> y
 *    style="…" en cada elemento. Por eso este archivo se ve "a la antigua":
 *    es a propósito.
 *
 *  SEGURIDAD: todo texto que venga del cliente o de la base (nombres,
 *  direcciones, notas, nombres de producto) pasa por escapeHtml() antes de
 *  entrar al HTML. Así nadie puede inyectar código en un correo escribiendo,
 *  por ejemplo, "<script>" en su nombre.
 *
 *  Colores: los mismos de la tienda (globals.css): crema #FBF6F1, cacao
 *  #2D1F1A, cobre #B07953, gris cálido #8A7570, borde #E8DDD0.
 *
 *  Lo usan las plantillas de src/lib/email/templates.ts.
 * ============================================================================
 */

export type EmailLocale = "es" | "en";

/** Normaliza cualquier texto de idioma a "es" | "en" (español por defecto). */
export function toEmailLocale(locale: string | null | undefined): EmailLocale {
  return locale === "en" ? "en" : "es";
}

const COLORS = {
  background: "#FBF6F1",
  card: "#FFFFFF",
  text: "#2D1F1A",
  muted: "#8A7570",
  accent: "#B07953",
  border: "#E8DDD0",
  subtle: "#F5EFE8",
} as const;

const FONT = "Georgia, 'Times New Roman', serif"; // títulos (parecido a Playfair)
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"; // texto

/** Convierte caracteres especiales para que el texto no se interprete como HTML. */
export function escapeHtml(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** $1,250.00 MXN en el idioma del correo. */
export function formatMoney(pesos: number, locale: EmailLocale): string {
  const formatted = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "MXN",
    // "narrowSymbol" muestra "$" en ambos idiomas (en inglés saldría "MX$"),
    // y "MXN" se agrega al final para que no haya duda de la moneda.
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(pesos);
  return `${formatted} MXN`;
}

/** "13 de octubre de 2026, 9:41 p.m." en hora de Mazatlán. */
export function formatDateTime(date: Date, locale: EmailLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mazatlan",
  }).format(date);
}

/* ─────────────────────────── Piezas reutilizables ─────────────────────────── */

/** Título grande de la sección principal. */
export function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:normal;color:${COLORS.text};">${escapeHtml(text)}</h1>`;
}

/** Párrafo normal. `html` ya debe venir escapado si contiene datos del cliente. */
export function paragraph(html: string, options: { muted?: boolean } = {}): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.6;color:${options.muted ? COLORS.muted : COLORS.text};">${html}</p>`;
}

/** Subtítulo pequeño en mayúsculas (como en la tienda). */
export function label(text: string): string {
  return `<p style="margin:24px 0 8px;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.accent};">${escapeHtml(text)}</p>`;
}

/** Botón (enlace con aspecto de botón; los correos no admiten <button>). */
export function button(text: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background:${COLORS.text};border-radius:6px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 28px;font-family:${SANS};font-size:14px;font-weight:bold;color:${COLORS.background};text-decoration:none;">${escapeHtml(text)}</a>
      </td>
    </tr>
  </table>`;
}

/** Una fila de la tabla de importes. */
export interface AmountRow {
  label: string;
  value: string;
  /** Resalta la fila (total). */
  strong?: boolean;
  /** Texto gris (detalles secundarios). */
  muted?: boolean;
}

/** Tabla de dos columnas: concepto a la izquierda, importe a la derecha. */
export function amountsTable(rows: AmountRow[]): string {
  const cells = rows
    .map((row) => {
      const color = row.muted ? COLORS.muted : COLORS.text;
      const weight = row.strong ? "bold" : "normal";
      const border = row.strong ? `border-top:1px solid ${COLORS.border};` : "";
      const padding = row.strong ? "12px 0 4px" : "6px 0";
      return `
      <tr>
        <td style="${border}padding:${padding};font-family:${SANS};font-size:14px;color:${color};font-weight:${weight};">${escapeHtml(row.label)}</td>
        <td align="right" style="${border}padding:${padding};font-family:${SANS};font-size:14px;color:${color};font-weight:${weight};white-space:nowrap;">${escapeHtml(row.value)}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table>`;
}

/** Bloque gris con varias líneas (dirección, datos de entrega…). Escapa el texto. */
export function infoBox(lines: string[]): string {
  const html = lines
    .filter((line) => line.trim() !== "")
    .map((line) => escapeHtml(line))
    .join("<br>");
  return `<div style="background:${COLORS.subtle};border-radius:6px;padding:16px;font-family:${SANS};font-size:14px;line-height:1.6;color:${COLORS.text};">${html}</div>`;
}

/* ─────────────────────────────── El marco ─────────────────────────────── */

const FOOTER = {
  es: {
    tagline: "Joyería artesanal mexicana hecha a mano · Mazatlán, Sinaloa",
    why: "Recibes este correo por una compra o apartado que hiciste en MKatalina.",
    help: "¿Dudas? Responde a este correo y con gusto te ayudamos.",
  },
  en: {
    tagline: "Handmade Mexican artisan jewelry · Mazatlán, Sinaloa",
    why: "You're receiving this email because of a purchase or reservation you made at MKatalina.",
    help: "Questions? Just reply to this email and we'll be happy to help.",
  },
} as const;

/**
 * Envuelve el contenido en el diseño completo del correo.
 *
 * @param preheader Texto corto que muestran Gmail/Outlook junto al asunto en
 *                  la bandeja de entrada (no se ve dentro del correo).
 * @param bodyHtml  Contenido ya armado con las piezas de arriba.
 */
export function renderLayout(params: {
  locale: EmailLocale;
  siteUrl: string;
  preheader: string;
  bodyHtml: string;
}): string {
  const { locale, siteUrl, preheader, bodyHtml } = params;
  const footer = FOOTER[locale];

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>MKatalina</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.background};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <!-- Encabezado con la marca -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${escapeHtml(`${siteUrl}/${locale}`)}" style="font-family:${FONT};font-size:28px;letter-spacing:4px;color:${COLORS.text};text-decoration:none;">MKatalina</a>
            </td>
          </tr>
          <!-- Tarjeta con el contenido -->
          <tr>
            <td style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:8px;padding:32px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Pie -->
          <tr>
            <td align="center" style="padding:24px 8px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.muted};">
              ${escapeHtml(footer.help)}<br>
              ${escapeHtml(footer.tagline)}<br>
              <a href="${escapeHtml(siteUrl)}" style="color:${COLORS.accent};text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a><br>
              <span style="font-size:11px;">${escapeHtml(footer.why)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}