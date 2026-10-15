/**
 * ============================================================================
 * PAGE: /[locale]/admin/productos/nuevo — MKATALINA · Fase 13 · Etapa 4B
 * ============================================================================
 *
 * Página para CREAR un producto. Solo muestra el formulario vacío
 * (ProductForm en modo "create"); todo el trabajo lo hace el formulario.
 *
 * Seguridad: el layout de /admin exige ser administrador, y createProduct
 * (src/actions/admin-products.ts) lo vuelve a comprobar al guardar.
 *
 * Nota de rutas: la carpeta "nuevo" tiene prioridad sobre la carpeta "[id]"
 * de al lado, así que /admin/productos/nuevo nunca se confunde con un id.
 * ============================================================================
 */

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return <ProductForm mode="create" />;
}