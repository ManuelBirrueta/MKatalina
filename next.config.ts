/**
 * ============================================================================
 *  MKatalina · Configuración de Next.js
 * ============================================================================
 *
 *  - next-intl: el plugin conecta la configuración de idiomas (src/i18n).
 *
 *  - images.remotePatterns (NUEVO, Fase 13 · Etapa 2):
 *    <Image> de Next.js solo optimiza imágenes de dominios autorizados aquí.
 *    Autorizamos ÚNICAMENTE la carpeta pública del bucket "product-images" de
 *    tu proyecto de Supabase, donde el panel sube las fotos de productos.
 *    Sin esto, una foto subida daría el error "hostname is not configured".
 *
 *    El dominio se lee de NEXT_PUBLIC_SUPABASE_URL (Next.js carga el .env
 *    antes de leer este archivo; en Vercel viene de sus variables). Si por
 *    alguna razón faltara, se usa el dominio de tu proyecto como respaldo.
 *
 *  Si cambias este archivo, REINICIA `npm run dev`: no se recarga solo.
 * ============================================================================
 */

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Dominio de Supabase (ej. "odylqbhkokulqffwniuz.supabase.co"). */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "odylqbhkokulqffwniuz.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        // Solo los archivos públicos de ESTE bucket, nada más del dominio.
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);