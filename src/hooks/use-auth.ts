/**
 * ============================================================================
 * USE AUTH — KATALINA (Fase 8: implementación real)
 * ============================================================================
 *
 * Hook que expone la API de autenticación a los componentes.
 *
 * Cambios respecto a la versión placeholder anterior:
 *   - Ya NO usa MOCK_LOGGED_IN. Lee el estado real del auth-store.
 *   - Expone funciones login, register, logout que mutan el store.
 *   - Valida credenciales contra MOCK_USERS + usuarios registrados.
 *
 * Patrón de diseño:
 *   La UI nunca conoce Zustand ni los usuarios mock. Solo usa este hook.
 *   Cuando NextAuth llegue en Fase 12, reemplazamos esta implementación:
 *
 *     import { useSession, signIn, signOut } from "next-auth/react";
 *
 *     export function useAuth() {
 *       const { data: session, status } = useSession();
 *       return {
 *         isAuthenticated: status === "authenticated",
 *         user: session?.user ?? null,
 *         isLoading: status === "loading",
 *         login: signIn,
 *         logout: signOut,
 *         ...
 *       };
 *     }
 *
 *   Todos los componentes que consumen useAuth siguen funcionando idéntico.
 *
 * Tipos de retorno:
 *   - `login(email, password)` devuelve `{ success, error? }`. El componente
 *     puede usar el error para mostrar mensaje al usuario.
 *   - `register(data)` devuelve `{ success, error? }`. Similar.
 *
 *   Hacemos los handlers asíncronos (devuelven Promise) aunque la
 *   implementación actual es síncrona — esto facilita la migración a
 *   NextAuth donde sí serán async.
 *
 * Detección de doble registro:
 *   Si alguien intenta registrarse con un email ya existente (sea de
 *   MOCK_USERS o de los registeredUsers), bloqueamos con error claro.
 *
 * Identidad consistente:
 *   El hook devuelve `requiresAuth` para componentes que usan
 *   sesión (ej. wishlist). Es lo opuesto de isAuthenticated, pero el
 *   nombre lo hace más natural en el código que lo consume:
 *     if (auth.requiresAuth) → redirigir a login
 *     vs
 *     if (!auth.isAuthenticated) → menos legible
 * ============================================================================
 */

"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  validateCredentials,
  findUserByEmail,
  isPasswordValid,
  stripPassword,
  type AuthUser,
  type MockUserCredentials,
} from "@/data/mock-users";

/**
 * RegisterInput — campos requeridos para crear una cuenta nueva.
 *
 * NO incluye id ni createdAt porque esos se generan automáticamente al
 * momento del registro.
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Resultado de las operaciones de auth (login/register).
 *
 * Devolver un objeto con `success` (boolean) y opcionalmente `error`
 * (string) en lugar de lanzar excepciones permite que los componentes
 * manejen los errores con if/else en lugar de try/catch, que es más
 * ergonómico en formularios.
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

interface UseAuthReturn {
  /** True si hay sesión activa */
  isAuthenticated: boolean;

  /** Inverso de isAuthenticated — más legible en chequeos de guard */
  requiresAuth: boolean;

  /** Datos del usuario logueado, o null */
  user: AuthUser | null;

  /**
   * Inicia sesión. Devuelve { success: true } si OK, o
   * { success: false, error: "mensaje" } si falla.
   *
   * No diferenciamos entre "email no existe" y "contraseña incorrecta"
   * en el mensaje de error — práctica de seguridad estándar para no
   * revelar qué emails están registrados.
   */
  login: (email: string, password: string) => Promise<AuthResult>;

  /**
   * Registra un nuevo usuario.
   * Valida que el email no exista ya, que la contraseña cumpla las reglas,
   * y que todos los campos requeridos estén presentes.
   *
   * Si el registro es exitoso, automáticamente inicia sesión con la nueva
   * cuenta (comportamiento esperado: tras registrarse el usuario entra
   * al sitio logueado).
   */
  register: (data: RegisterInput) => Promise<AuthResult>;

  /** Cierra la sesión actual */
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  // Suscripción granular al store: solo a los campos que usamos.
  // Esto evita re-renders cuando otros campos del store cambian.
  const currentUser = useAuthStore((state) => state.currentUser);
  const registeredUsers = useAuthStore((state) => state.registeredUsers);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const addRegisteredUser = useAuthStore((state) => state.addRegisteredUser);
  const storeLogout = useAuthStore((state) => state.logout);

  /**
   * login — valida credenciales y establece sesión si son correctas.
   *
   * async aunque sea sync para coincidir con la firma de NextAuth y
   * facilitar migración futura. JavaScript permite `async` sin `await`
   * dentro — la función devuelve una Promise automáticamente.
   */
  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    // Validar inputs básicos
    if (!email.trim() || !password) {
      return { success: false, error: "Email y contraseña son requeridos" };
    }

    // Validar credenciales contra base mock + registrados
    const user = validateCredentials(email, password, registeredUsers);

    if (!user) {
      // Mensaje genérico — no revelar si el email existe o no
      return {
        success: false,
        error: "Email o contraseña incorrectos",
      };
    }

    // Login exitoso → establecer sesión
    setCurrentUser(user);
    return { success: true };
  };

  /**
   * register — crea cuenta nueva y la inicia sesión automáticamente.
   *
   * Validaciones:
   *   1. Email no vacío y con formato válido (delegado al form, aquí
   *      asumimos que llegó válido)
   *   2. Contraseña cumple reglas (mínimo 8, una mayúscula, un número)
   *   3. firstName, lastName presentes (1+ char tras trim)
   *   4. Email no existe ya en MOCK_USERS ni en registeredUsers
   */
  const register = async (data: RegisterInput): Promise<AuthResult> => {
    const { email, password, firstName, lastName } = data;

    // Validación básica de presencia
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      return { success: false, error: "Todos los campos son obligatorios" };
    }

    // Validación de contraseña según reglas
    if (!isPasswordValid(password)) {
      return {
        success: false,
        error: "La contraseña no cumple los requisitos",
      };
    }

    // Verificar email no duplicado (case-insensitive)
    const existing = findUserByEmail(email, registeredUsers);
    if (existing) {
      return {
        success: false,
        error: "Este email ya está registrado",
      };
    }

    // Crear usuario nuevo
    // ID generado client-side por ahora. En Fase 12 lo asigna el backend.
    const newUser: MockUserCredentials = {
      id: `user-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      email: email.trim().toLowerCase(),
      password, // ⚠️ Texto plano — solo simulación
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      createdAt: new Date().toISOString(),
    };

    // Agregar a la "base de datos" de usuarios registrados
    addRegisteredUser(newUser);

    // Iniciar sesión automáticamente (sin contraseña)
    setCurrentUser(stripPassword(newUser));

    return { success: true };
  };

  return {
    isAuthenticated: currentUser !== null,
    requiresAuth: currentUser === null,
    user: currentUser,
    login,
    register,
    logout: storeLogout,
  };
}