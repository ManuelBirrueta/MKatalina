// ============================================================================
//  MKatalina · Cliente de Supabase (NAVEGADOR) · Fase 13 · Etapa 1
// ============================================================================
//
//  QUÉ HACE ESTE ARCHIVO
//  ---------------------
//  Crea un cliente de Supabase para código que corre EN EL NAVEGADOR, es
//  decir, dentro de componentes marcados con "use client". Se usa, por
//  ejemplo, en el formulario de login/registro para llamar a
//  supabase.auth.signInWithPassword(...) directamente desde el cliente.
//
//  Se usará así:
//      "use client";
//      import { createClient } from "@/lib/supabase/client";
//      const supabase = createClient(); // nota: aquí NO lleva await
//
//  ¿POR QUÉ HAY DOS CLIENTES (este y server.ts)?
//  ---------------------------------------------
//  En el navegador SÍ existe el manejo normal de cookies del navegador, así
//  que este cliente es más simple: no necesita que le pasemos manualmente el
//  sistema de cookies como en el servidor. Usar el cliente equivocado en el
//  entorno equivocado provoca errores de sesión, por eso los separamos.
//
//  SEGURIDAD
//  ---------
//  Este cliente usa la "publishable key" pública (sb_publishable_...). Nunca
//  pondremos aquí la clave secreta (sb_secret_...): esa es solo de servidor y
//  Supabase la rechaza (HTTP 401) si detecta que se usa desde un navegador.
//  Toda operación sensible
//  (crear pedidos, ver datos de otros) pasará por el servidor, nunca por este
//  cliente del navegador.
// ============================================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para el navegador. Es seguro llamarlo varias
 * veces: la librería reutiliza la misma instancia internamente.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}