/**
 * ============================================================================
 * LAYOUT: (account) — KATALINA
 * ============================================================================
 *
 * Layout compartido por todas las páginas privadas:
 *   - /perfil
 *   - /wishlist
 *   - /mis-pedidos
 *
 * El paréntesis (account) es un "route group" de Next.js App Router. Esto
 * agrupa las rutas bajo el mismo layout pero NO agrega "/account" a la URL.
 * Las URLs siguen siendo "/perfil", "/wishlist", etc. — limpias.
 *
 * El layout proporciona:
 *   1. Guard de autenticación: si no hay sesión, redirige a /login con el
 *      destino guardado en ?redirect= para volver después del login
 *   2. Estructura visual: sidebar + contenido en dos columnas (desktop)
 *      o stacked (móvil)
 *   3. Container para el ancho consistente con el resto del sitio
 *
 * El guard usa useEffect (no chequeo en render) porque router.push debe
 * llamarse fuera del ciclo de render. Mientras se evalúa, mostramos un
 * placeholder mínimo para evitar flash de contenido privado.
 *
 * Por qué no hacer guard server-side (más seguro):
 *   El guard ideal vive en server-side (Next.js middleware o server component)
 *   porque allí es imposible que el cliente lo evada. Pero con nuestro sistema
 *   de auth basado en localStorage (que solo existe en el cliente), no
 *   tenemos acceso server-side.
 *
 *   En Fase 12 con NextAuth, el guard ideal es:
 *     - middleware.ts global que chequea la cookie httpOnly de sesión
 *     - Server Components que verifican `auth()` antes de renderizar
 *     - Esto ES seguro porque el cliente no puede saltarse server-side checks
 *
 *   Por ahora el guard cliente-side es suficiente para UX. La "seguridad"
 *   real vendrá con backend.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { useAuth } from "@/hooks/use-auth";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  /**
   * Flag de mounted — mismo patrón que usamos en /carrito y /checkout.
   *
   * Necesario porque Zustand persist rehidrata async desde localStorage.
   * Si chequeáramos `isAuthenticated` en el primer render del cliente, sería
   * false (todavía no rehidrató) y redirigiríamos al login incorrectamente
   * incluso a usuarios logueados.
   *
   * El flag `mounted=true` solo se activa DESPUÉS del primer render, donde
   * ya rehidrató. Ahí sí podemos confiar en isAuthenticated.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Guard de redirección.
   *
   * Si terminó la hidratación Y no hay sesión activa, redirigir a /login
   * con el destino actual como redirect param. Después del login exitoso,
   * el LoginForm leerá ese param y traerá al usuario de vuelta aquí.
   */
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isAuthenticated, router, pathname]);

  /**
   * Render condicional:
   *   - Antes de mounted: placeholder neutro (no muestra contenido privado)
   *   - Después de mounted, sin sesión: placeholder mientras redirige
   *   - Después de mounted, con sesión: layout completo
   */
  if (!mounted || !isAuthenticated) {
    return (
      <Container>
        <div className="h-96" aria-hidden="true" />
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8 lg:py-12">
        {/*
         * Grid responsive:
         *   - móvil: 1 columna (sidebar arriba horizontal, contenido abajo)
         *   - desktop (lg+): 2 columnas asimétricas (sidebar fijo + contenido)
         *
         * gap-8 vertical en móvil, gap-12 horizontal en desktop.
         *
         * items-start importante para que el sidebar se alinee al top
         * cuando el contenido es más alto.
         */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <AccountSidebar />

          {/*
           * Contenido principal de la página de cuenta.
           * flex-1 ocupa el espacio restante después del sidebar.
           * min-w-0 previene problemas de overflow con grids dentro.
           */}
          <main className="flex-1 min-w-0 w-full">{children}</main>
        </div>
      </div>
    </Container>
  );
}