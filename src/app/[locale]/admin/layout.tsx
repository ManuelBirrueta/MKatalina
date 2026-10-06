/**
 * ============================================================================
 * LAYOUT: /[locale]/admin — MKATALINA · Fase 13 · Panel de administración
 * ============================================================================
 *
 * Componente de SERVIDOR que:
 *   1. Llama a requireAdmin() antes de renderizar (solo un admin pasa).
 *   2. Muestra el título y la navegación del panel (AdminNav, con pestañas
 *      Pedidos / Apartados y resaltado de la activa).
 * ============================================================================
 */

import { Container } from "@/components/layout/Container";
import { AdminNav } from "@/components/layout/AdminNav";
import { requireAdmin } from "@/lib/auth";

const COPY = {
  es: { title: "Panel de administración" },
  en: { title: "Admin panel" },
} as const;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // GUARD: solo administradores.
  await requireAdmin(locale);

  const t = locale === "en" ? COPY.en : COPY.es;

  return (
    <Container>
      <div className="py-8 lg:py-12">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">
            {t.title}
          </p>
          <AdminNav />
        </header>

        {children}
      </div>
    </Container>
  );
}