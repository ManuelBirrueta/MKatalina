/**
 * ============================================================================
 * I18N HELPERS — KATALINA (Fase 12 Turno 3A)
 * ============================================================================
 *
 * Tipos y helpers para manejar contenido bilingüe en data layer (productos,
 * páginas estáticas, etc).
 *
 * Diferencia clave vs next-intl:
 *   - next-intl maneja textos del UI (botones, labels, mensajes de error)
 *     vía archivos messages/{es,en}.json
 *   - Este helper maneja CONTENIDO EDITORIAL bilingüe que vive en data
 *     (descripciones de productos, párrafos legales, FAQs, etc.)
 *
 * Por qué dos sistemas:
 *   - UI labels son globales y reutilizables → JSON files es el patrón
 *   - Contenido editorial es por-pieza → debe vivir junto a la pieza
 *     (un producto tiene su descripción, una FAQ tiene su respuesta)
 *
 * Cuando se haga el backend, los campos LocalizedString se convertirán
 * en columnas separadas en la DB (description_es, description_en) o en
 * un campo JSON nativo. Pero la API de este helper queda estable.
 *
 * ─── ACTUALIZADO Turno 3B fix-confirmation ──────────────────────────────
 *   Se agregó `getLocalizedSafe()` que tolera datos legacy (string puro)
 *   y datos nuevos (LocalizedString). Útil para componentes que reciben
 *   datos persistidos (sessionStorage, localStorage, backend) que pueden
 *   tener formato viejo.
 * ============================================================================
 */

/**
 * LocalizedString — par de strings es/en para contenido editorial.
 *
 * Ejemplo:
 *   const greeting: LocalizedString = {
 *     es: "Bienvenido",
 *     en: "Welcome"
 *   };
 */
export interface LocalizedString {
  es: string;
  en: string;
}

/**
 * LocalizedStringArray — par de arrays de strings es/en.
 *
 * Útil cuando el contenido es una lista (instrucciones de cuidado,
 * párrafos de una sección legal, líneas de envío).
 *
 * Ejemplo:
 *   const careInstructions: LocalizedStringArray = {
 *     es: ["Evita el agua", "Limpia con paño suave"],
 *     en: ["Avoid water", "Clean with soft cloth"]
 *   };
 */
export interface LocalizedStringArray {
  es: string[];
  en: string[];
}

/**
 * Locale type (idéntico al de routing).
 * Lo duplicamos aquí para no crear dependencia circular entre i18n-helpers
 * y i18n/routing.
 */
type Locale = "es" | "en";

/**
 * getLocalized — resuelve un LocalizedString al idioma activo.
 *
 * Función "tonta" pero centralizada para que:
 *   - El día que agreguemos más idiomas, solo cambiamos esta función
 *   - Manejamos el fallback consistentemente (si no hay traducción, usar español)
 *   - El código consumer es más legible: `getLocalized(p.name, locale)`
 *     en lugar de `p.name[locale] || p.name.es`
 *
 * Si el campo no tiene el idioma activo, hace fallback a español (que es
 * el idioma default del sitio y siempre debe existir).
 */
export function getLocalized(field: LocalizedString, locale: Locale): string {
  return field[locale] ?? field.es;
}

/**
 * getLocalizedArray — versión para arrays.
 *
 * Mismo comportamiento de fallback que getLocalized.
 */
export function getLocalizedArray(
  field: LocalizedStringArray,
  locale: Locale
): string[] {
  return field[locale] ?? field.es;
}

/**
 * ============================================================================
 * HELPER DEFENSIVO — getLocalizedSafe
 * ============================================================================
 *
 * Resuelve un campo que PUEDE ser string puro (formato legacy) o
 * LocalizedString (formato nuevo bilingüe).
 *
 * Caso de uso:
 *   Datos persistidos (sessionStorage, localStorage, backend) creados
 *   ANTES de un cambio de tipos pueden tener `name: string`. Datos nuevos
 *   tendrán `name: { es, en }`. Este helper acepta ambos sin crashear.
 *
 * Ejemplo real (página de confirmación):
 *   Una orden guardada en sessionStorage antes del Turno 3B tendrá los
 *   items con `name: "Aretes Camelia"` (string).
 *   Una orden guardada después tendrá `name: { es: "Aretes Camelia",
 *   en: "Camelia Earrings" }`.
 *   getLocalizedSafe maneja ambos sin tirar el error
 *   "Objects are not valid as a React child".
 *
 * Cuándo usar este helper en lugar de getLocalized:
 *   - Datos que vienen de storage persistente (puede haber versiones viejas)
 *   - Datos que vienen del backend durante migración de schema
 *   - Migraciones graduales donde no quieres invalidar todo lo viejo
 *
 * NO usar para:
 *   - Datos que sabemos que son siempre LocalizedString (data files
 *     estáticos como products.ts) — ahí usa getLocalized() directo
 *   - Datos que sabemos que son siempre string (precios, IDs) — esos
 *     son strings por naturaleza
 */
export function getLocalizedSafe(
  field: string | LocalizedString | undefined | null,
  locale: Locale
): string {
  // Casos null/undefined → string vacío (no rompe el render)
  if (field === null || field === undefined) {
    return "";
  }

  // Formato legacy: ya es string, devolverlo tal cual
  if (typeof field === "string") {
    return field;
  }

  // Formato nuevo: es LocalizedString, resolver al locale
  // (con fallback a español si el idioma activo no tiene traducción)
  return field[locale] ?? field.es ?? "";
}