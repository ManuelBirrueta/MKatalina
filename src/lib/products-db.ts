/**
 * ============================================================================
 *  MKatalina · Capa de datos de PRODUCTOS (base de datos) · Fase 13 · Etapa 3
 * ============================================================================
 *
 *  QUÉ ES
 *  ------
 *  El reemplazo de las funciones de src/data/products.ts, pero leyendo de la
 *  base (tablas products y product_images) con Prisma. Mismos nombres y misma
 *  forma de resultado, para que las páginas cambien lo mínimo:
 *
 *    antes:  const p = getProductBySlug(slug);          (código, instantáneo)
 *    ahora:  const p = await getProductBySlug(slug);    (base, asíncrono)
 *
 *  LA CLAVE: devuelve los MISMOS tipos de siempre (Product / ProductDetail):
 *    - nameEs/nameEn             → name: { es, en }
 *    - images (filas)            → images: [{ src, alt }]  (ordenadas)
 *    - stock                     → inStock = stock > 0, y stock
 *    - stock = 0                 → badge "agotado" (si no, el badge guardado)
 *    - slug                      → href: "/productos/<slug>"
 *  Así ProductCard, la ficha, filtros, etc. no se enteran del cambio.
 *
 *  DISPONIBLES (Etapa 3D)
 *  ----------------------
 *  Hacia la tienda, `stock` significa PIEZAS DISPONIBLES PARA COMPRAR:
 *      stock de la tabla − apartados ACTIVOS no vencidos
 *  (la misma regla que src/lib/inventory.ts usa al cobrar). Así, si la única
 *  pieza está apartada, el producto se ve "agotado" para los demás, y el
 *  límite del selector y del carrito coincide con lo que el servidor deja
 *  pagar. El panel de administración trabaja con el stock REAL por separado.
 *
 *  REGLAS
 *  ------
 *  - Solo se muestran productos con isActive = true (los retirados desde el
 *    panel desaparecen de la tienda, pero siguen en la base para el historial).
 *  - SOLO SERVIDOR (`server-only`): usa Prisma. El navegador recibirá el
 *    catálogo de otra forma en la Etapa 3B.
 *  - cache() de React: si una misma página pide el mismo dato dos veces
 *    (ej. generateMetadata y el componente), la base se consulta UNA sola vez
 *    por petición. No guarda nada entre visitas: lo que cambies en el panel se
 *    ve en la siguiente carga.
 * ============================================================================
 */

import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type {
  Product,
  ProductDetail,
  ProductBadgeType,
  ProductCategory,
  ProductMaterial,
  ProductColor,
} from "@/types/product";

/* ───────────────────────── Forma de una fila de la base ─────────────────────────
 * Describimos a mano los campos que usamos (en vez de importar los tipos
 * generados por Prisma). Lo que devuelve Prisma encaja con esta forma, y así
 * las funciones de conversión no dependen de detalles internos de Prisma.
 */
interface DbImageRow {
  url: string;
  alt: string;
  position: number;
}

interface DbProductRow {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  category: string;
  material: string;
  color: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  stock: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightG: number | null;
  dimensionNotesEs: string | null;
  dimensionNotesEn: string | null;
  careInstructionsEs: string[];
  careInstructionsEn: string[];
  createdAt: Date;
  images: DbImageRow[];
}

/** Incluir las imágenes ya ordenadas (la de position 0 = principal). */
const withImages = {
  images: { orderBy: { position: "asc" as const } },
};

/** Badges que sí se guardan en la base ("agotado" se deduce del stock). */
const EDITORIAL_BADGES: ProductBadgeType[] = ["nuevo", "oferta", "limitado"];

/* ───────────────────────────── Conversión fila → tipo ───────────────────────────── */

/**
 * Fila de la base → Product (lo que usan listados y tarjetas).
 * `blocked` = piezas bloqueadas por apartados activos (se restan del stock).
 */
function toProduct(row: DbProductRow, blocked: number = 0): Product {
  // Piezas que un cliente puede comprar ahora mismo (nunca negativo).
  const available = Math.max(0, row.stock - blocked);

  const storedBadge = EDITORIAL_BADGES.includes(row.badge as ProductBadgeType)
    ? (row.badge as ProductBadgeType)
    : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: { es: row.nameEs, en: row.nameEn },
    // category/material/color se guardan como texto y se validan al crear o
    // editar desde el panel; aquí los tratamos como las listas tipadas.
    category: row.category as ProductCategory,
    material: row.material as ProductMaterial,
    color: row.color as ProductColor,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    images: row.images.map((img) => ({ src: img.url, alt: img.alt })),
    // Sin piezas disponibles = "agotado", sin importar el badge guardado.
    badge: available <= 0 ? "agotado" : storedBadge,
    href: `/productos/${row.slug}`,
    inStock: available > 0,
    stock: available, // DISPONIBLES, no el stock crudo (ver la cabecera)
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Fila de la base + datos de reseñas → ProductDetail (la ficha del producto).
 * Los campos de medidas vacíos se omiten (undefined), igual que en los datos
 * de código, para que la ficha no muestre "0 cm".
 */
function toProductDetail(
  row: DbProductRow,
  reviews: { averageRating: number; reviewCount: number },
  blocked: number,
): ProductDetail {
  const hasNotes = row.dimensionNotesEs || row.dimensionNotesEn;

  return {
    ...toProduct(row, blocked),
    description: { es: row.descriptionEs, en: row.descriptionEn },
    dimensions: {
      length: row.lengthCm ?? undefined,
      width: row.widthCm ?? undefined,
      height: row.heightCm ?? undefined,
      weight: row.weightG ?? undefined,
      notes: hasNotes
        ? { es: row.dimensionNotesEs ?? "", en: row.dimensionNotesEn ?? "" }
        : undefined,
    },
    careInstructions: {
      es: row.careInstructionsEs,
      en: row.careInstructionsEn,
    },
    averageRating: reviews.averageRating,
    reviewCount: reviews.reviewCount,
  };
}

/* ───────────────────────── Piezas bloqueadas por apartados ───────────────────────── */

/**
 * Cuántas piezas de cada producto están bloqueadas por apartados ACTIVOS y no
 * vencidos, en UNA sola consulta para todo el catálogo. El slug vive dentro
 * del JSON del apartado (productSnapshot.slug), por eso se usa SQL directo
 * (Prisma no agrupa por un campo dentro de un JSON).
 * cache(): una sola consulta por petición aunque varias funciones la pidan.
 */
const getBlockedUnits = cache(async (): Promise<Map<string, number>> => {
  const rows = await prisma.$queryRaw<{ slug: string; blocked: number }[]>`
    SELECT "productSnapshot"->>'slug' AS slug, COUNT(*)::int AS blocked
    FROM "reservations"
    WHERE "status" = 'ACTIVO' AND "expiresAt" > NOW()
    GROUP BY 1
  `;
  return new Map(rows.map((r) => [r.slug, r.blocked]));
});

/* ───────────────────────────── Funciones públicas ───────────────────────────── */

/** Todos los productos visibles, del más nuevo al más antiguo. */
export const getActiveProducts = cache(async (): Promise<Product[]> => {
  const [rows, blocked] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: withImages,
      orderBy: { createdAt: "desc" },
    }),
    getBlockedUnits(),
  ]);
  return rows.map((row) => toProduct(row, blocked.get(row.slug)));
});

/**
 * Productos visibles de una categoría. Acepta mayúsculas/minúsculas
 * ("aretes" o "Aretes"), igual que la función anterior.
 */
export const getProductsByCategory = cache(
  async (category: string): Promise<Product[]> => {
    const [rows, blocked] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          category: { equals: category, mode: "insensitive" },
        },
        include: withImages,
        orderBy: { createdAt: "desc" },
      }),
      getBlockedUnits(),
    ]);
    return rows.map((row) => toProduct(row, blocked.get(row.slug)));
  },
);

/** Un producto visible por su slug, o null si no existe o está retirado. */
export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    const [row, blocked] = await Promise.all([
      prisma.product.findFirst({
        where: { slug, isActive: true },
        include: withImages,
      }),
      getBlockedUnits(),
    ]);
    return row ? toProduct(row, blocked.get(row.slug)) : null;
  },
);

/**
 * La ficha completa de un producto visible, o null.
 *
 * averageRating y reviewCount se calculan de las reseñas REALES de la tabla
 * reviews (antes eran números fijos de muestra). Sin reseñas: 0 y 0.
 */
export const getProductDetail = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const [row, stats, blocked] = await Promise.all([
      prisma.product.findFirst({
        where: { slug, isActive: true },
        include: withImages,
      }),
      prisma.review.aggregate({
        where: { productSlug: slug },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      getBlockedUnits(),
    ]);
    if (!row) return null;

    return toProductDetail(
      row,
      {
        // Un decimal, como se muestra en la ficha (ej. 4.7).
        averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
        reviewCount: stats._count._all,
      },
      blocked.get(row.slug) ?? 0,
    );
  },
);

/** Otros productos visibles de la misma categoría (para "también te puede gustar"). */
export const getRelatedProducts = cache(
  async (
    currentSlug: string,
    category: string,
    limit: number = 4,
  ): Promise<Product[]> => {
    const [rows, blocked] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          category: { equals: category, mode: "insensitive" },
          slug: { not: currentSlug },
        },
        include: withImages,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      getBlockedUnits(),
    ]);
    return rows.map((row) => toProduct(row, blocked.get(row.slug)));
  },
);

/** Slugs de todos los productos visibles (para el sitemap). */
export const getAllProductSlugs = cache(async (): Promise<string[]> => {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return rows.map((r: { slug: string }) => r.slug);
});