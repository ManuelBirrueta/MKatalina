/**
 * ============================================================================
 * HEADER — KATALINA (Fase 12 fix: arreglo de tipos MobileNav)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Construimos un array `translatedCategories` que tiene `label` (string
 *     ya traducido), no `labelKey`. Esto satisface el contrato de MobileNav
 *     que NO está internamente traducido aún.
 *   - El array original (con labelKey) se sigue usando para el nav desktop
 *     porque dentro del mismo componente tenemos acceso a tNav.
 *
 * Por qué este patrón:
 *   MobileNav es un componente "consumidor" que solo muestra los datos
 *   que le pasamos. No tiene useTranslations dentro (esa es la idea —
 *   responsabilidad única). El padre (Header) le pasa datos ya listos.
 *
 *   Una alternativa habría sido reescribir MobileNav para que también
 *   use translations, pero como no tenemos visibilidad de cómo está
 *   construido, mejor preservamos su contrato actual.
 * ============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, Heart } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import {
  CategoryMegaMenu,
  type MegaMenuContent,
} from "@/components/layout/CategoryMegaMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { CartButton } from "@/components/layout/CartButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

/**
 * Tipo "interno" usado dentro de este componente.
 *
 * labelKey se traduce en runtime al label final que se le pasa a MobileNav.
 */
interface NavCategoryInternal {
  labelKey: "earrings" | "necklaces" | "bracelets" | "chokers";
  href: string;
  content: MegaMenuContent;
}

const navCategories: NavCategoryInternal[] = [
  {
    labelKey: "earrings",
    href: "/aretes",
    content: {
      eyebrow: "Categoría",
      title: "Aretes",
      description:
        "Desde minimalistas para uso diario hasta piezas statement para ocasiones especiales.",
      columns: [
        {
          title: "Por estilo",
          links: [
            { label: "Minimalistas", href: "/aretes/minimalistas" },
            { label: "Statement", href: "/aretes/statement" },
            { label: "Vintage", href: "/aretes/vintage" },
            { label: "Étnicos", href: "/aretes/etnicos" },
          ],
        },
        {
          title: "Por material",
          links: [
            { label: "Plata 925", href: "/aretes/plata-925" },
            { label: "Oro rosa", href: "/aretes/oro-rosa" },
            { label: "Acero quirúrgico", href: "/aretes/acero" },
            { label: "Piedras naturales", href: "/aretes/piedras-naturales" },
          ],
        },
      ],
      featuredImage: {
        src: "/placeholder-aretes.jpg",
        alt: "Colección de aretes Katalina",
      },
      ctaLabel: "Ver toda la colección de aretes",
      ctaHref: "/aretes",
    },
  },
  {
    labelKey: "necklaces",
    href: "/collares",
    content: {
      eyebrow: "Categoría",
      title: "Collares",
      description:
        "Cadenas finas, dijes personalizables y collares de declaración para complementar cada outfit.",
      columns: [
        {
          title: "Por largo",
          links: [
            { label: "Choker (35-40 cm)", href: "/collares/choker" },
            { label: "Princesa (45-50 cm)", href: "/collares/princesa" },
            { label: "Matinée (55-60 cm)", href: "/collares/matinee" },
            { label: "Largos (+70 cm)", href: "/collares/largos" },
          ],
        },
        {
          title: "Por estilo",
          links: [
            { label: "Con dije", href: "/collares/con-dije" },
            { label: "Capas múltiples", href: "/collares/capas" },
            { label: "Iniciales", href: "/collares/iniciales" },
            { label: "Personalizados", href: "/collares/personalizados" },
          ],
        },
      ],
      featuredImage: {
        src: "/placeholder-collares.jpg",
        alt: "Colección de collares Katalina",
      },
      ctaLabel: "Ver toda la colección de collares",
      ctaHref: "/collares",
    },
  },
  {
    labelKey: "bracelets",
    href: "/pulseras",
    content: {
      eyebrow: "Categoría",
      title: "Pulseras",
      description:
        "Brazaletes, charms y pulseras tejidas. Combinables entre sí para crear un look único.",
      columns: [
        {
          title: "Por tipo",
          links: [
            { label: "Charms", href: "/pulseras/charms" },
            { label: "Brazaletes rígidos", href: "/pulseras/brazaletes" },
            { label: "Tejidas", href: "/pulseras/tejidas" },
            { label: "Cadenas", href: "/pulseras/cadenas" },
          ],
        },
        {
          title: "Por ocasión",
          links: [
            { label: "Uso diario", href: "/pulseras/diario" },
            { label: "Eventos", href: "/pulseras/eventos" },
            { label: "Personalizables", href: "/pulseras/personalizables" },
            { label: "Para regalar", href: "/pulseras/regalo" },
          ],
        },
      ],
      featuredImage: {
        src: "/placeholder-pulseras.jpg",
        alt: "Colección de pulseras Katalina",
      },
      ctaLabel: "Ver toda la colección de pulseras",
      ctaHref: "/pulseras",
    },
  },
  {
    labelKey: "chokers",
    href: "/gargantillas",
    content: {
      eyebrow: "Categoría",
      title: "Gargantillas",
      description:
        "Piezas que abrazan el cuello con elegancia. Diseños desde minimalistas hasta statement.",
      columns: [
        {
          title: "Por material",
          links: [
            { label: "Plata 925", href: "/gargantillas/plata" },
            { label: "Oro rosa", href: "/gargantillas/oro-rosa" },
            { label: "Terciopelo", href: "/gargantillas/terciopelo" },
            { label: "Cuero", href: "/gargantillas/cuero" },
          ],
        },
        {
          title: "Por estilo",
          links: [
            { label: "Minimalistas", href: "/gargantillas/minimalistas" },
            { label: "Con piedras", href: "/gargantillas/con-piedras" },
            { label: "Tejidas", href: "/gargantillas/tejidas" },
            { label: "Statement", href: "/gargantillas/statement" },
          ],
        },
      ],
      featuredImage: {
        src: "/placeholder-gargantillas.jpg",
        alt: "Colección de gargantillas Katalina",
      },
      ctaLabel: "Ver toda la colección de gargantillas",
      ctaHref: "/gargantillas",
    },
  },
];

export function Header() {
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");

  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
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
   * Array traducido para pasar a MobileNav.
   *
   * MobileNav espera { label: string, href, content } — NO conoce
   * traducciones. Aquí construimos esa estructura traduciendo cada
   * labelKey con tNav().
   */
  const translatedCategoriesForMobile = navCategories.map((category) => ({
    label: tNav(category.labelKey),
    href: category.href,
    content: category.content,
  }));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border py-3"
          : "bg-transparent py-6"
      )}
      onMouseLeave={() => setHoveredCategory(null)}
    >
      <Container>
        <div className="grid grid-cols-3 items-center">
          {/* COLUMNA 1: Navegación */}
          <div className="flex items-center gap-1 justify-self-start">
            <MobileNav categories={translatedCategoriesForMobile} />

            <nav
              className="hidden md:flex items-center gap-1"
              aria-label={tNav("shop")}
            >
              {navCategories.map((category) => (
                <div
                  key={category.labelKey}
                  onMouseEnter={() => setHoveredCategory(category.labelKey)}
                >
                  <Link
                    href={category.href}
                    className={cn(
                      "px-4 py-2 text-xs uppercase tracking-[0.15em] font-medium",
                      "transition-colors duration-200",
                      "hover:text-accent",
                      hoveredCategory === category.labelKey && "text-accent"
                    )}
                  >
                    {tNav(category.labelKey)}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* COLUMNA 2: Logo */}
          <div className="justify-self-center">
            <Link
              href="/"
              aria-label={`Katalina — ${tNav("home")}`}
              className="inline-block transition-opacity hover:opacity-70"
            >
              <Logo size={isScrolled ? "sm" : "md"} />
            </Link>
          </div>

          {/* COLUMNA 3: Iconos de acción */}
          <div className="flex items-center gap-1 justify-self-end">
            <Button
              variant="ghost"
              size="icon"
              aria-label={tNav("search")}
              onClick={() => {
                alert("Búsqueda — pendiente de implementar");
              }}
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

      {/* Mega-menú */}
      {hoveredCategory && (
        <div
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          className="absolute left-0 right-0 top-full"
        >
          <CategoryMegaMenu
            content={
              navCategories.find((c) => c.labelKey === hoveredCategory)!
                .content
            }
          />
        </div>
      )}
    </header>
  );
}