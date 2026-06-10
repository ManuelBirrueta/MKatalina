/**
 * ============================================================================
 * AUTH LAYOUT — KATALINA
 * ============================================================================
 *
 * Wrapper compartido por las páginas /login y /registro.
 *
 * Estructura:
 *   ┌────────────────────────────────────────┐
 *   │  [Header del sitio se mantiene]        │
 *   ├────────────────────────────────────────┤
 *   │                                        │
 *   │                                        │
 *   │         ┌──────────────────┐          │
 *   │         │  [Eyebrow]        │          │
 *   │         │  Título h1        │          │
 *   │         │  Subtítulo        │          │
 *   │         │                   │          │
 *   │         │  [Formulario]     │          │
 *   │         │                   │          │
 *   │         │  ─── o ───         │          │
 *   │         │                   │          │
 *   │         │  [Google btn]     │          │
 *   │         │                   │          │
 *   │         │  Link a alterno   │          │
 *   │         └──────────────────┘          │
 *   │                                        │
 *   ├────────────────────────────────────────┤
 *   │  [Footer del sitio se mantiene]        │
 *   └────────────────────────────────────────┘
 *
 * El panel central tiene max-width de 440px (medida estándar para formularios
 * de auth — suficiente para que no se vea apretado pero no tanto que pierda
 * intimidad). Centrado horizontal y verticalmente en el espacio disponible.
 *
 * Server Component — no necesita estado. Solo renderiza children.
 * ============================================================================
 */

import Link from "next/link";
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
   */
  alternateAction: {
    prompt: string; // ej. "¿No tienes cuenta?"
    linkText: string; // ej. "Crea una"
    href: string; // ej. "/registro"
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
      {/*
       * Wrapper externo: ocupa al menos toda la pantalla menos header y footer
       * para que el panel se sienta centrado visualmente.
       *
       * min-h-[calc(100vh-200px)] = altura mínima del viewport menos
       * aproximadamente el alto combinado de header (60px) + footer (140px).
       * Si el contenido es más alto, crece naturalmente con padding.
       */}
      <div
        className={cn(
          "min-h-[calc(100vh-200px)]",
          "flex items-center justify-center",
          "py-12 lg:py-20"
        )}
      >
        {/*
         * Panel del formulario.
         *
         * max-w-md (= 448px en Tailwind v4) cuando es solo el form.
         * Padding generoso interno para que respire.
         */}
        <div className="w-full max-w-md">
          {/*
           * Header del formulario: eyebrow + título + subtítulo.
           * Centrado para enfatizar simetría visual del panel.
           */}
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
           *
           * Border-t sutil arriba para separar visualmente del contenido
           * principal sin gritar. Centrado horizontalmente.
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