// ============================================================================
//  MKatalina · PROXY (idiomas + sesión) · Fase 13 · Mantenimiento
// ============================================================================
//
//  ANTES SE LLAMABA middleware.ts. Next.js 16 renombró esta convención a
//  "proxy": mismo archivo, misma lógica, solo cambia el nombre del archivo
//  (middleware.ts → proxy.ts) y el de la función (middleware → proxy). Con esto
//  desaparece el aviso de "deprecated" en cada arranque.
//
//  IMPORTANTE: renombrar SOLO este archivo (el que está en src/, la convención
//  de Next). El helper src/lib/supabase/middleware.ts NO se toca: ese es un
//  módulo normal, no la convención de Next, y este archivo lo sigue importando.
//
//  QUÉ HACE
//  --------
//  Corre ANTES de cada página y hace dos cosas en una pasada:
//    1. Enrutado de idioma (next-intl): aplica el prefijo /es o /en.
//    2. Refresco de sesión (Supabase): mantiene al usuario logueado.
//
//  Primero corre next-intl (decide idioma/redirección) y luego updateSession le
//  adjunta las cookies de sesión frescas a esa misma respuesta.
//
//  RUTAS /auth/* (caso especial)
//  -----------------------------
//  El callback de confirmación de correo (futuro) no lleva prefijo de idioma;
//  para /auth/* saltamos next-intl y solo refrescamos la sesión.
//
//  SEGURIDAD (CVE-2025-29927)
//  --------------------------
//  Esto SOLO refresca la sesión. La protección real de rutas privadas se hace
//  con getUser() dentro de cada página/acción de servidor, no aquí.
// ============================================================================

import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

// Creamos el middleware de next-intl una sola vez, con tu configuración de
// idiomas existente (locales, defaultLocale, localePrefix "always").
const handleI18nRouting = createMiddleware(routing);

// La función ahora se llama `proxy` (antes `middleware`).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Caso especial: rutas de autenticación (sin idioma) ---
  if (pathname.startsWith("/auth")) {
    const response = NextResponse.next({ request });
    return await updateSession(request, response);
  }

  // --- Caso general: resto del sitio ---
  // 1) next-intl decide idioma / redirección y produce la respuesta.
  const response = handleI18nRouting(request);
  // 2) Supabase le adjunta las cookies de sesión frescas a esa misma respuesta.
  return await updateSession(request, response);
}

export const config = {
  /**
   * Mismo matcher de siempre: intercepta todo MENOS api/*, _next/*, _vercel/*
   * y archivos con extensión. `(?!...)` es un "lookahead negativo".
   */
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};