/**
 * ============================================================================
 * FOOTER — MKATALINA (rebrand: URLs sociales actualizadas)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - URLs hardcoded de redes sociales:
 *     * https://instagram.com/katalina.mx → https://instagram.com/mkatalina.mx
 *     * https://facebook.com/katalina.mx → https://facebook.com/mkatalina.mx
 *
 * Lo que NO cambia:
 *   - Estructura del footer (newsletter, columnas, línea legal)
 *   - El newsletter (con NewsletterForm)
 *   - footerColumns array (links a categorías y páginas)
 *   - Los SVG inline de Instagram y Facebook
 *   - Métodos de pago
 *   - El copyright con interpolación (lee siteName desde messages.json,
 *     que ya está rebrandeada a "MKatalina" desde el Turno 1)
 *
 * ─── COMENTARIO IMPORTANTE ─────────────────────────────────────────────
 *
 * El copyright NO tiene "Katalina" hardcoded aquí. El texto se construye
 * con interpolación:
 *
 *   tFooter("copyright", {
 *     year: currentYear,
 *     siteName: t("common.siteName"),  ← viene de messages.json
 *   })
 *
 * Como messages.json ya tiene siteName: "MKatalina" desde el Turno 1, el
 * copyright muestra automáticamente "© 2026 MKatalina. Todos los derechos
 * reservados.".
 *
 * Misma cosa para el tagline ("MKatalina nace en..." → ya viene de messages
 * desde el Turno 1).
 *
 * Por lo tanto, en este archivo SOLO necesitamos cambiar los 2 socialLinks.
 * ─────────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { cn } from "@/lib/utils";

interface FooterColumn {
  titleKey: string;
  links: Array<{
    labelKey: string;
    href: string;
  }>;
}

const footerColumns: FooterColumn[] = [
  {
    titleKey: "shop",
    links: [
      { labelKey: "earrings", href: "/aretes" },
      { labelKey: "necklaces", href: "/collares" },
      { labelKey: "bracelets", href: "/pulseras" },
      { labelKey: "chokers", href: "/gargantillas" },
    ],
  },
  {
    titleKey: "support",
    links: [
      { labelKey: "faq", href: "/faq" },
      { labelKey: "contact", href: "/contacto" },
      { labelKey: "policies", href: "/politicas" },
    ],
  },
  {
    titleKey: "legal",
    links: [
      { labelKey: "about", href: "/quienes-somos" },
      { labelKey: "privacy", href: "/privacidad" },
      { labelKey: "terms", href: "/terminos" },
    ],
  },
];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/**
 * URLs sociales actualizadas al rebrand.
 *
 * Si los handles cambian en producción (ej. Instagram no permite
 * @mkatalina.mx por longitud), las URLs aquí deben actualizarse.
 */
const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com/mkatalina.mx",
    Icon: InstagramIcon,
  },
  {
    name: "Facebook",
    href: "https://facebook.com/mkatalina.mx",
    Icon: FacebookIcon,
  },
];

const paymentMethods = ["Visa", "Mastercard", "PayPal", "Mercado Pago"];

export async function Footer() {
  const t = await getTranslations();
  const tFooter = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tSections = await getTranslations("footer.sections");

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <Container>
        {/* ═══════ SECCIÓN 1: NEWSLETTER ═══════ */}
        <div className="py-16 border-b border-primary-foreground/10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
            Newsletter
          </p>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-medium mb-3">
            {tFooter("newsletter.title")}
          </h2>

          <p className="text-sm text-primary-foreground/70 max-w-md mx-auto mb-6 px-4">
            {tFooter("newsletter.description")}
          </p>

          <NewsletterForm />
        </div>

        {/* ═══════ SECCIÓN 2: COLUMNAS DE LINKS ═══════ */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo size="md" withTagline />
            <p className="text-sm text-primary-foreground/60 max-w-xs">
              {tFooter("tagline")}
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.titleKey}>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-primary-foreground mb-4">
                {tSections(column.titleKey)}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm",
                        "text-primary-foreground/70",
                        "hover:text-accent transition-colors duration-200"
                      )}
                    >
                      {tNav(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ═══════ SECCIÓN 3: LÍNEA LEGAL ═══════ */}
        <div
          className={cn(
            "py-6 border-t border-primary-foreground/10",
            "flex flex-col items-center gap-4",
            "md:flex-row md:items-center md:justify-between",
            "text-xs text-primary-foreground/60"
          )}
        >
          {/*
           * Copyright con interpolación.
           * siteName viene de messages.json (ya rebrandeada a "MKatalina"
           * desde el Turno 1 del rebrand).
           */}
          <p className="text-center md:text-left">
            {tFooter("copyright", {
              year: currentYear,
              siteName: t("common.siteName"),
            })}
          </p>

          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-6">
            {/* Redes sociales con URLs actualizadas al rebrand */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.Icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className={cn(
                      "h-9 w-9 rounded-full",
                      "flex items-center justify-center",
                      "text-primary-foreground/60 hover:text-accent",
                      "transition-colors"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            {/* Métodos de pago */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="text-[11px] uppercase tracking-wider text-primary-foreground/50"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}