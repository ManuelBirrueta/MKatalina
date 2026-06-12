/**
 * ============================================================================
 * GOOGLE LOGIN BUTTON — KATALINA (Fase 12 Turno 3B.4: toast bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component implícito a Client Component
 *     explícito (ya tenía "use client" porque maneja onClick + toast).
 *   - El toast del handleClick ahora usa useTranslations para mostrar el
 *     mensaje "Login con Google pendiente" en el idioma activo.
 *
 * Lo que NO cambia:
 *   - El componente sigue recibiendo `label` como prop. Las páginas
 *     (login/page.tsx, registro/page.tsx) le pasan el texto ya traducido:
 *     "Continuar con Google" / "Continue with Google" / etc.
 *   - El default del `label` se queda en español como fallback de seguridad.
 *     En el flujo real las páginas SIEMPRE le pasan label traducido, pero
 *     si por error alguien usa <GoogleLoginButton /> sin label, prefiero
 *     que muestre algo legible en lugar de undefined.
 *   - El SVG con los 4 colores oficiales de Google
 *   - El styling oficial de Google (fondo blanco, borde gris, hover sutil)
 *
 * ─── POR QUÉ EL LABEL VIENE POR PROP (NO POR useTranslations interno) ──
 *
 * Las dos páginas que lo usan tienen labels DIFERENTES:
 *   - /login → "Continuar con Google" / "Continue with Google"
 *   - /registro → "Registrarse con Google" / "Sign up with Google"
 *
 * Si el componente resolviera el label internamente, tendríamos que pasar
 * un "variant" en lugar del label. Más complicado por menor beneficio.
 *
 * El toast SÍ vive aquí porque es el mismo en ambas páginas (siempre dice
 * "Login con Google pendiente" / "Google login pending"). Centralizarlo
 * en el componente evita duplicar las strings en cada página.
 * ─────────────────────────────────────────────────────────────────────
 */

"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Logo G de Google como SVG inline. Sin cambios.
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
  /**
   * Texto del botón. Debe venir ya traducido al locale activo.
   *
   * Default en español por si alguien usa el componente sin pasar label
   * (fallback defensivo, no debería pasar en el flujo normal).
   */
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
   * Traducciones para el toast.
   * Reutilizamos namespace auth.login porque las claves "googlePendingToastTitle"
   * y "googlePendingToastDescription" están ahí.
   */
  const t = useTranslations("auth.login");

  /**
   * handleClick — por ahora muestra toast informativo en el idioma activo.
   *
   * En Fase 12 esto se reemplazará por:
   *   import { signIn } from "next-auth/react";
   *   const handleClick = () => signIn("google");
   */
  const handleClick = () => {
    toast.info(t("googlePendingToastTitle"), {
      description: t("googlePendingToastDescription"),
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "w-full h-11 px-4",
        "flex items-center justify-center gap-3",
        "bg-white border border-[#dadce0]",
        "rounded-md",
        "text-sm font-medium text-[#3c4043]",
        "hover:bg-[#f8f9fa] hover:shadow-sm",
        "transition-all duration-150",
        "cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-none",
        className
      )}
    >
      <GoogleIcon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}