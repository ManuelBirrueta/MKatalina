/**
 * ============================================================================
 * PAGE: /registro — KATALINA
 * ============================================================================
 *
 * Página de creación de cuenta.
 *
 * Estructura idéntica a /login pero con RegisterForm en lugar de LoginForm.
 * El AuthLayout se reutiliza con título y subtítulo diferentes.
 *
 * Como en /login: si ya hay sesión activa, redirigimos al home porque no
 * tiene sentido mostrar el form de registro.
 *
 * Tras registro exitoso, el RegisterForm internamente:
 *   1. Llama register() del hook
 *   2. Si OK, el hook automáticamente inicia sesión (no hay que llamar login)
 *   3. Muestra toast de bienvenida
 *   4. Redirige según ?redirect= o al home
 * ============================================================================
 */

"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useAuth } from "@/hooks/use-auth";
import { Container } from "@/components/layout/Container";

function RegisterPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

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
      eyebrow="Únete a Katalina"
      title="Crear cuenta"
      subtitle="Crea tu cuenta para guardar productos, hacer seguimiento de tus pedidos y acceder a ofertas exclusivas."
      alternateAction={{
        prompt: "¿Ya tienes cuenta?",
        linkText: "Inicia sesión",
        href: "/login",
      }}
    >
      <RegisterForm />

      {/* Separador */}
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

      {/*
       * Botón Google con label diferente al login.
       * "Registrarse con Google" en lugar de "Continuar con Google".
       * Más claro para el usuario qué va a pasar.
       */}
      <GoogleLoginButton label="Registrarse con Google" />
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