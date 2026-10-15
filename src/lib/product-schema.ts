/**
 * ============================================================================
 *  MKatalina · Reglas de un PRODUCTO (validación) · Fase 13 · Etapa 4A
 * ============================================================================
 *
 *  Única fuente de verdad de qué es un producto válido. La usan:
 *    - el formulario del panel (para marcar errores en el campo exacto), y
 *    - las acciones de servidor (que validan SIEMPRE, sin confiar en el
 *      navegador).
 *  Usa zod: describimos la forma del dato y zod revisa y limpia (recorta
 *  espacios, convierte "1250" en 1250, etc.).
 *
 *  Las listas de categorías, materiales y colores coinciden con los tipos de
 *  src/types/product.ts. Las páginas /aretes, /collares… existen solo para
 *  esas 4 categorías: agregar una quinta requiere también su página.
 *
 *  Sin secretos: se puede importar desde el navegador.
 * ============================================================================
 */

import { z } from "zod";
import type {
  ProductCategory,
  ProductMaterial,
  ProductColor,
} from "@/types/product";
import {
  PRODUCT_IMAGE_PATH_REGEX,
  getProductImagePublicUrl,
} from "@/lib/product-images";

/* ─────────────────────────── Listas permitidas ─────────────────────────── */

export const PRODUCT_CATEGORIES = [
  "Aretes",
  "Collares",
  "Pulseras",
  "Gargantillas",
] as const satisfies readonly ProductCategory[];

export const PRODUCT_MATERIALS = [
  "plata-925",
  "oro-rosa",
  "acero-quirurgico",
  "piedras-naturales",
  "terciopelo",
  "cuero",
] as const satisfies readonly ProductMaterial[];

export const PRODUCT_COLORS = [
  "dorado",
  "plateado",
  "rosa",
  "negro",
  "multicolor",
] as const satisfies readonly ProductColor[];

/** Etiquetas que se pueden elegir ("agotado" la pone sola el stock en 0). */
export const PRODUCT_BADGES = ["nuevo", "oferta", "limitado"] as const;

/** Máximo de fotos por producto. */
export const MAX_PRODUCT_IMAGES = 8;

/** Formato de un slug: minúsculas, números y guiones (ej. "aretes-camelia"). */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Sugiere un slug a partir de un nombre: "Aretes Rocío" → "aretes-rocio".
 * Quita acentos, pasa a minúsculas y cambia todo lo demás por guiones.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ─────────────────────────── Piezas reutilizables ─────────────────────────── */

/** Texto obligatorio, sin espacios sobrantes. */
const requiredText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label}: mínimo ${min} caracteres`)
    .max(max, `${label}: máximo ${max} caracteres`);

/** Texto opcional: vacío → null. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Medida opcional en cm o g: vacío → null; si viene, positiva. */
const optionalMeasure = (label: string) =>
  z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0 && v <= 1000), {
      message: `${label}: número mayor que 0 (máximo 1000)`,
    })
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Lista de cuidados: una línea por cuidado; se descartan las vacías. */
const careList = (label: string) =>
  z
    .array(z.string().trim().max(200, `${label}: cada línea, máximo 200 caracteres`))
    .transform((lines) => lines.filter((l) => l !== ""))
    .refine((lines) => lines.length <= 10, {
      message: `${label}: máximo 10 líneas`,
    });

/**
 * Una foto del producto.
 *   - Subida al bucket: trae storagePath ("products/<uuid>.jpg"). La URL se
 *     RECALCULA en el servidor a partir de esa ruta (no se acepta una URL
 *     cualquiera del navegador).
 *   - Placeholder local de los productos migrados: url que empieza con "/".
 */
const productImageSchema = z
  .object({
    url: z.string().trim(),
    alt: z.string().trim().max(160, "Texto alternativo: máximo 160 caracteres"),
    storagePath: z.string().trim().nullable(),
  })
  .transform((img, ctx) => {
    if (img.storagePath) {
      if (!PRODUCT_IMAGE_PATH_REGEX.test(img.storagePath)) {
        ctx.addIssue({ code: "custom", message: "Foto con ruta inválida" });
        return z.NEVER;
      }
      return {
        ...img,
        url: getProductImagePublicUrl(img.storagePath),
      };
    }
    // Sin storagePath: solo rutas locales del propio sitio ("/…", no "//…").
    if (!img.url.startsWith("/") || img.url.startsWith("//")) {
      ctx.addIssue({ code: "custom", message: "Foto con dirección inválida" });
      return z.NEVER;
    }
    return { ...img, storagePath: null };
  });

/* ─────────────────────────── El producto completo ─────────────────────────── */

export const productInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3, "Slug: mínimo 3 caracteres")
      .max(80, "Slug: máximo 80 caracteres")
      .regex(SLUG_REGEX, "Slug: solo minúsculas, números y guiones (ej. aretes-luna)"),

    nameEs: requiredText(2, 120, "Nombre en español"),
    nameEn: requiredText(2, 120, "Nombre en inglés"),
    descriptionEs: requiredText(10, 5000, "Descripción en español"),
    descriptionEn: requiredText(10, 5000, "Descripción en inglés"),

    category: z.enum(PRODUCT_CATEGORIES, { message: "Elige una categoría" }),
    material: z.enum(PRODUCT_MATERIALS, { message: "Elige un material" }),
    color: z.enum(PRODUCT_COLORS, { message: "Elige un color" }),

    price: z.coerce
      .number({ message: "Precio: escribe un número" })
      .int("Precio: en pesos enteros, sin centavos")
      .min(1, "Precio: mayor que 0")
      .max(1_000_000, "Precio: demasiado alto"),

    // Precio antes de la oferta (opcional): vacío → null.
    originalPrice: z
      .union([z.number(), z.string()])
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v > 0), {
        message: "Precio antes de oferta: pesos enteros mayores que 0",
      })
      .nullable()
      .optional()
      .transform((v) => v ?? null),

    badge: z
      .enum(PRODUCT_BADGES)
      .nullable()
      .optional()
      .transform((v) => v ?? null),

    stock: z.coerce
      .number({ message: "Stock: escribe un número" })
      .int("Stock: número entero")
      .min(0, "Stock: no puede ser negativo")
      .max(9999, "Stock: máximo 9999"),

    isActive: z.boolean(),

    lengthCm: optionalMeasure("Largo"),
    widthCm: optionalMeasure("Ancho"),
    heightCm: optionalMeasure("Alto"),
    weightG: optionalMeasure("Peso"),
    dimensionNotesEs: optionalText(300, "Notas de medidas (español)"),
    dimensionNotesEn: optionalText(300, "Notas de medidas (inglés)"),

    careInstructionsEs: careList("Cuidados en español"),
    careInstructionsEn: careList("Cuidados en inglés"),

    images: z
      .array(productImageSchema)
      .max(MAX_PRODUCT_IMAGES, `Máximo ${MAX_PRODUCT_IMAGES} fotos`),
  })
  // Reglas que dependen de dos campos a la vez.
  .superRefine((p, ctx) => {
    if (p.originalPrice !== null && p.originalPrice <= p.price) {
      ctx.addIssue({
        code: "custom",
        path: ["originalPrice"],
        message: "Precio antes de oferta: debe ser MAYOR que el precio actual",
      });
    }
  });

/** Lo que llega del formulario (antes de validar/limpiar). */
export type ProductInput = z.input<typeof productInputSchema>;
/** Lo que queda después de validar (listo para guardar). */
export type ProductData = z.output<typeof productInputSchema>;

/** Errores por campo: { "nameEs": "Nombre en español: mínimo 2…" }. */
export type FieldErrors = Record<string, string>;

/**
 * Valida un producto. Devuelve los datos limpios o los errores por campo
 * (el primer error de cada campo, que es el que muestra el formulario).
 */
export function validateProductInput(
  input: unknown,
): { ok: true; data: ProductData } | { ok: false; fieldErrors: FieldErrors } {
  // El segundo argumento da un mensaje en español a los errores que no tienen
  // uno propio (por ejemplo, un campo que ni siquiera llegó). Los mensajes
  // escritos arriba en cada campo tienen prioridad sobre este.
  const result = productInputSchema.safeParse(input, {
    error: (issue) =>
      issue.code === "invalid_type" ? "Campo obligatorio o con formato inválido" : undefined,
  });
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
}