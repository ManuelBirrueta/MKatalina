/**
 * ============================================================================
 * CATEGORY HERO — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Agregado useTranslations con namespace catalog
 *   - "Categoría" / "Category" eyebrow traducido
 *   - "X piezas en colección" / "X pieces in collection" con pluralización
 *     basada en count exacto (singular vs plural según count === 1)
 *
 * Lo que NO cambia:
 *   - El componente sigue siendo "tonto": recibe name y description ya
 *     resueltos como props. El padre (CategoryPage) se encarga de la
 *     traducción de esos textos editoriales.
 *   - Server Component compatible: useTranslations funciona en Client
 *     Components, así que añadimos "use client" arriba.
 *
 * Sobre por qué pasar name y description como strings ya resueltos:
 *   Es el patrón "el padre decide" que hemos usado consistentemente. El
 *   padre tiene el contexto del locale y la categoría; los hijos solo
 *   renderizan. Hace el componente reutilizable si en el futuro necesitamos
 *   pasarle un name/description de otra fuente (ej: una colección curada
 *   en lugar de una categoría estándar).
 * ============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";

interface CategoryHeroProps {
  /** Título visible ya traducido al locale activo */
  name: string;
  /** Descripción editorial ya traducida */
  description: string;
  /** Número de productos en la colección (opcional, para el contador) */
  productCount?: number;
}

export function CategoryHero({
  name,
  description,
  productCount,
}: CategoryHeroProps) {
  const t = useTranslations("catalog");

  return (
    <section className="py-12 lg:py-16 text-center">
      <Container size="narrow">
        {/* Eyebrow: "Categoría" / "Category" */}
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
          {t("categoryEyebrow")}
        </p>

        {/* Título principal — viene ya traducido como prop */}
        <h1 className="font-display text-5xl md:text-6xl font-medium tracking-tight mb-4">
          {name}
        </h1>

        {/* Descripción editorial — ya traducida como prop */}
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {description}
        </p>

        {/*
         * Contador de piezas con pluralización.
         * Elegimos singular vs plural según el count exacto.
         */}
        {typeof productCount === "number" && (
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-6">
            {productCount === 1
              ? t("piecesInCollectionSingular", { count: productCount })
              : t("piecesInCollectionPlural", { count: productCount })}
          </p>
        )}
      </Container>
    </section>
  );
}