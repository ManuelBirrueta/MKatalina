/**
 * ============================================================================
 *  MKatalina · Envío de correos con Resend (SERVIDOR) · Fase 13 · Etapa 6A
 * ============================================================================
 *
 *  Única puerta de salida de los correos del sitio. Todos los correos
 *  (confirmaciones de compra, apartados y, más adelante, avisos de envío)
 *  pasan por sendEmail().
 *
 *  VARIABLES DE ENTORNO (en .env y en Vercel):
 *    RESEND_API_KEY  → llave secreta de Resend ("re_…"). SOLO servidor.
 *    EMAIL_FROM      → remitente, con nombre visible. Ej.:
 *                      "María Katalina · MKatalina <maria.katalina@mkatalina.com>"
 *                      El dominio (mkatalina.com) debe estar VERIFICADO en Resend.
 *    EMAIL_REPLY_TO  → a dónde llegan las respuestas del cliente (opcional;
 *                      si falta, se usa el mismo remitente).
 *    NEXT_PUBLIC_SITE_URL → dirección del sitio para los enlaces de los
 *                      correos (ej. https://mkatalina.com). En tu computadora:
 *                      http://localhost:3000
 *
 *  REGLA DE ORO: un correo NUNCA rompe una compra.
 *    sendEmail no lanza errores: si falta la llave, si Resend falla o si la
 *    dirección es inválida, lo anota en la consola y devuelve false. El pago
 *    ya se hizo y el pedido ya existe; el correo es un extra.
 *
 *  `import "server-only"`: si algún componente del navegador intentara
 *  importar este archivo, el build fallaría. Así RESEND_API_KEY nunca puede
 *  terminar en el código que descarga el visitante.
 * ============================================================================
 */

import "server-only";
import { Resend } from "resend";

/** Lo que necesita un correo para salir. */
export interface EmailMessage {
  to: string;
  subject: string;
  /** Versión con diseño (la que ven casi todos). */
  html: string;
  /** Versión de solo texto (para lectores que no muestran HTML y anti-spam). */
  text: string;
}

/** Cliente de Resend creado una sola vez (se reutiliza entre envíos). */
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

/**
 * Dirección base del sitio para armar enlaces absolutos en los correos
 * (un correo no entiende rutas como "/es/mis-pedidos"; necesita la URL
 * completa). Sin barra al final.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

/**
 * Envía un correo. Devuelve true si Resend lo aceptó.
 * Nunca lanza errores (ver "regla de oro" arriba).
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;

  if (!resend || !from) {
    console.warn(
      "[email] No se envió el correo: falta RESEND_API_KEY o EMAIL_FROM en las variables de entorno.",
      { to: message.to, subject: message.subject },
    );
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: message.to,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      console.error("[email] Resend rechazó el correo:", error, {
        to: message.to,
        subject: message.subject,
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Error al enviar el correo:", error, {
      to: message.to,
      subject: message.subject,
    });
    return false;
  }
}