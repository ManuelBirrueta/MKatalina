/**
 * ============================================================================
 * SEARCH OVERLAY — MKATALINA · Fase 13 · Búsqueda de productos
 * ============================================================================
 *
 * Capa de búsqueda que se abre desde la lupa del header. Búsqueda 100% en el
 * navegador sobre el catálogo: instantánea, sin ir al servidor en cada tecla.
 *
 * CAMBIO DE LA ETAPA 3B:
 *   - Los productos ya no salen de productsData (código) sino de useCatalog():
 *     el catálogo VISIBLE que el layout lee de la base. Un producto agregado
 *     desde el panel aparece en la búsqueda; uno retirado, desaparece.
 *   - La miniatura muestra la FOTO real cuando el producto la tiene (las que
 *     se suben al bucket de Supabase). Si es un placeholder, sigue mostrando
 *     la inicial de la categoría, como antes.
 *
 * QUÉ BUSCA (y cómo)
 * ------------------
 * Arma un "texto de búsqueda" por producto: nombre es + nombre en + categoría +
 * material + color. Al comparar:
 *   - Ignora acentos: "rocio" encuentra "Rocío".
 *   - Convierte guiones en espacios: "oro rosa" encuentra "oro-rosa".
 *   - Busca POR PALABRAS: el producto debe contener TODAS las palabras, en
 *     cualquier orden ("oro rosa" y "rosa oro" dan lo mismo).
 *
 * Los textos de la interfaz van en un objeto {es, en} aquí mismo (autónomo).
 * ============================================================================
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, X } from "lucide-react";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { getLocalized } from "@/lib/i18n-helpers";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

const COPY = {
  es: {
    placeholder: "Buscar productos…",
    hint: "Escribe para buscar aretes, collares, pulseras…",
    noResults: "No se encontraron productos para",
    one: "resultado",
    many: "resultados",
    close: "Cerrar búsqueda",
  },
  en: {
    placeholder: "Search products…",
    hint: "Type to search earrings, necklaces, bracelets…",
    noResults: "No products found for",
    one: "result",
    many: "results",
    close: "Close search",
  },
} as const;

/**
 * Normaliza texto para comparar:
 *   - minúsculas
 *   - sin acentos
 *   - guiones/guiones bajos → espacios (para que "oro rosa" == "oro-rosa")
 *   - espacios colapsados
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const locale = useLocale() as Locale;
  const t = locale === "en" ? COPY.en : COPY.es;

  // Catálogo visible (de la base, vía el layout).
  const { products } = useCatalog();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!trimmed) return [];
    // Cada palabra de la búsqueda debe estar en el producto (en cualquier orden).
    const tokens = normalize(trimmed).split(" ").filter(Boolean);
    if (tokens.length === 0) return [];
    return products.filter((product) => {
      const haystack = normalize(
        `${product.name.es} ${product.name.en} ${product.category} ${product.material} ${product.color}`,
      );
      return tokens.every((token) => haystack.includes(token));
    });
  }, [trimmed, products]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={t.placeholder}
    >
      {/* Fondo semitransparente: clic para cerrar */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative mx-auto mt-20 w-[92%] max-w-2xl">
        <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {/* Fila del campo de búsqueda */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.placeholder}
              className={cn(
                "flex-1 h-14 bg-transparent",
                "text-base outline-none",
                "placeholder:text-muted-foreground",
              )}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Resultados */}
          <div className="max-h-[60vh] overflow-y-auto">
            {trimmed === "" ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                {t.hint}
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                {t.noResults}{" "}
                <strong className="text-foreground">&ldquo;{trimmed}&rdquo;</strong>
              </p>
            ) : (
              <>
                <p className="px-4 pt-3 pb-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {results.length} {results.length === 1 ? t.one : t.many}
                </p>
                <ul className="pb-2">
                  {results.map((product) => {
                    const image = product.images[0];
                    // Foto real = existe y no es uno de los placeholders locales.
                    const hasRealImage =
                      !!image && !image.src.startsWith("/placeholder");
                    const productName = getLocalized(product.name, locale);

                    return (
                      <li key={product.id}>
                        <Link
                          href={product.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3",
                            "hover:bg-muted transition-colors",
                          )}
                        >
                          {/* Miniatura: foto real o inicial de la categoría */}
                          <div className="relative w-12 h-14 flex-shrink-0 bg-secondary-subtle overflow-hidden">
                            {hasRealImage ? (
                              <Image
                                src={image.src}
                                alt={image.alt || productName}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {product.category[0]}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {productName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.category}
                            </p>
                          </div>

                          <p className="text-sm font-medium tabular-nums whitespace-nowrap">
                            {formatPrice(product.price)}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}