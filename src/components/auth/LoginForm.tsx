/**
 * ============================================================================
 * LOGIN FORM — MKATALINA (Fase 13 · Etapa 6C: correo y contraseña)
 * ============================================================================
 *
 * CAMBIOS DE LA ETAPA 6C:
 *   - "¿Olvidaste tu contraseña?" ya lleva a /recuperar-contrasena (antes
 *     mostraba un aviso de "próximamente").
 *   - Si la cuenta existe pero aún no confirma su correo (errorCode
 *     loginEmailNotConfirmed), se explica eso y se ofrece "Reenviar correo"
 *     (useAuth().resendConfirmation), en lugar de "datos incorrectos".
 *   Los textos nuevos viven en src/lib/account-copy.ts (es/en).
 *
 * ─── Historial ───────────────────────────────────────────────────────
 *
 * Cambios respecto a la versión anterior:
 *   - Imports actualizados:
 *     * Link de "next/link" → "@/i18n/navigation" (mantiene prefijo locale)
 *     * useRouter de "next/navigation" → "@/i18n/navigation"
 *     * useSearchParams se queda en "next/navigation" (no necesita i18n)
 *   - useTranslations agregado para namespace "auth.login", "auth.shared", etc.
 *   - validateField recibe `t` como parámetro (igual patrón que CheckoutForm)
 *   - El submitError ahora es un errorCode + un t para resolverlo
 *   - Todos los textos hardcoded traducidos (labels, placeholders, botones,
 *     aria-labels, toasts)
 *
 * Lo que NO cambia:
 *   - Estructura visual: campos email + password con toggle de visibilidad
 *   - Link "¿Olvidaste tu contraseña?" sigue mostrando toast pending
 *   - Banner de error rojo arriba del formulario
 *   - Lógica de validación (onBlur, onChange, onSubmit, validateAll)
 *   - Redirección post-login con ?redirect=
 *
 * ─── PATRÓN PARA EL ERROR DEL HOOK ────────────────────────────────────
 *
 * Antes:
 *   const result = await login(...);
 *   if (!result.success) {
 *     setSubmitError(result.error ?? "Error al iniciar sesión");
 *   }
 *
 * Ahora:
 *   const result = await login(...);
 *   if (!result.success) {
 *     setSubmitError(
 *       result.errorCode
 *         ? tErrors(result.errorCode)
 *         : tLogin("fallbackError")
 *     );
 *   }
 *
 * El hook devuelve un código identificable. El componente lo traduce
 * usando t() del namespace auth.errors. Si por alguna razón no viene
 * código (no debería pasar), cae al fallback "Sign in failed".
 *
 * IMPORTANTE: usamos `as keyof Messages["auth"]["errors"]` o `as any` para
 * permitir el lookup dinámico. next-intl es estricto con las claves; al
 * pasarle un string dinámico, TypeScript se queja. Lo resolvemos con cast.
 * ─────────────────────────────────────────────────────────────────────
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { accountCopy } from "@/lib/account-copy";

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Tipo de la función traductora que pasamos a validateField.
 * Liberal (acepta cualquier key) por simplicidad.
 */
type ValidateFn = (key: string) => string;

/**
 * Validar un campo individual.
 *
 * Cambio: recibe `t` para resolver los mensajes de error desde messages.json.
 * El `t` viene del namespace "auth.validation" en el componente caller.
 */
function validateField(
  field: "email" | "password",
  value: string,
  t: ValidateFn
): string | undefined {
  const trimmed = value.trim();

  if (field === "email") {
    if (!trimmed) return t("emailRequired");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return t("emailInvalid");
    return undefined;
  }

  if (field === "password") {
    if (!value) return t("passwordRequired");
    return undefined;
  }

  return undefined;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, resendConfirmation } = useAuth();
  // Textos nuevos de la Etapa 6C (src/lib/account-copy.ts).
  const tAccount = accountCopy(useLocale());

  // 4 namespaces para los distintos tipos de textos
  const tLogin = useTranslations("auth.login");
  const tShared = useTranslations("auth.shared");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Etapa 6C: la cuenta existe pero falta confirmar el correo.
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  /** Reenvía el correo de confirmación al correo escrito. */
  const handleResend = async () => {
    setResending(true);
    const result = await resendConfirmation(email);
    setResending(false);
    setResendMessage(
      result.success
        ? tAccount.resent
        : result.errorCode === "rateLimited"
          ? tAccount.rateLimited
          : tAccount.sendError,
    );
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateField("email", email, tValidation);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateField("password", password, tValidation);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) return;

    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success(tLogin("toastSuccessTitle"), {
        description: tLogin("toastSuccessDescription"),
      });

      const redirectTo = searchParams.get("redirect") ?? "/";
      router.push(redirectTo);
    } else {
      /**
       * Traducir el errorCode del hook.
       * Si no viene errorCode (no debería pasar), usar fallback.
       * Cast a any porque tErrors espera claves estáticas pero
       * nuestro código es dinámico.
       */
      // Etapa 6C: correo sin confirmar → mensaje propio + botón reenviar.
      // (Este código no está en auth.errors de messages, por eso va aparte.)
      if (result.errorCode === "loginEmailNotConfirmed") {
        setNotConfirmed(true);
        setResendMessage(null);
        setSubmitError(tAccount.notConfirmed);
        setIsSubmitting(false);
        return;
      }
      setNotConfirmed(false);

      const errorMessage = result.errorCode
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tErrors(result.errorCode as any)
        : tLogin("fallbackError");
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
      {/* Banner de error del submit */}
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
          <div className="space-y-2">
            <p>{submitError}</p>
            {/* Etapa 6C: reenviar el correo de confirmación */}
            {notConfirmed && (
              <>
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resending}
                  className="text-sm font-medium underline underline-offset-4 disabled:opacity-50"
                >
                  {tAccount.resend}
                </button>
                {resendMessage && (
                  <p className="text-xs text-foreground">{resendMessage}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-medium mb-1.5"
        >
          {tLogin("emailLabel")}
        </label>
        <input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: undefined }));
            }
            if (submitError) setSubmitError(null);
          }}
          onBlur={() => {
            const error = validateField("email", email, tValidation);
            if (error) setErrors((prev) => ({ ...prev, email: error }));
          }}
          placeholder={tShared("emailPlaceholder")}
          autoFocus
          className={inputClass("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Contraseña con link "olvidé contraseña" alineado a la derecha */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="block text-sm font-medium">
            {tLogin("passwordLabel")}
          </label>
          {/* Etapa 6C: lleva a la página real de recuperación. */}
          <Link
            href="/recuperar-contrasena"
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            {tLogin("forgotPassword")}
          </Link>
        </div>

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
              const error = validateField("password", password, tValidation);
              if (error) setErrors((prev) => ({ ...prev, password: error }));
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
        {isSubmitting ? tLogin("submitting") : tLogin("submitButton")}
      </Button>
    </form>
  );
}