/**
 * ============================================================================
 * PAGE: /[locale]/actualizar-contrasena — MKATALINA · Fase 13 · Etapa 6C
 * ============================================================================
 *
 * A esta página llega el cliente desde el correo "Cambia tu contraseña" que
 * pidió en /recuperar-contrasena. El enlace trae el código de un solo uso:
 *     /es/actualizar-contrasena?token_hash=…&type=recovery
 *
 * El cliente escribe su contraseña nueva dos veces (con las mismas reglas del
 * registro: 8+ caracteres, una mayúscula y un número, PASSWORD_RULES de
 * src/data/mock-users.ts). Al guardar, resetPasswordAction
 * (src/actions/auth.ts) gasta el código y cambia la contraseña EN UN SOLO
 * PASO. Igual que en /confirmar: abrir el enlace no gasta nada, solo el
 * botón (protege contra los correos que abren enlaces solos).
 *
 * Si sale bien, el cliente queda con la sesión iniciada y se recarga el
 * sitio en el inicio.
 * Si el enlace ya no sirve: mensaje y botón "Pedir un enlace nuevo".
 *
 * useSearchParams exige un <Suspense> alrededor (igual que en /login).
 * ============================================================================
 */

"use client";

import { Suspense, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check, Circle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Link } from "@/i18n/navigation";
import { resetPasswordAction } from "@/actions/auth";
import { PASSWORD_RULES, isPasswordValid } from "@/data/mock-users";
import { accountCopy } from "@/lib/account-copy";
import { cn } from "@/lib/utils";

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="h-96" aria-hidden="true" />
        </Container>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}

function UpdatePasswordContent() {
  const locale = useLocale();
  const t = accountCopy(locale);
  // Textos de las reglas de contraseña: los mismos del registro.
  const tPasswordRules = useTranslations("auth.passwordRules");
  const searchParams = useSearchParams();

  const tokenHash = searchParams.get("token_hash") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // true si falta el código o Supabase dijo que ya no sirve.
  const [invalidLink, setInvalidLink] = useState(!tokenHash);

  /** Recarga completa en el inicio (la sesión nueva quedó en las cookies). */
  const goHome = () => window.location.assign(`/${locale === "en" ? "en" : "es"}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Se revisa aquí primero para no gastar el código con una contraseña que
    // de todos modos sería rechazada.
    if (!isPasswordValid(password)) {
      setError(t.weakPassword);
      return;
    }
    if (password !== confirm) {
      setError(t.passwordsDontMatch);
      return;
    }

    setSaving(true);
    const result = await resetPasswordAction(tokenHash, password);
    if (result.ok) {
      toast.success(t.passwordSaved);
      goHome();
      return;
    }
    setSaving(false);

    switch (result.error) {
      case "invalidLink":
        setInvalidLink(true);
        break;
      case "samePassword":
        // El código ya se usó y la sesión quedó iniciada: solo se avisa.
        toast.info(t.samePassword);
        goHome();
        break;
      case "weakPassword":
        setError(t.weakPassword);
        break;
      default:
        setError(t.serverError);
    }
  };

  const inputClass = cn(
    "w-full h-11 px-3 bg-background border border-input rounded-md text-sm",
    "focus:outline-none focus:border-ring transition-colors",
  );

  return (
    <AuthLayout
      eyebrow={t.resetEyebrow}
      title={invalidLink ? t.invalidLinkTitle : t.resetTitle}
      subtitle={invalidLink ? t.invalidResetText : t.resetSubtitle}
      alternateAction={{
        prompt: t.rememberedPrompt,
        linkText: t.loginLink,
        href: "/login",
      }}
    >
      {invalidLink ? (
        <Button asChild size="lg" className="w-full">
          <Link href="/recuperar-contrasena">{t.requestNewLink}</Link>
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Contraseña nueva + lista de requisitos en vivo */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium mb-1.5">
              {t.newPassword}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className={cn(inputClass, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const passes = rule.test(password);
                return (
                  <li
                    key={rule.messageKey}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      passes ? "text-[#5A8A4F]" : "text-muted-foreground",
                    )}
                  >
                    {passes ? (
                      <Check className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span>{tPasswordRules(rule.messageKey)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Repetir contraseña */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1.5">
              {t.confirmPassword}
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError(null);
              }}
              className={inputClass}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? t.saving : t.savePassword}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}