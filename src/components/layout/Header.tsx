/**
 * ============================================================================
 * HEADER — MKATALINA (simplificado: sin mega menú)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *
 *   1) ELIMINADO el mega menú desktop:
 *      - state `hoveredCategory` removido
 *      - handlers onMouseEnter/onMouseLeave removidos
 *      - renderizado de <CategoryMegaMenu /> al final del JSX removido
 *      - import de CategoryMegaMenu y MegaMenuContent removidos
 *
 *   2) SIMPLIFICADO el array de categorías:
 *      Antes: cada categoría tenía { labelKey, label, href, content }
 *      Ahora: cada categoría tiene { labelKey, label, href }
 *      Se eliminó la construcción del `content` con eyebrow, columns,
 *      featuredImage, ctaLabel — todo ese código se fue.
 *
 *   3) ELIMINADO el namespace tMega ("header.megaMenu") en este archivo:
 *      Las traducciones del mega menú siguen existiendo en messages.json
 *      por si en el futuro decides reintroducir el feature, pero este
 *      componente ya no las consume.
 *
 * Por qué este cambio:
 *   Los sub-links del mega menú (/aretes/minimalistas, /collares/choker,
 *   etc.) apuntaban a páginas que NO existen → llevaban a 404. Mejor
 *   eliminar el feature visualmente hasta implementar las sub-páginas
 *   reales (Fase futura con backend).
 *
 *   El nav desktop ahora es una fila simple de 4 links: cada link va
 *   directamente a la página de la categoría. Más simple, más honesto.
 *
 * Lo que NO cambia:
 *   - Detección de scroll con histéresis (fix anterior)
 *   - Logo responsive (md = text-xl en mobile, text-3xl en desktop)
 *   - Botón de búsqueda oculto en mobile
 *   - Toda la columna derecha (search, LanguageSwitcher, UserMenu, wishlist, cart)
 *   - Bilingüe completo
 *
 * ─── ARCHIVO HUÉRFANO ─────────────────────────────────────────────────
 *
 * El componente CategoryMegaMenu.tsx ya NO se usa desde aquí (era el
 * único lugar). Sigue existiendo en el filesystem por si en el futuro
 * reintroducimos el mega menú. No se elimina automáticamente porque:
 *   1. Es código probado que ya funciona — borrarlo y reescribirlo
 *      después sería desperdicio
 *   2. Next.js hace tree-shaking: si nadie lo importa, no se incluye
 *      en el bundle de producción. No afecta el tamaño del sitio.
 *
 * Las claves de traducción header.megaMenu.* en messages.json también
 * siguen existiendo. Misma razón: no estorban si no se usan.
 * ─────────────────────────────────────────────────────────────────────
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
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

/**
 * Data CRUDA de las categorías del nav.
 *
 * Cada categoría tiene solo lo mínimo necesario:
 *   - labelKey: clave bajo "nav.*" para resolver el label al locale activo
 *   - href: ruta del catálogo (siempre en español, decisión arquitectural)
 *
 * Antes este array también tenía `categoryId`, `imageSrc`, `columns` para
 * construir el mega menú. Todo eso se eliminó porque ya no hay mega menú.
 */
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
  /**
   * 2 namespaces necesarios (antes eran 4):
   *   - tNav: para "nav.{earrings|...}" + "nav.shop" + "nav.search" + "nav.home"
   *   - tHeader: para "header.wishlistLabel"
   *
   * Eliminados (porque ya no se usan):
   *   - tMega ("header.megaMenu") — el mega menú se quitó
   *   - tCategories ("product.categories") — solo se usaba para el title
   *     y alt del mega menú, ahora innecesario
   */
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");

  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Detección de scroll con HISTÉRESIS (sin cambios respecto al fix anterior).
   * Ver fix-scroll-glitch para explicación completa.
   */
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

  /**
   * Array de categorías con LABELS YA RESUELTOS al idioma activo.
   *
   * Antes este useMemo era mucho más complejo (construía todo el `content`
   * del mega menú con 13+ traducciones por categoría). Ahora solo resuelve
   * el label (ej. "Aretes"/"Earrings") y el href se queda como está.
   *
   * useMemo evita reconstruir el array en cada render del Header. Solo
   * se reconstruye cuando cambia tNav (típicamente al cambiar el locale).
   */
  const translatedCategories = useMemo(() => {
    return navCategoriesData.map((cat) => ({
      labelKey: cat.labelKey,
      label: tNav(cat.labelKey),
      href: cat.href,
    }));
  }, [tNav]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border py-3"
          : "bg-transparent py-6"
      )}
    >
      <Container>
        <div className="grid grid-cols-3 items-center">
          {/* COLUMNA 1: Navegación */}
          <div className="flex items-center gap-1 justify-self-start">
            <MobileNav categories={translatedCategories} />

            {/*
             * Nav desktop simple: 4 links directos a las páginas de categorías.
             * Sin onMouseEnter ni dropdown — los hover effects siguen siendo
             * de color via CSS (hover:text-accent).
             */}
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
                    "hover:text-accent"
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
            {/*
             * Botón de búsqueda — OCULTO EN MOBILE (fix anterior).
             */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={tNav("search")}
              onClick={() => {
                alert("Búsqueda — pendiente de implementar");
              }}
              className="hidden sm:inline-flex"
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
                      "flex items-center justify-center"
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

      {/*
       * ── ELIMINADO: renderizado del mega menú ───────────────────────
       *
       * Antes aquí había:
       *
       *   {hoveredCategory && (
       *     <div className="absolute left-0 right-0 top-full">
       *       <CategoryMegaMenu content={...} />
       *     </div>
       *   )}
       *
       * Removido porque los sub-links del mega menú (/aretes/minimalistas,
       * /collares/choker, etc.) llevaban a 404. Si en el futuro implementas
       * esas sub-páginas, reintroducir el mega menú es trivial: restaurar
       * navCategoriesData con columns, el useMemo con el content completo,
       * y este bloque de renderizado.
       * ─────────────────────────────────────────────────────────────
       */}
    </header>
  );
}