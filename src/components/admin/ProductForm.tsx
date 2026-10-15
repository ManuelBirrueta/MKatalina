/**
 * ============================================================================
 * PRODUCT FORM — MKATALINA · Fase 13 · Etapa 4B
 * ============================================================================
 *
 * Formulario para CREAR y EDITAR productos (solo español, panel interno).
 * Lo usan dos páginas:
 *   - /admin/productos/nuevo → mode="create" (formulario vacío).
 *   - /admin/productos/[id]  → mode="edit" con los datos del producto
 *                              (leídos con getAdminProduct).
 *
 * Secciones: información básica, descripción, precio y stock, fotos
 * (ProductImagesField.tsx), medidas y cuidados. Nombre, descripción, notas de
 * medidas y cuidados se escriben en español E inglés (la tienda es bilingüe).
 *
 * VALIDACIÓN, dos veces con las MISMAS reglas (src/lib/product-schema.ts):
 *   1. Aquí, al pulsar "Guardar": marca los errores al instante, sin ir al
 *      servidor.
 *   2. En el servidor (createProduct / updateProduct en
 *      src/actions/admin-products.ts), que nunca confía en el navegador.
 *   Los errores aparecen debajo de cada campo.
 *
 * SLUG (la parte final de la dirección: /productos/aretes-luna):
 *   - Al crear, se va llenando solo a partir del nombre en español. Si lo
 *     editas a mano, deja de seguir al nombre.
 *   - Al editar, ya no se puede cambiar: pedidos, carritos y wishlists lo usan
 *     para identificar el producto.
 *
 * FOTOS SIN GUARDAR: las fotos se suben al bucket en cuanto se eligen. El
 * formulario anota cada archivo subido en esta visita (sessionUploads) y:
 *   - si quitas una de esas fotos antes de guardar → borra su archivo;
 *   - si pulsas "Cancelar" → borra todos los archivos subidos en esta visita;
 *   - si guardas → se quedan (ya los usa el producto).
 *   Las fotos YA guardadas que quites se borran del bucket hasta que guardas
 *   (lo hace updateProduct), así "Cancelar" no pierde nada.
 *   Si se cierra la pestaña sin guardar, el navegador pregunta antes de salir.
 * ============================================================================
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import {
  createProduct,
  discardUploadedImages,
  updateProduct,
  type AdminProductDetail,
} from "@/actions/admin-products";
import {
  MAX_PRODUCT_IMAGES,
  PRODUCT_BADGES,
  PRODUCT_CATEGORIES,
  PRODUCT_COLORS,
  PRODUCT_MATERIALS,
  slugify,
  validateProductInput,
  type FieldErrors,
} from "@/lib/product-schema";
import { cn } from "@/lib/utils";
import { ProductImagesField, type FormImage } from "./ProductImagesField";

/* ─────────────────────────── Etiquetas en español ─────────────────────────── */

/** Nombre legible de cada material (en la base se guarda el código). */
const MATERIAL_LABELS: Record<(typeof PRODUCT_MATERIALS)[number], string> = {
  "plata-925": "Plata .925",
  "oro-rosa": "Oro rosa",
  "acero-quirurgico": "Acero quirúrgico",
  "piedras-naturales": "Piedras naturales",
  terciopelo: "Terciopelo",
  cuero: "Cuero",
};

const COLOR_LABELS: Record<(typeof PRODUCT_COLORS)[number], string> = {
  dorado: "Dorado",
  plateado: "Plateado",
  rosa: "Rosa",
  negro: "Negro",
  multicolor: "Multicolor",
};

const BADGE_LABELS: Record<(typeof PRODUCT_BADGES)[number], string> = {
  nuevo: "Nuevo",
  oferta: "Oferta",
  limitado: "Edición limitada",
};

/* ─────────────────────────── Valores del formulario ─────────────────────────── */

/**
 * Lo que se escribe en los campos. Los números se guardan como TEXTO mientras
 * se editan (un campo puede estar vacío a medias); la validación los convierte.
 * Los cuidados se escriben uno por línea en un área de texto.
 */
interface FormValues {
  slug: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  category: string;
  material: string;
  color: string;
  price: string;
  originalPrice: string;
  badge: string; // "" = sin etiqueta
  stock: string;
  isActive: boolean;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightG: string;
  dimensionNotesEs: string;
  dimensionNotesEn: string;
  careEs: string;
  careEn: string;
}

/** Número o null → texto para el campo. */
const numText = (n: number | null) => (n === null ? "" : String(n));

/** Valores iniciales: vacíos al crear, los del producto al editar. */
function initialValues(product?: AdminProductDetail): FormValues {
  if (!product) {
    return {
      slug: "",
      nameEs: "",
      nameEn: "",
      descriptionEs: "",
      descriptionEn: "",
      category: "",
      material: "",
      color: "",
      price: "",
      originalPrice: "",
      badge: "",
      stock: "1",
      isActive: true,
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      weightG: "",
      dimensionNotesEs: "",
      dimensionNotesEn: "",
      careEs: "",
      careEn: "",
    };
  }
  return {
    slug: product.slug,
    nameEs: product.nameEs,
    nameEn: product.nameEn,
    descriptionEs: product.descriptionEs,
    descriptionEn: product.descriptionEn,
    category: product.category,
    material: product.material,
    color: product.color,
    price: String(product.price),
    originalPrice: numText(product.originalPrice),
    badge: product.badge ?? "",
    stock: String(product.stock),
    isActive: product.isActive,
    lengthCm: numText(product.lengthCm),
    widthCm: numText(product.widthCm),
    heightCm: numText(product.heightCm),
    weightG: numText(product.weightG),
    dimensionNotesEs: product.dimensionNotesEs ?? "",
    dimensionNotesEn: product.dimensionNotesEn ?? "",
    careEs: product.careInstructionsEs.join("\n"),
    careEn: product.careInstructionsEn.join("\n"),
  };
}

/** Convierte lo escrito en el formato que esperan las reglas y el servidor. */
function toPayload(values: FormValues, images: FormImage[]) {
  const { careEs, careEn, badge, ...rest } = values;
  return {
    ...rest,
    badge: badge === "" ? null : badge,
    careInstructionsEs: careEs.split("\n"),
    careInstructionsEn: careEn.split("\n"),
    images: images.map(({ url, alt, storagePath }) => ({ url, alt, storagePath })),
  };
}

/* ─────────────────────────────── Componente ─────────────────────────────── */

export function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: AdminProductDetail;
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && !!product;

  const [values, setValues] = useState<FormValues>(() => initialValues(product));
  const [images, setImages] = useState<FormImage[]>(() =>
    (product?.images ?? []).map((img, i) => ({ ...img, key: `${i}-${img.url}` })),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // ¿Hay cambios sin guardar? (para avisar antes de salir)
  const [dirty, setDirty] = useState(false);
  // Al crear: ¿el admin ya escribió el slug a mano?
  const [slugTouched, setSlugTouched] = useState(false);

  // Archivos subidos en ESTA visita y aún no guardados (ver encabezado).
  const sessionUploads = useRef<Set<string>>(new Set());

  /* ── Aviso del navegador si se intenta cerrar/recargar con cambios ── */
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // necesario en algunos navegadores para mostrar el aviso
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Cambia un campo (y quita su error, si tenía). */
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setDirty(true);
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Al crear, el slug sigue al nombre en español hasta que se edite a mano.
      if (key === "nameEs" && !isEdit && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
    if (errors[key]) {
      setErrors(({ [key]: _removed, ...rest }) => rest);
    }
  };

  /** Cambios en la lista de fotos (vienen de ProductImagesField). */
  const changeImages = (update: (prev: FormImage[]) => FormImage[]) => {
    setDirty(true);
    setImages(update);
  };

  /** Se quitó una foto: si se subió en esta visita, su archivo se borra ya. */
  const handleImageRemoved = (img: FormImage) => {
    if (img.storagePath && sessionUploads.current.has(img.storagePath)) {
      sessionUploads.current.delete(img.storagePath);
      void discardUploadedImages([img.storagePath]);
    }
  };

  /* ── Guardar ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = toPayload(values, images);

    // 1) Validación inmediata en el navegador.
    const check = validateProductInput(payload);
    if (!check.ok) {
      showErrors(check.fieldErrors);
      return;
    }

    // 2) Servidor (vuelve a validar y guarda).
    setSaving(true);
    const result = isEdit
      ? await updateProduct(product.id, payload)
      : await createProduct(payload);
    setSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) showErrors(result.fieldErrors);
      if (result.formError) {
        setFormError(result.formError);
        toast.error(result.formError);
      }
      return;
    }

    // 3) Guardado: los archivos subidos ya pertenecen al producto.
    sessionUploads.current.clear();
    setDirty(false);
    toast.success(isEdit ? "Cambios guardados" : "Producto creado");
    router.push("/admin/productos");
    router.refresh();
  };

  /** Muestra errores y lleva la vista al primero. */
  const showErrors = (fieldErrors: FieldErrors) => {
    setErrors(fieldErrors);
    toast.error("Revisa los campos marcados en rojo");
    // Espera a que se pinten los mensajes y desplaza la vista al primero.
    setTimeout(() => {
      document
        .querySelector("[data-field-error]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  /* ── Cancelar ── */
  const handleCancel = () => {
    if (dirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
    const pending = [...sessionUploads.current];
    sessionUploads.current.clear();
    if (pending.length > 0) void discardUploadedImages(pending);
    setDirty(false);
    router.push("/admin/productos");
  };

  // Errores de la sección de fotos ("images" o "images.0", "images.1"…).
  const imagesError = Object.entries(errors).find(([k]) => k.startsWith("images"))?.[1];

  /* ─────────────────────────────── Interfaz ─────────────────────────────── */

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10 pb-24">
      {/* Título */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/productos"
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Volver a productos
          </Link>
          <h1 className="font-serif text-2xl mt-2">
            {isEdit ? `Editar: ${product.nameEs}` : "Nuevo producto"}
          </h1>
        </div>
        {isEdit && values.isActive && (
          <Link
            href={`/productos/${product.slug}`}
            target="_blank"
            className="text-sm text-accent hover:underline"
          >
            Ver en la tienda ↗
          </Link>
        )}
      </div>

      {formError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      {/* ── Información básica ── */}
      <Section title="Información básica">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre en español" error={errors.nameEs}>
            <input
              type="text"
              value={values.nameEs}
              onChange={(e) => set("nameEs", e.target.value)}
              maxLength={120}
              placeholder="Aretes Luna"
              className={inputClass(errors.nameEs)}
            />
          </Field>
          <Field label="Nombre en inglés" error={errors.nameEn}>
            <input
              type="text"
              value={values.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              maxLength={120}
              placeholder="Luna Earrings"
              className={inputClass(errors.nameEn)}
            />
          </Field>
        </div>

        <Field
          label="Slug (dirección del producto)"
          error={errors.slug}
          hint={
            isEdit
              ? "No se puede cambiar: pedidos y carritos lo usan para identificar el producto."
              : `Se llena solo con el nombre. Quedará: /productos/${values.slug || "…"}`
          }
        >
          <input
            type="text"
            value={values.slug}
            readOnly={isEdit}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase());
            }}
            maxLength={80}
            className={cn(inputClass(errors.slug), "font-mono", isEdit && "bg-muted cursor-not-allowed")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Categoría" error={errors.category}>
            <select
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputClass(errors.category)}
            >
              <option value="">Elige…</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Material" error={errors.material}>
            <select
              value={values.material}
              onChange={(e) => set("material", e.target.value)}
              className={inputClass(errors.material)}
            >
              <option value="">Elige…</option>
              {PRODUCT_MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {MATERIAL_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Color" error={errors.color}>
            <select
              value={values.color}
              onChange={(e) => set("color", e.target.value)}
              className={inputClass(errors.color)}
            >
              <option value="">Elige…</option>
              {PRODUCT_COLORS.map((c) => (
                <option key={c} value={c}>
                  {COLOR_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Descripción ── */}
      <Section title="Descripción">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Descripción en español" error={errors.descriptionEs}>
            <textarea
              value={values.descriptionEs}
              onChange={(e) => set("descriptionEs", e.target.value)}
              rows={6}
              maxLength={5000}
              className={cn(inputClass(errors.descriptionEs), "h-auto py-2")}
            />
          </Field>
          <Field label="Descripción en inglés" error={errors.descriptionEn}>
            <textarea
              value={values.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
              rows={6}
              maxLength={5000}
              className={cn(inputClass(errors.descriptionEn), "h-auto py-2")}
            />
          </Field>
        </div>
      </Section>

      {/* ── Precio y stock ── */}
      <Section title="Precio y stock">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Precio (MXN)" error={errors.price} hint="Pesos enteros, sin centavos.">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputClass(errors.price)}
            />
          </Field>
          <Field
            label="Precio antes de oferta"
            error={errors.originalPrice}
            hint="Opcional. Se muestra tachado; debe ser mayor que el precio."
          >
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.originalPrice}
              onChange={(e) => set("originalPrice", e.target.value)}
              className={inputClass(errors.originalPrice)}
            />
          </Field>
          <Field label="Etiqueta" error={errors.badge} hint={'"Agotado" se pone sola con stock 0.'}>
            <select
              value={values.badge}
              onChange={(e) => set("badge", e.target.value)}
              className={inputClass(errors.badge)}
            >
              <option value="">Sin etiqueta</option>
              {PRODUCT_BADGES.map((b) => (
                <option key={b} value={b}>
                  {BADGE_LABELS[b]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stock (piezas)" error={errors.stock}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={9999}
              step={1}
              value={values.stock}
              onChange={(e) => set("stock", e.target.value)}
              className={inputClass(errors.stock)}
            />
          </Field>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="mt-1 h-4 w-4 accent-accent"
          />
          <span>
            <span className="text-sm font-medium">Visible en la tienda</span>
            <span className="block text-xs text-muted-foreground">
              Desmárcalo para guardarlo como borrador oculto.
            </span>
          </span>
        </label>
      </Section>

      {/* ── Fotos ── */}
      <Section title={`Fotos (${images.length}/${MAX_PRODUCT_IMAGES})`}>
        <div data-field-error={imagesError ? true : undefined}>
          <ProductImagesField
            images={images}
            onChange={changeImages}
            onUploaded={(path) => sessionUploads.current.add(path)}
            onRemoved={handleImageRemoved}
            onUploadingChange={setUploading}
            error={imagesError}
          />
        </div>
      </Section>

      {/* ── Medidas ── */}
      <Section title="Medidas (opcional)">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Field label="Largo (cm)" error={errors.lengthCm}>
            <input type="number" inputMode="decimal" min={0} step="0.1" value={values.lengthCm} onChange={(e) => set("lengthCm", e.target.value)} className={inputClass(errors.lengthCm)} />
          </Field>
          <Field label="Ancho (cm)" error={errors.widthCm}>
            <input type="number" inputMode="decimal" min={0} step="0.1" value={values.widthCm} onChange={(e) => set("widthCm", e.target.value)} className={inputClass(errors.widthCm)} />
          </Field>
          <Field label="Alto (cm)" error={errors.heightCm}>
            <input type="number" inputMode="decimal" min={0} step="0.1" value={values.heightCm} onChange={(e) => set("heightCm", e.target.value)} className={inputClass(errors.heightCm)} />
          </Field>
          <Field label="Peso (g)" error={errors.weightG}>
            <input type="number" inputMode="decimal" min={0} step="0.1" value={values.weightG} onChange={(e) => set("weightG", e.target.value)} className={inputClass(errors.weightG)} />
          </Field>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Notas de medidas en español" error={errors.dimensionNotesEs} hint='Ej. "Cadena ajustable de 40 a 45 cm".'>
            <input type="text" maxLength={300} value={values.dimensionNotesEs} onChange={(e) => set("dimensionNotesEs", e.target.value)} className={inputClass(errors.dimensionNotesEs)} />
          </Field>
          <Field label="Notas de medidas en inglés" error={errors.dimensionNotesEn}>
            <input type="text" maxLength={300} value={values.dimensionNotesEn} onChange={(e) => set("dimensionNotesEn", e.target.value)} className={inputClass(errors.dimensionNotesEn)} />
          </Field>
        </div>
      </Section>

      {/* ── Cuidados ── */}
      <Section title="Cuidados (opcional)">
        <p className="text-sm text-muted-foreground -mt-2">
          Un cuidado por línea (máximo 10). Ej. &quot;Evita el contacto con perfume&quot;.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Cuidados en español" error={errors.careInstructionsEs}>
            <textarea rows={5} value={values.careEs} onChange={(e) => set("careEs", e.target.value)} className={cn(inputClass(errors.careInstructionsEs), "h-auto py-2")} />
          </Field>
          <Field label="Cuidados en inglés" error={errors.careInstructionsEn}>
            <textarea rows={5} value={values.careEn} onChange={(e) => set("careEn", e.target.value)} className={cn(inputClass(errors.careInstructionsEn), "h-auto py-2")} />
          </Field>
        </div>
      </Section>

      {/* ── Barra fija con los botones ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-3">
          {uploading && (
            <span className="mr-auto text-xs text-muted-foreground">
              Esperando a que terminen de subirse las fotos…
            </span>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="h-10 px-4 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="h-10 px-6 rounded-md bg-accent text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ─────────────────────────────── Piezas visuales ─────────────────────────────── */

/** Clases de un campo; borde rojo si tiene error. */
function inputClass(error?: string) {
  return cn(
    "h-10 w-full px-3 rounded-md border bg-background text-sm focus:outline-none",
    error ? "border-destructive focus:border-destructive" : "border-input focus:border-ring",
  );
}

/** Bloque con título. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Etiqueta + campo + ayuda + error. */
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-field-error={error ? true : undefined}>
      <label className="block text-sm font-medium">
        {label}
        <span className="mt-1.5 block font-normal">{children}</span>
      </label>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}