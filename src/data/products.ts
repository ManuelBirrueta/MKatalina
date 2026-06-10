/**
 * ============================================================================
 * PRODUCTS DATA — KATALINA (Fase 12 Turno 3B.1: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - El campo `name` de cada producto ahora es { es, en } (LocalizedString)
 *   - Los 24 productos tienen su nombre traducido al inglés
 *   - Los helpers (getProductBySlug, getProductDetail, etc.) mantienen su
 *     firma — devuelven Product/ProductDetail bilingüe sin cambios estructurales
 *
 * Patrón de traducción aplicado:
 *   - Los nombres propios (Camelia, Aurora, Luna, Ofelia, etc.) se mantienen
 *     en español SIN traducir — son identidad de la pieza
 *   - El sustantivo de tipo (Aretes/Collar/Pulsera/Gargantilla) se traduce
 *     siempre (Earrings/Necklace/Bracelet/Choker)
 *   - Los descriptivos genéricos (Terciopelo→Velvet, Cuero→Leather) sí se
 *     traducen porque NO son nombres propios
 *
 * Los demás campos NO cambian:
 *   - slug, href, id: identificadores únicos
 *   - category, material, color: enums en español
 *   - price, originalPrice, images, badge, createdAt, inStock: idénticos
 * ============================================================================
 */

import type { Product, ProductDetail } from "@/types/product";
import {
  productDetailsMap,
  defaultExtras,
} from "@/data/product-details";

export const productsData: Product[] = [
  /* ─── ARETES (6) ─── */
  {
    id: "ar-001",
    slug: "aretes-camelia",
    name: { es: "Aretes Camelia", en: "Camelia Earrings" },
    category: "Aretes",
    price: 890,
    images: [{ src: "/placeholder-ar-001.jpg", alt: "Aretes Camelia en plata" }],
    href: "/productos/aretes-camelia",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-04-20T00:00:00.000Z",
    badge: "nuevo",
  },
  {
    id: "ar-002",
    slug: "aretes-aurora",
    name: { es: "Aretes Aurora", en: "Aurora Earrings" },
    category: "Aretes",
    price: 720,
    images: [{ src: "/placeholder-ar-002.jpg", alt: "Aretes Aurora oro rosa" }],
    href: "/productos/aretes-aurora",
    material: "oro-rosa",
    color: "rosa",
    inStock: true,
    createdAt: "2026-03-15T00:00:00.000Z",
  },
  {
    id: "ar-003",
    slug: "aretes-luna",
    name: { es: "Aretes Luna", en: "Luna Earrings" },
    category: "Aretes",
    price: 590,
    originalPrice: 790,
    images: [{ src: "/placeholder-ar-003.jpg", alt: "Aretes Luna minimalistas" }],
    href: "/productos/aretes-luna",
    material: "acero-quirurgico",
    color: "dorado",
    inStock: true,
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    id: "ar-004",
    slug: "aretes-estrella",
    name: { es: "Aretes Estrella", en: "Estrella Earrings" },
    category: "Aretes",
    price: 1450,
    images: [{ src: "/placeholder-ar-004.jpg", alt: "Aretes Estrella con piedras" }],
    href: "/productos/aretes-estrella",
    material: "piedras-naturales",
    color: "multicolor",
    inStock: false,
    createdAt: "2025-12-01T00:00:00.000Z",
    badge: "agotado",
  },
  {
    id: "ar-005",
    slug: "aretes-iris",
    name: { es: "Aretes Iris", en: "Iris Earrings" },
    category: "Aretes",
    price: 1290,
    images: [{ src: "/placeholder-ar-005.jpg", alt: "Aretes Iris edición limitada" }],
    href: "/productos/aretes-iris",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-01-15T00:00:00.000Z",
    badge: "limitado",
  },
  {
    id: "ar-006",
    slug: "aretes-rocio",
    name: { es: "Aretes Rocío", en: "Rocío Earrings" },
    category: "Aretes",
    price: 650,
    images: [{ src: "/placeholder-ar-006.jpg", alt: "Aretes Rocío oro rosa" }],
    href: "/productos/aretes-rocio",
    material: "oro-rosa",
    color: "rosa",
    inStock: true,
    createdAt: "2026-04-01T00:00:00.000Z",
  },

  /* ─── COLLARES (6) ─── */
  {
    id: "co-001",
    slug: "collar-luna-llena",
    name: { es: "Collar Luna Llena", en: "Luna Llena Necklace" },
    category: "Collares",
    price: 1240,
    images: [{ src: "/placeholder-co-001.jpg", alt: "Collar Luna Llena con dije" }],
    href: "/productos/collar-luna-llena",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-04-25T00:00:00.000Z",
    badge: "nuevo",
  },
  {
    id: "co-002",
    slug: "collar-rosalia",
    name: { es: "Collar Rosalía", en: "Rosalía Necklace" },
    category: "Collares",
    price: 980,
    originalPrice: 1340,
    images: [{ src: "/placeholder-co-002.jpg", alt: "Collar Rosalía cadena fina" }],
    href: "/productos/collar-rosalia",
    material: "oro-rosa",
    color: "rosa",
    inStock: true,
    createdAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "co-003",
    slug: "collar-amatista",
    name: { es: "Collar Amatista", en: "Amatista Necklace" },
    category: "Collares",
    price: 1890,
    images: [{ src: "/placeholder-co-003.jpg", alt: "Collar Amatista con piedras" }],
    href: "/productos/collar-amatista",
    material: "piedras-naturales",
    color: "multicolor",
    inStock: true,
    createdAt: "2026-03-10T00:00:00.000Z",
    badge: "limitado",
  },
  {
    id: "co-004",
    slug: "collar-orquidea",
    name: { es: "Collar Orquídea", en: "Orquídea Necklace" },
    category: "Collares",
    price: 820,
    images: [{ src: "/placeholder-co-004.jpg", alt: "Collar Orquídea acero" }],
    href: "/productos/collar-orquidea",
    material: "acero-quirurgico",
    color: "dorado",
    inStock: true,
    createdAt: "2026-01-20T00:00:00.000Z",
  },
  {
    id: "co-005",
    slug: "collar-azabache",
    name: { es: "Collar Azabache", en: "Azabache Necklace" },
    category: "Collares",
    price: 1450,
    images: [{ src: "/placeholder-co-005.jpg", alt: "Collar Azabache con piedras negras" }],
    href: "/productos/collar-azabache",
    material: "piedras-naturales",
    color: "negro",
    inStock: false,
    createdAt: "2025-11-15T00:00:00.000Z",
    badge: "agotado",
  },
  {
    id: "co-006",
    slug: "collar-perla",
    name: { es: "Collar Perla", en: "Perla Necklace" },
    category: "Collares",
    price: 1620,
    images: [{ src: "/placeholder-co-006.jpg", alt: "Collar Perla clásico" }],
    href: "/productos/collar-perla",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-04-10T00:00:00.000Z",
  },

  /* ─── PULSERAS (6) ─── */
  {
    id: "pu-001",
    slug: "pulsera-dalia",
    name: { es: "Pulsera Dalia", en: "Dalia Bracelet" },
    category: "Pulseras",
    price: 650,
    originalPrice: 890,
    images: [{ src: "/placeholder-pu-001.jpg", alt: "Pulsera Dalia tejida" }],
    href: "/productos/pulsera-dalia",
    material: "cuero",
    color: "multicolor",
    inStock: true,
    createdAt: "2026-03-25T00:00:00.000Z",
  },
  {
    id: "pu-002",
    slug: "pulsera-jade",
    name: { es: "Pulsera Jade", en: "Jade Bracelet" },
    category: "Pulseras",
    price: 780,
    images: [{ src: "/placeholder-pu-002.jpg", alt: "Pulsera Jade con piedras" }],
    href: "/productos/pulsera-jade",
    material: "piedras-naturales",
    color: "multicolor",
    inStock: true,
    createdAt: "2026-04-15T00:00:00.000Z",
    badge: "nuevo",
  },
  {
    id: "pu-003",
    slug: "pulsera-magnolia",
    name: { es: "Pulsera Magnolia", en: "Magnolia Bracelet" },
    category: "Pulseras",
    price: 540,
    images: [{ src: "/placeholder-pu-003.jpg", alt: "Pulsera Magnolia plata" }],
    href: "/productos/pulsera-magnolia",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-02-05T00:00:00.000Z",
  },
  {
    id: "pu-004",
    slug: "pulsera-marfil",
    name: { es: "Pulsera Marfil", en: "Marfil Bracelet" },
    category: "Pulseras",
    price: 920,
    images: [{ src: "/placeholder-pu-004.jpg", alt: "Pulsera Marfil oro rosa" }],
    href: "/productos/pulsera-marfil",
    material: "oro-rosa",
    color: "rosa",
    inStock: true,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "pu-005",
    slug: "pulsera-onix",
    name: { es: "Pulsera Ónix", en: "Ónix Bracelet" },
    category: "Pulseras",
    price: 1100,
    images: [{ src: "/placeholder-pu-005.jpg", alt: "Pulsera Ónix con piedras negras" }],
    href: "/productos/pulsera-onix",
    material: "piedras-naturales",
    color: "negro",
    inStock: true,
    createdAt: "2026-01-10T00:00:00.000Z",
    badge: "limitado",
  },
  {
    id: "pu-006",
    slug: "pulsera-marina",
    name: { es: "Pulsera Marina", en: "Marina Bracelet" },
    category: "Pulseras",
    price: 480,
    images: [{ src: "/placeholder-pu-006.jpg", alt: "Pulsera Marina acero" }],
    href: "/productos/pulsera-marina",
    material: "acero-quirurgico",
    color: "dorado",
    inStock: false,
    createdAt: "2025-12-20T00:00:00.000Z",
    badge: "agotado",
  },

  /* ─── GARGANTILLAS (6) ─── */
  {
    id: "ga-001",
    slug: "gargantilla-ofelia",
    name: { es: "Gargantilla Ofelia", en: "Ofelia Choker" },
    category: "Gargantillas",
    price: 1450,
    images: [{ src: "/placeholder-ga-001.jpg", alt: "Gargantilla Ofelia con piedras" }],
    href: "/productos/gargantilla-ofelia",
    material: "piedras-naturales",
    color: "multicolor",
    inStock: true,
    createdAt: "2026-04-22T00:00:00.000Z",
    badge: "nuevo",
  },
  {
    id: "ga-002",
    slug: "gargantilla-terciopelo",
    name: { es: "Gargantilla Terciopelo", en: "Velvet Choker" },
    category: "Gargantillas",
    price: 690,
    originalPrice: 890,
    images: [{ src: "/placeholder-ga-002.jpg", alt: "Gargantilla de terciopelo negro" }],
    href: "/productos/gargantilla-terciopelo",
    material: "terciopelo",
    color: "negro",
    inStock: true,
    createdAt: "2026-02-15T00:00:00.000Z",
  },
  {
    id: "ga-003",
    slug: "gargantilla-aria",
    name: { es: "Gargantilla Aria", en: "Aria Choker" },
    category: "Gargantillas",
    price: 1180,
    images: [{ src: "/placeholder-ga-003.jpg", alt: "Gargantilla Aria minimalista" }],
    href: "/productos/gargantilla-aria",
    material: "plata-925",
    color: "plateado",
    inStock: true,
    createdAt: "2026-03-20T00:00:00.000Z",
  },
  {
    id: "ga-004",
    slug: "gargantilla-petalo",
    name: { es: "Gargantilla Pétalo", en: "Pétalo Choker" },
    category: "Gargantillas",
    price: 1320,
    images: [{ src: "/placeholder-ga-004.jpg", alt: "Gargantilla Pétalo oro rosa" }],
    href: "/productos/gargantilla-petalo",
    material: "oro-rosa",
    color: "rosa",
    inStock: true,
    createdAt: "2026-01-25T00:00:00.000Z",
  },
  {
    id: "ga-005",
    slug: "gargantilla-cuero",
    name: { es: "Gargantilla Cuero", en: "Leather Choker" },
    category: "Gargantillas",
    price: 580,
    images: [{ src: "/placeholder-ga-005.jpg", alt: "Gargantilla de cuero" }],
    href: "/productos/gargantilla-cuero",
    material: "cuero",
    color: "negro",
    inStock: true,
    createdAt: "2025-12-10T00:00:00.000Z",
  },
  {
    id: "ga-006",
    slug: "gargantilla-vega",
    name: { es: "Gargantilla Vega", en: "Vega Choker" },
    category: "Gargantillas",
    price: 1750,
    images: [{ src: "/placeholder-ga-006.jpg", alt: "Gargantilla Vega edición limitada" }],
    href: "/productos/gargantilla-vega",
    material: "piedras-naturales",
    color: "plateado",
    inStock: false,
    createdAt: "2025-11-30T00:00:00.000Z",
    badge: "agotado",
  },
];

/**
 * getProductsByCategory — sin cambios.
 */
export function getProductsByCategory(category: string): Product[] {
  const normalized = category.toLowerCase();
  return productsData.filter(
    (product) => product.category.toLowerCase() === normalized
  );
}

/**
 * getProductBySlug — sin cambios estructurales.
 *
 * Devuelve Product (con name bilingüe). El consumidor debe resolver
 * con getLocalized(product.name, locale).
 */
export function getProductBySlug(slug: string): Product | null {
  return productsData.find((p) => p.slug === slug) ?? null;
}

/**
 * getProductDetail — combina Product + ProductExtras.
 *
 * Cambio menor: defaultExtras ahora se llama con product.material
 * solamente (la firma cambia en product-details.ts — ya no necesita
 * el name como argumento, porque la descripción genérica ya no
 * incluye el name dentro).
 */
export function getProductDetail(slug: string): ProductDetail | null {
  const product = getProductBySlug(slug);
  if (!product) return null;

  const extras =
    productDetailsMap[slug] ?? defaultExtras(product.material);

  return {
    ...product,
    ...extras,
  };
}

/**
 * getRelatedProducts — sin cambios.
 */
export function getRelatedProducts(
  currentSlug: string,
  category: string,
  limit: number = 4
): Product[] {
  return productsData
    .filter((p) => p.category === category && p.slug !== currentSlug)
    .slice(0, limit);
}

/**
 * getAllProductSlugs — sin cambios.
 */
export function getAllProductSlugs(): string[] {
  return productsData.map((p) => p.slug);
}