/**
 * ============================================================================
 * MOCK USERS — MKATALINA (Fase 12 Turno 3B.4: PASSWORD_RULES bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - `PASSWORD_RULES` ahora usa `messageKey: string` en lugar de
 *     `message: string`. La key sirve como índice contra el namespace
 *     "auth.passwordRules.{messageKey}" en messages.json.
 *
 * Lo que NO cambia:
 *   - Todos los demás tipos, constantes, funciones helper
 *   - MOCK_USERS hardcoded con credenciales de prueba
 *   - findUserByEmail, validateCredentials, stripPassword, isPasswordValid
 *   - Las reglas de validación reales (length >= 8, regex de mayúscula y número)
 *
 * ─── POR QUÉ messageKey EN VEZ DE message ──────────────────────────────
 *
 * El objetivo: el componente que muestra las reglas (RegisterForm) puede
 * traducir cada regla al locale activo usando t(`auth.passwordRules.${key}`).
 *
 * Alternativas consideradas:
 *
 *   A) Mantener message: string y cambiarlo a LocalizedString {es, en}.
 *      Problema: este archivo es data/lógica, no UI. Acoplar i18n aquí
 *      sería filtrar responsabilidad de capas.
 *
 *   B) Hardcodear los strings en RegisterForm, ignorando PASSWORD_RULES.
 *      Problema: rompe el contrato "una sola fuente de verdad para las
 *      reglas". Si agregamos una regla nueva, hay que tocarlo en 2 lados.
 *
 *   C) Cambiar a messageKey (esta opción).
 *      ✓ Mantiene separación: data/lógica vs UI/i18n
 *      ✓ Una sola fuente de verdad: PASSWORD_RULES es el array maestro
 *      ✓ RegisterForm resuelve con t(rule.messageKey)
 *      ✓ Agregar una regla nueva = agregar entry aquí + entry en messages.json
 *
 * Patrón consistente con cómo refactorizamos shipping methods, status badges,
 * y otras "data tables" del proyecto.
 * ─────────────────────────────────────────────────────────────────────
 */

/**
 * MockUserCredentials — sin cambios.
 */
export interface MockUserCredentials {
  id: string;
  email: string;
  /** ⚠️ Texto plano solo para mock. Backend usa hash. */
  password: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

/**
 * AuthUser — sin cambios.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

/**
 * stripPassword — sin cambios.
 */
export function stripPassword(user: MockUserCredentials): AuthUser {
  const { password: _password, ...authUser } = user;
  return authUser;
}

/**
 * MOCK_USERS — sin cambios.
 */
export const MOCK_USERS: MockUserCredentials[] = [
  {
    id: "user-mock-001",
    email: "maria@mkatalina.mx",
    password: "Demo1234",
    firstName: "María",
    lastName: "López",
    createdAt: "2026-01-15T10:30:00.000Z",
  },
  {
    id: "user-mock-002",
    email: "juan@mkatalina.mx",
    password: "Test5678",
    firstName: "Juan",
    lastName: "Hernández",
    createdAt: "2026-02-20T14:45:00.000Z",
  },
  {
    id: "user-mock-003",
    email: "admin@mkatalina.mx",
    password: "Admin999",
    firstName: "Admin",
    lastName: "MKatalina",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

/**
 * findUserByEmail — sin cambios.
 */
export function findUserByEmail(
  email: string,
  registeredUsers: MockUserCredentials[] = []
): MockUserCredentials | null {
  const normalized = email.trim().toLowerCase();
  const allUsers = [...MOCK_USERS, ...registeredUsers];
  return (
    allUsers.find((user) => user.email.toLowerCase() === normalized) ?? null
  );
}

/**
 * validateCredentials — sin cambios.
 */
export function validateCredentials(
  email: string,
  password: string,
  registeredUsers: MockUserCredentials[] = []
): AuthUser | null {
  const user = findUserByEmail(email, registeredUsers);

  if (!user || user.password !== password) {
    return null;
  }

  return stripPassword(user);
}

/**
 * PasswordRule — estructura de una regla de validación de contraseña.
 *
 * Cambio: `message: string` → `messageKey: string`.
 *
 * El messageKey es la sub-key dentro del namespace
 * "auth.passwordRules" en messages.json:
 *   - "minChars" → "Mínimo 8 caracteres" / "Minimum 8 characters"
 *   - "uppercase" → "Al menos una mayúscula" / "At least one uppercase letter"
 *   - "number" → "Al menos un número" / "At least one number"
 *
 * El componente que muestra las reglas resuelve:
 *   t(`auth.passwordRules.${rule.messageKey}`)
 */
export interface PasswordRule {
  /** Función que valida si una contraseña cumple la regla */
  test: (password: string) => boolean;
  /** Clave de traducción bajo "auth.passwordRules.*" en messages.json */
  messageKey: "minChars" | "uppercase" | "number";
}

/**
 * Reglas de validación de contraseña.
 *
 * Cada regla:
 *   - test: función que valida (sin cambios respecto a la versión anterior)
 *   - messageKey: clave bajo "auth.passwordRules.*" para resolver el texto
 *
 * En backend real estas mismas reglas se validan server-side.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    test: (password: string) => password.length >= 8,
    messageKey: "minChars",
  },
  {
    test: (password: string) => /[A-Z]/.test(password),
    messageKey: "uppercase",
  },
  {
    test: (password: string) => /[0-9]/.test(password),
    messageKey: "number",
  },
];

/**
 * isPasswordValid — sin cambios. Sigue validando contra TODAS las reglas.
 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}