/**
 * ============================================================================
 * CHECK EMAIL NOTICE — MKATALINA · Fase 13 · Etapa 6C
 * ============================================================================
 *
 * Aviso "Revisa tu correo" que aparece después de crear una cuenta, cuando
 * Supabase pide confirmar el correo antes de iniciar sesión. Lo usan:
 *   - RegisterForm.tsx (registro normal)
 *   - checkout/confirmacion/page.tsx (cuenta creada después de comprar
 *     como invitado)
 *
 * Incluye "Reenviar correo" (useAuth().resendConfirmation) con una espera de
 * 60 segundos entre intentos, para no chocar con el límite de envíos de
 * Supabase y para que el cliente no lo pulse diez veces seguidas.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { MailCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { accountCopy } from "@/lib/account-copy";
import { cn } from "@/lib/utils";

/** Segundos de espera entre reenvíos. */
const COOLDOWN_SECONDS = 60;

export function CheckEmailNotice({
  email,
  showLoginLink = true,
  className,
}: {
  /** Correo al que se mandó la confirmación. */
  email: string;
  /** Muestra el enlace "Ir a iniciar sesión". */
  showLoginLink?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const t = accountCopy(locale);
  const { resendConfirmation } = useAuth();

  // Al aparecer el aviso, el correo se acaba de enviar: arranca la espera.
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [sending, setSending] = useState(false);

  // Cuenta regresiva de un segundo en un segundo.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setSending(true);
    setMessage(null);
    const result = await resendConfirmation(email);
    setSending(false);
    if (result.success) {
      setMessage({ text: t.resent, ok: true });
      setCooldown(COOLDOWN_SECONDS);
    } else {
      setMessage({
        text: result.errorCode === "rateLimited" ? t.rateLimited : t.sendError,
        ok: false,
      });
    }
  };

  return (
    <div
      className={cn(
        "border border-border rounded-md bg-card p-6 text-center space-y-4",
        className,
      )}
      role="status"
    >
      <MailCheck className="h-8 w-8 text-accent mx-auto" strokeWidth={1.5} />
      <div>
        <p className="font-display text-xl font-medium mb-2">{t.checkEmailTitle}</p>
        <p className="text-sm text-muted-foreground">{t.checkEmailText(email)}</p>
      </div>

      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={cooldown > 0 || sending}
        className="text-sm text-accent hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
      >
        {cooldown > 0 ? t.resendIn(cooldown) : t.resend}
      </button>

      {message && (
        <p className={cn("text-xs", message.ok ? "text-[#5A8A4F]" : "text-destructive")}>
          {message.text}
        </p>
      )}

      {showLoginLink && (
        <p>
          <Link href="/login" className="text-sm underline underline-offset-4 hover:text-accent">
            {t.goToLogin}
          </Link>
        </p>
      )}
    </div>
  );
}