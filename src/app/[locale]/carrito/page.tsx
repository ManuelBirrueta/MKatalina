/**
 * ============================================================================
 * PAGE: /[locale]/carrito — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - useTranslations agregado con namespace "cart.page"
 *   - Breadcrumb "Carrito" / "Cart" desde messages
 *   - Header "Tu carrito" / "Your cart" desde messages
 *   - Contador con DOBLE pluralización: producto/s + unidad/es
 *     Ej: "1 producto · 1 unidad" / "3 productos · 5 unidades"
 *     Ej: "1 product · 1 unit" / "3 products · 5 units"
 *
 * Lo que NO cambia:
 *   - Estructura: layout dos columnas (items + summary)
 *   - Lógica de mounted + skeleton para evitar flash del estado vacío
 *   - CartItem y CartSummary se renderizan exactamente igual
 *   - El skeleton sigue siendo invisible (sin texto)
 *
 * El contador del header tiene 4 posibles formas:
 *   - 1 producto · 1 unidad
 *   - 1 producto · 3 unidades
 *   - 2 productos · 2 unidades
 *   - 2 productos · 5 unidades
 *
 * Usamos lógica simple: si uniqueCount === 1 → singular; si > 1 → plural.
 * Lo mismo para itemCount.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { CartItem } from "@/components/shop/CartItem";
import { CartSummary } from "@/components/shop/CartSummary";
import { EmptyCart } from "@/components/shop/EmptyCart";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const t = useTranslations("cart.page");
  const { items, itemCount, uniqueCount, subtotal, isEmpty } = useCart();

  /**
   * Flag de mounted para evitar "flash" del estado vacío durante hidratación.
   * Antes de mounted, mostramos un placeholder neutro (no EmptyCart).
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Container>
        {/* Breadcrumb "Carrito" / "Cart" */}
        <Breadcrumb items={[{ label: t("breadcrumb") }]} />
      </Container>

      <Container>
        <div className="pb-16">
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
 * Sin texto, solo espacio en blanco. No requiere traducción porque
 * no muestra contenido visible al usuario.
 */
function CartPageSkeleton() {
  return (
    <div className="py-12">
      <div className="h-96" aria-hidden="true" />
    </div>
  );
}

/**
 * CartPageContent — el layout principal cuando hay items.
 *
 * Renderiza el header (título + contador) y el grid de 2 columnas
 * con la lista de items + summary lateral.
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
  const t = useTranslations("cart.page");

  /**
   * Construir el contador con DOBLE pluralización.
   *
   * uniqueCount = cuántos productos DISTINTOS (slugs únicos)
   * itemCount   = suma de quantities (total de unidades)
   *
   * Ejemplos en español:
   *   uniqueCount=1, itemCount=1 → "1 producto · 1 unidad"
   *   uniqueCount=1, itemCount=3 → "1 producto · 3 unidades"
   *   uniqueCount=2, itemCount=5 → "2 productos · 5 unidades"
   *
   * En inglés:
   *   "1 product · 1 unit"
   *   "1 product · 3 units"
   *   "2 products · 5 units"
   */
  const productWord =
    uniqueCount === 1 ? t("productSingular") : t("productPlural");
  const unitWord = itemCount === 1 ? t("unitSingular") : t("unitPlural");

  return (
    <>
      {/* Header de la página: título + contador con doble pluralización */}
      <header className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-medium mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {uniqueCount} {productWord} · {itemCount} {unitWord}
        </p>
      </header>

      {/* Grid responsive: items izquierda, summary derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
        <div>
          {items.map((item) => (
            <CartItem key={item.slug} item={item} />
          ))}
        </div>

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