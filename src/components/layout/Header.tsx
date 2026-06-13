/**
 * ============================================================================
 * HEADER — MKATALINA (Fase 12 Turno 3B.4: mega menú bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - El array `navCategories` se refactorizó: ahora solo guarda IDs estables
 *     (labelKey, slug, hrefs, src de imagen). NO contiene textos.
 *   - Todo el contenido del mega menú (eyebrow, title, description, columnas,
 *     links, alt, ctaLabel) se construye en runtime con useTranslations dentro
 *     de un useMemo, leyendo del nuevo namespace "header.megaMenu.*".
 *   - El componente CategoryMegaMenu queda INTACTO: sigue recibiendo
 *     MegaMenuContent como prop con strings ya resueltos. Su contrato no cambia.
 *
 * Lo que NO cambia:
 *   - Toda la lógica visual del header (sticky, scroll, hoveredCategory)
 *   - El handling de wishlist con badge
 *   - El patrón de pasar `translatedCategoriesForMobile` a MobileNav
 *   - Los hrefs (siempre en español: /aretes, /aretes/minimalistas, etc.)
 *
 * ─── ARQUITECTURA DEL REFACTOR ────────────────────────────────────────
 *
 * ANTES (todo hardcoded en español):
 *   const navCategories = [
 *     {
 *       labelKey: "earrings",
 *       href: "/aretes",
 *       content: {
 *         eyebrow: "Categoría",
 *         title: "Aretes",
 *         description: "Desde minimalistas...",
 *         columns: [
 *           { title: "Por estilo", links: [
 *             { label: "Minimalistas", href: "..." },
 *             ...
 *           ]},
 *           ...
 *         ],
 *         featuredImage: { src: "...", alt: "Colección de aretes Katalina" },
 *         ctaLabel: "Ver toda la colección de aretes",
 *         ctaHref: "/aretes",
 *       }
 *     },
 *     ...
 *   ];
 *
 * AHORA (data minimal sin textos):
 *   const navCategoriesData = [
 *     {
 *       labelKey: "earrings",            // nav.earrings
 *       categoryId: "Aretes",            // product.categories.Aretes
 *       href: "/aretes",
 *       imageSrc: "/placeholder-aretes.jpg",
 *       columns: [
 *         { titleKey: "byStyle", linkGroup: "earringsStyle", links: [
 *           { linkKey: "minimalist", href: "/aretes/minimalistas" },
 *           ...
 *         ]},
 *         ...
 *       ]
 *     }
 *   ];
 *
 *   Y dentro del componente, un useMemo construye el array final
 *   resolviendo todos los textos con t().
 *
 * ─── POR QUÉ useMemo ──────────────────────────────────────────────────
 *
 * El array `navCategories` traducido depende de:
 *   - tNav (de "nav")
 *   - tMega (de "header.megaMenu")
 *   - tCategories (de "product.categories")
 *
 * Cada render del componente, estas funciones t() pueden cambiar de
 * referencia (next-intl las recrea internamente). Con useMemo:
 *   - Solo se reconstruye el array cuando cambian las funciones t
 *     (típicamente: cuando cambia el locale)
 *   - Optimiza performance evitando reconstruir 4 categorías × ~13 textos
 *     en cada hover sobre un link del header.
 *
 * ─── REUTILIZACIÓN DE NAMESPACES ──────────────────────────────────────
 *
 *   - product.categories.{Enum} → para "Aretes/Earrings", "Collares/...", etc.
 *     en title del mega menú. Misma fuente que ProductCard, breadcrumbs, etc.
 *   - nav.{earrings|necklaces|...} → para el label del link en navegación.
 *     Misma fuente que el desktop nav y MobileNav.
 *   - header.megaMenu.* → para los textos PROPIOS del mega menú: eyebrow,
 *     descriptions, columnTitles, links (estilos/largos/etc.), ctaLabel, alt.
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
 * Tipo "interno" para los datos crudos sin traducir.
 *
 * Cada categoría guarda solo los IDs estables (no traducibles) que
 * usaremos para resolver textos contra messages.json.
 *
 * - labelKey: clave bajo "nav.*" para el label del link
 * - categoryId: clave bajo "product.categories.*" para el title del mega menú
 *               y también bajo "header.megaMenu.descriptions.*"
 * - href: ruta del catálogo (siempre en español, decisión arquitectural)
 * - imageSrc: ruta del placeholder de imagen
 * - columns: array con 2 columnas. Cada una tiene:
 *     - titleKey: clave bajo "header.megaMenu.columnTitles.*"
 *     - linkGroup: clave bajo "header.megaMenu.links.*" (el grupo entero)
 *     - links: array de { linkKey, href } donde linkKey es la sub-key
 *              dentro del grupo
 */
interface NavCategoryData {
  labelKey: "earrings" | "necklaces" | "bracelets" | "chokers";
  categoryId: "Aretes" | "Collares" | "Pulseras" | "Gargantillas";
  href: string;
  imageSrc: string;
  columns: Array<{
    titleKey: "byStyle" | "byMaterial" | "byLength" | "byType" | "byOccasion";
    linkGroup: string;
    links: Array<{ linkKey: string; href: string }>;
  }>;
}

/**
 * Data CRUDA del mega menú: solo IDs y URLs. Los textos visibles se
 * resuelven dentro del componente con useTranslations.
 */
const navCategoriesData: NavCategoryData[] = [
  {
    labelKey: "earrings",
    categoryId: "Aretes",
    href: "/aretes",
    imageSrc: "/placeholder-aretes.jpg",
    columns: [
      {
        titleKey: "byStyle",
        linkGroup: "earringsStyle",
        links: [
          { linkKey: "minimalist", href: "/aretes/minimalistas" },
          { linkKey: "statement", href: "/aretes/statement" },
          { linkKey: "vintage", href: "/aretes/vintage" },
          { linkKey: "ethnic", href: "/aretes/etnicos" },
        ],
      },
      {
        titleKey: "byMaterial",
        linkGroup: "earringsMaterial",
        links: [
          { linkKey: "silver925", href: "/aretes/plata-925" },
          { linkKey: "roseGold", href: "/aretes/oro-rosa" },
          { linkKey: "surgicalSteel", href: "/aretes/acero" },
          { linkKey: "naturalStones", href: "/aretes/piedras-naturales" },
        ],
      },
    ],
  },
  {
    labelKey: "necklaces",
    categoryId: "Collares",
    href: "/collares",
    imageSrc: "/placeholder-collares.jpg",
    columns: [
      {
        titleKey: "byLength",
        linkGroup: "necklacesLength",
        links: [
          { linkKey: "choker", href: "/collares/choker" },
          { linkKey: "princess", href: "/collares/princesa" },
          { linkKey: "matinee", href: "/collares/matinee" },
          { linkKey: "long", href: "/collares/largos" },
        ],
      },
      {
        titleKey: "byStyle",
        linkGroup: "necklacesStyle",
        links: [
          { linkKey: "withPendant", href: "/collares/con-dije" },
          { linkKey: "layered", href: "/collares/capas" },
          { linkKey: "initials", href: "/collares/iniciales" },
          { linkKey: "personalized", href: "/collares/personalizados" },
        ],
      },
    ],
  },
  {
    labelKey: "bracelets",
    categoryId: "Pulseras",
    href: "/pulseras",
    imageSrc: "/placeholder-pulseras.jpg",
    columns: [
      {
        titleKey: "byType",
        linkGroup: "braceletsType",
        links: [
          { linkKey: "charms", href: "/pulseras/charms" },
          { linkKey: "bangles", href: "/pulseras/brazaletes" },
          { linkKey: "woven", href: "/pulseras/tejidas" },
          { linkKey: "chains", href: "/pulseras/cadenas" },
        ],
      },
      {
        titleKey: "byOccasion",
        linkGroup: "braceletsOccasion",
        links: [
          { linkKey: "daily", href: "/pulseras/diario" },
          { linkKey: "events", href: "/pulseras/eventos" },
          { linkKey: "personalizable", href: "/pulseras/personalizables" },
          { linkKey: "gifting", href: "/pulseras/regalo" },
        ],
      },
    ],
  },
  {
    labelKey: "chokers",
    categoryId: "Gargantillas",
    href: "/gargantillas",
    imageSrc: "/placeholder-gargantillas.jpg",
    columns: [
      {
        titleKey: "byMaterial",
        linkGroup: "chokersMaterial",
        links: [
          { linkKey: "silver925", href: "/gargantillas/plata" },
          { linkKey: "roseGold", href: "/gargantillas/oro-rosa" },
          { linkKey: "velvet", href: "/gargantillas/terciopelo" },
          { linkKey: "leather", href: "/gargantillas/cuero" },
        ],
      },
      {
        titleKey: "byStyle",
        linkGroup: "chokersStyle",
        links: [
          { linkKey: "minimalist", href: "/gargantillas/minimalistas" },
          { linkKey: "withStones", href: "/gargantillas/con-piedras" },
          { linkKey: "woven", href: "/gargantillas/tejidas" },
          { linkKey: "statement", href: "/gargantillas/statement" },
        ],
      },
    ],
  },
];

export function Header() {
  /**
   * 3 namespaces necesarios:
   *   - tNav: para "nav.{earrings|necklaces|...}" + "nav.shop" + "nav.search" + "nav.home"
   *   - tHeader: para "header.wishlistLabel" (badge del corazón)
   *   - tMega: para "header.megaMenu.*" (todo el contenido del mega menú)
   *   - tCategories: para "product.categories.{Aretes|...}" (title del mega)
   */
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");
  const tMega = useTranslations("header.megaMenu");
  const tCategories = useTranslations("product.categories");

  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  /**
   * Detección de scroll con HISTÉRESIS para evitar el "flickering" del header.
   *
   * ─── EL PROBLEMA SIN HISTÉRESIS ───────────────────────────────────────
   *
   * Si usas un solo umbral (ej. `scrollY > 80`), el header puede oscilar
   * cuando el scroll queda cerca de ese umbral. Cuando isScrolled cambia
   * de false a true, el header se acorta (py-6 → py-3) y el logo se
   * encoge (md → sm). Esto reduce la altura del header en ~24px. Como
   * el header es sticky, el contenido debajo "sube" visualmente.
   *
   * Durante la transición de 300ms, ciertos navegadores pueden disparar
   * nuevos eventos de scroll con scrollY ligeramente diferente. Si en
   * ese momento scrollY < 80, isScrolled vuelve a false → el header
   * crece otra vez → otro evento de scroll → loop infinito de titubeo.
   *
   * ─── LA SOLUCIÓN: 2 UMBRALES (HISTÉRESIS) ─────────────────────────────
   *
   * En lugar de un solo umbral, usamos DOS:
   *   - SCROLL_DOWN_THRESHOLD = 100: activar isScrolled cuando bajamos
   *     y pasamos los 100px
   *   - SCROLL_UP_THRESHOLD = 50: desactivar isScrolled cuando subimos
   *     y bajamos de los 50px
   *
   * Entre 50 y 100, NO CAMBIA NADA. Es una "zona muerta" estable.
   *
   * Es el mismo principio que usan los termostatos: no encienden a 19.99°C
   * cada vez que baja de 20°C — esperan a 19°C para encender, y se apagan
   * a 21°C. La zona entre 19 y 21 evita ciclos cortos.
   *
   * ─── OPTIMIZACIÓN: requestAnimationFrame ─────────────────────────────
   *
   * El evento `scroll` se dispara MUCHAS veces por segundo (60-120Hz
   * típico, más en monitores de alta frecuencia). Si cada disparo
   * recalcula el estado, hay trabajo desperdiciado.
   *
   * requestAnimationFrame (rAF) sincroniza la actualización con el ciclo
   * de render del navegador: solo se ejecuta UNA vez por frame. Con el
   * flag `ticking`, evitamos encolar múltiples rAFs.
   *
   * Resultado: el handler de scroll real se ejecuta ~60 veces/segundo
   * máximo, y solo cambia state cuando los umbrales se cruzan.
   * ─────────────────────────────────────────────────────────────────────
   */
  useEffect(() => {
    const SCROLL_DOWN_THRESHOLD = 50; // Bajando: activar header compacto
    const SCROLL_UP_THRESHOLD = 30;    // Subiendo: desactivar (volver a grande)

    let ticking = false;

    const handleScroll = () => {
      // Throttle con requestAnimationFrame: solo procesar 1 vez por frame
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        // Histéresis: usamos el callback functional de setState para leer
        // el valor MÁS RECIENTE de isScrolled sin necesidad de incluirlo
        // en las dependencias del useEffect.
        setIsScrolled((currentlyScrolled) => {
          if (currentlyScrolled && scrollY < SCROLL_UP_THRESHOLD) {
            // Estamos en estado scrolled Y subimos por debajo del umbral
            // → volver a estado grande
            return false;
          }
          if (!currentlyScrolled && scrollY > SCROLL_DOWN_THRESHOLD) {
            // Estamos en estado normal Y bajamos por debajo del umbral
            // → cambiar a estado compacto
            return true;
          }
          // Zona muerta entre umbrales: no cambiar nada
          return currentlyScrolled;
        });

        ticking = false;
      });
    };

    // Llamada inicial para configurar el estado correcto si la página
    // se carga con scroll ya activo (ej. usuario refresca en mitad de
    // la página).
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
   * Array completo con TEXTOS YA RESUELTOS al idioma activo.
   *
   * Para cada categoría:
   *   - label: nav.{labelKey}                    (Aretes / Earrings)
   *   - href, content.featuredImage.src: estables (no se traducen)
   *   - content.eyebrow: header.megaMenu.eyebrow ("Categoría" / "Category")
   *   - content.title: product.categories.{categoryId} (Aretes / Earrings)
   *   - content.description: header.megaMenu.descriptions.{categoryId}
   *   - content.columns: arr de {title, links}, todos resueltos
   *   - content.featuredImage.alt: header.megaMenu.imageAlt con interpolación
   *   - content.ctaLabel: header.megaMenu.ctaLabel con interpolación
   *
   * useMemo: evita reconstruir todo el array en cada render del Header
   * (que ocurre muchas veces por hover/scroll). Solo se reconstruye cuando
   * cambian las funciones t (típicamente al cambiar el locale).
   */
  const translatedCategories = useMemo(() => {
    return navCategoriesData.map((cat) => {
      // Nombre de la categoría resuelto al locale (ej. "Aretes" / "Earrings").
      // Lo usamos en title, alt y ctaLabel.
      const categoryName = tCategories(cat.categoryId);

      // Construir el content completo del mega menú
      const content: MegaMenuContent = {
        eyebrow: tMega("eyebrow"),
        title: categoryName,
        description: tMega(`descriptions.${cat.categoryId}`),
        columns: cat.columns.map((col) => ({
          title: tMega(`columnTitles.${col.titleKey}`),
          links: col.links.map((link) => ({
            // tMega("links.earringsStyle.minimalist") → "Minimalistas"/"Minimalist"
            label: tMega(`links.${col.linkGroup}.${link.linkKey}`),
            href: link.href,
          })),
        })),
        featuredImage: {
          src: cat.imageSrc,
          alt: tMega("imageAlt", { category: categoryName }),
        },
        ctaLabel: tMega("ctaLabel", { category: categoryName }),
        ctaHref: cat.href,
      };

      return {
        labelKey: cat.labelKey,
        label: tNav(cat.labelKey), // Aretes / Earrings (para el link del nav)
        href: cat.href,
        content,
      };
    });
  }, [tNav, tMega, tCategories]);

  /**
   * Array reducido para MobileNav. MobileNav espera { label, href, content }
   * sin labelKey. Lo derivamos del array completo arriba.
   */
  const translatedCategoriesForMobile = translatedCategories.map((cat) => ({
    label: cat.label,
    href: cat.href,
    content: cat.content,
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
              {translatedCategories.map((category) => (
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
                    {category.label}
                  </Link>
                </div>
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
             * Botón de búsqueda — OCULTO EN MOBILE (hidden sm:inline-flex).
             *
             * Razón: en mobile (<640px) el header tiene poco espacio
             * horizontal. El logo "MKatalina" + ícono de carrito + búsqueda
             * causaba que el botón de búsqueda cayera SOBRE las letras
             * finales del logo (colisión visual).
             *
             * Como la búsqueda todavía es un placeholder (solo muestra un
             * alert), ocultarla en mobile no afecta la funcionalidad real
             * y mejora el layout. Cuando implementemos búsqueda real (Fase
             * 13 con backend), podemos:
             *   a) Agregar un campo de búsqueda dentro del drawer mobile
             *   b) O quitar el "hidden sm:inline-flex" si decidimos
             *      que el botón debe estar visible en mobile
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

      {/* Mega-menú: renderiza el content ya traducido de la categoría hover */}
      {hoveredCategory && (
        <div
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          className="absolute left-0 right-0 top-full"
        >
          <CategoryMegaMenu
            content={
              translatedCategories.find((c) => c.labelKey === hoveredCategory)!
                .content
            }
          />
        </div>
      )}
    </header>
  );
}