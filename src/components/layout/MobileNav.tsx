/**
 * ============================================================================
 * MOBILE NAV — KATALINA (actualizado con wishlist)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Importa el icono Heart y el hook useWishlist
 *   - Agrega un link "Mi wishlist" en el footer del drawer, debajo de
 *     "Iniciar sesión"
 *
 * Por qué la wishlist se muestra en el FOOTER del drawer y no junto a las
 * categorías:
 *   - Las categorías son "espacios de exploración" (descubrir productos)
 *   - La wishlist es "espacio personal" (productos ya descubiertos)
 *   - Esa separación visual entre "explorar" y "lo mío" coincide con la
 *     forma en que el usuario piensa al navegar la tienda
 * ============================================================================
 */

"use client";

import { useState } from "react";
import Link from "next/link";
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
import type { MegaMenuContent } from "@/components/layout/CategoryMegaMenu";

interface MobileNavProps {
  categories: Array<{
    label: string;
    href: string;
    content: MegaMenuContent;
  }>;
}

export function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  /**
   * Datos de la wishlist para mostrar el contador en el link móvil.
   * Como en desktop, si no hay sesión el link redirige a /login.
   */
  const { itemCount: wishlistCount, requiresAuth: wishlistRequiresAuth } =
    useWishlist();

  const wishlistHref = wishlistRequiresAuth
    ? "/login?redirect=/wishlist"
    : "/wishlist";

  // Mostrar el contador solo si hay sesión y hay items guardados
  const showWishlistCount = !wishlistRequiresAuth && wishlistCount > 0;

  const handleLinkClick = () => {
    setOpen(false);
  };

  const toggleCategory = (label: string) => {
    setExpandedCategory((current) => (current === label ? null : label));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menú de navegación"
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
            Menú de navegación principal con categorías de productos
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
                    Ver toda la colección →
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
         *
         * Aquí van los enlaces a la zona "mía" del usuario:
         *   - Iniciar sesión / Mi cuenta
         *   - Mi wishlist (NUEVO)
         *   - Selector de idioma
         *
         * Separados visualmente del menú principal con un border-top y
         * más espaciado, refuerzan la idea de "esto es tuyo, no es navegación".
         */}
        <div className="p-6 space-y-3 border-t border-border">
          {/* Iniciar sesión / Mi cuenta */}
          <Link
            href="/login"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
          >
            <User className="h-4 w-4" />
            <span>Iniciar sesión</span>
          </Link>

          {/*
           * Mi wishlist — NUEVO
           *
           * Diseño:
           *   - Mismo formato que "Iniciar sesión" (icono + label) para
           *     consistencia visual
           *   - El contador aparece a la derecha con el mismo estilo del
           *     badge desktop (rosa polvo, redondeado)
           *   - flex-1 + ml-auto en el badge: el label se queda a la izq.
           *     y el badge se va a la der., el espacio entre se distribuye solo
           */}
          <Link
            href={wishlistHref}
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
          >
            <Heart className="h-4 w-4" />
            <span>Mi wishlist</span>

            {/* Badge con el contador, solo si hay items y hay sesión */}
            {showWishlistCount && (
              <span
                className={cn(
                  "ml-auto", // Empuja el badge al lado derecho del link
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

          {/* Selector de idioma — placeholder, conexión real en Fase 4 */}
          <button
            className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
            onClick={() => {
              alert("Selector de idioma — pendiente de integrar con next-intl");
            }}
          >
            <Globe className="h-4 w-4" />
            <span>ES / EN</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}