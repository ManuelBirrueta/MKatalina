/**
 * ============================================================================
 * PAGE: /[locale]/contacto — KATALINA (Fase 12 Turno 3A — fix lucide icons)
 * ============================================================================
 *
 * Página de Contacto con contenido bilingüe.
 *
 * Cambio respecto a versión anterior:
 *   - Instagram y Facebook NO se importan más de "lucide-react" porque
 *     lucide eliminó esos iconos (las marcas pidieron que sus logos no
 *     se distribuyeran como recursos genéricos)
 *   - En su lugar, definimos SVGs inline con los paths de los logos
 *     (mismo patrón que el Footer)
 *
 * Estrategia general:
 *   - Server Component
 *   - Resuelve todo el contenido localizado de contactContent
 *   - Pasa al ContactForm un objeto `uiText` con todos los strings
 *
 * Datos NO localizados:
 *   - Email (hola@katalina.mx)
 *   - Teléfono (+52 669...)
 *   - Dirección física
 *   - URLs de redes sociales
 * ============================================================================
 */

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/static/PageHero";
import { ContactForm } from "@/components/static/ContactForm";
import { contactContent } from "@/data/static-content";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

/* ─── SVGs INLINE DE REDES SOCIALES ─────────────────────────────────────
 *
 * Mismo patrón que Footer.tsx. lucide-react deprecó los iconos de marcas
 * (Facebook, Instagram, Twitter, etc.) porque las empresas pidieron que
 * no se distribuyeran sus logos como recursos genéricos.
 *
 * Estos SVGs son los paths oficiales simplificados de los logos.
 * Aceptan className para styling con Tailwind.
 */

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;

  return {
    title: getLocalized(contactContent.hero.title, locale),
    description: getLocalized(contactContent.hero.subtitle, locale),
  };
}

export default async function ContactPage() {
  const locale = (await getLocale()) as Locale;

  /* ─── Resolver Hero ─── */
  const hero = {
    eyebrow: getLocalized(contactContent.hero.eyebrow, locale),
    title: getLocalized(contactContent.hero.title, locale),
    subtitle: getLocalized(contactContent.hero.subtitle, locale),
  };

  /* ─── Resolver section titles ─── */
  const sections = {
    contactData: getLocalized(
      contactContent.form.sectionTitles.contactData,
      locale
    ),
    hereForYou: getLocalized(
      contactContent.form.sectionTitles.hereForYou,
      locale
    ),
    chooseChannel: getLocalized(
      contactContent.form.sectionTitles.chooseChannel,
      locale
    ),
    followUs: getLocalized(contactContent.form.sectionTitles.followUs, locale),
  };

  /* ─── Resolver detail labels (Email, Teléfono, etc) ─── */
  const detailLabels = {
    email: getLocalized(contactContent.form.detailLabels.email, locale),
    emailHint: getLocalized(
      contactContent.form.detailLabels.emailHint,
      locale
    ),
    phone: getLocalized(contactContent.form.detailLabels.phone, locale),
    phoneHint: getLocalized(
      contactContent.form.detailLabels.phoneHint,
      locale
    ),
    physicalStore: getLocalized(
      contactContent.form.detailLabels.physicalStore,
      locale
    ),
    hours: getLocalized(contactContent.form.detailLabels.hours, locale),
    hoursHint: getLocalized(
      contactContent.form.detailLabels.hoursHint,
      locale
    ),
  };

  /* ─── uiText para ContactForm ─── */
  const formUiText = {
    eyebrow: getLocalized(contactContent.form.eyebrow, locale),
    title: getLocalized(contactContent.form.title, locale),
    description: getLocalized(contactContent.form.description, locale),
    labels: {
      name: getLocalized(contactContent.form.labels.name, locale),
      email: getLocalized(contactContent.form.labels.email, locale),
      emailHint: getLocalized(contactContent.form.labels.emailHint, locale),
      subject: getLocalized(contactContent.form.labels.subject, locale),
      subjectPlaceholder: getLocalized(
        contactContent.form.labels.subjectPlaceholder,
        locale
      ),
      message: getLocalized(contactContent.form.labels.message, locale),
      messagePlaceholder: getLocalized(
        contactContent.form.labels.messagePlaceholder,
        locale
      ),
      submit: getLocalized(contactContent.form.labels.submit, locale),
      sending: getLocalized(contactContent.form.labels.sending, locale),
      backendPending: getLocalized(
        contactContent.form.labels.backendPending,
        locale
      ),
    },
    errors: {
      nameRequired: getLocalized(
        contactContent.form.errors.nameRequired,
        locale
      ),
      nameMin: getLocalized(contactContent.form.errors.nameMin, locale),
      emailRequired: getLocalized(
        contactContent.form.errors.emailRequired,
        locale
      ),
      emailInvalid: getLocalized(
        contactContent.form.errors.emailInvalid,
        locale
      ),
      subjectRequired: getLocalized(
        contactContent.form.errors.subjectRequired,
        locale
      ),
      messageRequired: getLocalized(
        contactContent.form.errors.messageRequired,
        locale
      ),
      messageMin: getLocalized(contactContent.form.errors.messageMin, locale),
    },
    subjectOptions: contactContent.form.subjectOptions.map((option) => ({
      value: option.value,
      label: getLocalized(option.label, locale),
    })),
    successMessage: getLocalized(contactContent.form.successMessage, locale),
    successDescription: getLocalized(
      contactContent.form.successDescription,
      locale
    ),
  };

  /* ─── Datos NO localizados ─── */
  const { email, phone, phoneDisplay, address, social } =
    contactContent.details;
  const hoursText = getLocalized(contactContent.details.hours, locale);
  const country = getLocalized(address.country, locale);

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      <section className="py-12 lg:py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* ═══ COLUMNA IZQUIERDA: Datos de contacto ═══ */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
                {sections.contactData}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
                {sections.hereForYou}
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                {sections.chooseChannel}
              </p>

              <div className="space-y-6">
                {/* Email */}
                <div className="flex gap-4">
                  <Mail
                    className="h-5 w-5 text-accent flex-shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">
                      {detailLabels.email}
                    </h3>
                    <a
                      href={`mailto:${email}`}
                      className="text-base text-foreground hover:text-accent transition-colors"
                    >
                      {email}
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      {detailLabels.emailHint}
                    </p>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="flex gap-4">
                  <Phone
                    className="h-5 w-5 text-accent flex-shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">
                      {detailLabels.phone}
                    </h3>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="text-base text-foreground hover:text-accent transition-colors"
                    >
                      {phoneDisplay}
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      {detailLabels.phoneHint}
                    </p>
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex gap-4">
                  <MapPin
                    className="h-5 w-5 text-accent flex-shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">
                      {detailLabels.physicalStore}
                    </h3>
                    <address className="not-italic text-base text-foreground">
                      {address.street}
                      <br />
                      {address.neighborhood}
                      <br />
                      {address.city}, {address.postalCode}
                      <br />
                      {country}
                    </address>
                  </div>
                </div>

                {/* Horarios */}
                <div className="flex gap-4">
                  <Clock
                    className="h-5 w-5 text-accent flex-shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-1">
                      {detailLabels.hours}
                    </h3>
                    <p className="text-base text-foreground">{hoursText}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {detailLabels.hoursHint}
                    </p>
                  </div>
                </div>
              </div>

              {/* Redes sociales */}
              <div className="mt-10 pt-8 border-t border-border">
                <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
                  {sections.followUs}
                </h3>
                <div className="flex gap-3">
                  <a
                    href={social.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram ${social.instagram.handle}`}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-border text-foreground hover:text-accent hover:border-accent transition-colors"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={social.facebook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Facebook ${social.facebook.handle}`}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-border text-foreground hover:text-accent hover:border-accent transition-colors"
                  >
                    <FacebookIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* ═══ COLUMNA DERECHA: Formulario ═══ */}
            <div>
              <ContactForm uiText={formUiText} fallbackEmail={email} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}