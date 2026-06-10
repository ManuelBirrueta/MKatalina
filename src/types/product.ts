/**
 * ============================================================================
 * PRODUCT TYPES — KATALINA (Fase 12 Turno 3B.3: + ProductCategory tipado)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Agregado: `export type ProductCategory` como union literal
 *   - Cambiado: `Product.category: string` → `Product.category: ProductCategory`
 *
 * Por qué este cambio importa:
 *   Antes, category era `string` genérico, lo que permitía pasar cualquier
 *   string al campo. Ej: `product.category = "Pendientes"` compilaba sin
 *   errores aunque rompe la lógica del sitio (los filtros buscan "Aretes").
 *
 *   Ahora con `ProductCategory` como union literal, el compilador rechaza
 *   valores fuera de las 4 categorías válidas. Beneficios:
 *     1. Type safety en TODO el proyecto donde se use product.category
 *     2. Autocomplete en VSCode cuando escribes el valor
 *     3. Errores de compilación en lugar de runtime cuando hay typos
 *
 * Otros cambios mantenidos (de la versión 3B.1 bilingüe):
 *   - Product.name: LocalizedString
 *   - ProductDimensions.notes: LocalizedString
 *   - ProductDetail.description: LocalizedString
 *   - ProductDetail.careInstructions: LocalizedStringArray
 *
 * Campos que NO se traducen (sin cambios):
 *   - slug, href, id: identificadores
 *   - category, material, color: ENUMS, son llaves de URL/filtros/DB
 *   - images.alt: por simplicidad inicial
 *   - price, originalPrice, averageRating, reviewCount: números universales
 *   - createdAt, inStock, badge: no son texto editorial
 *
 * ─── POSIBLES ERRORES DE COMPILACIÓN AL APLICAR ESTE CAMBIO ────────────
 *
 * Como ahora category es ProductCategory (no string), TypeScript puede
 * marcar errores en archivos que:
 *   a) Asignaban un string genérico a category:
 *        product.category = someStringVariable;
 *      → Solución: castear o validar el string como ProductCategory antes
 *
 *   b) Comparaban con strings que TypeScript no puede inferir como literal:
 *        if (product.category === userInput) { ... }
 *      → Solución: validar userInput contra el union antes de comparar
 *
 * En la práctica, casi nada debería romperse porque las categorías se
 * manejan como literales fijos en todo el código.
 * ─────────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

import type {
  LocalizedString,
  LocalizedStringArray,
} from "@/lib/i18n-helpers";

/**
 * ProductImage — sin cambios.
 *
 * Nota: alt sigue como string. Si quisieras traducirlo, lo cambiarías a
 * LocalizedString. Por simplicidad inicial lo dejamos así.
 */
export interface ProductImage {
  src: string;
  alt: string;
}

/**
 * ProductBadgeType — sin cambios.
 */
export type ProductBadgeType = "nuevo" | "oferta" | "limitado" | "agotado";

/**
 * ProductMaterial — enum de materiales.
 *
 * Las claves siguen en español (son los valores que aparecen en URLs,
 * filtros y data). Los labels visibles se traducen vía
 * t("product.materialsShort.{material}") y t("product.materials.{material}").
 */
export type ProductMaterial =
  | "plata-925"
  | "oro-rosa"
  | "acero-quirurgico"
  | "piedras-naturales"
  | "terciopelo"
  | "cuero";

/**
 * ProductColor — enum de colores.
 *
 * Las claves siguen en español. Labels visibles se traducen vía
 * t("product.colors.{color}").
 */
export type ProductColor =
  | "dorado"
  | "plateado"
  | "rosa"
  | "negro"
  | "multicolor";

/**
 * ─── NUEVO EN TURNO 3B.3 ─────────────────────────────────────────────────
 *
 * ProductCategory — enum de las 4 categorías del sitio.
 *
 * Antes era `string` genérico en Product.category. Ahora es union literal
 * tipado para type safety en todo el proyecto.
 *
 * Las claves se quedan en español (mismo patrón que ProductMaterial y
 * ProductColor). Los labels visibles se traducen vía
 * t("product.categories.{category}").
 *
 * Cuándo usar este tipo:
 *   - Cuando declaras una función que recibe una categoría:
 *       function getProductsByCategory(category: ProductCategory) { ... }
 *   - Cuando declaras un componente que recibe categoría como prop:
 *       <CategoryPage category={category: ProductCategory} />
 *   - Cuando declaras una variable que debe ser una categoría válida:
 *       const cat: ProductCategory = "Aretes";
 *
 * El día que agreguemos una 5ta categoría (ej: "Anillos"), solo agregamos
 * el literal aquí y TypeScript nos dirá en qué partes del código hay que
 * actualizar.
 * ─────────────────────────────────────────────────────────────────────────
 */
export type ProductCategory =
  | "Aretes"
  | "Collares"
  | "Pulseras"
  | "Gargantillas";

/**
 * Product — tipo "lite" para listados.
 *
 * Cambios:
 *   - name: LocalizedString (bilingüe)
 *   - category: ProductCategory (tipado, no string genérico)
 */
export interface Product {
  id: string;
  slug: string;

  /**
   * Nombre del producto en ambos idiomas.
   *
   * Ejemplo:
   *   { es: "Aretes Camelia", en: "Camelia Earrings" }
   *
   * Para acceder: getLocalized(product.name, locale)
   */
  name: LocalizedString;

  /**
   * Categoría como enum tipado.
   *
   * Valores válidos: "Aretes" | "Collares" | "Pulseras" | "Gargantillas"
   * El label visible se traduce vía t("product.categories.{category}").
   *
   * ANTES era `string` (cualquier valor). AHORA es ProductCategory
   * (solo los 4 valores válidos).
   */
  category: ProductCategory;

  price: number;
  originalPrice?: number;
  images: ProductImage[];
  badge?: ProductBadgeType;
  href: string;
  material: ProductMaterial;
  color: ProductColor;
  inStock: boolean;
  createdAt: string;
}

/**
 * ProductDimensions — medidas físicas.
 *
 * notes es LocalizedString para soportar texto libre traducible.
 * Los campos numéricos (length, width, etc.) son universales — las unidades
 * (cm, g) se muestran traducidas en el componente.
 */
export interface ProductDimensions {
  /** Longitud o largo en cm */
  length?: number;
  /** Ancho en cm */
  width?: number;
  /** Alto en cm */
  height?: number;
  /** Peso en gramos */
  weight?: number;
  /**
   * Texto libre con notas específicas, bilingüe.
   *
   * Ejemplo:
   *   { es: "Cierre ajustable", en: "Adjustable clasp" }
   */
  notes?: LocalizedString;
}

/**
 * ProductDetail — tipo extendido para la página de detalle.
 *
 * Extiende Product con campos adicionales que sí necesitan localización.
 */
export interface ProductDetail extends Product {
  /**
   * Descripción larga del producto, 2-3 párrafos.
   * Puede contener \n para separar párrafos.
   *
   * Ejemplo:
   *   { es: "Inspirados en la flor...", en: "Inspired by the flower..." }
   */
  description: LocalizedString;

  /**
   * Dimensiones físicas. Las notas internas son bilingues.
   */
  dimensions: ProductDimensions;

  /**
   * Instrucciones de cuidado, bilingüe.
   *
   * Cada idioma tiene su propio array. Ejemplo:
   *   {
   *     es: ["Evita el contacto con perfumes", "Limpia con paño suave"],
   *     en: ["Avoid contact with perfumes", "Clean with soft cloth"]
   *   }
   *
   * Resolver con: getLocalizedArray(product.careInstructions, locale)
   */
  careInstructions: LocalizedStringArray;

  /**
   * Promedio de rating (1.0 a 5.0). Universal, no se traduce.
   */
  averageRating: number;

  /**
   * Total de reseñas. Universal, no se traduce.
   */
  reviewCount: number;
}