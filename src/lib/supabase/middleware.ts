// ============================================================================
//  MKatalina · Helper de sesión de Supabase para el middleware · Fase 13 · Etapa 2
// ============================================================================
//
//  QUÉ HACE ESTE ARCHIVO
//  ---------------------
//  Exporta `updateSession`, la función que REFRESCA la sesión de Supabase en
//  cada petición. Es el "tercer cliente" de Supabase del proyecto, además de
//  server.ts (para el servidor) y client.ts (para el navegador). Este es
//  específico del middleware, porque el middleware trabaja con el par
//  request/response de Next.js, distinto a los otros dos entornos.
//
//  ¿POR QUÉ HACE FALTA REFRESCAR LA SESIÓN?
//  ----------------------------------------
//  El token de acceso de Supabase es de vida corta (~1 hora). Sin este
//  refresco, la sesión "muere" silenciosamente cuando el token expira y el
//  usuario aparece deslogueado aunque no haya cerrado sesión. El middleware
//  corre antes de cada página, así que es el lugar ideal para renovar el token
//  justo a tiempo y volver a guardar la cookie.
//
//  IMPORTANTE — SEGURIDAD: getUser() y NO getSession()
//  ---------------------------------------------------
//  `getSession()` lee la cookie y confía en ella sin verificar; en el servidor
//  eso NO es seguro. `getUser()` hace una llamada al servidor de Supabase que
//  valida el token de verdad. Por eso aquí, y en cualquier código de servidor,
//  usamos getUser().
//
//  CÓMO SE INTEGRA CON next-intl
//  -----------------------------
//  Esta función NO crea su propia respuesta: RECIBE la respuesta que ya produjo
//  next-intl (que puede ser una redirección para agregar el prefijo de idioma,
//  o un "rewrite" normal) y le ADJUNTA las cookies de sesión actualizadas. Así
//  ambas cosas conviven en una sola respuesta: el idioma correcto + la sesión
//  fresca. El orden lo controla middleware.ts (primero idioma, luego sesión).
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";

/**
 * Refresca la sesión de Supabase y adjunta las cookies actualizadas a la
 * respuesta que se le pasa (normalmente, la respuesta de next-intl).
 *
 * @param request  La petición entrante del middleware.
 * @param response La respuesta a la que hay que pegarle las cookies de sesión.
 * @returns        La misma respuesta, ahora con las cookies de sesión al día.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  // Leemos las variables de entorno a constantes ANTES de la guarda. Esto
  // hace dos cosas: (1) permite que TypeScript sepa que después de la guarda
  // ya no son `undefined`, y (2) evita releer process.env varias veces.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // GUARDA DE SEGURIDAD: si por alguna razón faltan las variables (por ejemplo,
  // un deploy sin configurar en Vercel), NO reventamos el sitio entero. Solo
  // devolvemos la respuesta tal cual: el sitio sigue funcionando, simplemente
  // sin refrescar sesión. Sin esta guarda, createServerClient lanzaría error y
  // cada página daría 500.
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  // Creamos el cliente de Supabase atado a las cookies de ESTA petición.
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // Supabase pide todas las cookies para localizar las suyas.
      getAll() {
        return request.cookies.getAll();
      },
      // Cuando Supabase refresca el token, nos entrega las cookies nuevas.
      // Las escribimos en dos lados:
      //   · request.cookies  -> para que el resto del pipeline vea el valor nuevo.
      //   · response.cookies -> para que lleguen al navegador (con todas sus
      //                         opciones de seguridad: httpOnly, secure, etc.).
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // ESTA es la línea clave. getUser() valida el token contra el servidor de
  // Supabase y, si expiró, lo refresca (lo que dispara setAll de arriba).
  // REGLA: no metas código entre crear el cliente y esta llamada.
  await supabase.auth.getUser();

  return response;
}