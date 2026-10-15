/**
 * ============================================================================
 *  USE AUTH — MKATALINA (Fase 13 · Etapa 6C: confirmación de correo)
 * ============================================================================
 *
 *  CAMBIOS DE LA ETAPA 6C — CONFIRMAR CORREO Y RECUPERAR CONTRASEÑA:
 *    - register() pide a Supabase mandar el correo de confirmación, con un
 *      enlace a /[idioma]/confirmar (página con el botón que confirma, ver
 *      src/actions/auth.ts). Con la confirmación activada en Supabase, el
 *      registro YA NO inicia sesión: devuelve needsConfirmation = true y el
 *      formulario muestra "Revisa tu correo".
 *      También guarda el idioma en los metadatos del usuario (locale).
 *    - login() reconoce "correo sin confirmar" (loginEmailNotConfirmed) para
 *      que el formulario ofrezca reenviar el correo, en vez de decir
 *      "datos incorrectos".
 *    - NUEVO resendConfirmation(email): reenvía el correo de confirmación.
 *    - NUEVO requestPasswordReset(email): manda el correo para cambiar la
 *      contraseña, con enlace a /[idioma]/actualizar-contrasena.
 *    Los enlaces se arman con la dirección actual del sitio
 *    (window.location.origin), así funcionan igual en localhost y en
 *    producción. Esas direcciones deben estar en la lista "Redirect URLs"
 *    de Supabase (Authentication → URL Configuration).
 *
 *  CAMBIO (errores del registro): antes, CUALQUIER rechazo de Supabase al
 *  registrarse se mostraba como "La contraseña no cumple los requisitos",
 *  aunque la causa fuera otra (base de datos, demasiados intentos, sin
 *  conexión). Ahora mapSignUpError() traduce cada código de Supabase a su
 *  propio mensaje, y register() anota el detalle en la consola del navegador
 *  para poder diagnosticar.
 *
 *  Igual que la versión de la Etapa 2 (login/register/logout con Supabase),
 *  pero se agrega updateProfile para editar el nombre del usuario. Todas las
 *  mutaciones de autenticación viven aquí, en un solo lugar.
 *
 *  De dónde sale cada cosa:
 *    - user / isAuthenticated : sesión real de Supabase (cookies) + listener.
 *    - login / register / logout : llaman a Supabase.
 *    - updateProfile : actualiza el nombre en los metadatos del usuario
 *      (cliente, refresca la UI al instante) y sincroniza la tabla profiles
 *      (servidor).
 * ============================================================================
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { type AuthUser, isPasswordValid } from "@/data/mock-users";
import { updateMyProfile } from "@/actions/profile";

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  success: boolean;
  /** Código del error si success === false. Resuelve a auth.errors.{errorCode} */
  errorCode?: string;
  /**
   * Solo en register(): true si la cuenta se creó pero falta confirmar el
   * correo (no hay sesión todavía). Etapa 6C.
   */
  needsConfirmation?: boolean;
}

/** Resultado de los correos de cuenta (reenviar confirmación / recuperar). */
export interface EmailRequestResult {
  success: boolean;
  /** "rateLimited" = demasiados intentos; "serverError" = cualquier otra falla. */
  errorCode?: "rateLimited" | "serverError";
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  requiresAuth: boolean;
  /** true mientras todavía no sabemos si hay sesión (primera carga). */
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  /** Actualiza el nombre del usuario (metadatos + tabla profiles). */
  updateProfile: (firstName: string, lastName: string) => Promise<AuthResult>;
  /** Reenvía el correo de confirmación de una cuenta nueva (Etapa 6C). */
  resendConfirmation: (email: string) => Promise<EmailRequestResult>;
  /** Manda el correo para cambiar la contraseña (Etapa 6C). */
  requestPasswordReset: (email: string) => Promise<EmailRequestResult>;
}

/** ¿El error de Supabase es por demasiados intentos? */
function isRateLimit(error: { code?: string; status?: number }): boolean {
  return (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    error.status === 429
  );
}

/**
 * Convierte el usuario de Supabase al tipo AuthUser que espera la UI.
 * firstName/lastName viven en user_metadata (los guardamos al registrar);
 * si por alguna razón no están, devolvemos cadena vacía en vez de undefined.
 */
function mapSupabaseUser(supaUser: User | null): AuthUser | null {
  if (!supaUser) return null;
  const meta = supaUser.user_metadata ?? {};
  return {
    id: supaUser.id,
    email: supaUser.email ?? "",
    firstName: typeof meta.firstName === "string" ? meta.firstName : "",
    lastName: typeof meta.lastName === "string" ? meta.lastName : "",
    createdAt: supaUser.created_at,
  };
}

/**
 * mapSignUpError — traduce un error de supabase.auth.signUp() a un errorCode
 * de la UI (cada uno tiene su texto en messages/{es,en}.json → auth.errors).
 *
 * Supabase devuelve un `code` estable (ej. "weak_password") y un `status`
 * HTTP. Usamos primero el código; el texto del mensaje solo como respaldo.
 */
function mapSignUpError(error: {
  code?: string;
  status?: number;
  name?: string;
  message: string;
}): string {
  const code = error.code ?? "";
  const msg = error.message.toLowerCase();

  // El correo ya tiene cuenta.
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    msg.includes("already registered")
  ) {
    return "registerEmailTaken";
  }

  // La contraseña no cumple la política configurada EN SUPABASE.
  if (code === "weak_password") return "registerInvalidPassword";

  // El correo no tiene formato válido o Supabase lo rechaza.
  if (code === "email_address_invalid" || code === "validation_failed") {
    return "registerInvalidEmail";
  }

  // Demasiados intentos seguidos (límite de Supabase por IP / por hora).
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    error.status === 429
  ) {
    return "registerRateLimited";
  }

  // No se pudo hablar con Supabase (sin internet, URL mal configurada…).
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "registerNetworkError";
  }

  // Todo lo demás: fallo del lado del servidor. Aquí cae, por ejemplo,
  // "Database error saving new user" (el trigger que crea el perfil falló).
  return "registerServerError";
}

export function useAuth(): UseAuthReturn {
  // Cliente de Supabase para el navegador. createClient() reutiliza una sola
  // instancia internamente; useMemo solo estabiliza la referencia para el
  // useEffect de abajo.
  const supabase = useMemo(() => createClient(), []);

  // Idioma activo: decide a qué página de idioma llevan los enlaces de los
  // correos (/es/confirmar o /en/confirmar). Etapa 6C.
  const locale = useLocale() === "en" ? "en" : "es";

  /** Dirección completa de una página del sitio en el idioma activo. */
  const pageUrl = (path: string) => `${window.location.origin}/${locale}${path}`;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange se dispara UNA vez al suscribirse (evento
    // INITIAL_SESSION) con la sesión actual, y luego en cada cambio: login,
    // logout, refresco de token y USER_UPDATED (al editar el perfil). Con esto
    // el estado siempre está al día, incluso entre pestañas.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setIsLoading(false);
    });

    // Al desmontar, cancelamos la suscripción para no dejar listeners colgados.
    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    if (!email.trim() || !password) {
      return { success: false, errorCode: "loginEmptyFields" };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Cuenta creada pero sin confirmar el correo (Etapa 6C): el formulario
      // ofrece reenviar el correo en lugar de decir "datos incorrectos".
      // (Supabase solo da este error si la contraseña SÍ era correcta.)
      if (error.code === "email_not_confirmed") {
        return { success: false, errorCode: "loginEmailNotConfirmed" };
      }
      // Supabase devuelve un error genérico para email o contraseña
      // incorrectos. Lo mapeamos al código genérico: por seguridad NO
      // revelamos si el email existe o no (igual que en el mock).
      return { success: false, errorCode: "loginInvalidCredentials" };
    }

    // El listener onAuthStateChange actualizará user/isAuthenticated solo.
    return { success: true };
  };

  const register = async (data: RegisterInput): Promise<AuthResult> => {
    const { email, password, firstName, lastName } = data;

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      return { success: false, errorCode: "registerEmptyFields" };
    }

    // Validamos la contraseña con las MISMAS reglas de siempre (8+ caracteres,
    // una mayúscula, un número) ANTES de mandarla a Supabase.
    if (!isPasswordValid(password)) {
      // Si ves este aviso con una contraseña que en pantalla cumple todo, la
      // función isPasswordValid (src/data/mock-users.ts) tiene una regla que
      // la lista de requisitos de la pantalla no muestra.
      console.warn(
        "[registro] La contraseña no pasó la validación local (isPasswordValid); no se contactó a Supabase.",
      );
      return { success: false, errorCode: "registerInvalidPassword" };
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // A dónde lleva el enlace del correo de confirmación (Etapa 6C).
        emailRedirectTo: pageUrl("/confirmar"),
        // Estos datos quedan en user_metadata; el trigger de la base los copia
        // a la tabla `profiles`.
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          // Idioma en que se registró (Etapa 6C).
          locale,
        },
      },
    });

    if (error) {
      // Dejamos el detalle real en la consola del navegador (F12 → Console)
      // para diagnosticar. Al usuario le mostramos un mensaje según la causa.
      console.error("[registro] Supabase rechazó el registro:", {
        code: error.code,
        status: error.status,
        name: error.name,
        message: error.message,
      });
      return { success: false, errorCode: mapSignUpError(error) };
    }

    // Etapa 6C: con la confirmación ACTIVADA en Supabase, signUp crea la
    // cuenta pero no inicia sesión (session = null) hasta que el cliente
    // confirme su correo. Si algún día se desactiva, session vendrá llena y
    // el usuario quedará dentro al instante, como antes.
    return { success: true, needsConfirmation: !signUpData.session };
  };

  const resendConfirmation = async (
    email: string,
  ): Promise<EmailRequestResult> => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: pageUrl("/confirmar") },
    });
    if (error) {
      console.error("[cuenta] No se pudo reenviar la confirmación:", error.code, error.message);
      return { success: false, errorCode: isRateLimit(error) ? "rateLimited" : "serverError" };
    }
    return { success: true };
  };

  /**
   * Por seguridad, Supabase responde igual exista o no la cuenta, y la
   * página siempre dice "si existe una cuenta, te enviamos un correo". Así
   * nadie puede usar este formulario para averiguar qué correos están
   * registrados.
   */
  const requestPasswordReset = async (
    email: string,
  ): Promise<EmailRequestResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: pageUrl("/actualizar-contrasena") },
    );
    if (error) {
      console.error("[cuenta] No se pudo pedir el cambio de contraseña:", error.code, error.message);
      return { success: false, errorCode: isRateLimit(error) ? "rateLimited" : "serverError" };
    }
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    // onAuthStateChange pondrá user en null automáticamente.
  };

  const updateProfile = async (
    firstName: string,
    lastName: string,
  ): Promise<AuthResult> => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      return { success: false, errorCode: "profileEmptyFields" };
    }

    // 1) Actualiza los metadatos del usuario en Supabase (desde el cliente).
    //    Esto dispara USER_UPDATED en onAuthStateChange, que refresca `user`
    //    al instante en la UI (el nombre cambia sin recargar).
    const { error } = await supabase.auth.updateUser({
      data: { firstName: fn, lastName: ln },
    });
    if (error) {
      return { success: false, errorCode: "profileUpdateFailed" };
    }

    // 2) Sincroniza la tabla `profiles` (servidor). El nombre ya cambió en la
    //    sesión (paso 1); si esto falla, lo registramos pero no bloqueamos.
    try {
      await updateMyProfile(fn, ln);
    } catch (e) {
      console.error("No se pudo sincronizar el perfil en la base:", e);
    }

    return { success: true };
  };

  return {
    isAuthenticated: user !== null,
    // requiresAuth solo es true cuando YA sabemos que no hay sesión. Durante la
    // primera carga (isLoading) lo dejamos en false para no redirigir por error
    // a un usuario que sí está logueado.
    requiresAuth: !isLoading && user === null,
    isLoading,
    user,
    login,
    register,
    logout,
    updateProfile,
    resendConfirmation,
    requestPasswordReset,
  };
}