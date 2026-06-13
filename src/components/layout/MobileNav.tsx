/**
 * ============================================================================
 * MOBILE NAV — MKATALINA (simplificado: sin acordeón)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *
 *   1) ELIMINADO el acordeón expandible de categorías:
 *      - state `expandedCategory` removido
 *      - función `toggleCategory` removida
 *      - El JSX del acordeón (ChevronDown rotativo, animación de altura,
 *        sub-columnas con sub-links) reemplazado por links directos
 *
 *   2) SIMPLIFICADA la prop categories:
 *      Antes: { label, href, content: MegaMenuContent }
 *      Ahora: { label, href }
 *      Se eliminó la dependencia del tipo MegaMenuContent.
 *
 *   3) ELIMINADO el texto "Ver toda la colección →":
 *      Como cada categoría ahora es UN solo link directo, ya no se necesita
 *      este texto que existía DENTRO del acordeón expandido.
 *      Las claves header.mobileNav.seeFullCollection siguen en messages.json
 *      por si en el futuro reintroducimos el acordeón.
 *
 *   4) ELIMINADO el import ChevronDown:
 *      Era el chevron del acordeón. Ya no se usa.
 *
 * Por qué este cambio:
 *   Los sub-links del acordeón (/aretes/minimalistas, /collares/choker,
 *   etc.) llevaban a 404 porque esas sub-páginas no existen. En lugar de
 *   tener acordeones que se expanden a links rotos, ahora cada categoría
 *   es un link directo a su página principal (/aretes, /collares, etc.).
 *
 * Lo que NO cambia:
 *   - Bilingüe completo (useTranslations en todos los strings)
 *   - Selector de idioma funcional (toggle ES | EN)
 *   - Footer del drawer: Iniciar sesión + Mi wishlist + Selector de idioma
 *   - Imports de Link, useRouter, usePathname desde @/i18n/navigation
 *   - Logo + título del drawer
 *
 * ─── ARCHIVO HUÉRFANO ─────────────────────────────────────────────────
 *
 * Igual que en Header.tsx, este componente ya NO consume el tipo
 * MegaMenuContent. CategoryMegaMenu.tsx queda como archivo huérfano
 * (existe en el filesystem pero nadie lo importa). No se elimina.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { Menu, User, Globe, Heart } from "lucide-react";
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

/**
 * Props simplificadas: cada categoría solo necesita label + href.
 *
 * Antes había una tercera prop `content: MegaMenuContent` con la data
 * del acordeón expandible. Removida porque ya no hay acordeón.
 */
interface MobileNavProps {
  categories: Array<{
    label: string;
    href: string;
  }>;
}

export function MobileNav({ categories }: MobileNavProps) {
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");
  const tLanguage = useTranslations("language");

  // Hooks para el selector de idioma funcional (sin cambios)
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);

  // Datos de wishlist (sin cambios)
  const { itemCount: wishlistCount, requiresAuth: wishlistRequiresAuth } =
    useWishlist();

  const wishlistHref = wishlistRequiresAuth
    ? "/login?redirect=/wishlist"
    : "/wishlist";

  const showWishlistCount = !wishlistRequiresAuth && wishlistCount > 0;

  /**
   * handleLinkClick — cierra el drawer cuando el usuario hace click en
   * cualquier link. Mejora UX: el drawer no queda abierto después de navegar.
   */
  const handleLinkClick = () => {
    setOpen(false);
  };

  /**
   * handleLanguageChange — lógica del selector de idioma (sin cambios).
   */
  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
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

        {/*
         * Nav simplificado: cada categoría es UN solo link directo a su
         * página principal. Sin acordeón, sin sub-links.
         *
         * Estilo: cada link ocupa una fila completa del drawer con
         * padding generoso (px-6 py-4) para que sea fácil tocar en mobile.
         * border-b separa las categorías visualmente.
         */}
        <nav className="flex flex-col py-4">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              onClick={handleLinkClick}
              className={cn(
                "block px-6 py-4",
                "text-sm uppercase tracking-[0.15em] font-medium",
                "border-b border-border",
                "hover:bg-muted hover:text-accent",
                "transition-colors"
              )}
            >
              {category.label}
            </Link>
          ))}
        </nav>

        {/* Footer del drawer: links personales (sin cambios) */}
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

          {/* Selector de idioma: toggle ES | EN funcional */}
          <div
            className="flex items-center gap-3 text-sm"
            aria-label={tLanguage("switchTo")}
          >
            <Globe className="h-4 w-4 text-foreground" aria-hidden="true" />

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
                          ? "text-accent cursor-default"
                          : "text-foreground hover:text-accent cursor-pointer",
                        isPending && "opacity-50"
                      )}
                    >
                      {option}
                    </button>

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