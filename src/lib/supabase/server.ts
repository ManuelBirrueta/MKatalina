// ============================================================================
//  MKatalina · Cliente de Supabase (SERVIDOR) · Fase 13 · Etapa 1
// ============================================================================
//
//  QUÉ HACE ESTE ARCHIVO
//  ---------------------
//  Crea un cliente de Supabase pensado para código que corre EN EL SERVIDOR:
//  route handlers, server actions y server components. Su trabajo principal
//  ahora mismo es la AUTENTICACIÓN: lee y escribe la sesión del usuario a
//  través de las cookies de la petición.
//
//  Se usará así (siempre con await, ver más abajo):
//      import { createClient } from "@/lib/supabase/server";
//      const supabase = await createClient();
//      const { data: { user } } = await supabase.auth.getUser();
//
//  ¿POR QUÉ ESTE CLIENTE Y NO EL DEL NAVEGADOR?
//  --------------------------------------------
//  La sesión de Supabase vive en cookies. En el servidor no hay "navegador"
//  que las gestione solo, así que le enseñamos a Supabase a leer/escribir esas
//  cookies usando el sistema de cookies de Next.js (`next/headers`).
//
//  DETALLE IMPORTANTE DE NEXT.JS 16
//  --------------------------------
//  En Next.js 15+ la función `cookies()` es ASÍNCRONA (devuelve una promesa),
//  por eso `createClient` es async y hay que llamarlo con `await`.
//
//  RELACIÓN CON PRISMA
//  -------------------
//  Este cliente NO se usa para consultar tus tablas de negocio (eso lo hace
//  Prisma). Aquí Supabase se encarga solo de "quién es el usuario". Patrón:
//  Supabase responde "quién eres" -> con ese id, Prisma trae "tus datos".
//
//  SEGURIDAD (CVE-2025-29927)
//  --------------------------
//  Recuerda: la sola presencia del middleware NO basta para proteger rutas.
//  En cada route handler / server action verificaremos la sesión con
//  supabase.auth.getUser() ANTES de devolver datos privados.
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente de Supabase para el servidor, atado a las cookies de la
 * petición actual. Debe llamarse dentro de una petición (route handler,
 * server action o server component).
 */
export async function createClient() {
  // `cookies()` es asíncrono en Next.js 16: nos da acceso a las cookies de
  // ESTA petición para poder leer/refrescar la sesión.
  const cookieStore = await cookies();

  return createServerClient(
    // Estas dos variables NEXT_PUBLIC_* son públicas por diseño: la
    // "publishable key" (sb_publishable_...) tiene privilegios bajos, limitados
    // por las políticas de seguridad de Supabase. Es la que reemplaza a la
    // antigua "anon key". Viven en .env.local y también hay que cargarlas en Vercel.
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Supabase pide TODAS las cookies para poder encontrar las suyas.
        getAll() {
          return cookieStore.getAll();
        },
        // Supabase nos entrega las cookies que quiere fijar (por ejemplo, al
        // refrescar el token de sesión) y aquí las escribimos.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Si esto se llama desde un Server Component, Next.js no permite
            // escribir cookies y lanza error. Lo ignoramos a propósito: el
            // middleware (Etapa 2) se encargará de refrescar la sesión. Este
            // try/catch es el patrón recomendado por Supabase, no un descuido.
          }
        },
      },
    },
  );
}