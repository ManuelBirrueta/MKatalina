/**
 * ============================================================================
 * ADMIN NAV — MKATALINA · Fase 13 · Navegación del panel de administración
 * ============================================================================
 *
 * Pestañas del panel (Pedidos / Apartados / Productos) con resaltado de la
 * activa. Es un componente cliente porque usa usePathname para saber en qué
 * sección estamos. Lo muestra src/app/[locale]/admin/layout.tsx.
 *
 * usePathname (de @/i18n/navigation) devuelve la ruta SIN el prefijo de idioma,
 * así que comparamos contra "/admin", "/admin/apartados", etc.
 *
 * Cómo se decide la pestaña activa:
 *   - "Pedidos" (/admin) solo cuando la ruta es EXACTAMENTE /admin; si no,
 *     estaría activa en todas las secciones (todas empiezan con /admin).
 *   - Las demás también se activan en sus subpáginas, por ejemplo
 *     /admin/productos/nuevo sigue marcando "Productos" (Etapa 4B).
 *
 * Etapa 4A: se añadió la pestaña "Productos".
 * ============================================================================
 */

"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const COPY = {
  es: { orders: "Pedidos", reservations: "Apartados", products: "Productos" },
  en: { orders: "Orders", reservations: "Reservations", products: "Products" },
} as const;

export function AdminNav() {
  const locale = useLocale();
  const t = locale === "en" ? COPY.en : COPY.es;
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: t.orders, exact: true },
    { href: "/admin/apartados", label: t.reservations, exact: false },
    { href: "/admin/productos", label: t.products, exact: false },
  ];

  return (
    <nav className="flex gap-4 border-b border-border overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-1 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}