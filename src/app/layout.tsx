/**
 * ============================================================================
 * ROOT LAYOUT (mínimo) — KATALINA
 * ============================================================================
 *
 * Layout raíz minimalista.
 *
 * Next.js requiere que exista un archivo app/layout.tsx en la raíz, pero
 * ahora que tenemos rutas por idioma en app/[locale]/, el layout "real"
 * con Header, Footer, fonts y metadata vive ahí.
 *
 * Este archivo solo retorna children. No tiene Header, Footer, fonts ni
 * <html>/<body> tags — esos viven en [locale]/layout.tsx.
 *
 * Por qué retornamos solo children:
 *   En App Router con i18n via [locale], el layout que envuelve realmente
 *   las páginas es [locale]/layout.tsx. Ese layout SÍ tiene <html> y <body>
 *   con el lang correcto según el idioma del usuario.
 *
 *   Si este layout raíz también tuviera <html>/<body>, habría tags
 *   duplicados. Por eso lo dejamos pasante (passthrough).
 *
 * Sobre globals.css:
 *   Importamos los estilos globales aquí porque cualquier layout que se
 *   importe a sí mismo desde Next.js debe declarar las dependencias
 *   estilísticas. El [locale]/layout.tsx no necesita re-importarlos.
 * ============================================================================
 */

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}