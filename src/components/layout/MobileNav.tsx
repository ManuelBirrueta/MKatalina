/**
 * ============================================================================
 * MOBILE NAV — MKATALINA (bilingüe completo + selector de idioma funcional)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *
 *   1) IMPORT DE Link cambia de "next/link" a "@/i18n/navigation"
 *      Razón: los links del drawer mobile no preservaban el locale al
 *      navegar. Ahora cualquier <Link href="/aretes"> automáticamente
 *      respeta /es/aretes o /en/aretes según el idioma activo.
 *
 *   2) BILINGÜE COMPLETO con useTranslations
 *      Todos los strings hardcoded ahora vienen de messages.json:
 *        - "Abrir menú de navegación" → nav.openMenu
 *        - "Menú de navegación principal..." → header.mobileNav.menuDescription
 *        - "Ver toda la colección →" → header.mobileNav.seeFullCollection
 *        - "Iniciar sesión" → header.loginLabel
 *        - "Mi wishlist" → header.wishlistLabel
 *        - "Selector de idioma — pendiente..." → eliminado, reemplazado
 *          por implementación funcional
 *
 *   3) SELECTOR DE IDIOMA FUNCIONAL (no más alert placeholder)
 *      Reemplazado el botón con alert() por un toggle "ES | EN" donde:
 *        - El idioma activo aparece en color cobre (text-accent)
 *        - El otro idioma es clickeable con hover en color cobre
 *        - Al hacer click se llama a router.replace(pathname, { locale })
 *          que es exactamente el mismo mecanismo del LanguageSwitcher desktop
 *        - El drawer se cierra automáticamente al cambiar (handleLinkClick)
 *
 * Por qué NO reutilizamos el componente <LanguageSwitcher /> desktop:
 *   El LanguageSwitcher desktop es un DROPDOWN (botón compacto + lista que
 *   aparece debajo al hacer click). En mobile dentro del drawer, abrir otro
 *   dropdown sobre el drawer es UX confusa. Mejor implementar el patrón
 *   "toggle inline" que el usuario pidió, reutilizando los hooks (useRouter,
 *   usePathname, useLocale) pero NO el JSX del LanguageSwitcher.
 *
 * Por qué el wishlist se muestra en el FOOTER del drawer:
 *   - Las categorías son "espacios de exploración" (descubrir productos)
 *   - La wishlist es "espacio personal" (productos ya descubiertos)
 *   - La separación visual refuerza la distinción entre explorar y "lo mío"
 *
 * ─── ARQUITECTURA DEL SELECTOR DE IDIOMA ───────────────────────────────
 *
 * El selector usa los mismos hooks que el LanguageSwitcher desktop:
 *
 *   - useLocale(): devuelve el locale activo ("es" o "en") para saber
 *     cuál subrayar y a cuál NO navegar (no-op si haces click en el activo).
 *
 *   - useRouter() de "@/i18n/navigation": devuelve un router que sabe
 *     manipular locales. router.replace(pathname, { locale }) hace 3 cosas:
 *       a) Convierte el pathname actual al equivalente del nuevo locale
 *          (en nuestro caso, mismas URLs ES/EN porque pathnames=undefined
 *          en routing.ts, decisión arquitectural ya tomada)
 *       b) Guarda cookie NEXT_LOCALE para futuras visitas
 *       c) Redirige al usuario sin reload completo de página
 *
 *   - usePathname() de "@/i18n/navigation": devuelve el pathname canónico
 *     sin el prefijo de locale. Ej. si estás en /es/aretes, devuelve "/aretes".
 *     Esto se le pasa a router.replace junto con { locale: "en" } para
 *     navegar a "/en/aretes".
 *
 *   - useTransition(): permite saber si el cambio está en progreso
 *     (router.replace tarda algunos ms). Durante ese tiempo deshabilitamos
 *     los botones para evitar dobles clicks.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
// IMPORTANTE: Link, useRouter, usePathname desde @/i18n/navigation
// (no de next/link ni next/navigation) para que respeten el locale activo.
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { Menu, ChevronDown, User, Globe, Heart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import type { MegaMenuContent } from "@/components/layout/CategoryMegaMenu";

interface MobileNavProps {
  categories: Array<{
    label: string;
    href: string;
    content: MegaMenuContent;
  }>;
}

export function MobileNav({ categories }: MobileNavProps) {
  /**
   * 3 namespaces de traducciones:
   *   - tNav: para "Abrir menú", links navegación, etc.
   *   - tHeader: para "Iniciar sesión", "Lista de deseos", descripciones del drawer
   *   - tLanguage: para "Cambiar idioma" (aria-label del selector)
   */
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");
  const tLanguage = useTranslations("language");

  // Hooks de i18n para el selector de idioma funcional
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Datos de wishlist (sin cambios)
  const { itemCount: wishlistCount, requiresAuth: wishlistRequiresAuth } =
    useWishlist();

  const wishlistHref = wishlistRequiresAuth
    ? "/login?redirect=/wishlist"
    : "/wishlist";

  const showWishlistCount = !wishlistRequiresAuth && wishlistCount > 0;

  /**
   * handleLinkClick — cierra el drawer cuando el usuario hace click
   * en cualquier link. Mejora UX: el drawer se cierra automáticamente
   * después de navegar.
   */
  const handleLinkClick = () => {
    setOpen(false);
  };

  const toggleCategory = (label: string) => {
    setExpandedCategory((current) => (current === label ? null : label));
  };

  /**
   * handleLanguageChange — lógica del selector de idioma.
   *
   * Si el usuario hace click en el mismo idioma activo, no hace nada
   * (early return). Si elige el otro idioma:
   *   1. startTransition() marca el cambio como pending (deshabilita botones)
   *   2. router.replace(pathname, { locale: newLocale }) navega al
   *      equivalente en el nuevo idioma manteniendo el path actual
   *   3. setOpen(false) cierra el drawer (UX: el usuario ve la página
   *      principal renderizada en el nuevo idioma)
   */
  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return; // No-op si ya es el idioma activo

    startTransition(() => {
      // pathname es el path canónico sin prefijo de locale (ej. "/aretes").
      // router.replace lo combina con el nuevo locale → "/en/aretes" o "/es/aretes"
      router.replace(pathname, { locale: newLocale });
    });

    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={tNav("openMenu")}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[85vw] sm:w-[400px] bg-background p-0 overflow-y-auto"
      >
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle asChild>
            <Link href="/" onClick={handleLinkClick} className="inline-block">
              <Logo size="sm" />
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {tHeader("mobileNav.menuDescription")}
          </SheetDescription>
        </SheetHeader>

        {/* Acordeón de categorías */}
        <nav className="flex flex-col py-4">
          {categories.map((category) => {
            const isExpanded = expandedCategory === category.label;

            return (
              <div key={category.label} className="border-b border-border">
                <button
                  onClick={() => toggleCategory(category.label)}
                  className={cn(
                    "w-full flex items-center justify-between",
                    "px-6 py-4 text-left",
                    "text-sm uppercase tracking-[0.15em] font-medium",
                    "hover:bg-muted transition-colors",
                    isExpanded && "text-accent"
                  )}
                  aria-expanded={isExpanded}
                  aria-controls={`mobile-cat-${category.label}`}
                >
                  <span>{category.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                <div
                  id={`mobile-cat-${category.label}`}
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isExpanded ? "max-h-[500px] pb-4" : "max-h-0"
                  )}
                >
                  <Link
                    href={category.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "block px-6 py-2 text-sm",
                      "text-foreground hover:text-accent transition-colors",
                      "font-medium"
                    )}
                  >
                    {tHeader("mobileNav.seeFullCollection")}
                  </Link>

                  {category.content.columns.map((column) => (
                    <div key={column.title} className="px-6 pt-4">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                        {column.title}
                      </h4>
                      <ul className="space-y-2 mb-2">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={handleLinkClick}
                              className="block py-1 text-sm text-foreground hover:text-accent transition-colors"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/*
         * ─── FOOTER DEL DRAWER: links personales ───
         */}
        <div className="p-6 space-y-3 border-t border-border">
          {/* Iniciar sesión / Mi cuenta */}
          <Link
            href="/login"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
          >
            <User className="h-4 w-4" />
            <span>{tHeader("loginLabel")}</span>
          </Link>

          {/* Mi wishlist con badge */}
          <Link
            href={wishlistHref}
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
          >
            <Heart className="h-4 w-4" />
            <span>{tHeader("wishlistLabel")}</span>

            {showWishlistCount && (
              <span
                className={cn(
                  "ml-auto",
                  "h-5 min-w-[20px] px-1.5 rounded-full",
                  "bg-secondary text-secondary-foreground",
                  "text-[10px] font-medium leading-none",
                  "flex items-center justify-center"
                )}
              >
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>

          {/*
           * ─── SELECTOR DE IDIOMA FUNCIONAL ───
           *
           * Estructura visual:
           *   🌐  ES | EN
           *      ─        (activo subrayado en cobre)
           *
           * - Icono Globe a la izquierda (consistente con desktop)
           * - Toggle "ES | EN" donde:
           *   * El idioma activo: color cobre (text-accent) + font-medium
           *   * El idioma inactivo: color foreground normal + hover cobre
           * - Aria-label descriptivo para screen readers
           * - Botones deshabilitados durante la transición (isPending)
           *
           * Implementación: cada idioma es un <button> separado dentro
           * de un div flex. Esto permite estilos independientes y
           * facilita la accesibilidad (cada idioma es su propio elemento
           * focusable).
           */}
          <div
            className="flex items-center gap-3 text-sm"
            aria-label={tLanguage("switchTo")}
          >
            <Globe className="h-4 w-4 text-foreground" aria-hidden="true" />

            {/*
             * Lista de idiomas con separador visual " | " entre ellos.
             * Generamos los botones iterando sobre routing.locales
             * para que si en el futuro agregas más idiomas (pt, fr),
             * el código no necesite cambios.
             */}
            <div className="flex items-center gap-2">
              {routing.locales.map((option, index) => {
                const isActive = option === locale;
                return (
                  <div key={option} className="flex items-center gap-2">
                    <button
                      onClick={() => handleLanguageChange(option)}
                      disabled={isPending || isActive}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "uppercase tracking-wider font-medium",
                        "transition-colors",
                        isActive
                          ? // Idioma activo: cobre, no clickeable (cursor default)
                            "text-accent cursor-default"
                          : // Idioma inactivo: foreground, clickeable con hover cobre
                            "text-foreground hover:text-accent cursor-pointer",
                        // Estado deshabilitado durante transición
                        isPending && "opacity-50"
                      )}
                    >
                      {option}
                    </button>

                    {/*
                     * Separador " | " entre idiomas (no después del último).
                     * Como solo hay 2 idiomas (es, en), aparece UN separador.
                     * Si agregaras más, el patrón sigue funcionando.
                     */}
                    {index < routing.locales.length - 1 && (
                      <span
                        className="text-muted-foreground"
                        aria-hidden="true"
                      >
                        |
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}