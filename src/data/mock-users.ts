/**
 * ============================================================================
 * AUTH: TIPOS Y REGLAS DE CONTRASEÑA — MKATALINA (Fase 13 · Mantenimiento)
 * ============================================================================
 *
 * Este archivo se llamaba "mock-users" porque antes contenía el login simulado.
 * Con la autenticación real (Supabase) ese código se eliminó, y ahora que se
 * retiró el auth-store también se quitó el tipo `MockUserCredentials` (que solo
 * usaba ese store).
 *
 * LO QUE QUEDA (en uso):
 *   - AuthUser            → tipo del usuario que devuelve useAuth y usa la UI.
 *   - PasswordRule / PASSWORD_RULES / isPasswordValid → reglas de contraseña
 *                           (8+ caracteres, una mayúscula, un número), usadas
 *                           por RegisterForm, la página de confirmación y el hook.
 *
 * El nombre del archivo se dejó como "mock-users" para no tocar los imports de
 * otros archivos; se puede renombrar en una limpieza futura.
 * ============================================================================
 */

/**
 * AuthUser — la forma del usuario que la UI espera (sin contraseña).
 * Es lo que devuelve el hook useAuth().
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

/**
 * PasswordRule — una regla de validación de contraseña.
 *
 * `messageKey` es la sub-clave dentro del namespace "auth.passwordRules" en los
 * archivos de traducción: el componente que muestra las reglas resuelve el
 * texto con t(`auth.passwordRules.${messageKey}`). Una sola fuente de verdad
 * (este arreglo) y el texto se traduce en la UI.
 */
export interface PasswordRule {
  /** Función que valida si una contraseña cumple la regla. */
  test: (password: string) => boolean;
  /** Clave de traducción bajo "auth.passwordRules.*". */
  messageKey: "minChars" | "uppercase" | "number";
}

/**
 * Reglas de contraseña. Mismas que valida el hook antes de mandar el registro
 * a Supabase, y mismas que RegisterForm muestra en tiempo real.
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
 * isPasswordValid — true solo si la contraseña cumple TODAS las reglas.
 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}