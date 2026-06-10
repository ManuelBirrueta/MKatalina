/**
 * ============================================================================
 * AUTH STORE — KATALINA
 * ============================================================================
 *
 * Store global de Zustand para autenticación. Gestiona:
 *   1. El usuario actualmente logueado (o null si no hay sesión)
 *   2. La lista de usuarios registrados vía /registro (que se suman a los
 *      pre-cargados de mock-users.ts)
 *
 * Persistencia:
 *   Ambos datos se persisten en localStorage. Al recargar la página:
 *     - Si había sesión activa, el usuario sigue logueado
 *     - Los usuarios registrados siguen existiendo
 *
 *   Llaves de localStorage:
 *     - 'katalina-auth-v1' → estado completo del store
 *
 * Por qué un solo localStorage en lugar de dos:
 *   Aunque conceptualmente sesión y usuarios registrados son cosas
 *   distintas, Zustand `persist` con UN solo middleware es más simple
 *   y atómico. Si en el futuro queremos separarlos, podemos refactorizar.
 *
 * ⚠️ Seguridad en simulación:
 *   En producción NUNCA se guarda info del usuario en localStorage sin
 *   encriptación. NextAuth (Fase 12) usa cookies httpOnly con JWT firmados
 *   por el servidor, lo cual es mucho más seguro porque JavaScript del
 *   cliente NO puede leer esas cookies.
 *
 *   Aquí guardamos en localStorage solo para simular. No incluimos
 *   contraseñas en el estado de sesión (solo en la base de usuarios
 *   registrados, que también es inseguro pero necesario para que login
 *   funcione).
 * ============================================================================
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, MockUserCredentials } from "@/data/mock-users";

/**
 * AuthState — la forma completa del store.
 */
interface AuthState {
  /**
   * El usuario actualmente logueado. null si no hay sesión activa.
   *
   * No incluye la contraseña (es de tipo AuthUser, no MockUserCredentials)
   * para evitar exponerla accidentalmente a componentes que accedan al store.
   */
  currentUser: AuthUser | null;

  /**
   * Usuarios registrados vía /registro. Se SUMAN a los MOCK_USERS pre-cargados
   * cuando se busca un usuario por email durante el login.
   *
   * Estos SÍ tienen contraseña porque necesitamos validar contra ellos.
   * El acceso desde la UI es indirecto: el hook useAuth nunca expone este
   * array, solo lo usa internamente.
   */
  registeredUsers: MockUserCredentials[];

  /**
   * Establece la sesión activa. Solo se llama desde acciones de login/register
   * después de que las credenciales o el formulario fueron validados.
   */
  setCurrentUser: (user: AuthUser | null) => void;

  /**
   * Agrega un nuevo usuario registrado a la lista.
   * Lo llamamos desde el flujo de registro tras validar el formulario.
   */
  addRegisteredUser: (user: MockUserCredentials) => void;

  /**
   * Cierra la sesión actual.
   * Equivalente a setCurrentUser(null) pero con nombre explícito para
   * que el código que llama sea más legible.
   */
  logout: () => void;
}

/**
 * useAuthStore — store interno de Zustand.
 *
 * Igual que con cart-store, NO se debe consumir directamente desde componentes.
 * Los componentes usan el hook `useAuth` que provee una API más amigable.
 *
 * Esta separación nos permite cambiar la implementación interna (Zustand →
 * NextAuth en Fase 12) sin tocar componentes.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      registeredUsers: [],

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      addRegisteredUser: (user) => {
        set((state) => ({
          registeredUsers: [...state.registeredUsers, user],
        }));
      },

      logout: () => {
        set({ currentUser: null });
      },
    }),
    {
      // Llave de localStorage. Versionada para invalidar en caso de cambios
      // estructurales en el futuro.
      name: "katalina-auth-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);