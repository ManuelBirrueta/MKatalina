/**
 * ============================================================================
 * PAGE: /[locale]/(account)/wishlist — MKATALINA (Fase 13 · Etapa 3B)
 * ============================================================================
 *
 * CAMBIO DE LA ETAPA 3B:
 *   - Cada slug guardado se convierte en su producto con useCatalog()
 *     (catálogo de la base, vía el layout) en lugar de getProductBySlug() de
 *     src/data/products.ts. Los productos retirados no aparecen.
 *
 * Lo que NO cambia:
 *   - La wishlist viene de la base vía useWishlist (carga asíncrona). Mientras
 *     `isLoading` es true se muestra un placeholder en vez del mensaje de
 *     "wishlist vacía" (evita un parpadeo).
 *   - ProductCard ya es bilingüe → muestra nombres en el idioma activo.
 *   - La wishlist guarda solo referencias (slugs): al cambiar de idioma, los
 *     productos se re-resuelven al nuevo idioma (no es una factura inmutable).
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

export default function WishlistPage() {
  const t = useTranslations("wishlistPage");
  const { items, isLoading } = useWishlist();
  const { getBySlug } = useCatalog();

  /**
   * Slugs → productos completos del catálogo. useWishlist ya devuelve solo
   * los visibles; el filtro es una protección extra.
   */
  const products = items
    .map((slug) => getBySlug(slug))
    .filter((p): p is Product => p !== null);

  const isEmpty = products.length === 0;

  // Subtítulo dinámico. Mientras carga no mostramos conteo (aún no es fiable).
  const subtitleText = isLoading
    ? ""
    : isEmpty
      ? t("subtitleEmpty")
      : products.length === 1
        ? t("subtitleSingular", { count: products.length })
        : t("subtitlePlural", { count: products.length });

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
          {t("title")}
        </h1>
        {subtitleText && (
          <p className="text-sm text-muted-foreground">{subtitleText}</p>
        )}
      </header>

      {/*
       * Tres estados:
       *   - Cargando: placeholder (evita el parpadeo de "vacía").
       *   - Cargado y vacío: mensaje de wishlist vacía.
       *   - Cargado con productos: la cuadrícula.
       */}
      {isLoading ? (
        <div className="h-96" aria-hidden="true" />
      ) : isEmpty ? (
        <EmptyWishlist />
      ) : (
        <WishlistGrid products={products} />
      )}
    </div>
  );
}

/**
 * WishlistGrid — cuadrícula de productos guardados.
 * Reutiliza ProductCard (con el corazón integrado). Al quitar uno, la
 * cuadrícula se actualiza sola porque useWishlist es reactivo.
 */
function WishlistGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}

/**
 * EmptyWishlist — estado vacío amigable.
 */
function EmptyWishlist() {
  const t = useTranslations("wishlistPage.empty");

  return (
    <div className="py-16 lg:py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-subtle mb-6">
        <Heart
          className="h-7 w-7 text-accent"
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">
        {t("title")}
      </h2>

      <p className={cn("text-sm text-muted-foreground", "max-w-md mx-auto mb-8")}>
        {t("description")}
      </p>

      <Button asChild size="lg">
        <Link href="/aretes">{t("ctaButton")}</Link>
      </Button>
    </div>
  );
}