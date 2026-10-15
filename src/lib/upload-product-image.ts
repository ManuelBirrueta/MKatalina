/**
 * ============================================================================
 *  MKatalina · Subir una foto de producto (NAVEGADOR) · Fase 13 · Etapa 2
 * ============================================================================
 *
 *  Función que usan los componentes del panel (el formulario de producto de la
 *  Etapa 4, y por ahora la página de prueba) para subir UNA foto:
 *
 *    1. Revisa tipo y tamaño aquí mismo, para avisar al instante sin gastar
 *       una llamada al servidor.
 *    2. Pide permiso al servidor (createProductImageUpload).
 *    3. Sube la foto directo a Supabase con la URL firmada, usando el cliente
 *       de navegador (llave pública; el permiso lo da el token, no la llave).
 *
 *  Devuelve la ruta en el bucket (para guardarla en product_images.storagePath)
 *  y la URL pública (para product_images.url).
 * ============================================================================
 */

import { createClient } from "@/lib/supabase/client";
import {
  createProductImageUpload,
  type ImageUploadError,
} from "@/actions/product-images";
import {
  PRODUCT_IMAGES_BUCKET,
  PRODUCT_IMAGE_MAX_BYTES,
  isAllowedImageType,
} from "@/lib/product-images";

export type UploadProductImageResult =
  | { ok: true; path: string; url: string }
  | { ok: false; error: ImageUploadError | "uploadFailed" };

export async function uploadProductImage(
  file: File,
): Promise<UploadProductImageResult> {
  // 1) Validación rápida en el navegador (el servidor vuelve a validar).
  if (!isAllowedImageType(file.type)) return { ok: false, error: "invalidType" };
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return { ok: false, error: "tooLarge" };

  // 2) Permiso del servidor (verifica que seas admin).
  const permit = await createProductImageUpload({
    contentType: file.type,
    size: file.size,
  });
  if (!permit.ok) return permit;

  // 3) Subida directa a Supabase con la URL firmada.
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .uploadToSignedUrl(permit.path, permit.token, file, {
      contentType: file.type,
    });

  if (error) {
    console.error("[imágenes] La subida a Supabase falló:", error);
    return { ok: false, error: "uploadFailed" };
  }

  return { ok: true, path: permit.path, url: permit.publicUrl };
}