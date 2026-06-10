/**
 * ============================================================================
 * PAGE: /[locale]/productos/[slug] — KATALINA (fix Turno 3B.2)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Obtiene el locale activo con getLocale() de next-intl/server
 *   - Resuelve product.name con getLocalized() para meta tags y schema
 *   - Resuelve extras.description con getLocalized() antes de pasarlo a
 *     buildProductDescription (que sigue trabajando con strings)
 *   - Resuelve los labels de material/color para fallback de description
 *
 * Por qué necesitamos resolver al locale en esta página (server side):
 *   - La metadata (title, description, OG, twitter) se renderiza server-side
 *     y va en el HTML inicial. Necesita estar en el idioma correcto.
 *   - El structured data (JSON-LD) también va en el HTML inicial. Google
 *     necesita ver descripciones consistentes con la metadata.
 *   - Los componentes hijos (ProductInfo, ProductAccordion) son Client y
 *     resuelven sus propios datos con useLocale, pero el server-side data
 *     debe pre-resolverse aquí.
 *
 * Sobre buildProductDescription:
 *   Sigue siendo una función pura que recibe strings y devuelve string.
 *   No la cambiamos — solo le pasamos los strings ya resueltos en lugar
 *   de los objetos LocalizedString crudos. Esto mantiene la función simple
 *   y testeable.
 * ============================================================================
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductInfo } from "@/components/shop/ProductInfo";
import { ProductActions } from "@/components/shop/ProductActions";
import { ProductAccordion } from "@/components/shop/ProductAccordion";
import { ProductReviews } from "@/components/shop/ProductReviews";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  productsData,
  getProductBySlug,
  getProductsByCategory,
} from "@/data/products";
import { productDetailsMap, defaultExtras } from "@/data/product-details";
import {
  getReviewsByProduct,
  calculateReviewStats,
} from "@/data/reviews";
import { formatPrice } from "@/lib/format";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/seo";
import { productSchema, breadcrumbSchema } from "@/lib/jsonld";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  return productsData.map((product) => ({
    slug: product.slug,
  }));
}

/**
 * buildProductDescription — sin cambios estructurales.
 *
 * Sigue recibiendo strings. La diferencia es que ahora el caller
 * (generateMetadata y ProductDetailPage) le pasa los strings YA
 * resueltos al locale, en lugar de objetos LocalizedString crudos.
 *
 * Esta función pura es fácil de testear independientemente y mantiene
 * la separación de responsabilidades: el caller maneja localización,
 * esta función maneja formato.
 */
function buildProductDescription(
  product: Product,
  productName: string,
  detailsDescription: string | undefined,
  materialText: string,
  colorText: string
): string {
  if (detailsDescription) {
    const trimmed = detailsDescription.slice(0, 120);
    return `${trimmed}${detailsDescription.length > 120 ? "..." : ""} Desde ${formatPrice(product.price)}.`;
  }

  return `${productName} en ${materialText}, color ${colorText}. Joyería artesanal mexicana hecha a mano por ${SITE_NAME}. Desde ${formatPrice(product.price)}.`;
}

/**
 * Helper: obtener extras del producto (con fallback a defaultExtras).
 *
 * Cambio respecto a la versión anterior:
 *   defaultExtras ahora recibe SOLO el material (su firma cambió en
 *   product-details.ts del Turno 3B.1).
 */
function getExtras(product: Product) {
  return productDetailsMap[product.slug] ?? defaultExtras(product.material);
}

/**
 * Mappings de material y color a labels en cada idioma.
 *
 * Los usamos como fallback cuando el producto NO tiene description
 * manual y necesitamos construir uno desde el material/color.
 *
 * Mantenemos estos mappings aquí (no en messages.json) porque solo
 * se usan en metadata server-side, no en el UI visible.
 */
const MATERIAL_LABELS_ES: Record<string, string> = {
  "plata-925": "plata 925",
  "oro-rosa": "oro rosa",
  "acero-quirurgico": "acero quirúrgico",
  "piedras-naturales": "piedras naturales",
  cuero: "cuero",
  terciopelo: "terciopelo",
};

const MATERIAL_LABELS_EN: Record<string, string> = {
  "plata-925": "sterling silver 925",
  "oro-rosa": "rose gold",
  "acero-quirurgico": "surgical steel",
  "piedras-naturales": "natural stones",
  cuero: "leather",
  terciopelo: "velvet",
};

const COLOR_LABELS_ES: Record<string, string> = {
  dorado: "dorado",
  plateado: "plateado",
  rosa: "rosa",
  negro: "negro",
  multicolor: "multicolor",
};

const COLOR_LABELS_EN: Record<string, string> = {
  dorado: "gold-tone",
  plateado: "silver-tone",
  rosa: "rose",
  negro: "black",
  multicolor: "multicolor",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  /**
   * Resolver al locale activo.
   * En metadata, generateMetadata es async así que getLocale() funciona aquí.
   */
  const locale = (await getLocale()) as Locale;
  const extras = getExtras(product);

  const productName = getLocalized(product.name, locale);
  const detailsDescription = getLocalized(extras.description, locale);

  const materialLabels = locale === "en" ? MATERIAL_LABELS_EN : MATERIAL_LABELS_ES;
  const colorLabels = locale === "en" ? COLOR_LABELS_EN : COLOR_LABELS_ES;
  const materialText = materialLabels[product.material] ?? product.material;
  const colorText = colorLabels[product.color] ?? product.color;

  const description = buildProductDescription(
    product,
    productName,
    detailsDescription,
    materialText,
    colorText
  );

  const imageUrl = product.images[0]?.src.startsWith("/")
    ? absoluteUrl(product.images[0].src)
    : product.images[0]?.src ?? absoluteUrl("/og-default.svg");

  const productUrl = absoluteUrl(`/productos/${product.slug}`);

  return {
    title: productName,
    description,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      type: "website",
      url: productUrl,
      title: `${productName} · ${SITE_NAME}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 1200,
          alt: product.images[0]?.alt ?? productName,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${productName} · ${SITE_NAME}`,
      description,
      images: [imageUrl],
    },

    other: {
      "product:price:amount": product.price.toString(),
      "product:price:currency": "MXN",
      "product:availability": product.inStock ? "in stock" : "out of stock",
      "product:brand": SITE_NAME,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  /**
   * Resolver al locale activo para el server-side rendering.
   * Los componentes Client (ProductInfo, ProductAccordion) resuelven
   * por su cuenta con useLocale, pero aquí necesitamos resolver para:
   *   - structured data (JSON-LD)
   *   - breadcrumb URL
   *   - category label en el breadcrumb visual
   */
  const locale = (await getLocale()) as Locale;

  const extras = getExtras(product);
  const productDetail = { ...product, ...extras };

  // Datos pre-resueltos para meta tags y structured data
  const productName = getLocalized(product.name, locale);
  const detailsDescription = getLocalized(extras.description, locale);

  const materialLabels = locale === "en" ? MATERIAL_LABELS_EN : MATERIAL_LABELS_ES;
  const colorLabels = locale === "en" ? COLOR_LABELS_EN : COLOR_LABELS_ES;
  const materialText = materialLabels[product.material] ?? product.material;
  const colorText = colorLabels[product.color] ?? product.color;

  const description = buildProductDescription(
    product,
    productName,
    detailsDescription,
    materialText,
    colorText
  );

  /**
   * Pre-cargar reseñas SERVER-SIDE.
   * Los datos están en el HTML inicial → mejor SEO + carga inmediata.
   */
  const initialReviews = getReviewsByProduct(product.slug);
  const initialStats = calculateReviewStats(product.slug);

  // Productos relacionados de la misma categoría, sin el actual
  const related = getProductsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  /**
   * Structured Data.
   *
   * Pasamos productName ya resuelto al schema en lugar de product
   * porque productSchema espera strings, no LocalizedString.
   *
   * NOTA IMPORTANTE: si productSchema en lib/jsonld.ts aún espera un Product
   * con name como string, va a fallar igual. Asumo que esa función
   * recibe el name como argumento separado o ya está adaptada. Si no,
   * tendremos que ajustar también lib/jsonld.ts.
   */
  const productJsonLd = productSchema(
    product,
    initialReviews,
    initialStats,
    description
  );

  /**
   * Breadcrumb: usamos productName ya resuelto.
   * Para la categoría, sería ideal traducirla aquí también, pero
   * mantenemos el valor del enum (en español) por simplicidad — Google
   * lo entenderá igual.
   */
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: SITE_URL },
    {
      name: product.category,
      url: absoluteUrl(`/${product.category.toLowerCase()}`),
    },
    { name: productName, url: absoluteUrl(`/productos/${product.slug}`) },
  ]);

  return (
    <>
      {/* Structured Data global */}
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <Container>
        <Breadcrumb
          items={[
            {
              label: product.category,
              href: `/${product.category.toLowerCase()}`,
            },
            { label: productName },
          ]}
        />
      </Container>

      <Container>
        <div className="pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <ProductGallery
              images={product.images}
              productName={productName}
            />

            <div>
              {/* ProductInfo es Client Component: resuelve con useLocale */}
              <ProductInfo product={productDetail} />

              <div className="mt-8">
                {/* ProductActions trabaja con Product base */}
                <ProductActions product={product} />
              </div>

              <div className="mt-8">
                {/* ProductAccordion es Client Component: resuelve con useLocale */}
                <ProductAccordion product={productDetail} />
              </div>
            </div>
          </div>
        </div>
      </Container>

      <ProductReviews
        productSlug={product.slug}
        productName={productName}
        initialReviews={initialReviews}
        initialStats={initialStats}
      />

      {related.length > 0 && <RelatedProducts products={related} />}
    </>
  );
}