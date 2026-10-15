/**
 * ============================================================================
 * PAGE: /[locale]/confirmar — MKATALINA · Fase 13 · Etapa 6C
 * ============================================================================
 *
 * A esta página llega el cliente desde el correo "Confirma tu correo" que
 * Supabase manda al registrarse. El enlace trae el código de un solo uso:
 *     /es/confirmar?token_hash=…&type=email
 *
 * La página NO confirma al abrirse: muestra el botón "Confirmar mi correo" y
 * solo al pulsarlo llama a confirmEmailAction (src/actions/auth.ts), que
 * gasta el código con Supabase. Así los programas de correo que abren
 * enlaces automáticamente (Outlook/Microsoft 365) no lo gastan antes que el
 * cliente. Ver la explicación completa en src/actions/auth.ts.
 *
 * Al confirmar, el servidor deja la sesión iniciada y la página recarga el
 * sitio en el inicio (recarga completa, para que el encabezado y el carrito
 * lean la sesión nueva).
 *
 * Si falta el código o ya no sirve: mensaje "Este enlace ya no es válido" con
 * el camino para seguir (iniciar sesión, donde se ofrece reenviar el correo).
 *
 * useSearchParams exige un <Suspense> alrededor (igual que en /login).
 * ============================================================================
 */

"use client";

import { Suspense, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Link } from "@/i18n/navigation";
import { confirmEmailAction } from "@/actions/auth";
import { accountCopy } from "@/lib/account-copy";

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="h-96" aria-hidden="true" />
        </Container>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const locale = useLocale();
  const t = accountCopy(locale);
  const searchParams = useSearchParams();

  const tokenHash = searchParams.get("token_hash") ?? "";
  const [status, setStatus] = useState<"idle" | "working" | "invalid" | "error">(
    tokenHash ? "idle" : "invalid",
  );

  const handleConfirm = async () => {
    setStatus("working");
    const result = await confirmEmailAction(tokenHash);
    if (result.ok) {
      toast.success(t.confirmed);
      // Recarga completa al inicio: la sesión nueva quedó en las cookies.
      window.location.assign(`/${locale === "en" ? "en" : "es"}`);
      return;
    }
    setStatus(result.error === "invalidLink" ? "invalid" : "error");
  };

  return (
    <AuthLayout
      eyebrow={t.confirmEyebrow}
      title={status === "invalid" ? t.invalidLinkTitle : t.confirmTitle}
      subtitle={status === "invalid" ? t.invalidConfirmText : t.confirmSubtitle}
      alternateAction={{
        prompt: t.rememberedPrompt,
        linkText: t.loginLink,
        href: "/login",
      }}
    >
      {status === "invalid" ? (
        <Button asChild size="lg" className="w-full">
          <Link href="/login">{t.goToLogin}</Link>
        </Button>
      ) : (
        <div className="space-y-4">
          {status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{t.serverError}</p>
            </div>
          )}
          <Button
            size="lg"
            className="w-full"
            onClick={() => void handleConfirm()}
            disabled={status === "working"}
          >
            {status === "working" ? t.confirming : t.confirmButton}
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}