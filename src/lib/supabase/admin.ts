/**
 * ============================================================================
 *  MKatalina · Cliente ADMIN de Supabase (solo servidor) · Fase 13 · Etapa 2
 * ============================================================================
 *
 *  Cliente de Supabase con la SECRET KEY (SUPABASE_SECRET_KEY). Esa llave tiene
 *  permisos totales y se salta el RLS, por eso:
 *
 *    1. `import "server-only"` hace que el build FALLE si algún componente del
 *       navegador intenta importar este archivo. Así la llave nunca puede
 *       terminar, ni por error, en el código que descarga el visitante.
 *    2. Solo se usa en acciones de servidor que ANTES verifican que quien
 *       llama sea admin (ver src/actions/product-images.ts).
 *
 *  Por ahora lo usamos únicamente para Storage (crear URLs firmadas de subida
 *  y borrar fotos). Los datos siguen pasando por Prisma.
 *
 *  Diferencia con los otros clientes de src/lib/supabase/:
 *    - client.ts → navegador, llave pública, actúa como el usuario logueado.
 *    - server.ts → servidor, llave pública + cookies del usuario.
 *    - admin.ts  → servidor, llave SECRETA, actúa como "el sistema".
 * ============================================================================
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en las variables de entorno",
    );
  }

  return createClient(url, secretKey, {
    // Cliente "de sistema": no hay usuario, así que no guardamos ni
    // refrescamos ninguna sesión.
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}