/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: PRODUCTOS (panel admin) · Fase 13 · Etapa 4A
 * ============================================================================
 *
 *  Todo lo que el panel puede hacer con los productos. CADA acción verifica
 *  primero que quien llama sea administrador (isCurrentUserAdmin): aunque la
 *  página ya esté protegida, una Server Action es un punto de entrada público
 *  y se protege por sí misma.
 *
 *    getAdminProducts      → lista para la tabla (visibles y ocultos).
 *    getAdminProduct       → un producto completo, para el formulario de edición.
 *    createProduct         → crea un producto con sus fotos.
 *    updateProduct         → edita un producto (el slug NO cambia).
 *    updateProductStock    → cambio rápido de stock desde la lista.
 *    setProductActive      → ocultar / volver a mostrar en la tienda.
 *    deleteProduct         → borra si nunca se vendió; si ya tuvo ventas, lo oculta.
 *    discardUploadedImages → borra fotos subidas que NO se guardaron (formulario
 *                            cancelado), sin tocar nunca las que usa un producto.
 *
 *  VALIDACIÓN: todos los datos pasan por productInputSchema
 *  (src/lib/product-schema.ts), las mismas reglas que usa el formulario.
 *
 *  FOTOS: las filas viven en product_images; los archivos en el bucket de
 *  Supabase Storage. Al quitar fotos o borrar un producto, primero se cambia
 *  la base y DESPUÉS se borran los archivos (si se borraran antes y la base
 *  fallara, el producto quedaría apuntando a fotos que ya no existen).
 *
 *  Los cambios se ven al instante en la tienda porque sus páginas leen la
 *  base en cada visita (force-dynamic).
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGES_BUCKET,
  PRODUCT_IMAGE_PATH_REGEX,
} from "@/lib/product-images";
import {
  validateProductInput,
  type ProductData,
  type FieldErrors,
} from "@/lib/product-schema";

/* ─────────────────────────────── Tipos de respuesta ─────────────────────────────── */

/** Resultado de crear / editar: ok con id, o errores por campo / generales. */
export type SaveProductResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; fieldErrors?: FieldErrors; formError?: string };

/** Fila de la tabla del panel. */
export interface AdminProductRow {
  id: string;
  slug: string;
  nameEs: string;
  category: string;
  price: number;
  originalPrice: number | null;
  /** Stock REAL de la tabla (piezas físicas). */
  stock: number;
  /** Piezas bloqueadas por apartados activos no vencidos. */
  reserved: number;
  isActive: boolean;
  badge: string | null;
  /** URL de la foto principal, o null si no tiene. */
  mainImage: string | null;
  updatedAt: string;
}

/** Producto completo para el formulario de edición. */
export interface AdminProductDetail {
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
  isActive: boolean;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightG: number | null;
  dimensionNotesEs: string | null;
  dimensionNotesEn: string | null;
  careInstructionsEs: string[];
  careInstructionsEn: string[];
  images: { url: string; alt: string; storagePath: string | null }[];
  /** true si ya aparece en algún pedido o apartado (no se puede borrar). */
  hasSales: boolean;
}

const NOT_ADMIN = "Tu cuenta no tiene permiso de administrador.";

/* ─────────────────────────────── Ayudantes internos ─────────────────────────────── */

/**
 * ¿Este producto ya se vendió o se apartó alguna vez? Pedidos y apartados lo
 * referencian por slug (sin llave foránea), así que se cuenta por slug.
 */
async function productHasSales(slug: string): Promise<boolean> {
  const [orderLines, reservations] = await Promise.all([
    prisma.orderItem.count({ where: { productSlug: slug } }),
    prisma.reservation.count({
      where: { productSnapshot: { path: ["slug"], equals: slug } },
    }),
  ]);
  return orderLines + reservations > 0;
}

/**
 * Borra archivos del bucket. "Mejor esfuerzo": si Storage falla, se registra
 * el error pero no se deshace lo que ya se guardó en la base (un archivo
 * sobrante solo ocupa espacio; no rompe nada).
 */
async function removeStorageFiles(paths: string[]): Promise<void> {
  const valid = paths.filter((p) => PRODUCT_IMAGE_PATH_REGEX.test(p));
  if (valid.length === 0) return;
  try {
    const { error } = await createAdminClient()
      .storage.from(PRODUCT_IMAGES_BUCKET)
      .remove(valid);
    if (error) console.error("removeStorageFiles:", error);
  } catch (error) {
    console.error("removeStorageFiles:", error);
  }
}

/** Columnas de la tabla products a partir de los datos validados. */
function toProductColumns(data: ProductData) {
  return {
    nameEs: data.nameEs,
    nameEn: data.nameEn,
    descriptionEs: data.descriptionEs,
    descriptionEn: data.descriptionEn,
    category: data.category,
    material: data.material,
    color: data.color,
    price: data.price,
    originalPrice: data.originalPrice,
    badge: data.badge,
    stock: data.stock,
    isActive: data.isActive,
    lengthCm: data.lengthCm,
    widthCm: data.widthCm,
    heightCm: data.heightCm,
    weightG: data.weightG,
    dimensionNotesEs: data.dimensionNotesEs,
    dimensionNotesEn: data.dimensionNotesEn,
    careInstructionsEs: data.careInstructionsEs,
    careInstructionsEn: data.careInstructionsEn,
  };
}

/** Filas de product_images en el orden recibido (position 0 = principal). */
function toImageRows(images: ProductData["images"]) {
  return images.map((img, index) => ({
    url: img.url,
    alt: img.alt,
    position: index,
    storagePath: img.storagePath,
  }));
}

/* ─────────────────────────────── Lectura ─────────────────────────────── */

/** Todos los productos (visibles y ocultos), el más reciente primero. */
export async function getAdminProducts(): Promise<AdminProductRow[]> {
  if (!(await isCurrentUserAdmin())) return [];

  const [rows, blockedRows] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      },
    }),
    // Piezas apartadas por producto (apartados ACTIVOS no vencidos).
    prisma.$queryRaw<{ slug: string; blocked: number }[]>`
      SELECT "productSnapshot"->>'slug' AS slug, COUNT(*)::int AS blocked
      FROM "reservations"
      WHERE "status" = 'ACTIVO' AND "expiresAt" > NOW()
      GROUP BY 1
    `,
  ]);
  const blocked = new Map(blockedRows.map((r) => [r.slug, r.blocked]));

  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameEs: p.nameEs,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    reserved: blocked.get(p.slug) ?? 0,
    isActive: p.isActive,
    badge: p.badge,
    mainImage: p.images[0]?.url ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));
}

/** Un producto completo para editar, o null si no existe / no eres admin. */
export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail | null> {
  if (!(await isCurrentUserAdmin())) return null;

  const p = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!p) return null;

  return {
    id: p.id,
    slug: p.slug,
    nameEs: p.nameEs,
    nameEn: p.nameEn,
    descriptionEs: p.descriptionEs,
    descriptionEn: p.descriptionEn,
    category: p.category,
    material: p.material,
    color: p.color,
    price: p.price,
    originalPrice: p.originalPrice,
    badge: p.badge,
    stock: p.stock,
    isActive: p.isActive,
    lengthCm: p.lengthCm,
    widthCm: p.widthCm,
    heightCm: p.heightCm,
    weightG: p.weightG,
    dimensionNotesEs: p.dimensionNotesEs,
    dimensionNotesEn: p.dimensionNotesEn,
    careInstructionsEs: p.careInstructionsEs,
    careInstructionsEn: p.careInstructionsEn,
    images: p.images.map((img) => ({
      url: img.url,
      alt: img.alt,
      storagePath: img.storagePath,
    })),
    hasSales: await productHasSales(p.slug),
  };
}

/* ─────────────────────────────── Crear y editar ─────────────────────────────── */

/** Crea un producto con sus fotos. El slug debe ser único. */
export async function createProduct(input: unknown): Promise<SaveProductResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, formError: NOT_ADMIN };

  const parsed = validateProductInput(input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  // Slug repetido → error en ese campo (más claro que un error de la base).
  const taken = await prisma.product.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (taken) {
    return {
      ok: false,
      fieldErrors: { slug: "Ya existe un producto con este slug. Elige otro." },
    };
  }

  try {
    const created = await prisma.product.create({
      data: {
        slug: data.slug,
        ...toProductColumns(data),
        images: { create: toImageRows(data.images) },
      },
      select: { id: true, slug: true },
    });
    return { ok: true, id: created.id, slug: created.slug };
  } catch (error) {
    console.error("createProduct:", error);
    return { ok: false, formError: "No se pudo guardar el producto. Inténtalo de nuevo." };
  }
}

/**
 * Edita un producto. El slug NO se cambia (pedidos, carritos y wishlists lo
 * usan como referencia): se ignora el que venga en los datos.
 * Las fotos se reemplazan por la lista recibida, en su nuevo orden; los
 * archivos de las fotos que se quitaron se borran del bucket al final.
 */
export async function updateProduct(
  id: string,
  input: unknown,
): Promise<SaveProductResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, formError: NOT_ADMIN };

  const current = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, images: { select: { storagePath: true } } },
  });
  if (!current) return { ok: false, formError: "El producto ya no existe." };

  // Se valida con el slug guardado, para que un slug editado a mano no cuente.
  const parsed = validateProductInput({
    ...(input as Record<string, unknown>),
    slug: current.slug,
  });
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  try {
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          ...toProductColumns(data),
          images: { create: toImageRows(data.images) },
        },
      }),
    ]);
  } catch (error) {
    console.error("updateProduct:", error);
    return { ok: false, formError: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }

  // Archivos que el producto tenía y ya no usa → fuera del bucket.
  const kept = new Set(data.images.map((img) => img.storagePath).filter(Boolean));
  const removed = current.images
    .map((img) => img.storagePath)
    .filter((p): p is string => !!p && !kept.has(p));
  await removeStorageFiles(removed);

  return { ok: true, id, slug: current.slug };
}

/* ─────────────────────────────── Acciones rápidas ─────────────────────────────── */

/** Cambia solo el stock (entero entre 0 y 9999). */
export async function updateProductStock(
  id: string,
  stock: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: NOT_ADMIN };
  if (!Number.isInteger(stock) || stock < 0 || stock > 9999) {
    return { ok: false, error: "El stock debe ser un número entero entre 0 y 9999." };
  }
  try {
    await prisma.product.update({ where: { id }, data: { stock } });
    return { ok: true };
  } catch (error) {
    console.error("updateProductStock:", error);
    return { ok: false, error: "No se pudo actualizar el stock." };
  }
}

/** Oculta (false) o vuelve a mostrar (true) un producto en la tienda. */
export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: NOT_ADMIN };
  try {
    await prisma.product.update({ where: { id }, data: { isActive } });
    return { ok: true };
  } catch (error) {
    console.error("setProductActive:", error);
    return { ok: false, error: "No se pudo cambiar la visibilidad." };
  }
}

/**
 * Elimina un producto según la regla acordada:
 *   - Nunca se vendió ni se apartó → se BORRA de verdad: su fila, sus fotos
 *     (filas y archivos) y sus apariciones en carritos, wishlists y reseñas.
 *   - Ya tuvo ventas o apartados → solo se OCULTA (isActive = false), para que
 *     los pedidos y apartados viejos sigan mostrando su información.
 * `mode` le dice al panel cuál de las dos pasó.
 */
export async function deleteProduct(
  id: string,
): Promise<{ ok: boolean; mode?: "deleted" | "archived"; error?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: NOT_ADMIN };

  const product = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, images: { select: { storagePath: true } } },
  });
  if (!product) return { ok: false, error: "El producto ya no existe." };

  try {
    if (await productHasSales(product.slug)) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return { ok: true, mode: "archived" };
    }

    // Borrado real, todo o nada.
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productSlug: product.slug } }),
      prisma.wishlistItem.deleteMany({ where: { productSlug: product.slug } }),
      prisma.review.deleteMany({ where: { productSlug: product.slug } }),
      // Las filas de product_images se borran solas (onDelete: Cascade).
      prisma.product.delete({ where: { id } }),
    ]);
  } catch (error) {
    console.error("deleteProduct:", error);
    return { ok: false, error: "No se pudo eliminar el producto." };
  }

  // Ya fuera de la base: borrar sus archivos del bucket.
  await removeStorageFiles(
    product.images
      .map((img) => img.storagePath)
      .filter((p): p is string => !!p),
  );
  return { ok: true, mode: "deleted" };
}

/* ─────────────────────────────── Limpieza de fotos ─────────────────────────────── */

/**
 * Borra del bucket fotos que se subieron en un formulario que NO se guardó
 * (se canceló o se quitó la foto antes de guardar). Por seguridad, solo borra
 * rutas que NINGÚN producto está usando: así nunca puede desaparecer la foto
 * de un producto guardado por error.
 */
export async function discardUploadedImages(
  paths: string[],
): Promise<{ ok: boolean }> {
  if (!(await isCurrentUserAdmin())) return { ok: false };

  const candidates = [...new Set(paths)].filter((p) =>
    PRODUCT_IMAGE_PATH_REGEX.test(p),
  );
  if (candidates.length === 0) return { ok: true };

  const inUse = await prisma.productImage.findMany({
    where: { storagePath: { in: candidates } },
    select: { storagePath: true },
  });
  const used = new Set(inUse.map((r) => r.storagePath));

  await removeStorageFiles(candidates.filter((p) => !used.has(p)));
  return { ok: true };
}