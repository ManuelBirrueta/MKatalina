/**
 * ============================================================================
 * LOCALE LAYOUT — MKATALINA (Fase 12 Turno 3A: + SEO bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - generateMetadata reemplaza la metadata estática anterior
 *   - generateMetadata recibe `params.locale` y genera metadata específica
 *     para ese idioma:
 *       - title/description en el idioma activo (cuando sea aplicable)
 *       - alternates.canonical apunta a la URL en el idioma activo
 *       - alternates.languages declara TODAS las versiones del sitio
 *         (es y en) para que Google genere los <link rel="alternate" hreflang>
 *       - OpenGraph locale dinámico
 *
 * Sobre alternates.languages:
 *   Esto le dice a Next.js que genere automáticamente tags como:
 *     <link rel="alternate" hreflang="es" href="https://Mkatalina.mx/es" />
 *     <link rel="alternate" hreflang="en" href="https://Mkatalina.mx/en" />
 *     <link rel="alternate" hreflang="x-default" href="https://Mkatalina.mx/es" />
 *
 *   El "x-default" es el idioma fallback cuando Google no puede determinar
 *   la preferencia del usuario. Usamos español porque es nuestro default.
 *
 * Sobre las URLs en alternates:
 *   Apuntamos a "/es" y "/en" (las raíces de cada idioma). Cada página
 *   individual debería tener SUS PROPIOS alternates específicos (página
 *   /es/aretes apunta a /en/aretes). Pero para el layout global, declarar
 *   las raíces ya da a Google la señal de "este sitio existe en es y en".
 *
 *   Las páginas individuales pueden sobreescribir esto con su propio
 *   generateMetadata si necesitan alternates más específicos.
 * ============================================================================
 */

import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { playfair, dmSans } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import { routing } from "@/i18n/routing";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  OG_DEFAULT_IMAGE,
  TWITTER_HANDLE,
  GOOGLE_SITE_VERIFICATION,
} from "@/lib/seo";

/**
 * generateStaticParams genera una version estática para cada locale.
 * Next.js usa esto en build time para pre-renderizar /es/* y /en/*.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Generar metadata dinámica según el locale.
 *
 * Cambio importante respecto a versión anterior:
 *   - Antes era `export const metadata`: estática, igual para todos los locales
 *   - Ahora es `export async function generateMetadata`: dinámica, recibe
 *     params y genera distinta metadata para /es y /en
 *
 * Esto permite:
 *   - alternates.canonical específica del locale activo
 *   - alternates.languages declarando ambas versiones
 *   - openGraph.locale correcto (es_MX vs en_US)
 *   - html lang correcto en cada versión
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  /**
   * URL canónica del locale activo.
   * Si estamos generando metadata para /es, canonical es https://Mkatalina.mx/es
   */
  const canonicalUrl = `${SITE_URL}/${locale}`;

  /**
   * languages: mapping de cada locale soportado a su URL.
   * Next.js genera automáticamente los <link rel="alternate" hreflang> en HTML.
   */
  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = `${SITE_URL}/${loc}`;
  });

  /**
   * x-default: idioma fallback cuando Google no sabe qué servir.
   * Usamos español porque es nuestro default.
   *
   * Aunque defaultLocale es "es", apuntamos a /es explícitamente porque
   * con localePrefix: "always", no hay URL sin prefijo.
   */
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}`;

  /**
   * Mapeo de locale a códigos OpenGraph estándar.
   * OpenGraph espera códigos como "es_MX", "en_US", no solo "es" o "en".
   */
  const openGraphLocale = locale === "es" ? "es_MX" : "en_US";

  return {
    metadataBase: new URL(SITE_URL),

    title: {
      default: `${SITE_NAME} — ${locale === "es" ? "Joyería artesanal mexicana" : "Mexican handcrafted jewelry"}`,
      template: `%s · ${SITE_NAME}`,
    },

    description: SITE_DESCRIPTION,

    keywords:
      locale === "es"
        ? [
            "joyería artesanal",
            "joyería mexicana",
            "aretes plata 925",
            "collares oro rosa",
            "pulseras hechas a mano",
            "gargantillas",
            "joyería Mazatlán",
            SITE_NAME,
          ]
        : [
            "handcrafted jewelry",
            "mexican jewelry",
            "sterling silver earrings",
            "rose gold necklaces",
            "handmade bracelets",
            "chokers",
            "Mazatlán jewelry",
            SITE_NAME,
          ],

    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,

    formatDetection: {
      email: true,
      telephone: true,
      address: false,
    },

    openGraph: {
      type: "website",
      locale: openGraphLocale,
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${locale === "es" ? "Joyería artesanal mexicana" : "Mexican handcrafted jewelry"}`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: OG_DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${locale === "es" ? "Joyería artesanal mexicana" : "Mexican handcrafted jewelry"}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${locale === "es" ? "Joyería artesanal mexicana" : "Mexican handcrafted jewelry"}`,
      description: SITE_DESCRIPTION,
      images: [OG_DEFAULT_IMAGE],
      creator: TWITTER_HANDLE,
      site: TWITTER_HANDLE,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    verification: GOOGLE_SITE_VERIFICATION
      ? { google: GOOGLE_SITE_VERIFICATION }
      : undefined,

    /**
     * Alternates: declara las versiones bilingues a Google.
     *
     * Next.js convierte esto en:
     *   <link rel="canonical" href="https://Mkatalina.mx/es" />
     *   <link rel="alternate" hreflang="es" href="https://Mkatalina.mx/es" />
     *   <link rel="alternate" hreflang="en" href="https://Mkatalina.mx/en" />
     *   <link rel="alternate" hreflang="x-default" href="https://Mkatalina.mx/es" />
     */
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${dmSans.variable} ${playfair.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Structured data global */}
          <JsonLd data={organizationSchema()} />
          <JsonLd data={websiteSchema()} />

          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}