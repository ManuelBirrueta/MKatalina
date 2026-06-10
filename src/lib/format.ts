/**
 * ============================================================================
 * FORMAT HELPERS — KATALINA (Fase 12 Turno 3B.3: formatRelativeDate bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - formatRelativeDate ahora recibe `locale` como segundo parámetro
 *   - Usa Intl.RelativeTimeFormat con el locale correcto para que las
 *     unidades de tiempo (días, horas, etc.) se traduzcan automáticamente
 *   - El fallback "hace unos segundos" / "a few seconds ago" se recibe
 *     como parámetro `justNowText` para no acoplar el helper a messages.json
 *
 * Por qué pasamos justNowText como parámetro en lugar de tenerlo aquí:
 *   format.ts es un helper PURO sin dependencias de UI ni de next-intl.
 *   Mantener esa pureza facilita testing y evita ciclos de dependencias.
 *   Los componentes que llaman a formatRelativeDate ya tienen acceso a
 *   useTranslations, así que ellos resuelven justNowText y se lo pasan.
 *
 * Cómo lo usan los componentes:
 *   const t = useTranslations("reviews");
 *   const locale = useLocale() as Locale;
 *   const text = formatRelativeDate(
 *     review.createdAt,
 *     locale,
 *     t("relativeTime.justNow")
 *   );
 *
 * Intl.RelativeTimeFormat traduce automáticamente las unidades:
 *   - es-MX: "hace 2 días", "hace 1 mes", "hace 3 horas"
 *   - en-US: "2 days ago", "1 month ago", "3 hours ago"
 *
 * Y maneja casos especiales con numeric: "auto":
 *   - "hace 1 día" → "ayer" (es)
 *   - "1 day ago" → "yesterday" (en)
 * ============================================================================
 */

/**
 * Locale type — duplicado aquí (no importado de i18n/routing) para
 * mantener format.ts sin dependencias del sistema de i18n.
 */
type Locale = "es" | "en";

/**
 * formatPrice — formatea un número como precio en pesos mexicanos.
 *
 * NO se traduce — los precios siempre son en MXN regardless del idioma.
 * El símbolo $ y formato (1,240 con coma como separador) son universales
 * para esta tienda.
 *
 * Si en el futuro quisieras formato distinto en /en (ej. $1,240.00 MXN
 * con código de moneda), agregarías un locale param aquí también.
 *
 * Ejemplo: formatPrice(1240) → "$1,240"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0, // Sin decimales en precios redondos
  }).format(price);
}

/**
 * formatDiscount — calcula y formatea el porcentaje de descuento.
 *
 * "% off" es texto inglés universal en e-commerce, no se traduce.
 * Si quisieras "26% de descuento" en /es, habría que hacer el cambio
 * aquí + agregar el locale param.
 *
 * Ejemplo: formatDiscount(890, 1200) → "26% off"
 */
export function formatDiscount(
  currentPrice: number,
  originalPrice: number
): string {
  const discount = Math.round(
    ((originalPrice - currentPrice) / originalPrice) * 100
  );
  return `${discount}% off`;
}

/**
 * formatRelativeDate — convierte un timestamp ISO en texto relativo
 * localizado tipo "hace 2 días" / "2 days ago".
 *
 * Usa Intl.RelativeTimeFormat (nativo del browser desde 2018) que traduce
 * automáticamente las unidades de tiempo al locale especificado. Cero
 * bytes extra al bundle (vs. dayjs/date-fns).
 *
 * Estrategia: calcular la diferencia en múltiples unidades, elegir la más
 * grande que dé un número >= 1. Es lo que hace el cerebro humano al leer
 * "hace 2 días" vs "hace 48 horas".
 *
 * @param isoDateString fecha en formato ISO 8601
 * @param locale idioma del output ("es" o "en")
 * @param justNowText texto a usar para diferencias menores a 1 minuto.
 *                    Se pasa como parámetro para no acoplar este helper
 *                    a messages.json. El componente caller lo resuelve.
 */
export function formatRelativeDate(
  isoDateString: string,
  locale: Locale,
  justNowText: string
): string {
  const date = new Date(isoDateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Calcular la diferencia en cada unidad. Tomamos floor para evitar
  // fracciones (no queremos "hace 1.5 días", queremos "hace 1 día").
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  /**
   * Mapeo de nuestro locale a códigos BCP 47 que Intl entiende:
   *   "es" → "es-MX" (mexicano)
   *   "en" → "en-US" (americano por default)
   *
   * numeric: "auto" permite formas naturales del idioma:
   *   - es: "hace 1 día" → "ayer"
   *   - en: "1 day ago" → "yesterday"
   *   - es: "en 1 día" → "mañana"
   */
  const intlLocale = locale === "es" ? "es-MX" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" });

  // Elegir la unidad apropiada (más grande con valor >= 1).
  // Pasamos números negativos porque la diferencia es "en el pasado".
  if (diffYears > 0) return rtf.format(-diffYears, "year");
  if (diffMonths > 0) return rtf.format(-diffMonths, "month");
  if (diffWeeks > 0) return rtf.format(-diffWeeks, "week");
  if (diffDays > 0) return rtf.format(-diffDays, "day");
  if (diffHours > 0) return rtf.format(-diffHours, "hour");
  if (diffMinutes > 0) return rtf.format(-diffMinutes, "minute");

  // Para diferencias menores a 1 minuto, usamos el texto que pasó el caller
  // (traducido a su locale)
  return justNowText;
}