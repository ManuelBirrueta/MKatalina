/**
 * ============================================================================
 * JSON-LD COMPONENT — KATALINA
 * ============================================================================
 *
 * Componente reutilizable que renderiza un objeto JavaScript como un script
 * <script type="application/ld+json"> dentro del HTML.
 *
 * Por qué un componente en lugar de inline:
 *   - Reutilizable en cualquier página
 *   - Manejo correcto del serializado (escapado de caracteres especiales)
 *   - Permite múltiples JSON-LD en la misma página (Google los acepta)
 *
 * Server Component:
 *   No necesita "use client" porque solo renderiza HTML estático.
 *   Esto es importante: el JSON-LD viaja en el HTML inicial que recibe
 *   el navegador, así que está disponible para crawlers inmediatamente.
 *
 * Sobre dangerouslySetInnerHTML:
 *   Lo usamos porque necesitamos inyectar el JSON sin que React lo escape
 *   como texto. Es seguro porque:
 *     1. El contenido lo controlamos nosotros (no viene del usuario)
 *     2. JSON.stringify ya escapa los caracteres problemáticos del JSON
 *     3. Es el patrón estándar para JSON-LD en Next.js y otros frameworks
 *
 *   Si en el futuro el contenido viniera de user input, tendríamos que
 *   escapar adicionalmente para prevenir XSS. Por ahora N/A.
 *
 * Sobre el escape de </script>:
 *   Una vulnerabilidad teórica: si el JSON contiene la cadena "</script>",
 *   rompería el cierre del script tag en el HTML. JSON.stringify NO escapa
 *   eso por default. Hacemos un replace adicional para neutralizarlo.
 *
 *   Es muy improbable en nuestro contenido (precios, nombres de productos,
 *   reseñas) pero es buena práctica.
 * ============================================================================
 */

interface JsonLdProps {
  /**
   * El objeto JSON-LD a renderizar. Cualquier objeto serializable.
   * Típicamente generado por una de las funciones de lib/jsonld.ts.
   */
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  /**
   * Serializar a JSON string.
   *
   * No usamos indent (segundo argumento de stringify) porque añade espacios
   * en blanco innecesarios que aumentan el tamaño del HTML sin beneficio.
   * Google parsea ambas versiones igual.
   */
  const json = JSON.stringify(data);

  /**
   * Escapar </script> dentro del contenido para evitar break del script tag.
   * Reemplaza "</script>" con la versión escapada que JavaScript reconoce
   * pero que no termina el tag.
   *
   * Esto es paranoia defensiva — muy poco probable en nuestro contenido
   * pero es estándar en bibliotecas serias de SEO.
   */
  const safeJson = json.replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}