/**
 * ============================================================================
 * USER MENU — KATALINA (Fase 12: i18n completo)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Imports de Link y useRouter cambian a "@/i18n/navigation"
 *   - Agregamos useTranslations para todos los labels
 *   - Toast de logout traducido
 *
 * El comportamiento (dropdown, click outside, hidratación) se mantiene
 * idéntico.
 *
 * Sobre router.push("/"):
 *   "/" es path canónico. useRouter de @/i18n/navigation lo convierte
 *   al locale activo, así que tras logout el usuario llega a /es/ o /en/.
 * ============================================================================
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { User, Heart, Package, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function UserMenu() {
  const t = useTranslations("userMenu");
  const tHeader = useTranslations("header");

  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  // Flag de hidratación
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Estado del dropdown
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Cerrar el dropdown al hacer clic fuera o presionar Esc.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  /**
   * Handler de cerrar sesión.
   * Toast traducido + redirige al home en el locale activo.
   */
  const handleLogout = () => {
    setIsOpen(false);
    logout();
    toast.success(t("logout"));
    router.push("/");
  };

  /**
   * Antes de mounted O sin sesión: link simple a /login.
   *
   * Mantenemos esta versión "invitado" hasta que mounted=true para evitar
   * hydration mismatch con Zustand persist.
   */
  if (!mounted || !isAuthenticated) {
    return (
      <Link
        href="/login"
        aria-label={tHeader("loginLabel")}
        className={cn(
          "inline-flex items-center justify-center h-9 w-9",
          "text-foreground hover:text-accent transition-colors"
        )}
      >
        <User className="h-4 w-4" />
      </Link>
    );
  }

  /**
   * Con sesión: botón que abre dropdown.
   */
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={tHeader("userMenuLabel")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "inline-flex items-center justify-center h-9 w-9",
          "text-foreground hover:text-accent transition-colors",
          isOpen && "text-accent"
        )}
      >
        <UserCircle className="h-5 w-5" />
      </button>

      {/*
       * Dropdown menu.
       */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full mt-2",
            "w-64",
            "bg-background border border-border rounded-md shadow-lg",
            "py-2 z-50",
            "animate-in fade-in slide-in-from-top-1 duration-150"
          )}
        >
          {/* Header del menu con datos del usuario */}
          {user && (
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {user.email}
              </p>
            </div>
          )}

          {/* Links de navegación */}
          <div className="py-1">
            <MenuLink
              href="/perfil"
              icon={User}
              label={t("myProfile")}
              onClick={() => setIsOpen(false)}
            />
            <MenuLink
              href="/wishlist"
              icon={Heart}
              label={t("myWishlist")}
              onClick={() => setIsOpen(false)}
            />
            <MenuLink
              href="/mis-pedidos"
              icon={Package}
              label={t("myOrders")}
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Cerrar sesión separado por border */}
          <div className="border-t border-border pt-1">
            <button
              onClick={handleLogout}
              role="menuitem"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2",
                "text-sm",
                "text-muted-foreground hover:text-destructive hover:bg-destructive/5",
                "transition-colors cursor-pointer"
              )}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MenuLink — sub-componente para cada item del dropdown.
 *
 * Recibe label ya traducido como prop.
 */
function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className={cn(
        "flex items-center gap-3 px-4 py-2",
        "text-sm text-foreground hover:bg-muted hover:text-accent",
        "transition-colors"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}