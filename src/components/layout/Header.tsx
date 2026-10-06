/**
 * ============================================================================
 * HEADER — MKATALINA (Fase 13: búsqueda de productos conectada)
 * ============================================================================
 *
 * Cambio de esta etapa:
 *   - La lupa ya NO muestra un alert. Ahora abre el SearchOverlay (búsqueda
 *     de productos en vivo). Se agregó el estado `isSearchOpen` y se renderiza
 *     el overlay al final.
 *
 * Nota: la lupa sigue oculta en móvil (hidden sm:inline-flex), como estaba. La
 * búsqueda en móvil (desde el menú hamburguesa) es una mejora futura.
 *
 * El resto del header queda igual (nav de 4 categorías, logo, idioma, cuenta,
 * wishlist, carrito, detección de scroll con histéresis).
 * ============================================================================
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, Heart } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { CartButton } from "@/components/layout/CartButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

interface NavCategoryData {
  labelKey: "earrings" | "necklaces" | "bracelets" | "chokers";
  href: string;
}

const navCategoriesData: NavCategoryData[] = [
  { labelKey: "earrings", href: "/aretes" },
  { labelKey: "necklaces", href: "/collares" },
  { labelKey: "bracelets", href: "/pulseras" },
  { labelKey: "chokers", href: "/gargantillas" },
];

export function Header() {
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");

  const [isScrolled, setIsScrolled] = useState(false);
  // NUEVO: controla si el overlay de búsqueda está abierto.
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const SCROLL_DOWN_THRESHOLD = 100;
    const SCROLL_UP_THRESHOLD = 50;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        setIsScrolled((currentlyScrolled) => {
          if (currentlyScrolled && scrollY < SCROLL_UP_THRESHOLD) {
            return false;
          }
          if (!currentlyScrolled && scrollY > SCROLL_DOWN_THRESHOLD) {
            return true;
          }
          return currentlyScrolled;
        });

        ticking = false;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { itemCount: wishlistCount, requiresAuth: wishlistRequiresAuth } =
    useWishlist();
  const showWishlistBadge = !wishlistRequiresAuth && wishlistCount > 0;
  const wishlistHref = wishlistRequiresAuth
    ? "/login?redirect=/wishlist"
    : "/wishlist";

  const translatedCategories = useMemo(() => {
    return navCategoriesData.map((cat) => ({
      labelKey: cat.labelKey,
      label: tNav(cat.labelKey),
      href: cat.href,
    }));
  }, [tNav]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-sm border-b border-border py-3"
            : "bg-transparent py-6",
        )}
      >
        <Container>
          <div className="grid grid-cols-3 items-center">
            {/* COLUMNA 1: Navegación */}
            <div className="flex items-center gap-1 justify-self-start">
              <MobileNav categories={translatedCategories} />

              <nav
                className="hidden md:flex items-center gap-1"
                aria-label={tNav("shop")}
              >
                {translatedCategories.map((category) => (
                  <Link
                    key={category.labelKey}
                    href={category.href}
                    className={cn(
                      "px-4 py-2 text-xs uppercase tracking-[0.15em] font-medium",
                      "transition-colors duration-200",
                      "hover:text-accent",
                    )}
                  >
                    {category.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* COLUMNA 2: Logo */}
            <div className="justify-self-center">
              <Link
                href="/"
                aria-label={`MKatalina — ${tNav("home")}`}
                className="inline-block transition-opacity hover:opacity-70"
              >
                <Logo size={isScrolled ? "sm" : "md"} />
              </Link>
            </div>

            {/* COLUMNA 3: Iconos de acción */}
            <div className="flex items-center gap-1 justify-self-end">
              {/* Botón de búsqueda — ahora abre el overlay (oculto en móvil) */}
              <Button
                variant="ghost"
                size="icon"
                aria-label={tNav("search")}
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>

              <div className="hidden sm:inline-flex">
                <LanguageSwitcher />
              </div>

              <div className="hidden sm:inline-flex">
                <UserMenu />
              </div>

              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label={
                  showWishlistBadge
                    ? `${tHeader("wishlistLabel")} (${wishlistCount})`
                    : tHeader("wishlistLabel")
                }
                className="relative hidden sm:inline-flex"
              >
                <Link href={wishlistHref}>
                  <Heart className="h-4 w-4" />
                  {showWishlistBadge && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1",
                        "h-4 w-4 rounded-full",
                        "bg-secondary text-secondary-foreground",
                        "text-[10px] font-medium leading-none",
                        "flex items-center justify-center",
                      )}
                    >
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </Link>
              </Button>

              <CartButton />
            </div>
          </div>
        </Container>
      </header>

      {/* Overlay de búsqueda (fixed, se muestra sobre todo el sitio) */}
      <SearchOverlay
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}