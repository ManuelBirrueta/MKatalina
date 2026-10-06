/**
 * ============================================================================
 * NOT FOUND (404) — MKATALINA · Fase 13 · Mantenimiento
 * ============================================================================
 *
 * QUÉ RESUELVE
 * ------------
 * Antes, cuando alguien visitaba una URL inexistente (o una ruta daba 404),
 * Next intentaba renderizar la página de error usando el layout RAÍZ, que no
 * tiene <html>/<body>, y explotaba con "Missing html/body in root layout".
 *
 * Al vivir este archivo DENTRO de [locale], el 404 se renderiza con el layout
 * de idioma (que SÍ tiene <html>/<body>, Header y Footer). Resultado: una
 * página 404 con la identidad del sitio, en vez del crash. Cubre todos los 404
 * bajo /es y /en (que son prácticamente todos los reales, porque el proxy
 * normaliza el idioma antes de enrutar).
 *
 * SOBRE LOS TEXTOS
 * ----------------
 * Como not-found.tsx no recibe `params`, tomamos el idioma con useLocale(). Los
 * textos van en un objeto {es, en} aquí mismo para que este archivo sea
 * autónomo (no depende de agregar claves nuevas a los archivos de traducción).
 * Si más adelante quieres moverlos a messages, es un cambio trivial.
 * ============================================================================
 */

"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

const COPY = {
  es: {
    title: "Página no encontrada",
    description:
      "La página que buscas no existe o fue movida. Revisa la dirección o vuelve al inicio.",
    button: "Volver al inicio",
  },
  en: {
    title: "Page not found",
    description:
      "The page you're looking for doesn't exist or was moved. Check the address or go back home.",
    button: "Back to home",
  },
} as const;

export default function NotFound() {
  const locale = useLocale();
  const t = locale === "en" ? COPY.en : COPY.es;

  return (
    <Container>
      <div className="py-24 lg:py-32 text-center">
        {/* El "404" grande, en el color de acento de la marca */}
        <p className="font-display text-6xl md:text-7xl font-medium text-accent mb-4">
          404
        </p>

        <h1 className="font-display text-2xl md:text-3xl font-medium mb-3">
          {t.title}
        </h1>

        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
          {t.description}
        </p>

        <Button asChild size="lg">
          <Link href="/">{t.button}</Link>
        </Button>
      </div>
    </Container>
  );
}