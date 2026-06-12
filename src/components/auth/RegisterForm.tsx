/**
 * ============================================================================
 * REGISTER FORM — KATALINA (Fase 12 Turno 3B.4: bilingüe completo)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Imports actualizados: Link y useRouter desde "@/i18n/navigation"
 *   - useTranslations agregado con varios namespaces
 *   - validateField recibe `t` como parámetro
 *   - El submitError ahora se traduce desde errorCode con tErrors
 *   - PASSWORD_RULES.message reemplazado por PASSWORD_RULES.messageKey
 *     resuelto con tPasswordRules(rule.messageKey)
 *   - Todos los textos hardcoded traducidos:
 *     * Labels: Nombre/Apellido/Email/Contraseña → First name/Last name/Email/Password
 *     * Placeholder de email
 *     * Botón "Crear cuenta" / "Creando cuenta..."
 *     * Aria-labels de toggle password
 *     * Toast de éxito
 *     * Mensajes de validación inline
 *     * Texto del checkbox de términos con rich text (2 links inline)
 *
 * Lo que NO cambia:
 *   - Estructura visual: nombre+apellido en grid, email, password con
 *     lista de requisitos en tiempo real, checkbox de términos
 *   - Lista de requisitos con check verde / círculo gris en tiempo real
 *   - Lógica de validación (onBlur, validateAll, error states)
 *   - Redirección post-registro con ?redirect=
 *
 * ─── PATRÓN PARA EL CHECKBOX DE TÉRMINOS ──────────────────────────────
 *
 * El texto del checkbox tiene 2 links inline:
 *   "Acepto los [términos y condiciones] y la [política de privacidad]"
 *
 * Para mantener esos links bilingüe usamos t.rich() con dos componentes
 * custom (terms y privacy) que envuelven los chunks de texto en <Link>.
 *
 * La clave en messages.json es:
 *   "termsLabel": "Acepto los <terms>términos y condiciones</terms> y la <privacy>política de privacidad</privacy>"
 *
 * En el JSX:
 *   {t.rich("termsLabel", {
 *     terms: (chunks) => <Link href="/terminos">{chunks}</Link>,
 *     privacy: (chunks) => <Link href="/privacidad">{chunks}</Link>,
 *   })}
 *
 * Esto permite que cada idioma reordene el texto si la sintaxis natural
 * cambia (en inglés podría ser "I accept the [terms] and the [privacy
 * policy]" con orden diferente).
 *
 * ─── PASSWORD_RULES CON messageKey ────────────────────────────────────
 *
 * Antes:
 *   PASSWORD_RULES.map((rule, index) => (
 *     <span>{rule.message}</span>
 *   ))
 *
 * Ahora:
 *   PASSWORD_RULES.map((rule, index) => (
 *     <span>{tPasswordRules(rule.messageKey)}</span>
 *   ))
 *
 * El rule.messageKey es uno de: "minChars" | "uppercase" | "number".
 * tPasswordRules viene de useTranslations("auth.passwordRules").
 *
 * Cast a `any` necesario porque next-intl tipa estrictamente las claves;
 * el messageKey de PasswordRule es del tipo unión, pero el lookup
 * dinámico necesita el cast.
 * ─────────────────────────────────────────────────────────────────────
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
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
 * Tipo liberal para t passed-in.
 */
type ValidateFn = (key: string) => string;

/**
 * Validar un campo individual.
 *
 * Cambio: recibe `t` para resolver los mensajes de error.
 */
function validateField(
  field: keyof FormData,
  value: unknown,
  t: ValidateFn
): string | undefined {
  switch (field) {
    case "firstName":
      if (typeof value !== "string" || !value.trim()) {
        return t("firstNameRequired");
      }
      if (value.trim().length < 2) return t("minChars");
      return undefined;

    case "lastName":
      if (typeof value !== "string" || !value.trim()) {
        return t("lastNameRequired");
      }
      if (value.trim().length < 2) return t("minChars");
      return undefined;

    case "email": {
      if (typeof value !== "string" || !value.trim()) {
        return t("emailRequired");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) return t("emailInvalid");
      return undefined;
    }

    case "password":
      if (typeof value !== "string" || !value) {
        return t("passwordRequired");
      }
      if (!PASSWORD_RULES.every((rule) => rule.test(value))) {
        return t("passwordInvalid");
      }
      return undefined;

    case "acceptTerms":
      if (value !== true) return t("acceptTermsRequired");
      return undefined;

    default:
      return undefined;
  }
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  // 5 namespaces para los distintos tipos de textos
  const tRegister = useTranslations("auth.register");
  const tShared = useTranslations("auth.shared");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const tPasswordRules = useTranslations("auth.passwordRules");

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

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};

    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const error = validateField(field, formData[field], tValidation);
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
      toast.success(tRegister("toastSuccessTitle"), {
        description: tRegister("toastSuccessDescription"),
      });

      const redirectTo = searchParams.get("redirect") ?? "/";
      router.push(redirectTo);
    } else {
      // Traducir el errorCode desde tErrors. Fallback genérico si no viene.
      const errorMessage = result.errorCode
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tErrors(result.errorCode as any)
        : tRegister("fallbackError");
      setSubmitError(errorMessage);
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
            {tRegister("firstNameLabel")}
          </label>
          <input
            id="register-firstName"
            type="text"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            onBlur={() => {
              const error = validateField(
                "firstName",
                formData.firstName,
                tValidation
              );
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
            {tRegister("lastNameLabel")}
          </label>
          <input
            id="register-lastName"
            type="text"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            onBlur={() => {
              const error = validateField(
                "lastName",
                formData.lastName,
                tValidation
              );
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
          {tRegister("emailLabel")}
        </label>
        <input
          id="register-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => {
            const error = validateField("email", formData.email, tValidation);
            if (error) setErrors((prev) => ({ ...prev, email: error }));
          }}
          placeholder={tShared("emailPlaceholder")}
          className={inputClass("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Contraseña con lista de requisitos */}
      <div>
        <label
          htmlFor="register-password"
          className="block text-sm font-medium mb-1.5"
        >
          {tRegister("passwordLabel")}
        </label>

        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => {
              if (!formData.password) {
                setErrors((prev) => ({
                  ...prev,
                  password: tValidation("passwordRequired"),
                }));
              }
            }}
            className={cn(inputClass("password"), "pr-10")}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword
                ? tShared("hidePassword")
                : tShared("showPassword")
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
         * Lista de requisitos de contraseña en tiempo real.
         *
         * Cada regla tiene un messageKey que resolvemos con tPasswordRules.
         * Cast a `any` necesario porque el messageKey es un union literal
         * pero next-intl espera claves específicas en tiempo de compilación.
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
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <span>{tPasswordRules(rule.messageKey as any)}</span>
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
          {/*
           * Texto del checkbox con 2 links inline usando t.rich().
           * El idioma controla el orden de las palabras alrededor de los links.
           */}
          <span className="text-xs text-muted-foreground leading-relaxed">
            {tRegister.rich("termsLabel", {
              terms: (chunks) => (
                <Link
                  href="/terminos"
                  className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="/privacidad"
                  className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
                >
                  {chunks}
                </Link>
              ),
            })}
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
        {isSubmitting ? tRegister("submitting") : tRegister("submitButton")}
      </Button>
    </form>
  );
}