/**
 * ============================================================================
 * PAGE: /[locale]/login — KATALINA (Fase 12 Turno 3B.4: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import useRouter cambia de "next/navigation" a "@/i18n/navigation".
 *     Esto asegura que el redirect a "/" respete el locale activo.
 *   - useTranslations agregado con namespace "auth.login"
 *   - Todos los strings hardcoded pasados a AuthLayout y GoogleLoginButton
 *     se traducen primero con t(), luego se inyectan como props
 *   - El separador "o" / "or" también traducido
 *
 * Lo que NO cambia:
 *   - Estructura: AuthLayout + LoginForm + separador + GoogleLoginButton
 *   - Guard de redirección si ya hay sesión (useEffect → router.push("/"))
 *   - Suspense boundary porque LoginForm usa useSearchParams internamente
 *
 * ─── EL SEPARADOR "o" / "or" ──────────────────────────────────────────
 *
 * El separador es una sola letra ("o" en español, "or" en inglés). Como
 * cualquier otro texto traducido, viene de auth.login.orSeparator.
 *
 * El layout visual (dos líneas horizontales con texto centrado) NO cambia.
 * Solo cambia el texto del span del medio.
 *
 * ─── alternateAction APUNTA A "/registro" SIEMPRE ──────────────────────
 *
 * Las rutas internas siempre se mantienen en español según la decisión
 * arquitectural del proyecto (routing.ts sin pathnames estrictas). El
 * Link de @/i18n/navigation se encarga de prefijar el locale automáticamente:
 *   - /es/registro en español
 *   - /en/registro en inglés
 *
 * El LABEL del link ("Regístrate" / "Sign up") sí se traduce.
 * ─────────────────────────────────────────────────────────────────────
 */

"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useAuth } from "@/hooks/use-auth";
import { Container } from "@/components/layout/Container";

/**
 * Componente interno con la lógica.
 * Necesita Suspense boundary porque LoginForm usa useSearchParams.
 */
function LoginPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const t = useTranslations("auth.login");

  /**
   * Si ya hay sesión, redirigir al home (con locale automático).
   */
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  /**
   * Si está autenticado, no renderizamos el formulario mientras se redirige.
   */
  if (isAuthenticated) {
    return (
      <Container>
        <div className="h-96" aria-hidden="true" />
      </Container>
    );
  }

  return (
    <AuthLayout
      // Todos los textos del wrapper traducidos antes de pasarlos como props.
      eyebrow={t("pageEyebrow")}
      title={t("title")}
      subtitle={t("pageSubtitle")}
      alternateAction={{
        prompt: t("noAccountPrompt"),
        linkText: t("registerLink"),
        // href siempre en español. Link de @/i18n/navigation prefija el locale.
        href: "/registro",
      }}
    >
      {/* Formulario de email + contraseña — su propia internacionalización */}
      <LoginForm />

      {/*
       * Separador "─ o ─" / "─ or ─" entre formulario y Google.
       *
       * Estructura visual:
       *   - Dos líneas horizontales superpuestas con flexbox
       *   - Texto centrado encima con fondo bg-background para "cortar" la línea
       */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {t("orSeparator")}
          </span>
        </div>
      </div>

      {/*
       * Botón Google con label traducido.
       * Para /login: "Continuar con Google" / "Continue with Google".
       */}
      <GoogleLoginButton label={t("googleButton")} />
    </AuthLayout>
  );
}

/**
 * Export default con Suspense boundary.
 * useSearchParams (dentro de LoginForm) requiere Suspense en Next 16.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="h-96" aria-hidden="true" />
        </Container>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}