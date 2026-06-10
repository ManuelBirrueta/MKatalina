/**
 * ============================================================================
 * PAGE: /[locale]/(account)/wishlist — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link de "next/link" → "@/i18n/navigation" (mantiene prefijo
 *     de locale al navegar al CTA "Explorar productos")
 *   - useTranslations agregado con namespace wishlistPage
 *   - Header con título, subtítulo + pluralización (singular/plural)
 *   - EmptyWishlist con título, descripción y CTA traducidos
 *
 * Lo que NO cambia:
 *   - useWishlist().items sigue devolviendo slugs
 *   - getProductBySlug resuelve cada slug a Product completo (bilingüe)
 *   - ProductCard ya es bilingüe → muestra nombres en idioma activo
 *
 * Sobre el wishlist + factura inmutable:
 *   La wishlist guarda solo slugs (referencias). Cuando el usuario cambia
 *   de idioma, los productos se re-resuelven y se muestran en el nuevo
 *   idioma. Es el comportamiento natural — la wishlist no es una factura.
 *   Es una "lista de referencias", no un documento histórico.
 *
 *   Esto es opuesto a Apartados/Órdenes, que SÍ son documentos históricos
 *   y guardan name como string resuelto (factura inmutable).
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
  const { items } = useWishlist();

  /**
   * Resolver slugs a productos completos.
   * Filtramos null (productos que ya no existen en el catálogo).
   * Cada Product devuelto tiene name como LocalizedString — ProductCard
   * se encarga de resolverlo al idioma activo.
   */
  const products = items
    .map((slug) => getProductBySlug(slug))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const isEmpty = products.length === 0;

  /**
   * Subtítulo dinámico según count.
   * Singular vs plural con claves separadas.
   */
  const subtitleText = isEmpty
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
        <p className="text-sm text-muted-foreground">{subtitleText}</p>
      </header>

      {isEmpty ? <EmptyWishlist /> : <WishlistGrid products={products} />}
    </div>
  );
}

/**
 * WishlistGrid — grid de productos guardados.
 *
 * Reutiliza ProductCard del catálogo. Como ProductCard ya tiene el corazón
 * de wishlist integrado y bilingüe, no necesitamos lógica adicional aquí.
 * Al quitar de wishlist, el grid se actualiza automáticamente (useWishlist
 * es reactivo via Zustand).
 */
function WishlistGrid({
  products,
}: {
  products: NonNullable<ReturnType<typeof getProductBySlug>>[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4}
        />
      ))}
    </div>
  );
}

/**
 * EmptyWishlist — estado vacío amigable.
 *
 * Textos del namespace wishlistPage.empty.
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

      <p
        className={cn(
          "text-sm text-muted-foreground",
          "max-w-md mx-auto mb-8"
        )}
      >
        {t("description")}
      </p>

      <Button asChild size="lg">
        <Link href="/aretes">{t("ctaButton")}</Link>
      </Button>
    </div>
  );
}