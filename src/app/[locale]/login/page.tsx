/**
 * ============================================================================
 * PAGE: /login — KATALINA
 * ============================================================================
 *
 * Página de inicio de sesión. Orquesta:
 *   - AuthLayout (panel centrado con título)
 *   - LoginForm (email + password + submit)
 *   - Separador "─ o ─"
 *   - GoogleLoginButton (simulado)
 *
 * Guard de redirección si ya hay sesión:
 *   Si el usuario ya está logueado y entra a /login, lo redirigimos al home.
 *   No tiene sentido mostrar el formulario a alguien que ya tiene sesión.
 *
 * Si vino con ?redirect=X (guard de ruta privada), después de login exitoso
 * navegamos ahí. Si no, al home. Esto lo maneja LoginForm internamente.
 *
 * useSearchParams requiere Suspense en Next.js 16 (App Router):
 *   Como LoginForm consume useSearchParams (para leer ?redirect=), debe
 *   estar dentro de un boundary <Suspense>. El componente padre lo envuelve.
 * ============================================================================
 */

"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  /**
   * Si ya hay sesión, redirigir al home.
   *
   * useEffect porque router.push no debe llamarse en render (puede causar
   * loops y warnings de React).
   */
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  /**
   * Si está autenticado, no renderizamos el formulario mientras se redirige.
   * Evita el "flash" del form antes de la redirección.
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
      eyebrow="Bienvenida de vuelta"
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta para ver tus pedidos, wishlist y datos guardados."
      alternateAction={{
        prompt: "¿Aún no tienes cuenta?",
        linkText: "Regístrate",
        href: "/registro",
      }}
    >
      {/* Formulario de email + contraseña */}
      <LoginForm />

      {/*
       * Separador "─ o ─" entre formulario y Google.
       *
       * Implementación: dos líneas horizontales con texto centrado.
       * Patrón visual estándar para alternativas de login.
       */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            o
          </span>
        </div>
      </div>

      {/* Botón Google (simulado) */}
      <GoogleLoginButton />
    </AuthLayout>
  );
}

/**
 * Export default con Suspense boundary.
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