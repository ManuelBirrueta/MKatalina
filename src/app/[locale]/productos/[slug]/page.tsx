/**
 * ============================================================================
 * PAGE: /[locale]/productos/[slug] — MKATALINA (Fase 13 · Etapa 3: desde la base)
 * ============================================================================
 *
 * Ficha de un producto. Componente de SERVIDOR que arma la metadata SEO, los
 * datos estructurados (JSON-LD) y la página, y les pasa los datos ya listos a
 * los componentes hijos (ProductInfo, ProductAccordion… son de navegador y
 * resuelven el idioma por su cuenta con useLocale).
 *
 * CAMBIOS DE ESTA ETAPA:
 *
 *   1. El producto se lee de la BASE con getProductDetail() de
 *      src/lib/products-db.ts. Ese único dato ya trae todo lo que antes se
 *      juntaba a mano (products.ts + productDetailsMap/defaultExtras):
 *      descripción, medidas y cuidados. Un producto retirado desde el panel
 *      (isActive = false) devuelve null → 404.
 *
 *   2. SE QUITÓ generateStaticParams y se agregó `dynamic = "force-dynamic"`.
 *      generateStaticParams generaba TODAS las fichas al compilar, lo que
 *      congelaba precio, stock y nombre hasta el siguiente despliegue. Ahora
 *      cada visita lee la base, así que lo que cambies en el panel se ve al
 *      recargar.
 *
 *   3. Los relacionados vienen de getRelatedProducts() (misma categoría, sin
 *      el actual, solo visibles).
 *
 *   4. RESEÑAS: la sección de reseñas sigue usando los datos de muestra de
 *      src/data/reviews.ts (pasarlas a la base es un paso aparte). Para que
 *      las estrellitas de arriba (ProductInfo) coincidan SIEMPRE con la
 *      sección de abajo, averageRating y reviewCount se calculan con esas
 *      mismas reseñas, y no con la tabla `reviews` (hoy vacía).
 *
 * generateMetadata y getProductDetail se llaman con el mismo slug en la misma
 * petición; gracias a cache() de React la base se consulta una sola vez.
 *
 * Sobre buildProductDescription: sigue siendo una función pura que recibe
 * strings ya resueltos al idioma y devuelve el texto para SEO.
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
import { getProductDetail, getRelatedProducts } from "@/lib/products-db";
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

// Leer la base en cada visita (ver punto 2 de la cabecera).
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

/**
 * buildProductDescription — texto para metadata y JSON-LD.
 * Recibe strings YA resueltos al idioma activo.
 */
function buildProductDescription(
  product: Product,
  productName: string,
  detailsDescription: string | undefined,
  materialText: string,
  colorText: string,
): string {
  if (detailsDescription) {
    const trimmed = detailsDescription.slice(0, 120);
    return `${trimmed}${detailsDescription.length > 120 ? "..." : ""} Desde ${formatPrice(product.price)}.`;
  }

  return `${productName} en ${materialText}, color ${colorText}. Joyería artesanal mexicana hecha a mano por ${SITE_NAME}. Desde ${formatPrice(product.price)}.`;
}

/**
 * Labels de material y color por idioma. Solo se usan para armar la
 * descripción SEO cuando un producto no tiene descripción propia.
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

/**
 * Textos de material/color resueltos al idioma (para la descripción SEO).
 * Se usa en generateMetadata y en la página, por eso vive en una función.
 */
function getMaterialColorText(product: Product, locale: Locale) {
  const materialLabels =
    locale === "en" ? MATERIAL_LABELS_EN : MATERIAL_LABELS_ES;
  const colorLabels = locale === "en" ? COLOR_LABELS_EN : COLOR_LABELS_ES;
  return {
    materialText: materialLabels[product.material] ?? product.material,
    colorText: colorLabels[product.color] ?? product.color,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const locale = (await getLocale()) as Locale;

  const productName = getLocalized(product.name, locale);
  const detailsDescription = getLocalized(product.description, locale);
  const { materialText, colorText } = getMaterialColorText(product, locale);

  const description = buildProductDescription(
    product,
    productName,
    detailsDescription,
    materialText,
    colorText,
  );

  // Imagen para compartir: las rutas locales ("/placeholder-…") se vuelven
  // absolutas; las de Supabase Storage ya son URLs completas.
  const imageUrl = product.images[0]?.src.startsWith("/")
    ? absoluteUrl(product.images[0].src)
    : (product.images[0]?.src ?? absoluteUrl("/og-default.svg"));

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

  // Producto completo desde la base (null si no existe o está retirado).
  const productFromDb = await getProductDetail(slug);
  if (!productFromDb) {
    notFound();
  }

  const locale = (await getLocale()) as Locale;

  /**
   * Reseñas (datos de muestra, ver punto 4 de la cabecera). Se cargan en el
   * servidor para que vayan en el HTML inicial (mejor SEO y carga inmediata).
   */
  const initialReviews = getReviewsByProduct(productFromDb.slug);
  const initialStats = calculateReviewStats(productFromDb.slug);

  // Estrellitas de arriba = las mismas reseñas que se muestran abajo.
  const reviewCount = initialReviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          (initialReviews.reduce((sum, review) => sum + review.rating, 0) /
            reviewCount) *
            10,
        ) / 10
      : 0;

  const product = { ...productFromDb, averageRating, reviewCount };

  // Datos pre-resueltos para metadata y datos estructurados.
  const productName = getLocalized(product.name, locale);
  const detailsDescription = getLocalized(product.description, locale);
  const { materialText, colorText } = getMaterialColorText(product, locale);

  const description = buildProductDescription(
    product,
    productName,
    detailsDescription,
    materialText,
    colorText,
  );

  // Hasta 4 productos visibles de la misma categoría, sin el actual.
  const related = await getRelatedProducts(product.slug, product.category, 4);

  // Datos estructurados del producto (para Google).
  const productJsonLd = productSchema(
    product,
    initialReviews,
    initialStats,
    description,
  );

  // Migas de pan para SEO. La categoría va con su enum en español.
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
      {/* Structured Data */}
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
            <ProductGallery images={product.images} productName={productName} />

            <div>
              {/* ProductInfo (navegador): resuelve el idioma con useLocale */}
              <ProductInfo product={product} />

              <div className="mt-8">
                {/* ProductActions: carrito, wishlist y apartado */}
                <ProductActions product={product} />
              </div>

              <div className="mt-8">
                {/* ProductAccordion (navegador): descripción, medidas, cuidados */}
                <ProductAccordion product={product} />
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