/**
 * ============================================================================
 * LANGUAGE SWITCHER — KATALINA
 * ============================================================================
 *
 * Componente que permite al usuario cambiar entre español e inglés.
 *
 * Anatomía visual (cerrado):
 *
 *   ┌──────────┐
 *   │ ES  ▾   │   ← botón compacto con código de idioma actual
 *   └──────────┘
 *
 * Anatomía abierta (dropdown):
 *
 *   ┌──────────┐
 *   │ ES  ▾   │
 *   ├──────────┤
 *   │ Español │   ← idioma actual (checkmark)
 *   │ English │   ← otro idioma disponible
 *   └──────────┘
 *
 * Cómo funciona el cambio de idioma:
 *   1. Usuario hace clic en el botón → dropdown se abre
 *   2. Usuario selecciona "English"
 *   3. Llamamos a router.replace(pathname, { locale: "en" })
 *   4. next-intl:
 *      - Convierte el path actual al equivalente en inglés según routing.ts
 *        (ej. /es/aretes → /en/earrings)
 *      - Guarda cookie con la preferencia para futuras visitas
 *      - Redirige al usuario
 *
 * Por qué Client Component:
 *   Necesita useRouter, usePathname, useLocale — todos hooks de cliente.
 *
 * Por qué dropdown y no toggle simple:
 *   Aunque solo tenemos 2 idiomas, el patrón de dropdown es escalable
 *   (si agregamos pt-BR, fr, etc., el componente no necesita cambios).
 *   También deja claro al usuario cuál es el idioma actual.
 *
 * Accesibilidad:
 *   - Botón con aria-label descriptivo
 *   - Cierre con Escape
 *   - Cierre al hacer clic fuera
 *   - Foco visible en cada opción
 *   - Anuncio del idioma actual con aria-current
 *
 * Sobre el código de idioma mostrado:
 *   Mostramos el código en uppercase (ES, EN) en el botón cerrado para
 *   compacidad. Algunos sitios usan banderitas (🇪🇸 🇺🇸) pero las banderas
 *   son problemáticas: una bandera = un país, no un idioma. Español se
 *   habla en 20+ países, inglés en 50+. Mejor usar códigos textuales.
 * ============================================================================
 */

"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { ChevronDown, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";

/**
 * Mapeo de códigos de idioma a nombres "mostrables".
 * Las claves vienen de routing.locales para que TypeScript valide consistencia.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
};

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * useTransition nos permite saber si el cambio de idioma está en progreso.
   * router.replace puede tardar unos ms en redirigir; durante ese tiempo
   * el botón se deshabilita visualmente.
   */
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * handleLanguageChange — cambia el locale y redirige.
   *
   * router.replace con `{ locale }` le dice a next-intl que mantenga el
   * pathname pero cambie el locale. Si estamos en /es/aretes y cambiamos
   * a "en", next-intl resuelve a /en/earrings (porque /aretes está mapeado
   * a /earrings en routing.ts).
   */
  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      // pathname es el path canónico, ej. "/aretes"
      // router.replace con { locale } regenera la URL con el nuevo locale
      // y la pathname localizada correspondiente
      router.replace(pathname, { locale: newLocale });
    });

    setIsOpen(false);
  };

  /**
   * Cerrar dropdown al hacer clic fuera o presionar Escape.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/*
       * BOTÓN PRINCIPAL (cerrado).
       *
       * Muestra el código del idioma actual en uppercase + chevron.
       * Estilo minimalista para integrarse con el resto del header.
       */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        aria-label={t("switchTo")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex items-center gap-1.5",
          "px-2.5 py-1.5 rounded-md",
          "text-xs font-medium uppercase tracking-wider",
          "text-foreground hover:text-accent hover:bg-muted/50",
          "transition-colors cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{locale}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/*
       * DROPDOWN (abierto).
       *
       * Aparece debajo del botón. Lista de idiomas disponibles con
       * checkmark en el actual.
       */}
      {isOpen && (
        <ul
          role="listbox"
          aria-label={t("currentLanguage")}
          className={cn(
            "absolute right-0 top-full mt-2",
            "min-w-[140px]",
            "bg-background border border-border rounded-md",
            "shadow-lg overflow-hidden",
            "z-50",
            "animate-in fade-in zoom-in-95 duration-150"
          )}
        >
          {routing.locales.map((option) => {
            const isCurrent = option === locale;
            return (
              <li key={option} role="none">
                <button
                  role="option"
                  aria-selected={isCurrent}
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={() => handleLanguageChange(option)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3",
                    "px-3 py-2 text-sm",
                    "transition-colors cursor-pointer",
                    isCurrent
                      ? "bg-accent-subtle/50 text-accent font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span>{LANGUAGE_LABELS[option]}</span>
                  {isCurrent && (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}