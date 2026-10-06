/**
 * ============================================================================
 * LAYOUT: (account) — MKATALINA (Fase 13 · Etapa 2: guard real de servidor)
 * ============================================================================
 *
 * Layout compartido por TODAS las páginas privadas de la cuenta:
 *   - /perfil
 *   - /wishlist
 *   - /mis-pedidos
 *   - /mis-apartados
 *
 * El paréntesis (account) es un "route group" de Next.js: agrupa estas rutas
 * bajo el mismo layout SIN agregar "/account" a la URL. Las URLs siguen siendo
 * "/perfil", "/wishlist", etc.
 *
 * ─── QUÉ CAMBIÓ RESPECTO A LA VERSIÓN ANTERIOR ─────────────────────────────
 *
 * Antes: era un componente CLIENTE ("use client") que verificaba la sesión con
 * useAuth y redirigía con useEffect. Funcionaba para la experiencia de usuario,
 * pero era evadible: el JavaScript del cliente corre DESPUÉS de que el servidor
 * ya mandó la página.
 *
 * Ahora: es un componente de SERVIDOR. Llama a requireUser() ANTES de renderizar
 * nada. Si no hay sesión válida, redirige a /login y el visitante nunca recibe
 * la página protegida. Esta es la barrera de seguridad real (la que tu propio
 * comentario anterior anticipaba "para cuando tengamos backend").
 *
 * Como el servidor garantiza que solo entran usuarios autenticados, ya NO hacen
 * falta el flag `mounted`, el useEffect de redirección, ni el placeholder para
 * evitar el "flash" de contenido privado. Todo eso se eliminó.
 *
 * Protege las CUATRO sub-páginas de una sola vez: el layout se renderiza en el
 * servidor antes que cualquiera de sus páginas hijas, aunque esas páginas sean
 * componentes cliente.
 *
 * NOTA: el AccountSidebar sigue siendo un componente cliente y funciona igual;
 * un componente de servidor puede renderizar componentes cliente sin problema.
 * ============================================================================
 */

import { Container } from "@/components/layout/Container";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { requireUser } from "@/lib/auth";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // En Next.js 15+, params llega como Promise y hay que await-earlo.
  params: Promise<{ locale: string }>;
}) {
  // Idioma activo, para redirigir a /es/login o /en/login si hace falta.
  const { locale } = await params;

  // GUARD: si no hay sesión, requireUser redirige a /login y la ejecución se
  // detiene aquí (nada de abajo se renderiza). Si hay sesión, seguimos.
  await requireUser(locale);

  return (
    <Container>
      <div className="py-8 lg:py-12">
        {/*
         * Grid responsive (idéntico a la versión anterior):
         *   - móvil: 1 columna (sidebar arriba, contenido abajo)
         *   - desktop (lg+): 2 columnas (sidebar + contenido)
         * items-start alinea el sidebar al tope cuando el contenido es más alto.
         */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <AccountSidebar />

          {/*
           * Contenido de la página de cuenta.
           * flex-1 ocupa el espacio restante; min-w-0 previene overflow de
           * grids internos.
           */}
          <main className="flex-1 min-w-0 w-full">{children}</main>
        </div>
      </div>
    </Container>
  );
}