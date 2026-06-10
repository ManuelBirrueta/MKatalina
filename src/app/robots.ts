/**
 * ============================================================================
 * ROBOTS — KATALINA
 * ============================================================================
 *
 * Genera /robots.txt automáticamente.
 *
 * El archivo robots.txt es la primera cosa que un crawler (Google, Bing,
 * etc.) lee al visitar tu sitio. Le dice qué puede y qué no puede indexar.
 *
 * Cómo funciona:
 *   - Allow: páginas que sí pueden indexar (default es allow todo)
 *   - Disallow: páginas que NO deben indexar
 *   - Sitemap: dónde está el sitemap.xml
 *
 * IMPORTANTE: robots.txt es una "sugerencia". Crawlers respetuosos
 * (Google, Bing) lo respetan. Crawlers maliciosos lo ignoran.
 * Para bloqueo real, necesitas autenticación, no solo robots.
 *
 * Qué bloqueamos:
 *   - /carrito: efímero, contiene datos personales del usuario
 *   - /checkout y /checkout/*: efímeros, transaccionales
 *   - /perfil, /wishlist, /mis-pedidos, /mis-apartados: privadas
 *   - /login, /registro: no aportan SEO, son formularios
 *   - /api/*: endpoints técnicos, no deben indexarse nunca
 *
 * Qué permitimos:
 *   - Todo lo demás (página principal, categorías, productos, páginas
 *     estáticas, FAQ)
 *
 * Sitemap:
 *   Apuntamos al sitemap.xml que generamos en sitemap.ts. Google
 *   automáticamente lee el sitemap mencionado en robots.txt.
 *
 * En Fase 12 con backend:
 *   Podríamos diferenciar por User-Agent para optimizar el crawl budget
 *   por bot. Por ejemplo, dar a Googlebot acceso pleno pero limitar a
 *   crawlers de scrapers maliciosos. Por ahora KISS — una regla para todos.
 * ============================================================================
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        /**
         * userAgent: "*" significa "todos los crawlers".
         * Si quisiéramos reglas específicas para Googlebot vs Bingbot,
         * usaríamos múltiples objetos en `rules`.
         */
        userAgent: "*",

        /**
         * allow: por defecto todo está permitido. Lo declaramos explícito
         * para claridad.
         */
        allow: "/",

        /**
         * disallow: páginas/secciones que NO queremos indexar.
         *
         * El "/" al final indica que es un path. Los wildcards (*) sirven
         * para cubrir patrones (ej. /checkout/* bloquea /checkout, /checkout/confirmacion, etc.).
         */
        disallow: [
          // Rutas efímeras del flujo de compra
          "/carrito",
          "/checkout",
          "/checkout/*",

          // Rutas privadas del usuario (requieren login)
          "/perfil",
          "/wishlist",
          "/mis-pedidos",
          "/mis-apartados",

          // Páginas de autenticación
          "/login",
          "/registro",

          // API y endpoints técnicos
          "/api/*",

          // Archivos internos de Next.js (por si acaso)
          "/_next/*",
        ],
      },
    ],

    /**
     * Sitemap: dónde está el sitemap.xml.
     *
     * Importante: debe ser URL absoluta.
     */
    sitemap: `${SITE_URL}/sitemap.xml`,

    /**
     * host: URL canónica del sitio.
     *
     * Útil cuando el sitio responde a múltiples dominios (con www, sin www,
     * con http, con https). Le decimos a Google "esta es la versión oficial".
     */
    host: SITE_URL,
  };
}