/**
 * ============================================================================
 * ADMIN NAV — MKATALINA · Fase 13 · Navegación del panel de administración
 * ============================================================================
 *
 * Pestañas del panel (Pedidos / Apartados) con resaltado de la activa. Es un
 * componente cliente porque usa usePathname para saber en qué sección estamos.
 *
 * usePathname (de @/i18n/navigation) devuelve la ruta SIN el prefijo de idioma,
 * así que comparamos contra "/admin" y "/admin/apartados" directamente.
 * ============================================================================
 */

"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const COPY = {
  es: { orders: "Pedidos", reservations: "Apartados" },
  en: { orders: "Orders", reservations: "Reservations" },
} as const;

export function AdminNav() {
  const locale = useLocale();
  const t = locale === "en" ? COPY.en : COPY.es;
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: t.orders },
    { href: "/admin/apartados", label: t.reservations },
  ];

  return (
    <nav className="flex gap-4 border-b border-border">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-1 pb-3 text-sm font-medium border-b-2 transition-colors",
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