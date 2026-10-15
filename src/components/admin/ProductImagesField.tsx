/**
 * ============================================================================
 * PRODUCT IMAGES FIELD — MKATALINA · Fase 13 · Etapa 4B
 * ============================================================================
 *
 * La sección "Fotos" del formulario de producto (ProductForm.tsx). Solo
 * español: es parte del panel interno.
 *
 * Qué permite:
 *   - SUBIR varias fotos a la vez (JPG, PNG o WebP de hasta 5 MB, máximo 8
 *     por producto). Cada una se sube con uploadProductImage()
 *     (src/lib/upload-product-image.ts): pide permiso al servidor y la manda
 *     directo a Supabase Storage.
 *   - ORDENAR con las flechas. La PRIMERA foto es la principal: la que se ve
 *     en el catálogo, el carrito y la búsqueda.
 *   - "Principal" lleva una foto al primer lugar.
 *   - Escribir el TEXTO ALTERNATIVO (alt): describe la foto para lectores de
 *     pantalla y para Google (SEO). Ej. "Aretes de plata con perla, de frente".
 *   - QUITAR una foto de la lista.
 *
 * Este componente NO guarda nada en la base: solo edita la lista que le pasa
 * el formulario (props images / onChange). La base cambia hasta que se pulsa
 * "Guardar". Lo que sí hace al momento es SUBIR los archivos al bucket; por eso
 * avisa al formulario de cada archivo nuevo (onUploaded) y de cada foto que se
 * quita (onRemoved), para que el formulario limpie los archivos que no se
 * llegaron a usar.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { uploadProductImage } from "@/lib/upload-product-image";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  isAllowedImageType,
} from "@/lib/product-images";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-schema";
import { cn } from "@/lib/utils";

/** Una foto en la lista del formulario. */
export interface FormImage {
  /** Identificador solo para React (no se guarda). */
  key: string;
  url: string;
  alt: string;
  /** Ruta en el bucket; null en los placeholders locales migrados ("/images/…"). */
  storagePath: string | null;
}

/** Texto para cada error que puede devolver la subida. */
const UPLOAD_ERROR_TEXT: Record<string, string> = {
  notAdmin: "Tu cuenta no es administradora.",
  invalidType: "Formato no permitido. Usa JPG, PNG o WebP.",
  tooLarge: "La foto pesa más de 5 MB.",
  storageError: "Supabase no dio permiso de subida. Inténtalo de nuevo.",
  uploadFailed: "La subida falló. Revisa tu conexión e inténtalo de nuevo.",
};

/** Mueve un elemento de la posición `from` a la posición `to`. */
function move<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function ProductImagesField({
  images,
  onChange,
  onUploaded,
  onRemoved,
  onUploadingChange,
  error,
}: {
  images: FormImage[];
  /**
   * Cambia la lista. Recibe una FUNCIÓN (lista anterior → lista nueva) para
   * partir siempre del estado más reciente: así una subida que termina tarde
   * no borra lo que el admin editó mientras tanto.
   */
  onChange: (update: (prev: FormImage[]) => FormImage[]) => void;
  /** Se llama con la ruta de cada archivo recién subido al bucket. */
  onUploaded: (path: string) => void;
  /** Se llama con cada foto que el admin quita de la lista. */
  onRemoved: (image: FormImage) => void;
  /** Avisa si hay subidas en curso (para desactivar "Guardar"). */
  onUploadingChange: (uploading: boolean) => void;
  /** Error de validación de la sección, si lo hay. */
  error?: string;
}) {
  // Cuántas fotos se están subiendo ahora (para mostrar cuadros de "Subiendo…").
  const [uploadingCount, setUploadingCount] = useState(0);

  const slotsLeft = MAX_PRODUCT_IMAGES - images.length - uploadingCount;

  /** El admin eligió archivos: se revisan y se suben en paralelo. */
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite volver a elegir los mismos archivos
    if (selected.length === 0) return;

    // 1) Revisión rápida aquí (el servidor y Supabase vuelven a revisar).
    const valid = selected.filter((file) => {
      if (!isAllowedImageType(file.type)) {
        toast.error(`"${file.name}": formato no permitido (usa JPG, PNG o WebP).`);
        return false;
      }
      if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
        toast.error(`"${file.name}" pesa más de 5 MB.`);
        return false;
      }
      return true;
    });

    // 2) Respeta el máximo de fotos por producto.
    const files = valid.slice(0, Math.max(0, slotsLeft));
    if (valid.length > files.length) {
      toast.warning(
        `Máximo ${MAX_PRODUCT_IMAGES} fotos por producto: se subirán solo ${files.length}.`,
      );
    }
    if (files.length === 0) return;

    // 3) Subida en paralelo.
    setUploadingCount((n) => n + files.length);
    onUploadingChange(true);
    const results = await Promise.all(files.map((file) => uploadProductImage(file)));
    setUploadingCount((n) => n - files.length);
    onUploadingChange(false);

    // 4) Se agregan al final, en el mismo orden en que se eligieron.
    const added: FormImage[] = [];
    results.forEach((result, i) => {
      if (result.ok) {
        onUploaded(result.path);
        added.push({
          key: result.path,
          url: result.url,
          alt: "",
          storagePath: result.path,
        });
      } else {
        toast.error(
          `"${files[i].name}": ${UPLOAD_ERROR_TEXT[result.error] ?? "error desconocido"}`,
        );
      }
    });
    if (added.length > 0) {
      // Se agregan a la lista MÁS RECIENTE (no a la de cuando empezó la
      // subida), por si el admin cambió algo mientras tanto.
      onChange((prev) => [...prev, ...added]);
      toast.success(added.length === 1 ? "Foto subida" : `${added.length} fotos subidas`);
    }
  };

  const updateAlt = (index: number, alt: string) =>
    onChange((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)));

  const remove = (index: number) => {
    onRemoved(images[index]);
    onChange((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        La <strong>primera</strong> foto es la principal (la que se ve en el
        catálogo). JPG, PNG o WebP, hasta 5 MB cada una, máximo{" "}
        {MAX_PRODUCT_IMAGES} fotos. Las fotos cuadradas se ven mejor.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div
            key={img.key}
            className={cn(
              "rounded-md border p-2 space-y-2",
              index === 0 ? "border-accent" : "border-border",
            )}
          >
            <div className="relative aspect-square rounded overflow-hidden bg-muted">
              {/* <img> simple: vista previa en el panel, no hace falta optimizarla. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute top-1 left-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                  Principal
                </span>
              )}
            </div>

            <input
              type="text"
              value={img.alt}
              maxLength={160}
              onChange={(e) => updateAlt(index, e.target.value)}
              placeholder="Describe la foto…"
              aria-label={`Texto alternativo de la foto ${index + 1}`}
              className="h-8 w-full px-2 rounded border border-input bg-background text-xs focus:outline-none focus:border-ring"
            />

            <div className="flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <SmallButton
                  label="←"
                  title="Mover a la izquierda"
                  disabled={index === 0}
                  onClick={() => onChange((prev) => move(prev, index, index - 1))}
                />
                <SmallButton
                  label="→"
                  title="Mover a la derecha"
                  disabled={index === images.length - 1}
                  onClick={() => onChange((prev) => move(prev, index, index + 1))}
                />
              </div>
              <div className="flex gap-1">
                {index !== 0 && (
                  <SmallButton
                    label="Principal"
                    title="Usar como foto principal"
                    onClick={() => onChange((prev) => move(prev, index, 0))}
                  />
                )}
                <SmallButton
                  label="Quitar"
                  title="Quitar esta foto"
                  danger
                  onClick={() => remove(index)}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Cuadros de "Subiendo…" mientras terminan las subidas */}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="aspect-square rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground animate-pulse"
          >
            Subiendo…
          </div>
        ))}

        {/* Botón para agregar (un <label> que abre el selector de archivos) */}
        {slotsLeft > 0 && (
          <label className="aspect-square rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground cursor-pointer hover:border-accent hover:text-accent transition-colors">
            <span className="text-2xl leading-none">+</span>
            <span>Agregar fotos</span>
            <input
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              multiple
              onChange={handleFiles}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {images.length === 0 && uploadingCount === 0 && (
        <p className="text-xs text-muted-foreground">
          Sin fotos, la tienda mostrará un recuadro vacío. Puedes guardar y
          agregarlas después.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Botoncito de las tarjetas de foto. */
function SmallButton({
  label,
  title,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 px-2 rounded border text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
        danger
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}