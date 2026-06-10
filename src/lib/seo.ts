/**
 * ============================================================================
 * SEO HELPERS — KATALINA
 * ============================================================================
 *
 * Constantes y utilidades compartidas para todo el SEO del sitio.
 *
 * Centralizar estos valores aquí permite:
 *   - Cambiar la URL de producción en un solo lugar
 *   - Cambiar el nombre de la marca, descripción global, etc. sin
 *     buscar/reemplazar por todo el código
 *   - Garantizar consistencia entre meta tags, sitemap, structured data,
 *     y Open Graph
 *
 * En Fase 12 con next-intl, estas constantes se mantendrán pero algunas
 * (como `siteDescription`) tendrán versiones traducidas.
 * ============================================================================
 */

/**
 * URL canónica del sitio en producción.
 *
 * ⚠️ IMPORTANTE: cambia esto cuando tengas el dominio real.
 *
 * Convención: SIN slash al final. Si pones "https://katalina.mx/" causarás
 * URLs con doble slash al concatenar paths como "/aretes".
 *
 * Por qué importante:
 *   - Se usa en sitemap.xml para que Google sepa la URL completa de cada página
 *   - Se usa en Open Graph para que las previews en WhatsApp/Twitter
 *     muestren la URL correcta
 *   - Se usa en structured data para los `@id` de cada entidad
 */
export const SITE_URL = "https://katalina.mx";

/**
 * Nombre de la marca. Se usa en titles, OG, structured data.
 */
export const SITE_NAME = "Katalina";

/**
 * Descripción global del sitio. Aparece como meta description por defecto
 * en páginas que no definen una específica.
 *
 * Máximo recomendado: 155-160 caracteres. Google trunca en ese límite.
 * Lo que está aquí tiene 138 chars — espacio para crecer sin romper.
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
 *
 * 1200×630 es el tamaño estándar para que se vea bien en:
 *   - WhatsApp
 *   - Facebook
 *   - Twitter (Twitter usa una proporción ligeramente distinta pero 1200×630 funciona)
 *   - LinkedIn
 *   - iMessage
 *
 * Por ahora apunta a /og-default.png que debes generar y colocar en
 * /public/og-default.png. En el Turno 2 te explico cómo generar una buena
 * imagen OG sin diseñador.
 */
export const OG_DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

/**
 * Twitter handle (sin @). Aparece como "author" cuando se comparte en Twitter.
 * Cambia por tu handle real cuando lo tengas.
 */
export const TWITTER_HANDLE = "@katalina_mx";

/**
 * Verificación de Google Search Console.
 *
 * Cuando lances el sitio:
 *   1. Ve a https://search.google.com/search-console
 *   2. Agrega tu propiedad (la URL del sitio)
 *   3. Elige el método "HTML tag"
 *   4. Google te dará un código como "abc123def456..."
 *   5. Pega ese código aquí (sin las comillas envolventes, solo el contenido)
 *
 * Hasta que lo configures, déjalo vacío. El sitio funciona igual.
 */
export const GOOGLE_SITE_VERIFICATION = ""; // ← reemplazar al lanzar

/**
 * absoluteUrl — construye una URL absoluta a partir de un path relativo.
 *
 * Útil para canonical URLs, Open Graph URLs, structured data, etc.
 * que requieren URLs completas (no relativas como "/aretes").
 *
 * Ejemplos:
 *   absoluteUrl("/aretes") → "https://katalina.mx/aretes"
 *   absoluteUrl("/")       → "https://katalina.mx"
 *   absoluteUrl("aretes")  → "https://katalina.mx/aretes" (acepta sin slash)
 */
export function absoluteUrl(path: string): string {
  // Asegurar que el path empiece con /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // El SITE_URL no tiene slash final, así que concatenamos directo
  // Para path "/" (raíz), retornamos solo SITE_URL para evitar doble slash
  if (normalizedPath === "/") return SITE_URL;
  return `${SITE_URL}${normalizedPath}`;
}