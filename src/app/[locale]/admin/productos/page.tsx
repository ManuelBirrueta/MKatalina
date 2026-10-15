/**
 * ============================================================================
 * PAGE: /[locale]/admin/productos — MKATALINA · Fase 13 · Etapa 4A
 * ============================================================================
 *
 * Lista de TODOS los productos del catálogo (visibles y ocultos) para el
 * administrador. Solo en español: es una herramienta interna.
 *
 * Cómo está armada:
 *   - Esta página es un componente de SERVIDOR: pide los productos a la base
 *     (getAdminProducts, en src/actions/admin-products.ts) ANTES de mandar la
 *     página, así llega con datos y sin parpadeo de "cargando".
 *   - La tabla con botones (AdminProductsTable) es un componente de CLIENTE,
 *     porque reacciona a clics y escribe en campos.
 *
 * Seguridad: el layout de /admin ya exige ser administrador (requireAdmin),
 * y además getAdminProducts vuelve a comprobarlo por su cuenta.
 *
 * force-dynamic: la lista se lee de la base en cada visita (nunca una copia
 * guardada), para ver siempre el stock y la visibilidad reales.
 * ============================================================================
 */

import { getAdminProducts } from "@/actions/admin-products";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  return <AdminProductsTable initialProducts={products} />;
}