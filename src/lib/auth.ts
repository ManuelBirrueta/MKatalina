/**
 * ============================================================================
 *  MKatalina · Guardas de sesión del lado del SERVIDOR · Fase 13
 * ============================================================================
 *
 *  getOptionalUser → devuelve el usuario o null (páginas que funcionan sin sesión).
 *  requireUser     → exige sesión; si no, redirige a /login.
 *  isCurrentUserAdmin → ¿el usuario actual es admin? (para acciones de servidor).
 *  requireAdmin    → exige que el usuario sea admin; si no, redirige.
 *
 *  Todas usan getUser() (valida contra Supabase), y el ROL se lee de la tabla
 *  `profiles` (campo role: "customer" | "admin"). Solo puede correr en el
 *  servidor: usa el cliente de Supabase de servidor + Prisma.
 * ============================================================================
 */

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve el usuario logueado, o null si no hay sesión.
 */
export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Exige que haya un usuario logueado. Si NO lo hay, redirige a /login.
 */
export async function requireUser(locale: string): Promise<User> {
  const user = await getOptionalUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  return user;
}

/**
 * ¿El usuario actual es administrador? Útil dentro de acciones de servidor
 * para verificar permisos (defensa en profundidad, además del guard de página).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getOptionalUser();
  if (!user) return false;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  return profile?.role === "admin";
}

/**
 * Exige que el usuario sea ADMIN:
 *   - Sin sesión → redirige a /login (vía requireUser).
 *   - Con sesión pero NO admin → redirige al inicio (no revela el panel).
 *   - Admin → devuelve el usuario.
 *
 * @param locale Idioma activo (para las redirecciones).
 */
export async function requireAdmin(locale: string): Promise<User> {
  const user = await requireUser(locale);

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (profile?.role !== "admin") {
    redirect(`/${locale}`);
  }

  return user;
}