/**
 * ============================================================================
 * PAGE: /carrito — KATALINA
 * ============================================================================
 *
 * Página del carrito de compras. El "centro" del flujo de compra: aquí el
 * usuario revisa qué va a comprar antes de proceder al checkout.
 *
 * Layout en dos columnas (desktop):
 *
 *   ┌───────────────────────────────────┬──────────────┐
 *   │  Tu carrito · 3 productos         │  RESUMEN     │
 *   ├───────────────────────────────────┤  Subtotal    │
 *   │  [Item 1]                          │  Envío       │
 *   │  [Item 2]                          │  Total       │
 *   │  [Item 3]                          │  [Checkout]  │
 *   └───────────────────────────────────┴──────────────┘
 *
 * En móvil cambia a stack vertical: lista de items arriba, resumen abajo.
 *
 * Client Component porque:
 *   - Consume useCart (que es client-only por localStorage)
 *   - Necesita re-renderizar cuando cambia el carrito
 *
 * Manejo de hidratación:
 *   Mismo problema que en CartButton — durante el primer render del cliente
 *   (antes de que Zustand rehidrate desde localStorage), `items` viene vacío.
 *   Si renderizamos EmptyCart en ese momento, lo vería el usuario por un
 *   instante aunque tenga items. Para evitar el "flash" del estado vacío,
 *   usamos el patrón `mounted` igual que en CartButton.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { CartItem } from "@/components/shop/CartItem";
import { CartSummary } from "@/components/shop/CartSummary";
import { EmptyCart } from "@/components/shop/EmptyCart";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { items, itemCount, uniqueCount, subtotal, isEmpty } = useCart();

  /**
   * Flag de mounted para evitar "flash" del estado vacío durante hidratación.
   * Antes de mounted, mostramos un placeholder neutro (no EmptyCart).
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Render condicional:
   *   - Antes de mounted: skeleton neutral (no muestra vacío ni items)
   *   - Después de mounted, isEmpty=true: muestra EmptyCart
   *   - Después de mounted, hay items: muestra layout completo
   */

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Carrito" }]} />
      </Container>

      <Container>
        <div className="pb-16">
          {/*
           * Antes de mounted: placeholder mínimo para evitar layout shift.
           * Una vez mounted, decidimos qué mostrar según el estado real.
           */}
          {!mounted ? (
            <CartPageSkeleton />
          ) : isEmpty ? (
            <EmptyCart />
          ) : (
            <CartPageContent
              items={items}
              itemCount={itemCount}
              uniqueCount={uniqueCount}
              subtotal={subtotal}
            />
          )}
        </div>
      </Container>
    </>
  );
}

/**
 * CartPageSkeleton — placeholder durante hidratación.
 *
 * Mantiene la altura aproximada de la página real para evitar layout shift
 * cuando se hidrata. Es invisible (sin contenido) — el usuario ve un breve
 * espacio en blanco que enseguida se llena con la página real.
 *
 * No usamos pulsos animados de skeleton clásico porque la rehidratación
 * de Zustand es muy rápida (<100ms en la mayoría de casos), y un pulso
 * animado que aparece y desaparece tan rápido se percibe como bug visual.
 */
function CartPageSkeleton() {
  return (
    <div className="py-12">
      {/* Espacio en blanco mínimo, alto suficiente para evitar layout shift */}
      <div className="h-96" aria-hidden="true" />
    </div>
  );
}

/**
 * CartPageContent — el layout principal cuando hay items.
 *
 * Lo separo en su propio sub-componente para mantener el CartPage
 * principal legible.
 *
 * Layout grid:
 *   - lg:grid-cols-[1fr_380px] → en desktop: items toma todo el espacio
 *     disponible, summary tiene ancho fijo de 380px
 *   - Default (móvil): single column, items arriba, summary abajo
 */
function CartPageContent({
  items,
  itemCount,
  uniqueCount,
  subtotal,
}: {
  items: ReturnType<typeof useCart>["items"];
  itemCount: number;
  uniqueCount: number;
  subtotal: number;
}) {
  return (
    <>
      {/*
       * Header de la página: título + contador.
       * El contador es el mismo cálculo que pasamos al CartSummary,
       * pero aquí lo mostramos arriba como contexto general.
       */}
      <header className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-medium mb-2">
          Tu carrito
        </h1>
        <p className="text-sm text-muted-foreground">
          {uniqueCount} {uniqueCount === 1 ? "producto" : "productos"} ·{" "}
          {itemCount} {itemCount === 1 ? "unidad" : "unidades"}
        </p>
      </header>

      {/*
       * Grid responsive:
       *   - móvil: 1 columna (items arriba, summary abajo)
       *   - desktop (lg+): 2 columnas asimétricas
       *
       * gap-8 lg:gap-12 — más separación en desktop para que las dos
       * columnas se sientan distintas, menos en móvil donde están apiladas.
       *
       * items-start (no center) para que summary se alinee al top — sticky
       * funciona desde el top.
       */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
        {/*
         * COLUMNA IZQUIERDA: lista de items
         *
         * Wrapped en un div sin estilos porque CartItem ya maneja su propio
         * border-bottom para separarse entre sí.
         */}
        <div>
          {items.map((item) => (
            <CartItem key={item.slug} item={item} />
          ))}
        </div>

        {/*
         * COLUMNA DERECHA: resumen sticky
         *
         * lg:sticky lg:top-24 — en desktop el resumen se "pega" al top
         * (con 24 = 96px de offset para no chocar con el header sticky).
         * En móvil, sticky no aplica (queda al final del scroll natural).
         *
         * lg:top-24: el offset es 6rem (24 * 0.25rem = 6rem = 96px).
         * Esto deja espacio para que no se solape con el Header sticky
         * que está arriba (~60-70px). Ajustar si el header cambia de tamaño.
         */}
        <aside className="lg:sticky lg:top-24">
          <CartSummary
            itemCount={itemCount}
            uniqueCount={uniqueCount}
            subtotal={subtotal}
          />
        </aside>
      </div>
    </>
  );
}   