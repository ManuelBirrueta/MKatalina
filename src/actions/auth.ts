/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: CUENTA (correo y contraseña) · Etapa 6C
 * ============================================================================
 *
 *  Dos acciones que se ejecutan cuando el cliente pulsa el BOTÓN de una
 *  página a la que llegó desde un correo de Supabase:
 *
 *    confirmEmailAction    → /[locale]/confirmar
 *                            Confirma el correo de una cuenta nueva.
 *    resetPasswordAction   → /[locale]/actualizar-contrasena
 *                            Pone una contraseña nueva (recuperación).
 *
 *  ¿CÓMO FUNCIONA EL ENLACE DEL CORREO?
 *    Supabase manda un enlace con un código de un solo uso (token_hash), por
 *    ejemplo:  https://mkatalina.com/es/confirmar?token_hash=abc…&type=email
 *    La página solo LEE ese código; nada se gasta al abrirla. Se gasta aquí,
 *    con supabase.auth.verifyOtp(), cuando la persona pulsa el botón.
 *
 *  ¿POR QUÉ UN BOTÓN Y NO CONFIRMAR AL ABRIR EL ENLACE?
 *    Algunos correos (Outlook/Microsoft 365, el de GoDaddy) abren los enlaces
 *    por su cuenta para revisar que no sean peligrosos. Si el enlace
 *    confirmara al abrirse, ese "visitante automático" gastaría el código y
 *    al cliente le saldría "enlace vencido". Los escáneres no pulsan botones,
 *    así que con el botón el código llega intacto. (Recomendación de la
 *    documentación de Supabase sobre plantillas de correo.)
 *
 *  SESIÓN: verifyOtp, usado con el cliente de SERVIDOR
 *  (src/lib/supabase/server.ts), deja la sesión iniciada en las cookies del
 *  navegador. Por eso, tras confirmar o cambiar la contraseña, el cliente
 *  queda dentro de su cuenta sin volver a escribir sus datos.
 * ============================================================================
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { isPasswordValid } from "@/data/mock-users";

/** Motivos de fallo que las páginas traducen a un mensaje. */
export type AccountActionError =
  | "invalidLink" // código vencido, ya usado o incompleto
  | "weakPassword" // la contraseña no cumple las reglas
  | "samePassword" // la nueva es igual a la anterior
  | "serverError";

export type AccountActionResult = { ok: true } | { ok: false; error: AccountActionError };

/**
 * Forma básica de un token_hash (letras, números, guiones y guion bajo).
 * Solo filtra basura evidente; el que decide si es válido es Supabase.
 */
function looksLikeTokenHash(value: unknown): value is string {
  return typeof value === "string" && /^[\w-]{10,256}$/.test(value);
}

/** Confirma el correo de una cuenta nueva con el código del enlace. */
export async function confirmEmailAction(
  tokenHash: string,
): Promise<AccountActionResult> {
  if (!looksLikeTokenHash(tokenHash)) return { ok: false, error: "invalidLink" };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (error) {
      console.warn("[cuenta] No se pudo confirmar el correo:", error.code, error.message);
      return { ok: false, error: "invalidLink" };
    }
    return { ok: true };
  } catch (error) {
    console.error("[cuenta] confirmEmailAction:", error);
    return { ok: false, error: "serverError" };
  }
}

/**
 * Cambia la contraseña con el código del correo de recuperación.
 * Primero valida la contraseña (mismas reglas que el registro) para no gastar
 * el código si la contraseña no sirve.
 */
export async function resetPasswordAction(
  tokenHash: string,
  newPassword: string,
): Promise<AccountActionResult> {
  if (typeof newPassword !== "string" || !isPasswordValid(newPassword)) {
    return { ok: false, error: "weakPassword" };
  }
  if (!looksLikeTokenHash(tokenHash)) return { ok: false, error: "invalidLink" };

  try {
    const supabase = await createClient();

    // 1) El código del correo inicia una sesión de recuperación.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    if (verifyError) {
      console.warn("[cuenta] Código de recuperación inválido:", verifyError.code);
      return { ok: false, error: "invalidLink" };
    }

    // 2) Con esa sesión, se guarda la contraseña nueva.
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      console.warn("[cuenta] No se pudo cambiar la contraseña:", updateError.code);
      if (updateError.code === "same_password") return { ok: false, error: "samePassword" };
      if (updateError.code === "weak_password") return { ok: false, error: "weakPassword" };
      return { ok: false, error: "serverError" };
    }

    return { ok: true };
  } catch (error) {
    console.error("[cuenta] resetPasswordAction:", error);
    return { ok: false, error: "serverError" };
  }
}