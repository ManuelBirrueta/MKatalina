/**
 * ============================================================================
 * PAGE: /[locale]/recuperar-contrasena — MKATALINA · Fase 13 · Etapa 6C
 * ============================================================================
 *
 * "¿Olvidaste tu contraseña?" (enlace en el inicio de sesión, LoginForm.tsx).
 * El cliente escribe su correo y useAuth().requestPasswordReset le pide a
 * Supabase mandar el correo con el enlace a /[idioma]/actualizar-contrasena.
 *
 * SEGURIDAD: la respuesta es SIEMPRE "si existe una cuenta con ese correo,
 * te llegará un enlace", exista o no. Así este formulario no sirve para
 * averiguar qué correos están registrados en la tienda.
 * Solo se muestra un error distinto si Supabase rechaza por demasiados
 * intentos o por una falla del servicio.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { AlertCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/use-auth";
import { accountCopy, looksLikeEmail } from "@/lib/account-copy";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = accountCopy(locale);
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Correo al que se mandó el enlace (cuando ya se envió).
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!looksLikeEmail(email)) {
      setFieldError(t.emailInvalid);
      return;
    }

    setSending(true);
    const result = await requestPasswordReset(email);
    setSending(false);

    if (result.success) {
      setSentTo(email.trim());
    } else {
      setSubmitError(result.errorCode === "rateLimited" ? t.rateLimited : t.sendError);
    }
  };

  return (
    <AuthLayout
      eyebrow={t.forgotEyebrow}
      title={t.forgotTitle}
      subtitle={t.forgotSubtitle}
      alternateAction={{
        prompt: t.rememberedPrompt,
        linkText: t.loginLink,
        href: "/login",
      }}
    >
      {sentTo ? (
        <div className="border border-border rounded-md bg-card p-6 text-center space-y-3" role="status">
          <MailCheck className="h-8 w-8 text-accent mx-auto" strokeWidth={1.5} />
          <p className="font-display text-xl font-medium">{t.forgotSentTitle}</p>
          <p className="text-sm text-muted-foreground">{t.forgotSentText(sentTo)}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{submitError}</p>
            </div>
          )}

          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium mb-1.5">
              {t.emailLabel}
            </label>
            <input
              id="forgot-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError(null);
              }}
              className={cn(
                "w-full h-11 px-3 bg-background border border-input rounded-md text-sm",
                "focus:outline-none focus:border-ring transition-colors",
                fieldError && "border-destructive",
              )}
            />
            {fieldError && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {fieldError}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending ? t.sending : t.sendLink}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}