/**
 * ============================================================================
 * MIDDLEWARE — KATALINA
 * ============================================================================
 *
 * El middleware de Next.js se ejecuta antes de cada request. Acá lo usamos
 * para manejar la detección de idioma y el routing localizado.
 *
 * Comportamiento por escenario:
 *
 *   Escenario 1: URL con prefijo válido (/es/aretes, /en/earrings)
 *     - El middleware respeta el locale de la URL
 *     - Renderiza normalmente
 *
 *   Escenario 2: URL sin prefijo (/aretes, /)
 *     - El middleware DETECTA el idioma del navegador (Accept-Language header)
 *     - Si el usuario tiene cookie de preferencia previa, usa esa
 *     - Si no detecta nada, usa defaultLocale (es)
 *     - REDIRIGE a la URL con prefijo (/es/aretes)
 *
 *   Escenario 3: URL con prefijo inválido (/xx/aretes)
 *     - El locale no está en routing.locales
 *     - El middleware redirige al locale default
 *
 *   Escenario 4: archivos estáticos (/_next/*, /favicon.ico, /robots.txt)
 *     - El middleware NO intercepta (el matcher los excluye)
 *     - Se sirven directos sin redirección
 *
 * Sobre la cookie de preferencia:
 *   Cuando el usuario cambia idioma desde el selector (en el Turno 2),
 *   next-intl automáticamente guarda una cookie con su preferencia. La
 *   próxima vez que el usuario entre al sitio sin prefijo en la URL,
 *   esa cookie se usa para redirigirlo al idioma elegido.
 *
 * Sobre Accept-Language:
 *   Es un header HTTP estándar que el navegador envía con cada request.
 *   Contiene los idiomas preferidos del usuario, configurados en el OS
 *   y/o navegador. Ejemplo: "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7".
 *   next-intl parsea esto y compara con nuestros locales soportados.
 *
 * Sobre el matcher:
 *   La regex en `config.matcher` filtra qué URLs son interceptadas.
 *   Excluimos archivos estáticos y rutas internas de Next para optimizar
 *   performance — el middleware NO necesita correr en cada CSS file.
 * ============================================================================
 */

import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  /**
   * matcher define qué URLs pasan por el middleware.
   *
   * La regex hace tres cosas:
   *
   *   1. Matchea cualquier path que comience con "/"
   *   2. EXCLUYE paths que comiencen con:
   *      - "api/*"    (endpoints de API, no necesitan i18n)
   *      - "_next/*"  (recursos internos de Next)
   *      - "_vercel/*" (recursos de Vercel hosting)
   *      - archivos con extensión (favicon.ico, sitemap.xml, robots.txt, etc)
   *
   * Sintaxis: `(?!...)` es lookahead negativo. La regex completa significa
   * "todos los paths excepto los que matchean estas exclusiones".
   */
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};