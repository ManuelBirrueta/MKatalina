/**
 * ============================================================================
 * PAGE: /[locale]/registro — KATALINA (Fase 12 Turno 3B.4: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import useRouter cambia de "next/navigation" a "@/i18n/navigation".
 *   - useTranslations agregado con namespace "auth.register" (y reutilizamos
 *     "auth.login" para el separador "o", ya que es el mismo texto en ambas
 *     páginas).
 *   - Todos los strings hardcoded traducidos antes de pasarlos como props
 *     a AuthLayout y GoogleLoginButton.
 *
 * Lo que NO cambia:
 *   - Estructura: AuthLayout + RegisterForm + separador + GoogleLoginButton
 *   - Guard de redirección si ya hay sesión
 *   - Suspense boundary
 *   - El label del botón Google es DIFERENTE al de /login:
 *     "Registrarse con Google" en lugar de "Continuar con Google"
 *
 * ─── REUTILIZACIÓN DE auth.login.orSeparator ────────────────────────────
 *
 * El separador "o" / "or" es idéntico en ambas páginas. Para no duplicar
 * la clave (auth.register.orSeparator = auth.login.orSeparator), llamamos
 * useTranslations dos veces:
 *   - tRegister para los textos propios de registro
 *   - tLogin para el separador compartido
 *
 * Alternativa: mover orSeparator a auth.shared. Es más limpio
 * conceptualmente, pero solo lo usan estas 2 páginas, así que duplicar
 * tampoco era el fin del mundo. Por consistencia con auth.shared (que
 * ya tiene emailPlaceholder, showPassword, hidePassword) podríamos
 * moverlo ahí en un futuro pulido. Por ahora vive en auth.login.
 *
 * ─── alternateAction APUNTA A "/login" ─────────────────────────────────
 *
 * Decisión arquitectural: rutas en español. Link de @/i18n/navigation
 * prefija el locale automáticamente.
 * ─────────────────────────────────────────────────────────────────────
 */

"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useAuth } from "@/hooks/use-auth";
import { Container } from "@/components/layout/Container";

function RegisterPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  /**
   * Dos namespaces:
   *   - tRegister: textos propios de la página /registro
   *   - tLogin: para reutilizar el separador "orSeparator" (compartido con /login)
   */
  const tRegister = useTranslations("auth.register");
  const tLogin = useTranslations("auth.login");

  // Si ya hay sesión, redirigir al home
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <Container>
        <div className="h-96" aria-hidden="true" />
      </Container>
    );
  }

  return (
    <AuthLayout
      eyebrow={tRegister("pageEyebrow")}
      title={tRegister("title")}
      subtitle={tRegister("pageSubtitle")}
      alternateAction={{
        prompt: tRegister("haveAccountPrompt"),
        linkText: tRegister("loginLink"),
        // Ruta siempre en español. Link de @/i18n/navigation prefija el locale.
        href: "/login",
      }}
    >
      {/* Formulario de registro — su propia internacionalización */}
      <RegisterForm />

      {/* Separador (reutiliza la clave de auth.login.orSeparator) */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {tLogin("orSeparator")}
          </span>
        </div>
      </div>

      {/*
       * Botón Google con label específico para registro.
       * "Registrarse con Google" / "Sign up with Google" — más claro para
       * el usuario qué va a pasar (crea cuenta nueva, no inicia sesión).
       */}
      <GoogleLoginButton label={tRegister("googleButton")} />
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="h-96" aria-hidden="true" />
        </Container>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}