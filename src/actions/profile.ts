/**
 * ============================================================================
 *  MKatalina · Acción de servidor: PERFIL · Fase 13 · Etapa 3
 * ============================================================================
 *
 *  QUÉ HACE
 *  --------
 *  Sincroniza el nombre del usuario en la tabla `profiles` (Prisma). Se llama
 *  desde useAuth().updateProfile DESPUÉS de actualizar los metadatos del
 *  usuario en Supabase (eso se hace en el cliente para refrescar la UI al
 *  instante). Así el nombre queda igual en los dos lugares:
 *    - metadatos del usuario de Supabase → lo que lee la UI (useAuth)
 *    - tabla profiles                     → uso del lado del servidor
 *
 *  Usamos upsert (crear-o-actualizar): si por alguna razón el perfil no
 *  existiera (no debería, el trigger lo crea al registrarse), se crea. Así la
 *  operación nunca falla por "fila no encontrada".
 *
 *  SEGURIDAD: el usuario se resuelve en el servidor; solo puede tocar SU perfil.
 * ============================================================================
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalUser } from "@/lib/auth";

export async function updateMyProfile(
  firstName: string,
  lastName: string,
): Promise<void> {
  const user = await getOptionalUser();
  if (!user) return;

  const fn = firstName.trim();
  const ln = lastName.trim();

  await prisma.profile.upsert({
    where: { id: user.id },
    update: { firstName: fn, lastName: ln },
    create: {
      id: user.id,
      email: user.email ?? "",
      firstName: fn,
      lastName: ln,
    },
  });
}