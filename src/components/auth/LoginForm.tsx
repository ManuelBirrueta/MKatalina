/**
 * ============================================================================
 * LOGIN FORM — KATALINA
 * ============================================================================
 *
 * Formulario de inicio de sesión. Dos campos: email y contraseña.
 *
 * Validación:
 *   - Email: requerido + formato válido
 *   - Contraseña: requerida (no validamos las reglas de complejidad aquí
 *     porque podría ser que el usuario tenga una cuenta vieja con
 *     contraseña que ya no cumple — solo bloqueamos el campo vacío)
 *
 * Features:
 *   - Toggle de visibilidad de contraseña (icono de ojo)
 *   - Link "¿Olvidaste tu contraseña?" (placeholder por ahora, llevará a
 *     `/recuperar-contrasena` que veremos en Fase 12 con email real)
 *   - Manejo de error del backend: si el hook useAuth devuelve error,
 *     lo mostramos en un banner rojo arriba del formulario
 *   - Redirección post-login: si vino con ?redirect=X, navega ahí
 *     después del login exitoso. Si no, navega al home.
 *
 * Estado del form:
 *   Todo el estado vive en este componente porque no se comparte con
 *   nadie. No hace falta lift al padre.
 *
 * Validación timing:
 *   - onBlur: valida el campo que el usuario acaba de dejar (no agresivo)
 *   - onSubmit: valida todos los campos antes de intentar login
 *   - onChange: si el campo tenía error, limpia el error al empezar a
 *     escribir de nuevo (UX cómoda)
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Errores del formulario por campo.
 */
interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Validar un campo individual. Misma idea que en CheckoutForm.
 */
function validateField(
  field: "email" | "password",
  value: string
): string | undefined {
  const trimmed = value.trim();

  if (field === "email") {
    if (!trimmed) return "El email es obligatorio";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "Formato de email inválido";
    return undefined;
  }

  if (field === "password") {
    if (!value) return "La contraseña es obligatoria";
    return undefined;
  }

  return undefined;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Estado de los campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estado de errores
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Estado de "enviando"
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validar todos los campos antes de enviar.
   * Devuelve true si todo OK.
   */
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateField("email", email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateField("password", password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handler del submit.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar error previo del submit
    setSubmitError(null);

    // Validar campos
    if (!validateAll()) return;

    setIsSubmitting(true);

    // Llamar al login del hook
    const result = await login(email, password);

    if (result.success) {
      // Éxito: mostrar toast y redirigir
      toast.success("Sesión iniciada", {
        description: "Bienvenida de vuelta a Katalina",
      });

      /**
       * Redirección post-login:
       *   - Si vino con ?redirect=X, navegar ahí
       *   - Si no, navegar al home
       *
       * El parámetro redirect lo agregan los guards de ruta cuando un
       * usuario sin sesión intenta acceder a una página privada.
       */
      const redirectTo = searchParams.get("redirect") ?? "/";
      router.push(redirectTo);
    } else {
      // Error: mostrar mensaje
      setSubmitError(result.error ?? "Error al iniciar sesión");
      setIsSubmitting(false);
    }
  };

  /**
   * Helper de clases del input. Agrega borde rojo si hay error en ese campo.
   */
  const inputClass = (field: keyof FormErrors) =>
    cn(
      "w-full h-11 px-3",
      "bg-background border border-input rounded-md",
      "text-sm",
      "focus:outline-none focus:border-ring transition-colors",
      errors[field] && "border-destructive"
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/*
       * Banner de error del submit.
       * Aparece solo si el login falló con un mensaje del servidor.
       * Se limpia al cambiar cualquier campo.
       */}
      {submitError && (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3",
            "p-3 rounded-md",
            "bg-destructive/10 border border-destructive/30",
            "text-sm text-destructive"
          )}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-medium mb-1.5"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // Limpiar error del campo al escribir
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: undefined }));
            }
            // Limpiar error del submit también
            if (submitError) setSubmitError(null);
          }}
          onBlur={() => {
            const error = validateField("email", email);
            if (error) setErrors((prev) => ({ ...prev, email: error }));
          }}
          placeholder="tu@email.com"
          autoFocus
          className={inputClass("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Contraseña */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="block text-sm font-medium">
            Contraseña
          </label>
          {/*
           * Link "Olvidé mi contraseña" alineado a la derecha del label.
           * Placeholder por ahora — llevará a /recuperar-contrasena que
           * construiremos en Fase 12 cuando tengamos email real con Resend.
           */}
          <Link
            href="/recuperar-contrasena"
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
            onClick={(e) => {
              // Por ahora, mostrar toast en lugar de navegar a página que no existe
              e.preventDefault();
              toast.info("Recuperar contraseña pendiente", {
                description:
                  "Esta función estará disponible cuando integremos el backend.",
              });
            }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/*
         * Wrapper relativo para posicionar el botón del ojo absoluto.
         * El input tiene padding-right grande para que el texto no se
         * superponga con el icono.
         */}
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
              if (submitError) setSubmitError(null);
            }}
            onBlur={() => {
              const error = validateField("password", password);
              if (error) setErrors((prev) => ({ ...prev, password: error }));
            }}
            className={cn(inputClass("password"), "pr-10")}
          />
          {/*
           * Botón toggle de visibilidad.
           * Icono cambia entre Eye (cuando contraseña oculta) y EyeOff
           * (cuando visible). aria-label dinámico para screen readers.
           */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            tabIndex={-1} // No incluir en orden de tabulación
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-muted-foreground hover:text-foreground transition-colors",
              "cursor-pointer"
            )}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {errors.password && (
          <p className="text-xs text-destructive mt-1" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Botón submit */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}