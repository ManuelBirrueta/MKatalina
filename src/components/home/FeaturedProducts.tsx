/**
 * ============================================================================
 * FEATURED PRODUCTS — KATALINA (Sección 3 de la Home)
 * ============================================================================
 *
 * Grid de productos destacados. Reutiliza el ProductCard de Fase 3.
 *
 * Esta sección es "el cebo": son las piezas que queremos que el visitante
 * vea primero. Pueden ser los más nuevos, los más vendidos, o los curados
 * por el admin desde el CMS.
 *
 * Anatomía visual:
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │              EYEBROW: Selección curada                           │
 *   │              Lo más nuevo                                        │
 *   │              [Subtítulo descriptivo]                             │
 *   │                                                                  │
 *   │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                          │
 *   │  │      │  │      │  │      │  │      │                          │
 *   │  │ CARD │  │ CARD │  │ CARD │  │ CARD │                          │
 *   │  │      │  │      │  │      │  │      │                          │
 *   │  └──────┘  └──────┘  └──────┘  └──────┘                          │
 *   │                                                                  │
 *   │              Ver toda la colección →                             │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Decisiones de diseño:
 *
 *   1. EXACTAMENTE 4 PRODUCTOS, no más: con 4 puedes mostrar una fila
 *      completa en desktop y 2 filas en móvil sin que se sienta abrumador.
 *      Más productos los reservamos para la página de cada categoría.
 *
 *   2. CTA "Ver toda la colección" al final: el visitante sabe que esto es
 *      una muestra, no todo el catálogo. Lo lleva a /aretes o a una página
 *      curada de "novedades" según el contexto.
 *
 *   3. REUTILIZACIÓN: usa el ProductCard existente. Cero código nuevo de
 *      cards. Esto valida que el sistema de diseño funciona — los componentes
 *      "encajan" en composiciones más grandes sin modificarse.
 * ============================================================================
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * featuredProducts — DATA hardcoded de los 4 productos a destacar.
 *
 * Cuando integremos backend + CMS:
 *   - Estos vendrán de una llamada al API tipo `getFeaturedProducts()`
 *   - El admin podrá curar manualmente cuáles aparecen
 *   - O usar lógica automática (más vendidos, más nuevos, etc.)
 */
const featuredProducts: Product[] = [
  {
    id: "f1",
    slug: "aretes-camelia",
    name: "Aretes Camelia",
    category: "Aretes",
    price: 890,
    images: [{ src: "/placeholder-1.jpg", alt: "Aretes Camelia en plata" }],
    href: "/productos/aretes-camelia",
    badge: "nuevo",
  },
  {
    id: "f2",
    slug: "collar-luna-llena",
    name: "Collar Luna Llena",
    category: "Collares",
    price: 1240,
    images: [{ src: "/placeholder-2.jpg", alt: "Collar Luna Llena con dije" }],
    href: "/productos/collar-luna-llena",
  },
  {
    id: "f3",
    slug: "pulsera-dalia",
    name: "Pulsera Dalia",
    category: "Pulseras",
    price: 650,
    originalPrice: 890,
    images: [{ src: "/placeholder-3.jpg", alt: "Pulsera Dalia tejida" }],
    href: "/productos/pulsera-dalia",
  },
  {
    id: "f4",
    slug: "gargantilla-ofelia",
    name: "Gargantilla Ofelia",
    category: "Gargantillas",
    price: 1450,
    images: [{ src: "/placeholder-4.jpg", alt: "Gargantilla Ofelia con piedras" }],
    href: "/productos/gargantilla-ofelia",
    badge: "limitado",
  },
];

export function FeaturedProducts() {
  return (
    <section className="py-24 bg-muted/30">
      {/*
       * Fondo: bg-muted/30 = crema muy ligero, casi imperceptible.
       * Crea una "banda" sutil que separa esta sección visualmente de las
       * vecinas (categorías arriba y editorial abajo) sin necesidad de
       * bordes o separadores fuertes.
       */}
      <Container>
        {/* Header de sección */}
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
            Selección curada
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-4">
            Lo más nuevo
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Las piezas más recientes de nuestro taller. Diseños únicos, en
            cantidades limitadas.
          </p>
        </header>

        {/*
         * Grid de productos. 4 columnas en desktop, 2 en móvil.
         * gap-x-4 gap-y-12 = mismo patrón que el showcase de Fase 3,
         * mantiene coherencia con el grid de la página de categoría
         * (cuando la construyamos en una fase futura).
         */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 mb-12">
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              // priority=true para los 4 primeros productos.
              // En la home, esta sección no está "above the fold" (queda
              // después del hero y categorías), pero igual le damos prioridad
              // moderada porque el usuario va a llegar aquí rápido si hace scroll.
              priority={index < 4}
            />
          ))}
        </div>

        {/*
         * CTA "Ver toda la colección" centrado.
         * Mismo patrón que usamos en mega-menú del header y hero secundario.
         */}
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
            Ver toda la colección
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