/**
 * ============================================================================
 * HERO — KATALINA (Sección 1 de la Home)
 * ============================================================================
 *
 * El "primer impacto" de la home. Aparece justo debajo del header.
 *
 * Anatomía visual:
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │                                                                │
 *   │                                                                │
 *   │              EYEBROW: Nueva colección                          │
 *   │                                                                │
 *   │              Piezas que                                        │
 *   │              cuentan tu                                        │
 *   │              historia                                          │
 *   │                                                                │
 *   │              Subtítulo descriptivo en gris                     │
 *   │                                                                │
 *   │              [Explorar colección]  Nuestra historia →          │
 *   │                                                                │
 *   │                                              IMAGEN EDITORIAL  │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Decisiones de diseño:
 *
 *   1. ALTURA: ~80vh (80% del viewport). Suficientemente alto para que la
 *      imagen tenga presencia editorial, pero no tan alto que el usuario
 *      no vea NADA más en la primera pantalla.
 *
 *   2. LAYOUT DESKTOP: dos columnas. Texto a la izquierda (40-50%), imagen
 *      a la derecha (50-60%). Es el patrón clásico de joyería editorial —
 *      mismo que usa Pandora en su home.
 *
 *   3. LAYOUT MÓVIL: stack vertical. Imagen arriba como banner, texto debajo.
 *      Razón: en móvil leer texto en vertical centrado se ve mejor que
 *      intentar mantener el split de desktop.
 *
 *   4. DOS CTAs: el primario (cacao, "Explorar colección") es la acción
 *      principal. El secundario (link inline con flecha, "Nuestra historia →")
 *      es para usuarios que quieren conocer la marca antes de comprar.
 *      Patrón estándar en e-commerce premium: dar dos caminos según intent.
 *
 *   5. ESPACIO NEGATIVO ENORME: padding generoso alrededor del texto.
 *      El lujo se comunica con AIRE, no con elementos amontonados.
 * ============================================================================
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Hero — primera sección de la home
 * ----------------------------------
 * Server Component (sin "use client"): no tiene interactividad propia,
 * todos los botones son <Link> de navegación que ya saben cómo manejarse.
 */
export function Hero() {
  return (
    /**
     * <section> en lugar de <div>: mejor semántica para SEO y accesibilidad.
     * Las secciones de una página deberían ser <section>; solo elementos
     * "decorativos" sin significado son <div>.
     *
     * min-h-[80vh] = 80% del viewport mínimo, pero puede crecer si el
     * contenido empuja. Esto es importante en móvil donde el texto puede
     * tomar más altura que 80vh y NO queremos que se corte.
     */
    <section
      className={cn(
        "relative min-h-[80vh] flex items-center",
        // Quitamos el padding-top del main que recibiría del layout
        // para que el hero se pegue al header (efecto editorial).
        "-mt-6 md:-mt-6"
      )}
    >
      <Container>
        {/*
         * GRID PRINCIPAL: 2 columnas en desktop, 1 columna en móvil.
         *
         * lg:grid-cols-2 → arriba de 1024px se divide en dos columnas iguales
         * gap-12 → 48px de espacio entre las dos columnas en desktop
         * items-center → ambas columnas se centran verticalmente entre sí
         */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          {/*
           * ─── COLUMNA IZQUIERDA: TEXTO Y CTAs ───
           *
           * order-2 lg:order-1 = en móvil aparece SEGUNDA (después de la
           * imagen), en desktop aparece PRIMERA (a la izquierda).
           */}
          <div className="order-2 lg:order-1 space-y-6">
            {/*
             * Eyebrow: contexto en mayúsculas pequeñas con tracking amplio.
             * El "primer ladrillo" visual antes del título principal.
             */}
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              Nueva colección · Primavera 2026
            </p>

            {/*
             * Título hero: el texto más grande de toda la página.
             *
             * Tamaño responsivo:
             *   - móvil: text-5xl (≈48px)
             *   - tablet: text-6xl (≈60px)
             *   - desktop: text-7xl (≈72px)
             *
             * leading-[1.05] = line-height muy ajustado. Los Didone a tamaños
             * grandes se ven mejor con líneas más juntas que el default.
             *
             * tracking-tight = letter-spacing ligeramente negativo. Mismo
             * principio: a tamaños grandes, letras un pelín más juntas se
             * ven más sofisticadas.
             */}
            <h1
              className={cn(
                "font-display font-medium",
                "text-5xl md:text-6xl lg:text-7xl",
                "leading-[1.05] tracking-tight",
                "text-foreground"
              )}
            >
              Piezas que
              <br />
              cuentan tu
              <br />
              <em className="text-accent not-italic">historia</em>
            </h1>

            {/*
             * Subtítulo descriptivo: cuerpo de texto en gris muted.
             * max-w-md (28rem ≈ 448px) para que la línea no sea muy ancha
             * y el texto sea cómodo de leer.
             */}
            <p className="text-base text-muted-foreground max-w-md leading-relaxed">
              Joyería artesanal mexicana diseñada para acompañarte en los
              momentos que importan. Cada pieza, hecha a mano con materiales
              de la más alta calidad.
            </p>

            {/*
             * CTAs: botón primario + link secundario.
             *
             * flex flex-wrap = en pantallas muy pequeñas si no caben en una
             * línea, se apilan. gap-4 mantiene separación visual.
             */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* CTA primario en cacao oscuro */}
              <Button asChild size="lg">
                <Link href="/aretes">Explorar colección</Link>
              </Button>

              {/*
               * CTA secundario: link con flecha que se desplaza al hover.
               * El mismo patrón que usamos en el mega-menú del header.
               * Crea coherencia visual a través de la app.
               */}
              <Link
                href="/quienes-somos"
                className={cn(
                  "group inline-flex items-center gap-2",
                  "text-xs uppercase tracking-[0.15em] font-medium",
                  "text-foreground hover:text-accent transition-colors duration-200",
                  "border-b border-foreground hover:border-accent pb-1"
                )}
              >
                Nuestra historia
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/*
           * ─── COLUMNA DERECHA: IMAGEN HERO ───
           *
           * order-1 lg:order-2 = aparece PRIMERA en móvil (banner arriba),
           * SEGUNDA en desktop (a la derecha del texto).
           */}
          <div className="order-1 lg:order-2">
            {/*
             * Placeholder de imagen.
             *
             * aspect-[4/5] = mismo ratio editorial 4:5 que usamos en ProductCard.
             * Mantenerlo consistente en toda la app crea ritmo visual.
             *
             * Cuando tengas la foto real del hero, reemplaza este div por:
             *   <Image
             *     src="/hero-spring-2026.jpg"
             *     alt="Modelo luciendo collar y aretes Katalina"
             *     fill
             *     priority   // LCP de la página, prioridad máxima de carga
             *     className="object-cover"
             *     sizes="(max-width: 1024px) 100vw, 50vw"
             *   />
             */}
            <div
              className={cn(
                "relative aspect-[4/5] w-full overflow-hidden",
                "bg-secondary-subtle", // Rosa polvo muy claro
                "flex items-center justify-center"
              )}
            >
              <div className="text-center px-8">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Imagen hero
                </p>
                <p className="font-display text-lg text-foreground">
                  Foto editorial de modelo
                  <br />
                  luciendo la nueva colección
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}