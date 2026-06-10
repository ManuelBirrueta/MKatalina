/**
 * ============================================================================
 * CART SUMMARY — KATALINA
 * ============================================================================
 *
 * Panel lateral derecho de la página /carrito. Muestra el resumen del pedido
 * y el botón "Proceder al checkout".
 *
 * Anatomía:
 *
 *   ┌──────────────────────────────────┐
 *   │  RESUMEN DEL PEDIDO              │  ← Header en uppercase
 *   ├──────────────────────────────────┤
 *   │  Subtotal (3 productos)  $1,780  │
 *   │  Envío                Calculado  │  ← Texto, no número
 *   │                       en checkout│
 *   ├──────────────────────────────────┤
 *   │  Total                   $1,780  │  ← Más grande, destacado
 *   ├──────────────────────────────────┤
 *   │  [PROCEDER AL CHECKOUT]          │  ← Botón cacao, full-width
 *   │  ─ o ─                            │
 *   │  Seguir comprando                │  ← Link secundario
 *   └──────────────────────────────────┘
 *
 * Server Component — no maneja estado. El componente padre (CartPage) le pasa
 * `itemCount`, `uniqueCount` y `subtotal` ya calculados. CartSummary solo
 * los renderiza.
 *
 * Por qué NO usa useCart directamente:
 *   Si CartSummary llamara a useCart, sería un Client Component. Como solo
 *   necesita números calculados (que el padre ya tiene), pasarlos por props
 *   permite que CartSummary sea Server Component → cero JavaScript adicional.
 *
 *   Pero en realidad el padre /carrito/page.tsx también es Client Component
 *   (porque consume useCart), así que esto es más principio que beneficio
 *   medible. Aún así mantenemos el separation of concerns.
 *
 * Diseño sticky:
 *   En desktop el resumen queda "pegado" mientras se scrollea la lista.
 *   El sticky lo aplica el componente padre (CartPage) en el wrapper,
 *   no acá adentro, para mantener este componente reutilizable en
 *   contextos sin sticky.
 * ============================================================================
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CartSummaryProps {
  /** Total de unidades en el carrito (suma de cantidades) */
  itemCount: number;
  /** Productos distintos en el carrito */
  uniqueCount: number;
  /** Suma de (precio × cantidad) de todos los items */
  subtotal: number;
}

export function CartSummary({
  itemCount,
  uniqueCount,
  subtotal,
}: CartSummaryProps) {
  /**
   * Texto del contador de items. Manejamos:
   *   - 1 producto, 1 unidad: "1 producto"
   *   - 1 producto, varias unidades: "1 producto · 3 unidades"
   *   - varios productos: "3 productos · 5 unidades"
   *
   * Esto le da al usuario claridad sobre qué está pagando: cuántas piezas
   * distintas + cuántas piezas totales.
   */
  const itemCountText = (() => {
    if (uniqueCount === itemCount) {
      // Cada producto tiene cantidad 1
      return `${uniqueCount} ${uniqueCount === 1 ? "producto" : "productos"}`;
    }
    return `${uniqueCount} ${uniqueCount === 1 ? "producto" : "productos"} · ${itemCount} unidades`;
  })();

  return (
    <div
      className={cn(
        "border border-border rounded-md",
        "p-6",
        "bg-card"
      )}
    >
      {/* Header */}
      <h2 className="text-xs uppercase tracking-[0.2em] font-medium mb-6">
        Resumen del pedido
      </h2>

      {/* Lista de cargos */}
      <dl className="space-y-3 text-sm">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal ({itemCountText})</dt>
          <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
        </div>

        {/*
         * Envío: por ahora muestra "Calculado en el checkout" como texto.
         *
         * Razón: para calcular envío necesitamos saber el código postal del
         * destino, que solo se conoce en el checkout. Mostrar "$0" sería
         * engañoso (el usuario pensaría que es gratis). El texto es honesto:
         * el costo se determina más adelante.
         *
         * En Fase 12+ cuando integremos calculadora real de envíos por CP,
         * aquí podríamos mostrar el costo si el usuario tiene una dirección
         * guardada (autenticado).
         */}
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">Envío</dt>
          <dd className="text-xs text-muted-foreground text-right">
            Calculado en el checkout
          </dd>
        </div>
      </dl>

      {/* Separador */}
      <div className="my-4 border-t border-border" />

      {/* Total */}
      <div className="flex items-baseline justify-between mb-6">
        <span className="text-base font-medium">Total</span>
        <span className="text-xl font-medium tabular-nums">
          {formatPrice(subtotal)}
        </span>
      </div>

      {/*
       * Botón principal "Proceder al checkout".
       *
       * Cacao oscuro, full-width, alto (size="lg"). Es la acción más
       * importante de la página — todo el diseño conduce a este botón.
       *
       * El href apunta a /checkout que aún no existe en este turno.
       * Se construye en el Turno 3.
       */}
      <Button asChild size="lg" className="w-full mb-3">
        <Link href="/checkout">
          Proceder al checkout
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      {/*
       * Link secundario "Seguir comprando".
       *
       * Lleva a una de las categorías (Aretes como default — la más popular
       * típicamente). En el futuro podríamos guardar de dónde venía el
       * usuario y devolverlo ahí, pero por ahora KISS.
       *
       * Estilo: link discreto, no botón, para que no compita con el CTA
       * principal arriba.
       */}
      <Link
        href="/aretes"
        className={cn(
          "block text-center text-xs uppercase tracking-[0.15em]",
          "text-muted-foreground hover:text-accent transition-colors",
          "py-2"
        )}
      >
        Seguir comprando
      </Link>

      {/*
       * Información secundaria de confianza al fondo.
       * Reutilizamos el patrón de "badges informativos" que vimos en
       * ProductInfo. Refuerza confianza en el momento crítico de pagar.
       */}
      <div className="mt-6 pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <span className="text-accent">●</span>
          Pago seguro con PayPal
        </p>
        <p className="flex items-center gap-2">
          <span className="text-accent">●</span>
          Devoluciones gratis dentro de 30 días
        </p>
      </div>
    </div>
  );
}