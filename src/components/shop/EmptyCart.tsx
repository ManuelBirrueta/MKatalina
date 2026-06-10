/**
 * ============================================================================
 * EMPTY CART — KATALINA
 * ============================================================================
 *
 * Estado vacío de la página /carrito. Aparece cuando el usuario llega al
 * carrito sin items (recién llegado al sitio, o después de vaciarlo).
 *
 * Por qué un componente dedicado en lugar de inline:
 *   - Encapsula el diseño del estado vacío para que sea reutilizable
 *   - Si en el futuro la "lógica" de qué mostrar cambia (ej. recomendaciones
 *     personalizadas), modificamos un solo archivo
 *
 * Anatomía visual:
 *
 *                    [icono de bolsa grande]
 *
 *                  Tu carrito está vacío
 *
 *           Aún no has agregado ningún producto.
 *           Explora nuestra colección y encuentra
 *           algo que te enamore.
 *
 *              [Ver toda la colección]
 *
 *           [Aretes] [Collares] [Pulseras] [Gargantillas]
 *
 * Decisiones de diseño:
 *
 *   1. ICONO GRANDE EN COBRE: el ShoppingBag de lucide a 64px en color
 *      cobre. Da identidad visual y refuerza "esto es el carrito".
 *
 *   2. TONO CÁLIDO, NO TRISTE: el mensaje no dice "está vacío" como un
 *      reproche, sino que invita a explorar. Pequeña diferencia tonal
 *      grande diferencia emocional.
 *
 *   3. CTA PRIMARIO + LINKS DE CATEGORÍAS: damos dos niveles de elección.
 *      El CTA grande lleva a "/aretes" (la categoría con más tráfico
 *      típicamente). Los links pequeños debajo permiten ir directo a
 *      una categoría específica si ya tienen idea de qué buscar.
 *
 *   4. CENTRADO Y CON AIRE: todo en columna, centrado, padding generoso.
 *      No queremos que se sienta apretado.
 * ============================================================================
 */

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Categorías a mostrar como atajos rápidos debajo del CTA principal.
 * Hardcoded por ahora — son las 4 categorías del sitio.
 */
const categoryShortcuts = [
  { label: "Aretes", href: "/aretes" },
  { label: "Collares", href: "/collares" },
  { label: "Pulseras", href: "/pulseras" },
  { label: "Gargantillas", href: "/gargantillas" },
];

export function EmptyCart() {
  return (
    <div className="py-20 lg:py-24 text-center">
      {/*
       * Icono grande en cobre.
       * strokeWidth 1 lo hace verse más delicado/editorial que el default 2.
       * Mismo principio que aplicamos en el icono del header.
       */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary-subtle mb-6">
        <ShoppingBag
          className="h-9 w-9 text-accent"
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>

      {/* Título principal */}
      <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
        Tu carrito está vacío
      </h2>

      {/* Mensaje invitando a explorar */}
      <p className="text-base text-muted-foreground max-w-md mx-auto mb-8">
        Aún no has agregado ningún producto. Explora nuestra colección y
        encuentra algo que te enamore.
      </p>

      {/* CTA principal */}
      <div className="mb-8">
        <Button asChild size="lg">
          <Link href="/aretes">Ver toda la colección</Link>
        </Button>
      </div>

      {/*
       * Atajos rápidos a las 4 categorías.
       *
       * flex flex-wrap permite que se apilen en móvil si no caben.
       * Cada link en estilo "pill" con borde sutil — visualmente discreto
       * pero clickeable.
       */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categoryShortcuts.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={cn(
              "px-4 py-2 rounded-full",
              "text-xs uppercase tracking-[0.15em] font-medium",
              "border border-border",
              "text-foreground hover:border-accent hover:text-accent",
              "transition-colors"
            )}
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}