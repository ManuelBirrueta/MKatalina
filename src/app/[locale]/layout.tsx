/**
 * ============================================================================
 * LOCALE LAYOUT — MKATALINA (Fase 13 · Etapa 3B: + catálogo desde la base)
 * ============================================================================
 *
 * CAMBIO DE ESTA ETAPA (catálogo para el navegador):
 *   - Se lee el catálogo de productos VISIBLES desde la base
 *     (getActiveProducts) y se entrega a <CatalogProvider>, que lo comparte
 *     con la búsqueda, el carrito y la wishlist (componentes de navegador que
 *     no pueden consultar la base).
 *   - `dynamic = "force-dynamic"`: este layout envuelve TODAS las páginas. Si
 *     Next.js lo congelara al compilar (como puede pasar con el inicio o las
 *     páginas informativas), el carrito y la búsqueda de esas páginas usarían
 *     precios y productos viejos hasta el siguiente despliegue. Así, cada
 *     visita lee el catálogo actual.
 *
 * Lo que NO cambia:
 *   - generateMetadata (SEO bilingüe con canonical, hreflang, OpenGraph…).
 *   - NextIntlClientProvider, Header, Footer, Toaster y datos estructurados.
 *
 * Sobre alternates.languages:
 *   Next.js genera automáticamente los <link rel="alternate" hreflang="…">
 *   para /es, /en y x-default (español, el idioma por defecto). Cada página
 *   puede declarar alternates más específicos en su propio generateMetadata.
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
import { CatalogProvider } from "@/components/providers/CatalogProvider";
import { getActiveProducts } from "@/lib/products-db";
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

// Generar en cada visita para que el catálogo esté siempre al día (ver cabecera).
export const dynamic = "force-dynamic";

/**
 * Los idiomas válidos de la ruta (/es, /en). Con force-dynamic ya no se
 * pre-generan páginas al compilar, pero se conserva como lista de idiomas.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Metadata dinámica según el idioma: canonical del idioma activo, hreflang
 * de todas las versiones, OpenGraph con es_MX / en_US, palabras clave, etc.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // URL canónica del idioma activo (ej. https://…/es).
  const canonicalUrl = `${SITE_URL}/${locale}`;

  // Cada idioma soportado → su URL (Next.js genera los <link hreflang>).
  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = `${SITE_URL}/${loc}`;
  });

  // x-default: el idioma de respaldo cuando Google no sabe cuál servir.
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}`;

  // OpenGraph espera códigos como "es_MX" / "en_US".
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

  // Traducciones y catálogo en paralelo (no dependen uno del otro).
  const [messages, catalog] = await Promise.all([
    getMessages(),
    getActiveProducts(),
  ]);

  return (
    <html lang={locale}>
      <body
        className={`${dmSans.variable} ${playfair.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/*
           * CatalogProvider envuelve Header (contador del carrito, búsqueda),
           * las páginas y el Footer: todo lo que use useCart, useWishlist o
           * useCatalog debe quedar dentro.
           */}
          <CatalogProvider products={catalog}>
            {/* Structured data global */}
            <JsonLd data={organizationSchema()} />
            <JsonLd data={websiteSchema()} />

            <Header />
            <main>{children}</main>
            <Footer />
            <Toaster />
          </CatalogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}