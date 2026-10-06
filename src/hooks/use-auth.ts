/**
 * ============================================================================
 *  USE AUTH — MKATALINA (Fase 13 · Etapa 3: + updateProfile)
 * ============================================================================
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

export function useAuth(): UseAuthReturn {
  // Cliente de Supabase para el navegador. createClient() reutiliza una sola
  // instancia internamente; useMemo solo estabiliza la referencia para el
  // useEffect de abajo.
  const supabase = useMemo(() => createClient(), []);

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
      return { success: false, errorCode: "registerInvalidPassword" };
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // Estos datos quedan en user_metadata; el trigger de la base los copia
        // a la tabla `profiles`.
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      },
    });

    if (error) {
      // Con la confirmación de correo DESACTIVADA, registrar un email que ya
      // existe devuelve un error de "usuario ya registrado".
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        return { success: false, errorCode: "registerEmailTaken" };
      }
      // Cualquier otro rechazo de Supabase (por ejemplo, su propia política de
      // contraseñas) lo tratamos como contraseña inválida.
      return { success: false, errorCode: "registerInvalidPassword" };
    }

    // Con la confirmación desactivada, signUp deja al usuario logueado al
    // instante; onAuthStateChange actualizará el estado automáticamente.
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
  };
}