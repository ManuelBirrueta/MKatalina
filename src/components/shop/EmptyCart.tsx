/**
 * ============================================================================
 * EMPTY CART — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Pasa de Server a Client Component (necesario para useTranslations).
 *     El padre /carrito ya era Client, así que no hay regresión real.
 *   - import Link cambia a "@/i18n/navigation"
 *   - Título, descripción y CTA principal traducidos desde "cart.empty.*"
 *   - Las 4 pills de categorías ya no tienen labels hardcoded en español;
 *     ahora resuelven sus labels desde "product.categories.{Enum}"
 *     (mismo namespace usado en navegación, breadcrumbs, etc.)
 *
 * Lo que NO cambia:
 *   - Estructura visual: icono grande + título + descripción + CTA + 4 pills
 *   - Las RUTAS de las pills (/aretes, /collares, etc.) — las URLs son
 *     siempre en español según la decisión arquitectural del proyecto
 *     (routing.ts sin pathnames estrictas, ambos locales usan los mismos paths)
 *   - El icono ShoppingBag con strokeWidth=1
 *
 * ─── SOBRE LAS PILLS DE CATEGORÍAS ────────────────────────────────────
 *
 * Las pills son atajos visuales a las 4 categorías del sitio. Cada pill:
 *   - Tiene un id (enum: "Aretes" | "Collares" | etc.) — estable, no se traduce
 *   - Tiene un href (URL en español: /aretes, /collares, etc.) — estable
 *   - Tiene un label visible — TRADUCIDO via t("product.categories.{id}")
 *
 * Esto reutiliza el mismo namespace que ProductCard, Breadcrumb, etc.
 * Si en el futuro agregas una 5ta categoría, solo agregas la entrada
 * en messages.json y la lista aquí.
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Categorías a mostrar como atajos rápidos debajo del CTA principal.
 *
 * Cada entry tiene:
 *   - id: enum estable (mismas claves que en product.categories)
 *   - href: URL del catálogo (siempre español, regardless del locale)
 *
 * El label visible se resuelve al renderizar con t("product.categories.{id}").
 *
 * El orden refleja la jerarquía visual del menú: Aretes primero (típicamente
 * la categoría con más tráfico), luego Collares, Pulseras, Gargantillas.
 */
const categoryShortcuts = [
  { id: "Aretes", href: "/aretes" },
  { id: "Collares", href: "/collares" },
  { id: "Pulseras", href: "/pulseras" },
  { id: "Gargantillas", href: "/gargantillas" },
] as const;

export function EmptyCart() {
  /**
   * Dos namespaces:
   *   - cart.empty: título, descripción, CTA principal
   *   - product.categories: labels de las pills (Aretes/Earrings, etc.)
   */
  const t = useTranslations("cart.empty");
  const tCategories = useTranslations("product.categories");

  return (
    <div className="py-20 lg:py-24 text-center">
      {/* Icono grande en cobre, strokeWidth 1 para look delicado */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary-subtle mb-6">
        <ShoppingBag
          className="h-9 w-9 text-accent"
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>

      {/* Título principal */}
      <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
        {t("title")}
      </h2>

      {/* Mensaje invitando a explorar */}
      <p className="text-base text-muted-foreground max-w-md mx-auto mb-8">
        {t("description")}
      </p>

      {/* CTA principal — botón grande hacia el catálogo */}
      <div className="mb-8">
        <Button asChild size="lg">
          <Link href="/aretes">{t("ctaButton")}</Link>
        </Button>
      </div>

      {/*
       * Atajos rápidos a las 4 categorías como "pills" discretas.
       * Cada label se resuelve desde product.categories.{id}.
       */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categoryShortcuts.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={cn(
              "px-4 py-2 rounded-full",
              "text-xs uppercase tracking-[0.15em] font-medium",
              "border border-border",
              "text-foreground hover:border-accent hover:text-accent",
              "transition-colors"
            )}
          >
            {tCategories(cat.id)}
          </Link>
        ))}
      </div>
    </div>
  );
}