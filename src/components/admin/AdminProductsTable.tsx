/**
 * ============================================================================
 * ADMIN PRODUCTS TABLE — MKATALINA · Fase 13 · Etapas 4A y 4B
 * ============================================================================
 *
 * Tabla del panel de productos (solo español). La usa la página
 * src/app/[locale]/admin/productos/page.tsx, que le pasa la lista inicial ya
 * leída de la base.
 *
 * Qué permite hacer, sin salir de la lista:
 *   - BUSCAR por nombre o slug, y FILTRAR por categoría y por visibilidad.
 *   - Cambiar el STOCK: se escribe el número y se guarda con Enter o al salir
 *     del campo (Esc deshace lo escrito).
 *   - OCULTAR / MOSTRAR un producto en la tienda.
 *   - ELIMINAR, con confirmación. El servidor decide (regla acordada):
 *       · nunca se vendió ni se apartó → se borra por completo;
 *       · ya tuvo ventas o apartados   → solo se oculta.
 *
 * Cada acción llama a una Server Action de src/actions/admin-products.ts y,
 * si sale bien, actualiza la fila aquí mismo (sin recargar la página). Si
 * falla, se muestra el error y la fila queda como estaba.
 *
 * Stock vs. disponible: "stock" son las piezas físicas. Los apartados activos
 * bloquean piezas sin descontarlas, así que la tienda ofrece
 * disponible = stock − apartadas. Se muestran ambos para que no confunda.
 *
 * Etapa 4B: botón "Nuevo producto" (→ /admin/productos/nuevo) y "Editar"
 * en cada fila (→ /admin/productos/<id>), que abren el formulario
 * ProductForm.tsx. El nombre del producto también lleva a editarlo.
 * ============================================================================
 */

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import {
  deleteProduct,
  setProductActive,
  updateProductStock,
  type AdminProductRow,
} from "@/actions/admin-products";
import { PRODUCT_CATEGORIES } from "@/lib/product-schema";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Filtro de visibilidad. */
type VisibilityFilter = "todos" | "visibles" | "ocultos";

/** Quita acentos y pasa a minúsculas, para que "rocio" encuentre "Rocío". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function AdminProductsTable({
  initialProducts,
}: {
  initialProducts: AdminProductRow[];
}) {
  // La lista vive aquí para poder actualizar filas sin recargar.
  const [products, setProducts] = useState(initialProducts);

  // Filtros.
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("todas");
  const [visibility, setVisibility] = useState<VisibilityFilter>("todos");

  // Qué fila está guardando algo (para desactivar sus botones mientras tanto).
  const [busyId, setBusyId] = useState<string | null>(null);
  // Qué fila está pidiendo confirmación para eliminar.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /** Cambia los datos de una fila en la lista local. */
  const patchRow = (id: string, changes: Partial<AdminProductRow>) =>
    setProducts((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );

  /* ───────────── Lista filtrada (se recalcula solo si cambia algo) ───────────── */
  const visibleRows = useMemo(() => {
    const q = normalize(query.trim());
    return products.filter((p) => {
      if (category !== "todas" && p.category !== category) return false;
      if (visibility === "visibles" && !p.isActive) return false;
      if (visibility === "ocultos" && p.isActive) return false;
      if (q && !normalize(`${p.nameEs} ${p.slug}`).includes(q)) return false;
      return true;
    });
  }, [products, query, category, visibility]);

  /* ───────────── Acciones ───────────── */

  /** Guarda un stock nuevo. Devuelve true si se guardó. */
  const handleStockSave = async (row: AdminProductRow, value: number) => {
    if (value === row.stock) return true;
    setBusyId(row.id);
    const res = await updateProductStock(row.id, value);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo actualizar el stock");
      return false;
    }
    patchRow(row.id, { stock: value });
    toast.success(`Stock de "${row.nameEs}": ${value}`);
    return true;
  };

  /** Oculta o vuelve a mostrar el producto en la tienda. */
  const handleToggleActive = async (row: AdminProductRow) => {
    const next = !row.isActive;
    setBusyId(row.id);
    const res = await setProductActive(row.id, next);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo cambiar la visibilidad");
      return;
    }
    patchRow(row.id, { isActive: next });
    toast.success(next ? "Producto visible en la tienda" : "Producto oculto de la tienda");
  };

  /** Elimina (o, si ya tuvo ventas, oculta) el producto. */
  const handleDelete = async (row: AdminProductRow) => {
    setConfirmDeleteId(null);
    setBusyId(row.id);
    const res = await deleteProduct(row.id);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar el producto");
      return;
    }
    if (res.mode === "deleted") {
      setProducts((rows) => rows.filter((r) => r.id !== row.id));
      toast.success(`"${row.nameEs}" se eliminó del catálogo`);
    } else {
      patchRow(row.id, { isActive: false });
      toast.info(
        `"${row.nameEs}" ya tiene ventas o apartados: se ocultó de la tienda en lugar de borrarse.`,
      );
    }
  };

  /* ───────────── Interfaz ───────────── */

  const hiddenCount = products.filter((p) => !p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Encabezado con conteo y botón para crear */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} en total · {products.length - hiddenCount} visibles ·{" "}
            {hiddenCount} ocultos
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex h-10 items-center px-4 rounded-md bg-accent text-sm font-medium text-white hover:opacity-90"
        >
          + Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o slug…"
          className="h-10 flex-1 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:border-ring"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 px-2 rounded-md border border-input bg-background text-sm cursor-pointer"
          aria-label="Filtrar por categoría"
        >
          <option value="todas">Todas las categorías</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as VisibilityFilter)}
          className="h-10 px-2 rounded-md border border-input bg-background text-sm cursor-pointer"
          aria-label="Filtrar por visibilidad"
        >
          <option value="todos">Visibles y ocultos</option>
          <option value="visibles">Solo visibles</option>
          <option value="ocultos">Solo ocultos</option>
        </select>
      </div>

      {visibleRows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">
          {products.length === 0
            ? "Aún no hay productos en el catálogo."
            : "Ningún producto coincide con los filtros."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Producto</th>
                <th className="py-3 pr-4 font-medium">Categoría</th>
                <th className="py-3 pr-4 font-medium text-right">Precio</th>
                <th className="py-3 pr-4 font-medium">Stock</th>
                <th className="py-3 pr-4 font-medium">Tienda</th>
                <th className="py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const busy = busyId === row.id;
                const available = Math.max(0, row.stock - row.reserved);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/60 hover:bg-muted/40",
                      !row.isActive && "opacity-60",
                    )}
                  >
                    {/* Foto + nombre + slug */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        {row.mainImage ? (
                          // <img> simple: miniatura de 48 px, no hace falta optimizarla.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.mainImage}
                            alt=""
                            className="h-12 w-12 rounded object-cover bg-muted shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted shrink-0" />
                        )}
                        <div>
                          <Link
                            href={`/admin/productos/${row.id}`}
                            className="font-medium hover:text-accent hover:underline"
                          >
                            {row.nameEs}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">
                            {row.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-4 whitespace-nowrap">{row.category}</td>

                    {/* Precio (y el anterior tachado si está en oferta) */}
                    <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                      <div>{formatPrice(row.price)}</div>
                      {row.originalPrice !== null && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatPrice(row.originalPrice)}
                        </div>
                      )}
                    </td>

                    {/* Stock editable */}
                    <td className="py-3 pr-4">
                      <StockInput
                        // key con el stock: si el valor guardado cambia, el
                        // campo se reinicia con el nuevo número.
                        key={`${row.id}-${row.stock}`}
                        initial={row.stock}
                        disabled={busy}
                        onSave={(value) => handleStockSave(row, value)}
                      />
                      <div className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">
                        {row.reserved > 0
                          ? `${row.reserved} apartada(s) · ${available} disponible(s)`
                          : row.stock === 0
                            ? "Agotado"
                            : `${available} disponible(s)`}
                      </div>
                    </td>

                    {/* Visible / oculto */}
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(row)}
                        disabled={busy}
                        className={cn(
                          "px-3 h-8 rounded-full text-xs font-medium border transition-colors whitespace-nowrap disabled:opacity-50",
                          row.isActive
                            ? "border-accent text-accent hover:bg-accent/10"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                        title={row.isActive ? "Clic para ocultar" : "Clic para mostrar"}
                      >
                        {row.isActive ? "Visible" : "Oculto"}
                      </button>
                    </td>

                    {/* Editar y eliminar (eliminar pide confirmación en la misma fila) */}
                    <td className="py-3 text-right whitespace-nowrap">
                      {confirmDeleteId === row.id ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-xs">¿Eliminar?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="px-3 h-8 rounded-md text-xs font-medium bg-destructive text-white hover:opacity-90"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 h-8 rounded-md text-xs border border-border hover:bg-muted"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/productos/${row.id}`}
                            className="inline-flex items-center px-3 h-8 rounded-md text-xs border border-border hover:bg-muted"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(row.id)}
                            disabled={busy}
                            className="px-3 h-8 rounded-md text-xs text-destructive border border-destructive/40 hover:bg-destructive/10 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Al eliminar: si el producto nunca se vendió ni se apartó, se borra por
        completo (con sus fotos). Si ya tuvo ventas o apartados, solo se oculta
        para conservar el historial de pedidos.
      </p>
    </div>
  );
}

/* ─────────────────────────────── Campo de stock ─────────────────────────────── */

/**
 * Campo numérico que guarda con Enter o al salir del campo. Esc vuelve al
 * valor guardado. Si el texto no es un entero entre 0 y 9999, se avisa y se
 * restaura el valor anterior.
 */
function StockInput({
  initial,
  disabled,
  onSave,
}: {
  initial: number;
  disabled: boolean;
  onSave: (value: number) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(String(initial));

  const commit = async () => {
    const value = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(value) || value < 0 || value > 9999) {
      toast.error("El stock debe ser un número entero entre 0 y 9999");
      setDraft(String(initial));
      return;
    }
    const saved = await onSave(value);
    if (!saved) setDraft(String(initial));
  };

  return (
    <input
      type="number"
      min={0}
      max={9999}
      step={1}
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur(); // blur → commit
        if (e.key === "Escape") {
          setDraft(String(initial));
          // Se espera un instante para que el blur use el valor restaurado.
          const el = e.currentTarget;
          setTimeout(() => el.blur(), 0);
        }
      }}
      className="h-9 w-20 px-2 rounded-md border border-input bg-background text-sm tabular-nums focus:outline-none focus:border-ring disabled:opacity-50"
      aria-label="Stock"
    />
  );
}