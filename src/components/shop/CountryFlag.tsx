/**
 * ============================================================================
 * COUNTRY FLAG — MKATALINA · Fase 13 · Etapa 7.1
 * ============================================================================
 *
 * Dibuja la bandera de un país a partir de su código de 2 letras ("MX",
 * "US", "ES"…), usando los archivos SVG de public/flags (los copia
 * scripts/copy-flags.mjs).
 *
 * ¿Por qué una imagen y no el emoji 🇲🇽?
 *   Windows NO dibuja los emojis de banderas: en Chrome/Edge de Windows se
 *   ven como dos letras ("MX"). Con un SVG la bandera se ve igual en todos
 *   los sistemas.
 *
 * Detalles:
 *   - loading="lazy": en una lista larga, el navegador solo descarga las
 *     banderas que se ven (cada una pesa ≈0.7 KB).
 *   - alt="": la bandera es decoración; el nombre del país siempre está
 *     escrito al lado, así que el lector de pantalla no la repite.
 *   - Un borde muy tenue (ring) para que las banderas con blanco (Japón,
 *     Canadá…) no se pierdan sobre el fondo claro.
 *   - Si el archivo no existe, la imagen se oculta (no aparece el ícono de
 *     imagen rota).
 *
 * Lo usa CountrySelect.tsx (selector de país y de lada).
 * ============================================================================
 */

"use client";

import { cn } from "@/lib/utils";

export function CountryFlag({
  code,
  className,
}: {
  /** Código ISO de 2 letras, ej. "MX". */
  code: string;
  className?: string;
}) {
  if (!/^[A-Z]{2}$/.test(code)) return null;

  return (
    // Imagen simple a propósito: SVG local y diminuto, no necesita el
    // optimizador de next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      alt=""
      aria-hidden="true"
      width={20}
      height={14}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
      className={cn(
        "inline-block h-3.5 w-5 flex-shrink-0 rounded-[2px] object-cover",
        "ring-1 ring-foreground/10",
        className,
      )}
    />
  );
}