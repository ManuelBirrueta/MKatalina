/**
 * ============================================================================
 *  MKatalina · Reglas de las imágenes de productos · Fase 13 · Etapa 2
 * ============================================================================
 *
 *  Única fuente de verdad sobre las fotos de productos: nombre del bucket,
 *  tamaño máximo y formatos permitidos. Lo usan TANTO el navegador (para
 *  avisar al admin antes de subir) COMO el servidor (para validar de verdad).
 *
 *  Estos valores deben coincidir con la configuración del bucket en Supabase
 *  (el SQL que lo creó: 5 MB y image/jpeg, image/png, image/webp). Supabase
 *  también los valida por su lado, así que hay tres capas de protección.
 *
 *  Este archivo NO tiene secretos: es seguro importarlo desde el navegador.
 * ============================================================================
 */

/** Nombre del bucket de Supabase Storage. */
export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Tamaño máximo por foto: 5 MB. */
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Formatos permitidos → extensión con la que se guarda el archivo. */
export const PRODUCT_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ProductImageType = keyof typeof PRODUCT_IMAGE_TYPES;

/** Valor para el atributo `accept` de un <input type="file">. */
export const PRODUCT_IMAGE_ACCEPT = Object.keys(PRODUCT_IMAGE_TYPES).join(",");

/**
 * ¿Es un formato permitido? Usa Object.hasOwn (y no `in`) para que textos
 * como "toString" no pasen por ser propiedades heredadas de todo objeto.
 */
export function isAllowedImageType(type: string): type is ProductImageType {
  return Object.hasOwn(PRODUCT_IMAGE_TYPES, type);
}

/**
 * Ruta interna de una foto dentro del bucket. Formato fijo
 * "products/<uuid>.<ext>": el servidor rechaza borrar cualquier otra cosa.
 */
export const PRODUCT_IMAGE_PATH_REGEX =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/** URL pública con la que la tienda muestra la foto. */
export function getProductImagePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}