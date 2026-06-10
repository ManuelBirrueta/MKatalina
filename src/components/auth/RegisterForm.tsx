/**
 * ============================================================================
 * REGISTER FORM — KATALINA
 * ============================================================================
 *
 * Formulario de creación de cuenta nueva.
 *
 * Campos:
 *   - Nombre
 *   - Apellido
 *   - Email
 *   - Contraseña (con lista de requisitos visible en tiempo real)
 *   - Checkbox "Acepto términos y condiciones"
 *
 * Validación:
 *   - Nombre y apellido: mínimo 2 chars
 *   - Email: formato válido + no duplicado (lo verifica el hook al hacer submit)
 *   - Contraseña: cumple las 3 reglas (mínimo 8, una mayúscula, un número)
 *   - Términos: debe estar checked
 *
 * Feature destacado: lista de requisitos de contraseña visible.
 *   Mientras el usuario escribe, debajo del campo aparecen 3 líneas:
 *     ○ Mínimo 8 caracteres
 *     ○ Al menos una mayúscula
 *     ○ Al menos un número
 *   Cada línea cambia de gris (○) a verde con check (✓) cuando se cumple
 *   ese requisito. UX clave para reducir frustración.
 *
 * Flujo post-registro:
 *   - El hook useAuth.register() crea la cuenta Y automáticamente
 *     inicia sesión.
 *   - Mostramos toast de bienvenida.
 *   - Redirigimos según ?redirect= o al home.
 *
 * Sobre el banner de error genérico vs específico:
 *   Mismo patrón que LoginForm — si el registro falla (email duplicado, etc.),
 *   mostramos banner rojo con mensaje del backend.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PASSWORD_RULES } from "@/data/mock-users";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  acceptTerms?: string;
}

/**
 * Validar un campo individual.
 *
 * Acepta el valor como `unknown` para manejar tanto strings (textos) como
 * boolean (checkbox). Internamente sabe qué esperar de cada campo según
 * su nombre.
 */
function validateField(
  field: keyof FormData,
  value: unknown
): string | undefined {
  switch (field) {
    case "firstName":
      if (typeof value !== "string" || !value.trim()) {
        return "El nombre es obligatorio";
      }
      if (value.trim().length < 2) return "Mínimo 2 caracteres";
      return undefined;

    case "lastName":
      if (typeof value !== "string" || !value.trim()) {
        return "El apellido es obligatorio";
      }
      if (value.trim().length < 2) return "Mínimo 2 caracteres";
      return undefined;

    case "email": {
      if (typeof value !== "string" || !value.trim()) {
        return "El email es obligatorio";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) return "Formato de email inválido";
      return undefined;
    }

    case "password":
      if (typeof value !== "string" || !value) {
        return "La contraseña es obligatoria";
      }
      // No mostramos error específico aquí — los requisitos viven en la
      // lista visual debajo del campo. Solo validamos que CUMPLA todas.
      if (!PASSWORD_RULES.every((rule) => rule.test(value))) {
        return "La contraseña no cumple los requisitos";
      }
      return undefined;

    case "acceptTerms":
      if (value !== true) return "Debes aceptar los términos para continuar";
      return undefined;

    default:
      return undefined;
  }
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Helper para actualizar un campo. Limpia el error del campo si existía
   * y también limpia el submitError global.
   */
  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) setSubmitError(null);
  };

  /**
   * Validar todo el formulario.
   */
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};

    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) return;

    setIsSubmitting(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    if (result.success) {
      toast.success("¡Bienvenida a Katalina!", {
        description: "Tu cuenta fue creada exitosamente",
      });

      const redirectTo = searchParams.get("redirect") ?? "/";
      router.push(redirectTo);
    } else {
      setSubmitError(result.error ?? "Error al crear cuenta");
      setIsSubmitting(false);
    }
  };

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
      {/* Banner de error general */}
      {submitError && (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3 p-3 rounded-md",
            "bg-destructive/10 border border-destructive/30",
            "text-sm text-destructive"
          )}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      {/* Nombre + Apellido en dos columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="register-firstName"
            className="block text-sm font-medium mb-1.5"
          >
            Nombre
          </label>
          <input
            id="register-firstName"
            type="text"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            onBlur={() => {
              const error = validateField("firstName", formData.firstName);
              if (error) setErrors((prev) => ({ ...prev, firstName: error }));
            }}
            className={inputClass("firstName")}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive mt-1" role="alert">
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="register-lastName"
            className="block text-sm font-medium mb-1.5"
          >
            Apellido
          </label>
          <input
            id="register-lastName"
            type="text"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            onBlur={() => {
              const error = validateField("lastName", formData.lastName);
              if (error) setErrors((prev) => ({ ...prev, lastName: error }));
            }}
            className={inputClass("lastName")}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive mt-1" role="alert">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="register-email"
          className="block text-sm font-medium mb-1.5"
        >
          Email
        </label>
        <input
          id="register-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => {
            const error = validateField("email", formData.email);
            if (error) setErrors((prev) => ({ ...prev, email: error }));
          }}
          placeholder="tu@email.com"
          className={inputClass("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/*
       * Contraseña con lista de requisitos en tiempo real.
       */}
      <div>
        <label
          htmlFor="register-password"
          className="block text-sm font-medium mb-1.5"
        >
          Contraseña
        </label>

        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => {
              // Solo mostramos error de password si está vacío.
              // Si tiene contenido pero no cumple reglas, la lista visual
              // ya comunica eso; no necesitamos texto rojo adicional.
              if (!formData.password) {
                setErrors((prev) => ({
                  ...prev,
                  password: "La contraseña es obligatoria",
                }));
              }
            }}
            className={cn(inputClass("password"), "pr-10")}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            tabIndex={-1}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            )}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/*
         * Lista de requisitos de contraseña.
         *
         * Cada regla se evalúa contra el valor actual del input.
         * Si la regla pasa → check verde, si no pasa → círculo gris.
         *
         * Esto da feedback inmediato sin necesidad de mostrar errores rojos.
         * El usuario sabe qué le falta y lo va completando.
         */}
        <ul className="mt-2 space-y-1">
          {PASSWORD_RULES.map((rule, index) => {
            const passes = rule.test(formData.password);
            return (
              <li
                key={index}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  "transition-colors duration-200",
                  passes ? "text-success" : "text-muted-foreground"
                )}
              >
                {passes ? (
                  <Check className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <Circle className="h-3 w-3 flex-shrink-0" />
                )}
                <span>{rule.message}</span>
              </li>
            );
          })}
        </ul>

        {errors.password && !formData.password && (
          <p className="text-xs text-destructive mt-1" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Checkbox de términos */}
      <div>
        <label
          className="flex items-start gap-3 cursor-pointer"
          htmlFor="register-terms"
        >
          <input
            id="register-terms"
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => updateField("acceptTerms", e.target.checked)}
            className="h-4 w-4 mt-0.5 accent-secondary cursor-pointer flex-shrink-0"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            Acepto los{" "}
            <Link
              href="/terminos"
              className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
            >
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
            >
              política de privacidad
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-destructive mt-1 ml-7" role="alert">
            {errors.acceptTerms}
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
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}