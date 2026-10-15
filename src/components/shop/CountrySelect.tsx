/**
 * ============================================================================
 * COUNTRY SELECT — MKATALINA · Fase 13 · Etapa 7.1
 * ============================================================================
 *
 * Selector de país con BANDERA y BUSCADOR. Reemplaza al <select> normal
 * (que no puede mostrar imágenes dentro de sus opciones).
 *
 * Tiene dos formas (prop `variant`):
 *
 *   "country"  →  campo "País" de la dirección:
 *                  [🇲🇽 México                ▾]
 *
 *   "dial"     →  lada del teléfono (dentro de PhoneField):
 *                  [🇲🇽 +52 ▾] 669 123 4567
 *
 * Al abrirlo aparece un panel con:
 *   - Un buscador arriba. Ignora acentos y mayúsculas ("mexico" encuentra
 *     "México"), acepta el nombre en español o en inglés ("Spain" encuentra
 *     "España"), el código ("US") y la lada ("+34" o "34").
 *   - La lista de países con su bandera; México primero y separado del resto
 *     (la mayoría de las compras). En la forma "dial" cada país muestra
 *     también su lada a la derecha.
 *   - Una palomita ✓ junto al país elegido.
 *
 * Teclado (accesible, como un <select>):
 *   - En el botón: Enter, Espacio o ↓ abren la lista. Escribir una letra la
 *     abre ya filtrando por esa letra.
 *   - En el buscador: ↑/↓ mueven la opción resaltada, RePág/AvPág saltan de
 *     8 en 8, Enter elige, Esc cierra y regresa al botón, Tab cierra.
 *   - Los lectores de pantalla leen la opción resaltada (roles combobox /
 *     listbox / option + aria-activedescendant).
 *
 * Se cierra al elegir, con Esc, con Tab o al hacer clic fuera.
 *
 * El `id` se pone en el BOTÓN: así el <label htmlFor> lo nombra y el
 * checkout puede enfocarlo si hay un error (document.getElementById).
 *
 * Los países salen de getCountryOptions (src/lib/countries.ts) y las
 * banderas de CountryFlag.tsx. Lo usan AddressFields.tsx y PhoneField.tsx.
 * ============================================================================
 */

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Check, ChevronDown, Search } from "lucide-react";
// Datos internos de libphonenumber-js (ya vienen dentro de la librería, no
// suman peso): para cada lada, la lista de países que la usan, con el país
// PRINCIPAL primero. Ej. "1" → ["US", "AG", "AI", …], "44" → ["GB", "GG", …].
import phoneMetadata from "libphonenumber-js/metadata.min.json";
import { countryName, dialCode, getCountryOptions, DEFAULT_COUNTRY } from "@/lib/countries";
import { CountryFlag } from "@/components/shop/CountryFlag";
import { cn } from "@/lib/utils";

/** Textos del componente en los dos idiomas. */
const COPY = {
  es: {
    search: "Buscar país…",
    noResults: "No encontramos ese país",
    listLabel: "Países",
    dialLabel: "Lada del país",
  },
  en: {
    search: "Search country…",
    noResults: "No country found",
    listLabel: "Countries",
    dialLabel: "Country calling code",
  },
} as const;

/** ¿Este país es el principal de su lada? (EE.UU. para +1, Reino Unido para +44) */
function isMainCountryForDial(code: string, dial: string): boolean {
  const codes = (phoneMetadata.country_calling_codes as Record<string, string[]>)[dial];
  return codes?.[0] === code;
}

/** Cuántas opciones salta RePág / AvPág. */
const PAGE_JUMP = 8;

/**
 * Prepara un texto para comparar: sin acentos, en minúsculas.
 * "México" → "mexico". (NFD separa la letra de su acento y luego se borra
 * el acento.)
 */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

interface Option {
  code: string;
  name: string;
  dial: string;
  /** Nombre normalizado (sin acentos, minúsculas), para ordenar resultados. */
  nameKey: string;
  /** Todo lo que se puede buscar de este país, ya normalizado. */
  haystack: string;
}

export function CountrySelect({
  id,
  value,
  onChange,
  variant = "country",
  invalid = false,
  className,
}: {
  /** id del botón (para el <label> y para enfocarlo en errores). */
  id?: string;
  /** Código de país elegido ("MX"). */
  value: string;
  onChange: (code: string) => void;
  /** "country" = campo País; "dial" = lada del teléfono. */
  variant?: "country" | "dial";
  /** Pinta el borde de error (solo en la forma "country"). */
  invalid?: boolean;
  /** Clases extra para el contenedor. */
  className?: string;
}) {
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "es";
  const copy = COPY[lang];

  // ids únicos para conectar botón, lista y opciones (accesibilidad).
  const autoId = useId();
  const baseId = id ?? `country-${autoId}`;
  const listId = `${baseId}-list`;
  const optionId = (code: string) => `${baseId}-opt-${code}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Índice (dentro de la lista filtrada) de la opción resaltada.
  const [active, setActive] = useState(0);

  /**
   * Lista completa de países, con el texto de búsqueda ya preparado:
   * nombre en los dos idiomas + código + lada. Se calcula una vez por idioma.
   */
  const options = useMemo<Option[]>(() => {
    const otherLang = lang === "en" ? "es" : "en";
    return getCountryOptions(lang).map((c) => ({
      ...c,
      nameKey: normalize(c.name),
      haystack: normalize(
        `${c.name} ${countryName(c.code, otherLang)} ${c.code} +${c.dial}`,
      ),
    }));
  }, [lang]);

  /**
   * Países que coinciden con lo escrito (todos si no hay búsqueda), con los
   * más probables primero:
   *   0. el país PRINCIPAL de la lada escrita ("+1" → Estados Unidos;
   *      "+44" → Reino Unido);
   *   1. los demás países con esa misma lada ("+1" → Canadá, Puerto Rico…);
   *   2. el nombre EMPIEZA con lo escrito ("es" → España, Estados Unidos…);
   *   3. alguna palabra empieza con lo escrito ("unidos" → Estados Unidos);
   *   4. lo escrito aparece en medio ("m" → Alemania; "44" → Angola +244).
   * Dentro de cada grupo se respeta el orden alfabético.
   */
  const filtered = useMemo(() => {
    const q = normalize(query).replace(/^\+/, ""); // "+52" y "52" buscan igual
    if (!q) return options;
    const words = q.split(/\s+/); // varias palabras: deben aparecer todas
    const rank = (o: Option) => {
      if (o.dial === q) return isMainCountryForDial(o.code, o.dial) ? 0 : 1;
      if (o.nameKey.startsWith(q)) return 2;
      if (o.haystack.split(" ").some((part) => part.startsWith(words[0]))) return 3;
      return 4;
    };
    return options
      .filter((o) => words.every((w) => o.haystack.includes(w)))
      .map((o) => ({ o, r: rank(o) }))
      .sort((a, b) => a.r - b.r) // sort estable: conserva el orden alfabético
      .map(({ o }) => o);
  }, [options, query]);

  // Separador debajo de México solo cuando se ve la lista completa.
  const showDivider = !query && filtered[0]?.code === DEFAULT_COUNTRY;

  /** Abre el panel (opcionalmente ya con algo escrito en el buscador). */
  const openPanel = (initialQuery = "") => {
    setQuery(initialQuery);
    // Resalta el país actual (si no hay búsqueda) para que se vea de entrada.
    const index = initialQuery ? 0 : options.findIndex((o) => o.code === value);
    setActive(Math.max(index, 0));
    setOpen(true);
  };

  /** Cierra el panel; si `focusButton`, regresa el foco al botón. */
  const closePanel = (focusButton = false) => {
    setOpen(false);
    setQuery("");
    if (focusButton) buttonRef.current?.focus();
  };

  /** Elige un país y cierra. */
  const choose = (code: string) => {
    if (code !== value) onChange(code);
    closePanel(true);
  };

  // Al abrir: foco al buscador (sin brincar la página) y asegurar que el
  // panel se vea completo (útil en celulares y dentro del modal).
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Mantiene visible la opción resaltada al moverse con el teclado.
  useEffect(() => {
    if (!open) return;
    const option = filtered[active];
    if (option) {
      document.getElementById(optionId(option.code))?.scrollIntoView({ block: "nearest" });
    }
    // optionId depende solo de baseId, que no cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, filtered]);

  // Cierra al hacer clic (o tocar) fuera del componente.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /** Teclas sobre el botón cerrado. */
  const onButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openPanel();
    } else if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Escribir una letra abre la lista ya filtrando ("e" → España…).
      event.preventDefault();
      openPanel(event.key);
    }
  };

  /** Teclas dentro del buscador. */
  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const last = filtered.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "PageDown":
        event.preventDefault();
        setActive((i) => Math.min(i + PAGE_JUMP, last));
        break;
      case "PageUp":
        event.preventDefault();
        setActive((i) => Math.max(i - PAGE_JUMP, 0));
        break;
      case "Enter":
        event.preventDefault(); // no enviar ningún formulario
        if (filtered[active]) choose(filtered[active].code);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation(); // que no cierre también el modal
        closePanel(true);
        break;
      case "Tab":
        closePanel();
        break;
    }
  };

  const isDial = variant === "dial";
  const current = options.find((o) => o.code === value);

  return (
    <div ref={rootRef} className={cn("relative", isDial ? "h-full" : "w-full", className)}>
      {/* ─────────── Botón (lo que se ve cerrado) ─────────── */}
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        // En la lada no hay <label> visible: el lector de pantalla dice
        // "Lada del país, México +52".
        aria-label={isDial ? `${copy.dialLabel}: ${current?.name ?? value} +${dialCode(value)}` : undefined}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={onButtonKeyDown}
        className={cn(
          "flex items-center gap-2 text-sm cursor-pointer",
          "focus:outline-none transition-colors",
          isDial
            ? // Lada: sin borde propio (va dentro del campo de teléfono).
              "h-full pl-3 pr-2 border-r border-input rounded-l-md tabular-nums hover:bg-muted/40 focus-visible:bg-muted/40"
            : // País: se ve igual que los demás campos del formulario.
              cn(
                "w-full h-10 px-3 bg-background border rounded-md text-left",
                "focus:border-ring",
                open && "border-ring",
                invalid ? "border-destructive" : !open && "border-input",
              ),
        )}
      >
        <CountryFlag code={value} />
        {isDial ? (
          <span>+{dialCode(value)}</span>
        ) : (
          <span className="flex-1 min-w-0 truncate">{current?.name ?? value}</span>
        )}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* ─────────── Panel (buscador + lista) ─────────── */}
      {open && (
        <div
          ref={panelRef}
          // Clic en cualquier parte del panel que no sea el buscador: no le
          // quita el foco al buscador (así el teclado sigue funcionando).
          onMouseDown={(e) => {
            if (e.target !== inputRef.current) e.preventDefault();
          }}
          className={cn(
            "absolute left-0 top-full z-50 mt-1",
            isDial ? "w-72 max-w-[calc(100vw-2rem)]" : "w-full",
            "rounded-md border border-border bg-popover text-popover-foreground shadow-lg",
            "overflow-hidden",
          )}
        >
          {/* Buscador */}
          <div className="flex items-center gap-2 px-3 border-b border-border">
            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={filtered[active] ? optionId(filtered[active].code) : undefined}
              aria-label={copy.search}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder={copy.search}
              className="h-10 flex-1 min-w-0 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Lista de países */}
          <ul
            id={listId}
            role="listbox"
            aria-label={copy.listLabel}
            className="max-h-64 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                {copy.noResults}
              </li>
            )}

            {filtered.map((option, index) => {
              const selected = option.code === value;
              const highlighted = index === active;
              return (
                <li
                  key={option.code}
                  id={optionId(option.code)}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => {
                    if (!highlighted) setActive(index);
                  }}
                  onClick={() => choose(option.code)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer select-none",
                    highlighted && "bg-accent-subtle",
                    selected && "font-medium",
                    // Línea que separa a México del resto de la lista.
                    showDivider && index === 0 && "mb-1 border-b border-border pb-2.5",
                  )}
                >
                  <CountryFlag code={option.code} />
                  <span className="flex-1 min-w-0 truncate">{option.name}</span>
                  {isDial && (
                    <span className="text-xs text-muted-foreground tabular-nums">+{option.dial}</span>
                  )}
                  <Check
                    aria-hidden="true"
                    className={cn("h-4 w-4 flex-shrink-0 text-accent", !selected && "invisible")}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}