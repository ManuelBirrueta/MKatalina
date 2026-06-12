/**
 * ============================================================================
 * FEATURED PRODUCTS — KATALINA (Fase 12 Turno 3B.3: bilingüe + fix de tipos)
 * ============================================================================
 *
 * ─── FIX CRÍTICO DE TIPOS ─────────────────────────────────────────────
 *
 * La versión anterior tenía un BUG GRAVE: el array featuredProducts usaba
 * la estructura vieja de Product:
 *
 *   { name: "Aretes Camelia", category: "Aretes", ... }
 *
 * Pero desde el Turno 3B.1 (fix de raíz bilingüe), Product es:
 *
 *   { name: { es: "...", en: "..." }, category: ProductCategory, ... }
 *
 * El código viejo probablemente compilaba pero los nombres se renderizaban
 * como [object Object] (porque LocalizedString → string).
 *
 * AHORA reconstruimos el array con la estructura correcta. Cada producto
 * tiene name como LocalizedString, lo cual ProductCard ya resuelve
 * internamente con getLocalized() en su propio render.
 *
 * Sobre por qué este archivo no rompió antes:
 *   Es posible que ProductCard tenga defensive parsing o que el TypeScript
 *   estaba en modo soft. En cualquier caso, ahora queda bien tipado.
 *
 * ─── CAMBIOS PARA BILINGÜE ────────────────────────────────────────────
 *
 *   - Pasa de Server a Client Component (useTranslations)
 *   - import Link cambia a "@/i18n/navigation"
 *   - Eyebrow, título, descripción, CTA traducidos desde "homepage.featuredProducts.*"
 *   - Los 4 productos featured ahora tienen `name` como LocalizedString
 *     bilingüe (siguiendo el patrón del Turno 3B.1 — Aretes Camelia →
 *     Camelia Earrings en /en)
 *
 * Lo que NO cambia:
 *   - Estructura visual: header + grid 4 columnas + CTA al final
 *   - Fondo crema sutil (bg-muted/30)
 *   - Reutilización de ProductCard (que ya es bilingüe internamente)
 *
 * ─── ROADMAP HACIA EL CMS ──────────────────────────────────────────────
 *
 * Cuando integremos CMS/backend, este array desaparece a favor de un
 * fetch a `/api/products/featured?locale=X` que devuelve productos ya
 * resueltos al locale. Mientras, los productos hardcoded aquí imitan
 * la estructura real bilingüe del proyecto.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * featuredProducts — DATA hardcoded de los 4 productos a destacar.
 *
 * ESTRUCTURA CORRECTA (bilingüe):
 *   - name: LocalizedString {es, en} — ProductCard lo resuelve al locale
 *   - category: ProductCategory union literal ("Aretes" | "Collares" | etc.)
 *   - resto de campos: sin cambios (slug, price, images, href, badge)
 *
 * Cuando integremos backend + CMS:
 *   - Estos vendrán de una llamada al API tipo `getFeaturedProducts(locale)`
 *   - El admin podrá curar manualmente cuáles aparecen
 *   - O usar lógica automática (más vendidos, más nuevos, etc.)
 */
const featuredProducts: Product[] = [
  {
    id: "f1",
    slug: "aretes-camelia",
    name: { es: "Aretes Camelia", en: "Camelia Earrings" },
    category: "Aretes",
    price: 890,
    images: [{ src: "/placeholder-1.jpg", alt: "Aretes Camelia en plata" }],
    href: "/productos/aretes-camelia",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    badge: "nuevo",
  },
  {
    id: "f2",
    slug: "collar-luna-llena",
    name: { es: "Collar Luna Llena", en: "Luna Llena Necklace" },
    category: "Collares",
    price: 1240,
    images: [{ src: "/placeholder-2.jpg", alt: "Collar Luna Llena con dije" }],
    href: "/productos/collar-luna-llena",
    material: "oro-rosa",
    color: "rosa",
    inStock: true,
    createdAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "f3",
    slug: "pulsera-dalia",
    name: { es: "Pulsera Dalia", en: "Dalia Bracelet" },
    category: "Pulseras",
    price: 650,
    originalPrice: 890,
    images: [{ src: "/placeholder-3.jpg", alt: "Pulsera Dalia tejida" }],
    href: "/productos/pulsera-dalia",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-01-03T00:00:00.000Z",
  },
  {
    id: "f4",
    slug: "gargantilla-ofelia",
    name: { es: "Gargantilla Ofelia", en: "Ofelia Choker" },
    category: "Gargantillas",
    price: 1450,
    images: [
      { src: "/placeholder-4.jpg", alt: "Gargantilla Ofelia con piedras" },
    ],
    href: "/productos/gargantilla-ofelia",
    material: "piedras-naturales",
    color: "multicolor",
    inStock: true,
    createdAt: "2026-01-04T00:00:00.000Z",
    badge: "limitado",
  },
];

export function FeaturedProducts() {
  const t = useTranslations("homepage.featuredProducts");

  return (
    <section className="py-24 bg-muted/30">
      <Container>
        {/* Header de sección */}
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-4">
            {t("title")}
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            {t("description")}
          </p>
        </header>

        {/*
         * Grid de productos. Reutiliza ProductCard que ya es bilingüe.
         * Los 4 productos featured tienen name como LocalizedString —
         * ProductCard resuelve internamente con useLocale.
         */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 mb-12">
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>

        {/* CTA "Ver toda la colección" centrado */}
        <div className="text-center">
          <Link
            href="/aretes"
            className={cn(
              "group inline-flex items-center gap-2",
              "text-xs uppercase tracking-[0.15em] font-medium",
              "text-foreground hover:text-accent transition-colors duration-200",
              "border-b border-foreground hover:border-accent pb-1"
            )}
          >
            {t("ctaViewAll")}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </Container>
    </section>
  );
}