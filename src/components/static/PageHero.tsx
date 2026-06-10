/**
 * ============================================================================
 * PAGE HERO — KATALINA
 * ============================================================================
 *
 * Hero sutil compartido por las páginas estáticas (Quiénes somos, Políticas,
 * Privacidad, Términos, FAQ, Contacto).
 *
 * Estructura visual:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │                                             │
 *   │           EYEBROW EN CO BRE                 │
 *   │                                             │
 *   │           Título grande serif               │
 *   │                                             │
 *   │      Subtítulo descriptivo en gris          │
 *   │                                             │
 *   └─────────────────────────────────────────────┘
 *
 * Anatomía:
 *   - Padding vertical generoso (py-16 lg:py-24) para dar peso
 *   - Centrado horizontalmente
 *   - Tres elementos: eyebrow (uppercase con letter-spacing), título grande
 *     en serif (Playfair Display), subtítulo en sans (DM Sans)
 *   - Fondo crema sutil (bg-secondary-subtle) para diferenciarse del
 *     contenido principal pero sin gritar
 *
 * Por qué un componente separado:
 *   - Las 6 páginas estáticas usan exactamente el mismo patrón
 *   - Cambiar el estilo en un lugar afecta todas las páginas (consistencia)
 *   - Si en el futuro queremos agregar imagen de fondo, breadcrumb integrado,
 *     etc., modificamos un solo archivo
 *
 * Server Component — no necesita state ni efectos. Solo renderiza props.
 * ============================================================================
 */

import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  /** Texto pequeño en uppercase arriba del título. Da contexto categórico. */
  eyebrow: string;
  /** Título principal de la página */
  title: string;
  /** Descripción debajo del título. Opcional pero recomendado. */
  subtitle?: string;
  /**
   * className opcional para casos donde necesitamos override.
   * No se usa frecuentemente pero es buena práctica.
   */
  className?: string;
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "py-16 lg:py-24",
        "bg-secondary-subtle/40",
        "border-b border-border",
        className
      )}
    >
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          {/* Eyebrow en cobre con letter-spacing amplio */}
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">
            {eyebrow}
          </p>

          {/*
           * Título en serif grande.
           * Responsive: 4xl en móvil → 5xl en md → 6xl en lg.
           * leading-tight para que múltiples líneas no queden separadas.
           */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-4">
            {title}
          </h1>

          {/* Subtítulo opcional */}
          {subtitle && (
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}