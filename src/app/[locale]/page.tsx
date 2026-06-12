/**
 * ============================================================================
 * HOME PAGE — MKATALINA
 * ============================================================================
 *
 * La página principal de la tienda. Compone las 6 secciones que construimos
 * en la Fase 4:
 *
 *   1. Hero — primer impacto (imagen + título + CTAs)
 *   2. CategoriesGrid — grid de 4 categorías
 *   3. FeaturedProducts — productos destacados con ProductCard
 *   4. BrandStory — sección editorial de marca
 *   5. Testimonials — reseñas de clientes
 *   6. ReservationCTA — banner final antes del footer
 *
 * Cada sección es 100% Server Component. La página completa carga sin
 * JavaScript del cliente excepto por:
 *   - El botón de wishlist en cada ProductCard (Client Component aislado)
 *   - El header sticky (Client Component aislado)
 *   - El form de newsletter del footer (Client Component aislado)
 *
 * Resultado: home cargando ultra-rápido, SEO óptimo, JavaScript mínimo
 * solo donde se necesita.
 *
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  RECORDATORIO: cuando integremos next-intl en una fase futura,    ║
 * ║  esta página se moverá a `src/app/[locale]/page.tsx` y este       ║
 * ║  archivo en la raíz desaparece o se vuelve un redirect.           ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * Metadata SEO: el layout raíz ya define metadata default ("MKATALINA —
 * Joyería y bisutería artesanal"), así que esta página la hereda sin
 * necesidad de declararla aquí. Si quisiéramos un title específico para
 * la home (raro porque la home suele heredar el del sitio), exportaríamos
 * `metadata` desde aquí.
 * ============================================================================
 */

import { Hero } from "@/components/home/Hero";
import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { Testimonials } from "@/components/home/Testimonials";
import { ReservationCTA } from "@/components/home/ReservationCTA";

export default function Home() {
  /**
   * La página es solo composición. Toda la lógica vive en sus secciones.
   * Esto es la "regla de oro" de page.tsx en App Router:
   *
   *   Las páginas ORQUESTAN secciones, no IMPLEMENTAN lógica.
   *
   * Si una página tiene 200+ líneas, casi siempre es señal de que algo
   * necesita extraerse a componente. La nuestra tiene ~20 líneas, lo cual
   * es perfecto.
   *
   * Nota sobre Fragment (<>...</>): usamos fragment en lugar de un <div>
   * envolvente porque NO necesitamos un wrapper DOM extra. Las secciones
   * ya son <section> semánticas, no requieren un padre adicional.
   */
  return (
    <>
      <Hero />
      <CategoriesGrid />
      <FeaturedProducts />
      <BrandStory />
      <Testimonials />
      <ReservationCTA />
    </>
  );
}