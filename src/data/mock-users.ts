/**
 * ============================================================================
 * MOCK USERS — KATALINA (solo para desarrollo)
 * ============================================================================
 *
 * "Base de datos" simulada de usuarios para el sistema de auth en frontend.
 *
 * ⚠️ ADVERTENCIA DE SEGURIDAD ⚠️
 * Las contraseñas aquí están en TEXTO PLANO. Esto es INSEGURO y NO debe
 * hacerse en producción. Cuando integremos NextAuth en Fase 12:
 *   - Las contraseñas se almacenan en backend como hashes (bcrypt/argon2)
 *   - El cliente envía la contraseña en texto plano vía HTTPS al backend
 *   - El backend hashea la contraseña recibida y la compara con el hash guardado
 *   - El cliente NUNCA ve las contraseñas hasheadas
 *
 * Por qué texto plano aquí entonces:
 *   - Es una simulación de UI, no un sistema real
 *   - Necesitamos comparar contraseñas para que el login "funcione"
 *   - Los usuarios mock son temporales y desaparecen en Fase 12
 *
 * Estos usuarios son INMUTABLES — siempre existen con las mismas credenciales.
 * Los usuarios que se registran vía /registro se guardan en localStorage
 * (no aquí) para preservar la separación entre data "del producto" y data
 * "del navegador del usuario".
 * ============================================================================
 */

/**
 * MockUserCredentials — combina datos del usuario + contraseña.
 *
 * En backend real, las contraseñas viven en su propia tabla aparte (o como
 * campo separado de la tabla users) y NUNCA se devuelven al cliente en las
 * respuestas del API.
 */
export interface MockUserCredentials {
  id: string;
  email: string;
  /** ⚠️ Texto plano solo para mock. Backend usa hash. */
  password: string;
  firstName: string;
  lastName: string;
  /** Fecha de creación del usuario en formato ISO */
  createdAt: string;
}

/**
 * AuthUser — los datos del usuario que se exponen a la UI.
 *
 * Importante: NO incluye la contraseña. Cuando el usuario inicia sesión,
 * el store guarda este tipo (no MockUserCredentials), garantizando que
 * la contraseña no se filtre accidentalmente a componentes que la usan.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

/**
 * Función helper para convertir MockUserCredentials a AuthUser
 * removiendo la contraseña.
 *
 * Esto se llama después de validar credenciales exitosamente. La separación
 * de tipos garantiza que solo después de validación correcta el usuario
 * "se vuelve" un AuthUser sin password.
 */
export function stripPassword(user: MockUserCredentials): AuthUser {
  // Destructuring para quitar password sin mutar el objeto original.
  // El `_password` indica explícitamente que estamos descartando ese campo.
  const { password: _password, ...authUser } = user;
  return authUser;
}

/**
 * MOCK_USERS — los usuarios pre-cargados para pruebas.
 *
 * 3 usuarios con perfiles distintos para que puedas probar:
 *   - maria@katalina.mx → contraseña "Demo1234" → usuaria estándar
 *   - juan@katalina.mx → contraseña "Test5678" → otro usuario para validar
 *     que la sesión es por-usuario (no global)
 *   - admin@katalina.mx → contraseña "Admin999" → reservada para cuando
 *     implementemos roles en Fase 11 (admin panel). Por ahora se comporta
 *     como usuario regular.
 *
 * Las contraseñas siguen estas reglas (que también validaremos en /registro):
 *   - Mínimo 8 caracteres
 *   - Al menos 1 mayúscula
 *   - Al menos 1 número
 */
export const MOCK_USERS: MockUserCredentials[] = [
  {
    id: "user-mock-001",
    email: "maria@katalina.mx",
    password: "Demo1234",
    firstName: "María",
    lastName: "López",
    createdAt: "2026-01-15T10:30:00.000Z",
  },
  {
    id: "user-mock-002",
    email: "juan@katalina.mx",
    password: "Test5678",
    firstName: "Juan",
    lastName: "Hernández",
    createdAt: "2026-02-20T14:45:00.000Z",
  },
  {
    id: "user-mock-003",
    email: "admin@katalina.mx",
    password: "Admin999",
    firstName: "Admin",
    lastName: "Katalina",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

/**
 * findUserByEmail — busca un usuario por su email (case-insensitive).
 *
 * Combina los usuarios pre-cargados (MOCK_USERS) con los registrados
 * vía /registro que viven en localStorage. El parámetro `registeredUsers`
 * lo pasa el store cuando llama a esta función — así mantenemos esta
 * función pura sin acoplarla a localStorage directamente.
 *
 * Devuelve `null` si no existe — los componentes deben manejar ese caso
 * (mostrar "email no encontrado" o similar).
 */
export function findUserByEmail(
  email: string,
  registeredUsers: MockUserCredentials[] = []
): MockUserCredentials | null {
  // Normalizar el email a minúsculas + trim para que "MARIA@..." y
  // "maria@..." y "maria@... " encuentren el mismo usuario.
  // Es como se hace en backend real (la columna email es case-insensitive).
  const normalized = email.trim().toLowerCase();

  // Buscar primero en pre-cargados, después en registrados.
  const allUsers = [...MOCK_USERS, ...registeredUsers];
  return (
    allUsers.find((user) => user.email.toLowerCase() === normalized) ?? null
  );
}

/**
 * validateCredentials — valida email + contraseña contra la base mock.
 *
 * Devuelve:
 *   - El usuario (sin contraseña) si las credenciales son correctas
 *   - null si email no existe O contraseña incorrecta
 *
 * IMPORTANTE: no diferenciamos entre "email no existe" y "contraseña
 * incorrecta" en el mensaje al usuario. Esta es una práctica de seguridad
 * estándar — si dijéramos "el email no está registrado" estaríamos
 * revelando qué emails SÍ existen, lo cual ayuda a atacantes a enumerar
 * usuarios. Aunque aquí es solo mock, mantenemos la práctica correcta.
 */
export function validateCredentials(
  email: string,
  password: string,
  registeredUsers: MockUserCredentials[] = []
): AuthUser | null {
  const user = findUserByEmail(email, registeredUsers);

  // Email no existe O contraseña no coincide → null genérico
  if (!user || user.password !== password) {
    return null;
  }

  // Credenciales correctas → devolver usuario SIN contraseña
  return stripPassword(user);
}

/**
 * Reglas de validación de contraseña para usar en /registro.
 *
 * Exportamos un array de objetos con regla + mensaje para que el formulario
 * pueda mostrar cada requisito y marcarlo como cumplido en tiempo real
 * (UX típica de "lista de requisitos que se van marcando con check").
 *
 * En backend real estas mismas reglas se validan server-side. Tener las
 * reglas en un objeto compartido permitiría reutilizarlas, pero como aquí
 * estamos solo en frontend, viven nada más en este archivo.
 */
export const PASSWORD_RULES = [
  {
    test: (password: string) => password.length >= 8,
    message: "Mínimo 8 caracteres",
  },
  {
    test: (password: string) => /[A-Z]/.test(password),
    message: "Al menos una mayúscula",
  },
  {
    test: (password: string) => /[0-9]/.test(password),
    message: "Al menos un número",
  },
];

/**
 * isPasswordValid — true si la contraseña cumple TODAS las reglas.
 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}