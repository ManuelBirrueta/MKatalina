/**
 * ============================================================================
 * PAGE: /[locale]/admin/productos/[id] — MKATALINA · Fase 13 · Etapa 4B
 * ============================================================================
 *
 * Página para EDITAR un producto. [id] es el identificador del producto en la
 * base (el uuid de la tabla products), no el slug.
 *
 *   1. Lee el producto completo con getAdminProduct (src/actions/admin-products.ts),
 *      incluso si está oculto.
 *   2. Si no existe → página 404.
 *   3. Si existe → ProductForm en modo "edit" con sus datos y sus fotos.
 *
 * force-dynamic: siempre lee la versión más reciente de la base.
 * En Next.js 16 `params` es una promesa, por eso se usa con await.
 * ============================================================================
 */

import { notFound } from "next/navigation";
import { getAdminProduct } from "@/actions/admin-products";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return <ProductForm mode="edit" product={product} />;
}