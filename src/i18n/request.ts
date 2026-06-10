/**
 * ============================================================================
 * I18N REQUEST CONFIG — KATALINA
 * ============================================================================
 *
 * Este archivo configura cómo next-intl carga las traducciones para CADA
 * request entrante.
 *
 * El plugin de Next que configuramos en next.config.ts apunta a este
 * archivo. En cada request, next-intl invoca esta función para saber:
 *   1. Qué locale es válido para este request
 *   2. Qué archivo de mensajes cargar
 *
 * Por qué los mensajes se cargan por request:
 *   - Permite Server-Side Rendering con traducciones correctas desde el HTML
 *   - Cada locale tiene sus propios mensajes (no cargamos todo el spanglish)
 *   - Compatible con streaming y suspense de React 19
 *
 * Estructura del retorno:
 *   - locale: confirmación del locale validado
 *   - messages: el objeto JSON con todas las traducciones para ese locale
 *
 * Sobre el lazy loading:
 *   `import()` dinámico hace que el archivo de mensajes se cargue solo
 *   cuando se necesita. Next.js puede optimizar esto en build time para
 *   que cada locale genere su bundle separado.
 *
 * Sobre `hasLocale`:
 *   Helper de next-intl que valida si el string es un locale soportado.
 *   Si alguien pone /xx/aretes en la URL, hasLocale("xx") devuelve false
 *   y devolvemos un 404. Esto previene que TypeScript se queje y previene
 *   carga de archivos inexistentes.
 * ============================================================================
 */

import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  /**
   * requestLocale viene del middleware: es el locale detectado para
   * esta request específica.
   *
   * Es Promise<string | undefined> porque puede no estar definido si la
   * URL no tiene prefijo válido. Lo manejamos abajo.
   */
  const requested = await requestLocale;

  /**
   * Validar que el locale solicitado sea uno de los soportados.
   * Si no, caer al default (ver routing.ts).
   *
   * hasLocale es una guarda de tipo: dentro del if, TypeScript sabe que
   * `requested` es un Locale válido.
   */
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  /**
   * Cargar el archivo de mensajes para el locale.
   *
   * El path `../../messages/${locale}.json` es relativo a este archivo
   * (src/i18n/request.ts). El `.default` accede al export default del JSON.
   *
   * Si el archivo no existe (ej. error de typo en locale), import() falla
   * y Next muestra un error de build, lo cual es lo deseado — atrapamos
   * el bug temprano.
   */
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});