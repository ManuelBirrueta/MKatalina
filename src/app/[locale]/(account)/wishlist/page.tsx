/**
 * ============================================================================
 * PAGE: /[locale]/(account)/wishlist — MKATALINA
 * ============================================================================
 *
 * Cambio de la Fase 13 (Etapa 3):
 *   - Ahora la wishlist viene de la base de datos (vía el hook useWishlist,
 *     que la trae al cargar). Como esa carga es asíncrona, agregamos un estado
 *     de CARGA: mientras `isLoading` es true, mostramos un placeholder en vez
 *     del mensaje de "wishlist vacía". Sin esto, la página mostraría "vacía"
 *     un instante antes de que llegaran los datos de la base (un parpadeo feo).
 *
 * Lo que NO cambia:
 *   - useWishlist().items sigue devolviendo slugs
 *   - getProductBySlug resuelve cada slug a Product completo (bilingüe)
 *   - ProductCard ya es bilingüe → muestra nombres en el idioma activo
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
import { getProductBySlug } from "@/data/products";
import { cn } from "@/lib/utils";

export default function WishlistPage() {
  const t = useTranslations("wishlistPage");
  const { items, isLoading } = useWishlist();

  /**
   * Resolver slugs a productos completos.
   * Filtramos null (productos que ya no existen en el catálogo).
   */
  const products = items
    .map((slug) => getProductBySlug(slug))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const isEmpty = products.length === 0;

  /**
   * Subtítulo dinámico. Mientras carga no mostramos conteo (aún no es fiable).
   */
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
 * WishlistGrid — grid de productos guardados.
 * Reutiliza ProductCard (que ya trae el corazón integrado y bilingüe). Al
 * quitar de la wishlist, el grid se actualiza solo porque useWishlist es
 * reactivo (la caché del store cambia y re-renderiza).
 */
function WishlistGrid({
  products,
}: {
  products: NonNullable<ReturnType<typeof getProductBySlug>>[];
}) {
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