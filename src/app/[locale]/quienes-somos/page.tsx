/**
 * ============================================================================
 * PAGE: /[locale]/quienes-somos — KATALINA (Fase 12 Turno 3A)
 * ============================================================================
 *
 * Página estática "Quiénes somos" con contenido bilingüe.
 *
 * Estrategia de renderizado:
 *   - Server Component (sin "use client") porque solo necesita leer datos
 *     y renderizar HTML estático
 *   - Lee el locale activo con getLocale() (Server-side API)
 *   - Resuelve cada campo bilingüe con getLocalized() antes de pasarlo
 *     a los componentes hijos
 *   - Los componentes hijos (PageHero, etc.) reciben strings simples,
 *     no objetos bilingües → no necesitan saber de i18n
 *
 * Patrón importante:
 *   "El padre resuelve la traducción, el hijo solo muestra."
 *   Esto mantiene los componentes reutilizables y simples.
 *
 * Sobre los iconos de la sección "values":
 *   Los iconos vienen como string ("Heart", "Sparkles", "MapPin"). Aquí
 *   los mapeamos a sus componentes de lucide-react. Si en el futuro
 *   agregamos más iconos, se añaden al mapping.
 * ============================================================================
 */

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Heart, Sparkles, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/static/PageHero";
import { Button } from "@/components/ui/button";
import { aboutContent } from "@/data/static-content";
import { getLocalized, getLocalizedArray } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

/**
 * Mapping de nombres de iconos a componentes reales.
 * Mantenemos esto aquí (no en static-content.ts) para que el archivo de
 * data sea puramente serializable sin dependencias de React.
 */
const ICON_MAP = {
  Heart,
  Sparkles,
  MapPin,
} as const;

/**
 * Metadata dinámica según el locale.
 *
 * generateMetadata es la forma oficial de Next.js para metadata por página.
 * La función es async porque getTranslations también lo es.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;

  // Tomamos los textos directamente del aboutContent
  const title = getLocalized(aboutContent.hero.title, locale);
  const description = getLocalized(aboutContent.hero.subtitle, locale);

  return {
    title,
    description,
  };
}

export default async function AboutPage() {
  const locale = (await getLocale()) as Locale;

  /**
   * Resolver todo el contenido localizado de antemano.
   *
   * Por qué hacerlo aquí y no en cada componente:
   *   - El componente no necesita saber del locale, recibe strings listos
   *   - Si en el futuro cambiamos la estructura de bilingüe, solo
   *     modificamos esta página, no los componentes
   *   - Más fácil de testear: los componentes son función pura sobre strings
   */
  const hero = {
    eyebrow: getLocalized(aboutContent.hero.eyebrow, locale),
    title: getLocalized(aboutContent.hero.title, locale),
    subtitle: getLocalized(aboutContent.hero.subtitle, locale),
  };

  const story = {
    eyebrow: getLocalized(aboutContent.story.eyebrow, locale),
    title: getLocalized(aboutContent.story.title, locale),
    paragraphs: getLocalizedArray(aboutContent.story.paragraphs, locale),
  };

  const values = {
    eyebrow: getLocalized(aboutContent.values.eyebrow, locale),
    title: getLocalized(aboutContent.values.title, locale),
    items: aboutContent.values.items.map((item) => ({
      Icon: ICON_MAP[item.icon],
      title: getLocalized(item.title, locale),
      description: getLocalized(item.description, locale),
    })),
  };

  const team = {
    eyebrow: getLocalized(aboutContent.team.eyebrow, locale),
    title: getLocalized(aboutContent.team.title, locale),
    members: aboutContent.team.members.map((member) => ({
      name: member.name, // No localizado: los nombres no se traducen
      role: getLocalized(member.role, locale),
      bio: getLocalized(member.bio, locale),
    })),
  };

  const cta = {
    title: getLocalized(aboutContent.cta.title, locale),
    description: getLocalized(aboutContent.cta.description, locale),
    buttonText: getLocalized(aboutContent.cta.buttonText, locale),
    buttonHref: aboutContent.cta.buttonHref,
  };

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      {/* SECCIÓN: Historia */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
              {story.eyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium mb-6">
              {story.title}
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-5">
            {story.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-base leading-relaxed text-foreground/85"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Container>
      </section>

      {/* SECCIÓN: Valores */}
      <section className="py-16 lg:py-20 bg-secondary-subtle/30">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
              {values.eyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium">
              {values.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-5xl mx-auto">
            {values.items.map((item, index) => {
              const Icon = item.Icon;
              return (
                <div key={index} className="text-center">
                  <Icon
                    className="h-8 w-8 text-accent mx-auto mb-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <h3 className="font-display text-xl font-medium mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/75">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* SECCIÓN: Equipo */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
              {team.eyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium">
              {team.title}
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-10">
            {team.members.map((member, index) => (
              <div key={index} className="text-center">
                <h3 className="font-display text-2xl font-medium mb-1">
                  {member.name}
                </h3>
                <p className="text-sm uppercase tracking-wider text-accent mb-4">
                  {member.role}
                </p>
                <p className="text-base leading-relaxed text-foreground/85">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* SECCIÓN: CTA */}
      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
              {cta.title}
            </h2>
            <p className="text-base text-primary-foreground/80 mb-8">
              {cta.description}
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href={cta.buttonHref}>{cta.buttonText}</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}