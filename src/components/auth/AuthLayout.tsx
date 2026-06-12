/**
 * ============================================================================
 * AUTH LAYOUT — KATALINA (Fase 12 Turno 3B.4: import locale-aware)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link cambia de "next/link" a "@/i18n/navigation".
 *     Esto asegura que el link de alternateAction (Regístrate / Inicia sesión)
 *     respete el prefijo locale activo (/en/registro vs /es/registro).
 *
 * Lo que NO cambia:
 *   - El componente sigue siendo el mismo Server Component.
 *   - Sigue recibiendo TODOS los textos por props (eyebrow, title, subtitle,
 *     alternateAction). NO conoce traducciones.
 *   - El padre (login/page.tsx, registro/page.tsx) le pasa los strings ya
 *     traducidos. Patrón "el padre decide" preservado.
 *
 * ─── POR QUÉ NO MIGRAMOS A useTranslations AQUÍ ────────────────────────
 *
 * AuthLayout es un wrapper genérico. Si en el futuro lo usamos también
 * para una página de "recuperar contraseña" o "verificar email", queremos
 * que siga siendo agnóstico al contenido — solo dibuja la estructura.
 *
 * Acoplarlo a auth.login/auth.register lo encierra a esos dos casos de uso.
 * Mejor que cada página inyecte sus propios textos traducidos.
 *
 * Es el mismo principio que aplicamos en CategoryMegaMenu, ProductCard, etc.:
 * componentes de presentación pura que reciben strings, no claves.
 * ─────────────────────────────────────────────────────────────────────
 */

import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  /** Texto pequeño en mayúsculas arriba del título — da contexto */
  eyebrow?: string;
  /** Título principal del formulario */
  title: string;
  /** Subtítulo descriptivo debajo del título */
  subtitle: string;
  /** El formulario en sí */
  children: React.ReactNode;
  /**
   * Link al modo alterno (si está en /login, link a /registro y viceversa).
   * Texto del prompt + texto del link + href.
   *
   * Importante: prompt y linkText deben venir ya traducidos al locale del usuario.
   * Esa responsabilidad la tiene la página que monta este layout.
   */
  alternateAction: {
    prompt: string; // ej. "¿No tienes cuenta?" / "Don't have an account yet?"
    linkText: string; // ej. "Regístrate" / "Sign up"
    href: string; // ej. "/registro" (siempre español, decisión arquitectural)
  };
}

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  alternateAction,
}: AuthLayoutProps) {
  return (
    <Container>
      <div
        className={cn(
          "min-h-[calc(100vh-200px)]",
          "flex items-center justify-center",
          "py-12 lg:py-20"
        )}
      >
        <div className="w-full max-w-md">
          {/* Header del formulario: eyebrow + título + subtítulo */}
          <header className="text-center mb-10">
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
                {eyebrow}
              </p>
            )}

            <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">
              {title}
            </h1>

            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {subtitle}
            </p>
          </header>

          {/* Slot para el formulario */}
          <div className="space-y-6">{children}</div>

          {/*
           * Link al modo alterno.
           * Link de @/i18n/navigation mantiene el prefijo locale automáticamente.
           */}
          <div className="mt-10 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {alternateAction.prompt}{" "}
              <Link
                href={alternateAction.href}
                className="text-foreground font-medium hover:text-accent transition-colors underline underline-offset-4"
              >
                {alternateAction.linkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}