/**
 * ============================================================================
 * I18N NAVIGATION — KATALINA
 * ============================================================================
 *
 * Wrappers tipados de los helpers de navegación de Next.js que respetan
 * el locale activo automáticamente.
 *
 * Por qué necesitamos esto:
 *   Next.js tiene componentes como <Link> y hooks como useRouter,
 *   useSearchParams, usePathname, redirect. Funcionan bien pero NO saben
 *   nada de i18n. Si haces <Link href="/aretes">, NO añade el prefijo
 *   /es o /en automáticamente.
 *
 *   Estos wrappers de next-intl SÍ lo hacen. <Link href="/aretes"> dentro
 *   de una página en español automáticamente apunta a /es/aretes (o
 *   /en/earrings si estás en inglés).
 *
 * Cómo migrar el código:
 *   Antes:    import Link from "next/link"
 *   Después:  import { Link } from "@/i18n/navigation"
 *
 *   El resto del uso es idéntico — el componente Link se ve y se comporta
 *   igual, solo que automáticamente añade el prefijo de idioma correcto.
 *
 *   Lo mismo para:
 *     - useRouter:     usar el de "@/i18n/navigation"
 *     - usePathname:   usar el de "@/i18n/navigation"
 *     - redirect:      usar el de "@/i18n/navigation"
 *     - getPathname:   usar el de "@/i18n/navigation"
 *
 *   useSearchParams NO necesita wrapper porque los query params no se
 *   localizan — esos siguen viniendo de "next/navigation" directo.
 *
 * En el Turno 2 migramos todos los `import Link from "next/link"` del
 * proyecto a estos wrappers.
 * ============================================================================
 */

import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/**
 * createNavigation genera los wrappers basados en la configuración de routing.
 *
 * Conoce todas las pathnames localizadas que declaramos en routing.ts,
 * así que cuando uses <Link href="/aretes">, TypeScript valida que esa
 * pathname existe y next-intl le añade el prefijo correcto.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);