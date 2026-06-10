/**
 * ============================================================================
 * RELATED PRODUCTS — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server Component a Client Component (necesario para
 *     useTranslations). El costo es mínimo porque ProductCard ya es Client.
 *   - Eyebrow "También te puede gustar" y título "Productos relacionados"
 *     traducidos
 *
 * Lo que NO cambia:
 *   - Recibe products como prop (resolución externa por el padre)
 *   - Grid responsive 2/3/4 columnas
 *   - Si products.length === 0, no renderiza nada
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/types/product";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const t = useTranslations("catalog.relatedProducts");

  // Si no hay productos relacionados, no renderizamos nada.
  if (products.length === 0) return null;

  return (
    <section className="py-16 border-t border-border">
      <Container>
        {/* Header de sección */}
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-medium">
            {t("title")}
          </h2>
        </header>

        {/* Grid: 2/3/4 columnas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              // priority=false para los relacionados (están al fondo)
              priority={index < 2}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}