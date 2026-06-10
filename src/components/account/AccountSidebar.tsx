/**
 * ============================================================================
 * ACCOUNT SIDEBAR — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link cambia de "next/link" a "@/i18n/navigation"
 *   - import useRouter y usePathname cambian a "@/i18n/navigation"
 *     (mantiene el prefijo de locale al navegar y comparar rutas)
 *   - Agregado useTranslations con namespace accountSidebar
 *   - Saludo "Hola, {firstName}" traducido con interpolación
 *   - Items del nav (Mi perfil, Mi wishlist, Mis apartados, Mis pedidos)
 *     traducidos
 *   - "Cerrar sesión" / "Salir" traducidos (desktop + móvil)
 *   - Toast "Sesión cerrada" traducido
 *
 * Sobre usePathname con next-intl:
 *   El hook usePathname de "@/i18n/navigation" devuelve el path SIN el
 *   prefijo de locale. Por ejemplo, si estamos en "/es/perfil", devuelve
 *   "/perfil" (no "/es/perfil"). Esto facilita comparar contra los hrefs
 *   internos que también son "/perfil" sin prefijo.
 *
 *   Si usáramos usePathname de "next/navigation" directamente, devolvería
 *   "/es/perfil" y la comparación "pathname === item.href" fallaría.
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { User, Heart, Package, BookmarkPlus, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useReservations } from "@/hooks/use-reservations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  Icon: typeof User;
  getBadge?: () => number | undefined;
}

export function AccountSidebar() {
  const t = useTranslations("accountSidebar");

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount: wishlistCount } = useWishlist();
  const { activeCount: activeReservationsCount } = useReservations();

  /**
   * Items de navegación con labels traducidos.
   */
  const navItems: NavItem[] = [
    {
      label: t("myProfile"),
      href: "/perfil",
      Icon: User,
    },
    {
      label: t("myWishlist"),
      href: "/wishlist",
      Icon: Heart,
      getBadge: () => (wishlistCount > 0 ? wishlistCount : undefined),
    },
    {
      label: t("myReservations"),
      href: "/mis-apartados",
      Icon: BookmarkPlus,
      getBadge: () =>
        activeReservationsCount > 0 ? activeReservationsCount : undefined,
    },
    {
      label: t("myOrders"),
      href: "/mis-pedidos",
      Icon: Package,
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success(t("toast.loggedOutTitle"), {
      description: t("toast.loggedOutDescription"),
    });
    router.push("/");
  };

  if (!user) return null;

  return (
    <aside
      className={cn(
        "flex flex-row overflow-x-auto gap-1",
        "border-b border-border pb-4",
        "lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6",
        "lg:w-64 lg:flex-shrink-0"
      )}
      aria-label="Account navigation"
    >
      {/* Saludo personalizado — solo desktop */}
      <div className="hidden lg:block mb-6 pb-6 border-b border-border">
        <p className="font-display text-lg font-medium">
          {t("greeting", { firstName: user.firstName })}
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {user.email}
        </p>
      </div>

      {/* Lista de items */}
      <nav className="flex flex-row lg:flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badge = item.getBadge?.();

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5",
                "text-sm font-medium whitespace-nowrap",
                "rounded-md transition-colors",
                isActive
                  ? "bg-accent-subtle text-accent"
                  : "text-foreground hover:bg-muted hover:text-accent",
                "flex-shrink-0"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto",
                    "min-w-[20px] h-5 px-1.5",
                    "flex items-center justify-center",
                    "bg-accent text-accent-foreground",
                    "text-[10px] font-medium tabular-nums",
                    "rounded-full"
                  )}
                  aria-hidden="true"
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Cerrar sesión desktop */}
      <div className={cn("hidden lg:block", "mt-6 pt-6 border-t border-border")}>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5",
            "text-sm font-medium",
            "text-muted-foreground hover:text-destructive",
            "transition-colors cursor-pointer rounded-md hover:bg-destructive/5"
          )}
        >
          <LogOut className="h-4 w-4" />
          <span>{t("logout")}</span>
        </button>
      </div>

      {/* Cerrar sesión móvil (versión corta) */}
      <button
        onClick={handleLogout}
        className={cn(
          "lg:hidden flex items-center gap-2 px-4 py-2.5",
          "text-sm font-medium text-muted-foreground hover:text-destructive",
          "border-l border-border ml-1 pl-4",
          "transition-colors cursor-pointer flex-shrink-0"
        )}
      >
        <LogOut className="h-4 w-4" />
        <span>{t("logoutShort")}</span>
      </button>
    </aside>
  );
}