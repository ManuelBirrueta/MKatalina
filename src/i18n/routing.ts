/**
 * ============================================================================
 * I18N ROUTING — KATALINA (Fase 12 — versión simplificada)
 * ============================================================================
 *
 * Configuración central de internacionalización para next-intl.
 *
 * Versión simplificada:
 *   En esta iteración NO declaramos pathnames localizadas (donde
 *   /es/aretes → /en/earrings). En su lugar, el sitio usa los MISMOS paths
 *   en ambos idiomas, solo con prefijo de locale:
 *
 *     /es/aretes  ↔  /en/aretes
 *     /es/contacto ↔ /en/contacto
 *     /es/quienes-somos ↔ /en/quienes-somos
 *
 *   Por qué este cambio:
 *     - Las pathnames estrictas tipaban Link de forma muy rígida y
 *       muchos paths dinámicos del proyecto fallaban (subcategorías,
 *       href props variables, etc.)
 *     - Con esta versión, Link acepta cualquier string como href
 *       y solo agrega el prefijo /es o /en al inicio
 *     - El compromiso es que las URLs en /en no usarán palabras en
 *       inglés (no será /en/earrings sino /en/aretes). Es aceptable
 *       para el MVP — si en el futuro queremos URLs 100% localizadas,
 *       se puede agregar despues con un CMS o middleware avanzado.
 *
 * El resto del sistema (middleware, request, navigation) sigue
 * funcionando idénticamente.
 * ============================================================================
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  /**
   * Idiomas soportados.
   */
  locales: ["es", "en"],

  /**
   * Idioma de fallback cuando el middleware no puede determinar otro.
   */
  defaultLocale: "es",

  /**
   * Siempre incluir el prefijo de idioma en las URLs.
   *
   * Resultado:
   *   /aretes        → 404 (sin prefijo)
   *   /es/aretes     → OK
   *   /en/aretes     → OK
   *
   * El middleware redirige las URLs sin prefijo al locale apropiado
   * (detectado del header Accept-Language o cookie).
   */
  localePrefix: "always",

  /**
   * Sin pathnames localizadas — usamos los mismos paths en ambos idiomas.
   *
   * Esto simplifica enormemente los tipos de Link y permite paths
   * dinámicos sin restricciones. En el futuro, si queremos URLs
   * completamente traducidas, se reactiva esta sección.
   */
});

/**
 * Tipos exportados para uso en otros archivos.
 */
export type Locale = (typeof routing.locales)[number];