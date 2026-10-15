/**
 * ============================================================================
 *  MKatalina · Acciones de servidor: IMÁGENES DE PRODUCTOS · Fase 13 · Etapa 2
 * ============================================================================
 *
 *  FLUJO DE SUBIDA ("URL firmada"):
 *    1. El navegador del admin llama a createProductImageUpload() con el tipo
 *       y el tamaño de la foto (NO manda la foto).
 *    2. Esta acción verifica que sea admin, valida tipo/tamaño, inventa un
 *       nombre único y le pide a Supabase una URL firmada de UN SOLO USO para
 *       esa ruta exacta.
 *    3. El navegador sube la foto DIRECTO a Supabase con esa URL
 *       (src/lib/upload-product-image.ts).
 *
 *  ¿Por qué no subir la foto a través de esta acción? Las Server Actions
 *  aceptan 1 MB por defecto y Vercel corta peticiones de más de 4.5 MB; una
 *  foto de celular pesa 3-8 MB. Con la URL firmada la foto nunca pasa por
 *  Next.js, y aun así nadie puede subir nada sin el permiso de un admin.
 *
 *  BORRAR: deleteProductImageFile() elimina el archivo del bucket (por ejemplo
 *  al quitar una foto en el formulario de producto, en la Etapa 4).
 * ============================================================================
 */

"use server";

import { isCurrentUserAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGES_BUCKET,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_TYPES,
  PRODUCT_IMAGE_PATH_REGEX,
  isAllowedImageType,
  getProductImagePublicUrl,
} from "@/lib/product-images";

/** Motivos por los que se puede negar una subida (la UI muestra un texto por cada uno). */
export type ImageUploadError =
  | "notAdmin"
  | "invalidType"
  | "tooLarge"
  | "storageError";

export type CreateUploadResult =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: ImageUploadError };

/**
 * Pide permiso para subir UNA foto. Devuelve la ruta donde se guardará, el
 * token de la URL firmada y la URL pública con la que se verá después.
 */
export async function createProductImageUpload(input: {
  contentType: string;
  size: number;
}): Promise<CreateUploadResult> {
  // 1) Solo administradores (no confiamos en que la página ya lo revisó).
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "notAdmin" };

  // 2) Validación en el servidor: lo que diga el navegador no basta.
  if (!isAllowedImageType(input.contentType)) {
    return { ok: false, error: "invalidType" };
  }
  if (
    !Number.isFinite(input.size) ||
    input.size <= 0 ||
    input.size > PRODUCT_IMAGE_MAX_BYTES
  ) {
    return { ok: false, error: "tooLarge" };
  }

  // 3) Nombre único e impredecible. No usamos el nombre original del archivo
  //    (puede traer espacios, acentos o caracteres raros) ni dejamos que el
  //    navegador elija la ruta.
  const extension = PRODUCT_IMAGE_TYPES[input.contentType];
  const path = `products/${crypto.randomUUID()}.${extension}`;

  // 4) URL firmada de un solo uso para esa ruta.
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("createProductImageUpload:", error);
    return { ok: false, error: "storageError" };
  }

  return {
    ok: true,
    path: data.path,
    token: data.token,
    publicUrl: getProductImagePublicUrl(data.path),
  };
}

/**
 * Borra una foto del bucket. Solo admins, y solo rutas con el formato que
 * genera createProductImageUpload ("products/<uuid>.<ext>"), para que nadie
 * pueda usar esta acción para borrar otra cosa.
 */
export async function deleteProductImageFile(
  path: string,
): Promise<{ ok: boolean }> {
  if (!(await isCurrentUserAdmin())) return { ok: false };
  if (!PRODUCT_IMAGE_PATH_REGEX.test(path)) return { ok: false };

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([path]);

  if (error) {
    console.error("deleteProductImageFile:", error);
    return { ok: false };
  }
  return { ok: true };
}