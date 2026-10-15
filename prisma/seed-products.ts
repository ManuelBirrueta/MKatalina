/**
 * ============================================================================
 *  MKatalina · Seed de productos (código → base de datos) · Fase 13
 * ============================================================================
 *
 *  QUÉ HACE
 *  --------
 *  Copia los productos que hoy viven en código (src/data/products.ts +
 *  src/data/product-details.ts) a las tablas `products` y `product_images`.
 *  Se corre UNA vez, a mano, desde la terminal:
 *
 *      npx tsx prisma/seed-products.ts
 *
 *  CÓMO OBTIENE LOS DATOS
 *  ----------------------
 *  No copia los productos a mano: IMPORTA tus archivos reales.
 *    - productsData       → la lista de los 24 productos (tipo Product)
 *    - getProductDetail() → el producto + descripción, medidas y cuidados
 *                           (tipo ProductDetail). Para los productos que no
 *                           tienen detalle propio, tu código ya devuelve un
 *                           texto genérico según el material; ese texto es el
 *                           que se guarda (luego lo puedes editar en el panel).
 *
 *  ES SEGURO CORRERLO MÁS DE UNA VEZ
 *  ---------------------------------
 *  Si un producto (mismo slug) YA existe en la base, por defecto se SALTA y
 *  no se toca. Así, si ya editaste un producto desde el panel, volver a correr
 *  el seed no borra tus cambios.
 *  Si quieres forzar que se vuelvan a copiar desde el código (sobrescribiendo):
 *
 *      npx tsx prisma/seed-products.ts --force
 *
 *  CÓMO SE TRADUCE CADA CAMPO
 *  --------------------------
 *    name { es, en }            → nameEs / nameEn
 *    description { es, en }     → descriptionEs / descriptionEn
 *    dimensions.length/…        → lengthCm / widthCm / heightCm / weightG
 *    dimensions.notes { es,en } → dimensionNotesEs / dimensionNotesEn
 *    careInstructions { es,en } → careInstructionsEs / careInstructionsEn
 *    inStock (true/false)       → stock (STOCK_INICIAL / 0)
 *    badge "agotado"            → NO se guarda (se deduce de stock = 0)
 *    images [{ src, alt }]      → filas en product_images (position 0, 1, …)
 *    averageRating, reviewCount → NO se guardan: eran valores de muestra y se
 *                                 calcularán desde la tabla reviews.
 * ============================================================================
 */

import { PrismaClient } from "@prisma/client";
// Tus datos reales. La ruta relativa funciona porque este archivo vive en
// frontend/prisma/ y los datos en frontend/src/data/. tsx resuelve también los
// alias "@/..." que esos archivos usan por dentro (lee tu tsconfig.json).
import { productsData, getProductDetail } from "../src/data/products";

/**
 * Cuántas piezas se cargan a los productos que hoy dicen "inStock: true".
 * El código actual solo sabe "hay / no hay", no cuántas. Pon aquí el número
 * que prefieras como punto de partida; después ajustas cada producto en el
 * panel de administración. Los que hoy están agotados quedan en 0.
 */
const STOCK_INICIAL = 5;

/** --force en la línea de comandos = sobrescribir productos existentes. */
const FORCE = process.argv.includes("--force");

// Cliente propio del script (no usamos src/lib/prisma.ts, que está pensado
// para el servidor de Next.js).
const prisma = new PrismaClient();

/**
 * Convierte un producto del código en los datos de la tabla `products`.
 * Separado en su función para que el flujo principal se lea fácil.
 */
function toProductData(slug: string) {
  const d = getProductDetail(slug);
  if (!d) {
    // No debería pasar: el slug viene de la misma lista productsData.
    throw new Error(`getProductDetail no devolvió nada para "${slug}"`);
  }

  return {
    id: d.id, // se conserva el id original ("ar-001", …)
    slug: d.slug,

    nameEs: d.name.es,
    nameEn: d.name.en,
    descriptionEs: d.description.es,
    descriptionEn: d.description.en,

    category: d.category,
    material: d.material,
    color: d.color,

    price: d.price,
    originalPrice: d.originalPrice ?? null,

    // "agotado" no es una etiqueta editorial: lo decide el stock.
    badge: d.badge && d.badge !== "agotado" ? d.badge : null,

    stock: d.inStock ? STOCK_INICIAL : 0,
    isActive: true,

    lengthCm: d.dimensions?.length ?? null,
    widthCm: d.dimensions?.width ?? null,
    heightCm: d.dimensions?.height ?? null,
    weightG: d.dimensions?.weight ?? null,
    dimensionNotesEs: d.dimensions?.notes?.es ?? null,
    dimensionNotesEn: d.dimensions?.notes?.en ?? null,

    careInstructionsEs: d.careInstructions?.es ?? [],
    careInstructionsEn: d.careInstructions?.en ?? [],

    // Conservamos la fecha original: el orden "más nuevos primero" no cambia.
    createdAt: new Date(d.createdAt),
  };
}

/** Convierte las imágenes del código en filas de `product_images`. */
function toImageRows(images: { src: string; alt: string }[]) {
  return images.map((img, index) => ({
    url: img.src, // hoy son rutas locales "/placeholder-…"
    alt: img.alt ?? "",
    position: index, // la primera (0) es la principal
    storagePath: null, // no están en Supabase Storage
  }));
}

async function main() {
  console.log(
    `\nCopiando ${productsData.length} productos a la base` +
      (FORCE ? " (modo --force: sobrescribe los existentes)" : "") +
      "…\n",
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of productsData) {
    const data = toProductData(product.slug);
    const images = toImageRows(product.images);

    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    if (!existing) {
      // CREAR: producto + imágenes en una sola operación (todo o nada).
      await prisma.product.create({
        data: { ...data, images: { create: images } },
      });
      created++;
      console.log(`  + creado      ${product.slug}`);
      continue;
    }

    if (!FORCE) {
      skipped++;
      console.log(`  · ya existe   ${product.slug} (se salta)`);
      continue;
    }

    // SOBRESCRIBIR (--force): borra sus imágenes y las vuelve a crear, y
    // actualiza los campos. En una transacción para no dejarlo a medias.
    // El id no se cambia: es la llave a la que apuntan las imágenes.
    const { id: _ignoredId, ...fields } = data;
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: existing.id } }),
      prisma.product.update({
        where: { id: existing.id },
        data: { ...fields, images: { create: images } },
      }),
    ]);
    updated++;
    console.log(`  ~ actualizado ${product.slug}`);
  }

  const total = await prisma.product.count();
  console.log(
    `\nListo. Creados: ${created} · Actualizados: ${updated} · Saltados: ${skipped}` +
      `\nTotal en la tabla products: ${total}\n`,
  );
}

main()
  .catch((error) => {
    console.error("\n✖ El seed falló:\n", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Siempre cerrar la conexión, falle o no, para que el proceso termine.
    await prisma.$disconnect();
  });