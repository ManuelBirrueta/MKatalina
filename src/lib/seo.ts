/**
 * ============================================================================
 * SEO HELPERS — MKATALINA (rebrand: constantes globales actualizadas)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - SITE_URL: "https://katalina.mx" → "https://mkatalina.mx"
 *   - SITE_NAME: "Katalina" → "MKatalina"
 *   - SITE_DESCRIPTION: ahora menciona "MKatalina" implícitamente (es la
 *     descripción del sitio, no menciona el nombre directo pero es info
 *     del sitio rebrandeado)
 *   - TWITTER_HANDLE: "@katalina_mx" → "@mkatalina_mx"
 *
 * Lo que NO cambia:
 *   - SITE_LOCALE y SITE_LANG (sigue siendo es_MX / es-MX)
 *   - GOOGLE_SITE_VERIFICATION (sigue vacío hasta producción)
 *   - absoluteUrl() function (sin cambios)
 *
 * ─── IMPACTO DE ESTOS CAMBIOS ──────────────────────────────────────────
 *
 * SITE_URL afecta:
 *   - sitemap.xml: todas las URLs incluyen este prefijo
 *   - Open Graph URLs (preview en WhatsApp/Twitter/Facebook)
 *   - canonical URLs en metadata
 *   - Structured data @id en JSON-LD
 *   - absoluteUrl() helper que se usa en TODA la app
 *
 * SITE_NAME afecta:
 *   - <title> de páginas
 *   - Open Graph title fallback
 *   - JSON-LD Organization name
 *   - mensajes que usan {siteName} via messages.json
 *
 * TWITTER_HANDLE afecta:
 *   - Twitter Cards meta tag
 *
 * ─── PENDIENTES PARA PRODUCCIÓN ────────────────────────────────────────
 *
 * Cuando llegue el momento de lanzar:
 *   1. Confirmar que mkatalina.mx es el dominio real (comprado y configurado)
 *   2. Subir og-default.png al /public/ del proyecto (1200x630)
 *   3. Configurar GOOGLE_SITE_VERIFICATION con el código real de Search Console
 *   4. Confirmar el handle real de Twitter/X si va a tener cuenta
 * ─────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

/**
 * URL canónica del sitio en producción.
 *
 * Convención: SIN slash al final. Si pones "https://mkatalina.mx/" causarás
 * URLs con doble slash al concatenar paths como "/aretes".
 */
export const SITE_URL = "https://mkatalina.mx";

/**
 * Nombre de la marca. Se usa en titles, OG, structured data.
 */
export const SITE_NAME = "MKatalina";

/**
 * Descripción global del sitio. Aparece como meta description por defecto
 * en páginas que no definen una específica.
 *
 * Nota: el copy NO menciona "MKatalina" explícitamente (es opcional) —
 * describe los productos del sitio. El nombre aparece en el <title>
 * automáticamente vía templates de Next metadata.
 */
export const SITE_DESCRIPTION =
  "Joyería artesanal mexicana hecha a mano. Aretes, collares, pulseras y gargantillas en plata 925, oro rosa y piedras naturales.";

/**
 * Locale del sitio. Por ahora español de México únicamente.
 * En Fase 12 con next-intl se extenderá a múltiples locales.
 */
export const SITE_LOCALE = "es_MX";
export const SITE_LANG = "es-MX";

/**
 * Imagen Open Graph por defecto.
 * Apunta a /og-default.png en /public/.
 *
 * Importante: cuando regeneres esta imagen (con el branding nuevo de
 * MKatalina), debes mantener el nombre del archivo o actualizar esta
 * constante.
 */
export const OG_DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

/**
 * Twitter handle (sin @). Aparece como "author" cuando se comparte en Twitter.
 *
 * IMPORTANTE: confirma que este handle esté disponible/registrado antes de
 * producción. Si está tomado, ajustar a una alternativa (ej. @mkatalinajoyeria).
 */
export const TWITTER_HANDLE = "@mkatalina_mx";

/**
 * Verificación de Google Search Console.
 * Sigue vacío hasta que se configure en producción.
 */
export const GOOGLE_SITE_VERIFICATION = "";

/**
 * absoluteUrl — construye una URL absoluta a partir de un path relativo.
 *
 * Sin cambios respecto a la versión anterior. Solo cambia el SITE_URL
 * base que ahora apunta a mkatalina.mx.
 *
 * Ejemplos:
 *   absoluteUrl("/aretes") → "https://mkatalina.mx/aretes"
 *   absoluteUrl("/")       → "https://mkatalina.mx"
 *   absoluteUrl("aretes")  → "https://mkatalina.mx/aretes"
 */
export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") return SITE_URL;
  return `${SITE_URL}${normalizedPath}`;
}