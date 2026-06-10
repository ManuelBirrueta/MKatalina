/**
 * ============================================================================
 * GOOGLE LOGIN BUTTON — KATALINA (simulado)
 * ============================================================================
 *
 * Botón "Continuar con Google" con styling oficial de Google.
 *
 * Por ahora SIMULADO: al hacer clic muestra un toast explicando que el
 * login social está pendiente de integración con el backend (Fase 12).
 *
 * Cuando llegue NextAuth en Fase 12:
 *   - Reemplazamos el handler onClick por `signIn("google", { ... })`
 *   - El usuario es redirigido a Google para autenticarse
 *   - Google redirige de vuelta con un token
 *   - NextAuth crea la sesión automáticamente
 *
 * El componente visualmente NO CAMBIA. Solo cambia la implementación interna.
 *
 * Styling:
 *   Google publica guidelines oficiales para botones de "Sign in with Google".
 *   Las seguimos para coherencia visual y para que el usuario reconozca
 *   el botón intuitivamente:
 *     - Fondo blanco
 *     - Borde gris claro
 *     - Logo G de Google de 4 colores
 *     - Texto "Continuar con Google" en negro
 *
 *   Esto es estándar en sitios que usan Google Sign-In.
 *
 * Accesibilidad:
 *   - aria-label explícito porque el botón tiene icono + texto, y queremos
 *     que screen readers entiendan ambos
 *   - Estados focus/disabled estilizados explícitamente
 * ============================================================================
 */

"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Logo G de Google como SVG inline.
 *
 * Lo dibujamos directamente para no depender de assets externos.
 * Los 4 colores son los oficiales de Google:
 *   - Azul:    #4285F4
 *   - Verde:   #34A853
 *   - Amarillo: #FBBC05
 *   - Rojo:    #EA4335
 *
 * Las paths fueron extraídas del SVG oficial de Google.
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface GoogleLoginButtonProps {
  /** Texto del botón. Default: "Continuar con Google" */
  label?: string;
  /** Si está disabled (ej. durante un submit en proceso) */
  disabled?: boolean;
  /** className opcional para personalizar */
  className?: string;
}

export function GoogleLoginButton({
  label = "Continuar con Google",
  disabled = false,
  className,
}: GoogleLoginButtonProps) {
  /**
   * handleClick — por ahora muestra toast informativo.
   *
   * En Fase 12 esto se reemplazará por:
   *   import { signIn } from "next-auth/react";
   *   const handleClick = () => signIn("google");
   */
  const handleClick = () => {
    toast.info("Login con Google pendiente", {
      description:
        "Esta función estará disponible cuando integremos NextAuth en una fase posterior.",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        // Layout
        "w-full h-11 px-4",
        "flex items-center justify-center gap-3",
        // Apariencia oficial de Google
        "bg-white border border-[#dadce0]",
        "rounded-md",
        // Texto en negro oscuro
        "text-sm font-medium text-[#3c4043]",
        // Interacciones
        "hover:bg-[#f8f9fa] hover:shadow-sm",
        "transition-all duration-150",
        "cursor-pointer",
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-none",
        className
      )}
    >
      <GoogleIcon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}