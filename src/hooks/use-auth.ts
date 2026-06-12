/**
 * ============================================================================
 * USE AUTH — KATALINA (Fase 12 Turno 3B.4: errorCode bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - `AuthResult.error: string` cambia a `AuthResult.errorCode: string`
 *   - El hook devuelve códigos identificables en lugar de texto traducido
 *   - Los códigos posibles son:
 *       login → "loginEmptyFields" | "loginInvalidCredentials"
 *       register → "registerEmptyFields" | "registerInvalidPassword" | "registerEmailTaken"
 *
 * Lo que NO cambia:
 *   - Toda la lógica de validación (campos vacíos, password rules, email duplicado)
 *   - El comportamiento de éxito (devolver { success: true })
 *   - La integración con auth-store
 *   - La creación del usuario nuevo en register()
 *
 * ─── POR QUÉ errorCode EN VEZ DE error ────────────────────────────────
 *
 * El hook useAuth NO debería conocer i18n. Devolver un mensaje en español
 * acopla el hook al locale y obliga a tener una versión por idioma.
 *
 * En cambio, devolver un código identificable (string estable) permite que
 * cada componente traduzca el código al locale activo usando su propio t().
 *
 * Patrón equivalente a HTTP status codes / API error codes en backends reales.
 * El backend devuelve { code: "INVALID_CREDENTIALS" }, no "Credenciales
 * inválidas". El cliente traduce.
 *
 * En los componentes (LoginForm, RegisterForm) hacemos:
 *   t(`auth.errors.${result.errorCode}`)
 *
 * Si en el futuro queremos cambiar el wording de "Email o contraseña
 * incorrectos" a "Credenciales no válidas", lo cambiamos SOLO en messages.json,
 * sin tocar el hook ni los formularios.
 *
 * ─── ELECCIÓN DE NOMBRES DE CÓDIGOS ────────────────────────────────────
 *
 * Prefijo por operación (login/register) para evitar colisiones y para
 * que sea obvio de qué viene el error. Si después añadimos logout o
 * recoverPassword, sigue el mismo patrón:
 *   - logoutFailed
 *   - recoverEmailNotFound
 *   - etc.
 * ─────────────────────────────────────────────────────────────────────
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

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * AuthResult — resultado de las operaciones de auth.
 *
 * Cambio: `error: string` → `errorCode: string`.
 *
 * Los códigos posibles están documentados en cada función (login, register).
 * El componente caller resuelve `t(\`auth.errors.${errorCode}\`)`.
 */
export interface AuthResult {
  success: boolean;
  /** Código del error si success === false. Resuelve a auth.errors.{errorCode} */
  errorCode?: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  requiresAuth: boolean;
  user: AuthUser | null;

  /**
   * Inicia sesión.
   * Códigos de error posibles:
   *   - "loginEmptyFields" → email o password vacíos
   *   - "loginInvalidCredentials" → email o password incorrectos (genérico
   *     por seguridad, no revela si el email existe o no)
   */
  login: (email: string, password: string) => Promise<AuthResult>;

  /**
   * Registra un nuevo usuario y lo inicia sesión.
   * Códigos de error posibles:
   *   - "registerEmptyFields" → algún campo obligatorio vacío
   *   - "registerInvalidPassword" → password no cumple PASSWORD_RULES
   *   - "registerEmailTaken" → email ya está registrado
   */
  register: (data: RegisterInput) => Promise<AuthResult>;

  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const currentUser = useAuthStore((state) => state.currentUser);
  const registeredUsers = useAuthStore((state) => state.registeredUsers);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const addRegisteredUser = useAuthStore((state) => state.addRegisteredUser);
  const storeLogout = useAuthStore((state) => state.logout);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    // Campos obligatorios
    if (!email.trim() || !password) {
      return { success: false, errorCode: "loginEmptyFields" };
    }

    // Validar credenciales
    const user = validateCredentials(email, password, registeredUsers);
    if (!user) {
      // Genérico por seguridad: no revelamos si el email existe o no
      return { success: false, errorCode: "loginInvalidCredentials" };
    }

    setCurrentUser(user);
    return { success: true };
  };

  const register = async (data: RegisterInput): Promise<AuthResult> => {
    const { email, password, firstName, lastName } = data;

    // Validación básica de presencia
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      return { success: false, errorCode: "registerEmptyFields" };
    }

    // Validación de contraseña según PASSWORD_RULES
    if (!isPasswordValid(password)) {
      return { success: false, errorCode: "registerInvalidPassword" };
    }

    // Email no duplicado (case-insensitive)
    const existing = findUserByEmail(email, registeredUsers);
    if (existing) {
      return { success: false, errorCode: "registerEmailTaken" };
    }

    // Crear usuario nuevo
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

    addRegisteredUser(newUser);
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