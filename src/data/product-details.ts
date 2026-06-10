/**
 * ============================================================================
 * PRODUCT DETAILS DATA — KATALINA (Fase 12 Turno 3B.1: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - ProductExtras.description: LocalizedString
 *   - ProductExtras.dimensions.notes: LocalizedString (opcional)
 *   - ProductExtras.careInstructions: LocalizedStringArray
 *   - defaultExtras(): firma simplificada, ahora recibe solo el material
 *     y devuelve ProductExtras bilingüe genérico
 *
 * Las traducciones de los 6 productos manuales son borradores razonables.
 * Para producción se recomienda revisión por hablante nativo o traductor
 * profesional, especialmente las descripciones largas (que tienen el "voice"
 * editorial de la marca).
 *
 * Notas sobre el campo "description":
 *   - Mantiene los párrafos separados con \n\n (doble salto de línea)
 *   - Los componentes que lo rendericen pueden splittear por \n para
 *     mostrar cada párrafo como su propio <p>
 * ============================================================================
 */

import type { ProductDimensions } from "@/types/product";
import type {
  LocalizedString,
  LocalizedStringArray,
} from "@/lib/i18n-helpers";

/**
 * ProductExtras — la "porción extra" de cada producto, bilingüe.
 *
 * Se combina con Product en el helper `getProductDetail` para devolver
 * un ProductDetail completo (Product + ProductExtras).
 */
interface ProductExtras {
  description: LocalizedString;
  dimensions: ProductDimensions;
  careInstructions: LocalizedStringArray;
  averageRating: number;
  reviewCount: number;
}

/**
 * productDetailsMap — mapa slug → datos extendidos.
 *
 * Solo cubrimos algunos productos con descripción rica. Los demás usan
 * defaults generados por material en defaultExtras().
 *
 * Cuando tengas las descripciones reales de todos tus productos, las
 * agregas aquí siguiendo el mismo formato bilingüe.
 */
export const productDetailsMap: Record<string, ProductExtras> = {
  "aretes-camelia": {
    description: {
      es: "Inspirados en la flor que les da nombre, los Aretes Camelia capturan la delicadeza de un pétalo en plata pura. Cada arete está hecho a mano por nuestros artesanos en el centro de México, lo que significa que cada par tiene pequeñas variaciones únicas que los hacen verdaderamente irrepetibles.\n\nPiezas pensadas para llevar a diario o como toque final de un look más arreglado. Su tamaño moderado los hace cómodos para usar muchas horas sin que el lóbulo se canse, y su acabado pulido se mantiene brillante con un mínimo de cuidado.",
      en: "Inspired by the flower that gives them their name, Camelia Earrings capture the delicacy of a petal in pure silver. Each earring is handmade by our artisans in central Mexico, which means every pair has small unique variations that make them truly one of a kind.\n\nPieces meant for everyday wear or as a finishing touch to a more polished look. Their moderate size makes them comfortable to wear for many hours without tiring the earlobe, and their polished finish stays bright with minimal care.",
    },
    dimensions: {
      height: 1.8,
      width: 1.2,
      weight: 2.4,
      notes: {
        es: "Cierre tipo presión con poste de plata",
        en: "Push-back clasp with silver post",
      },
    },
    careInstructions: {
      es: [
        "Evita el contacto con perfumes, cremas y productos químicos",
        "Quítatelos antes de bañarte o entrar al mar",
        "Límpialos con un paño suave y seco después de cada uso",
        "Guárdalos en su bolsita de tela para evitar oxidación",
      ],
      en: [
        "Avoid contact with perfumes, creams, and chemicals",
        "Take them off before bathing or entering the sea",
        "Clean them with a soft, dry cloth after each use",
        "Store them in their fabric pouch to prevent oxidation",
      ],
    },
    averageRating: 4.8,
    reviewCount: 47,
  },
  "collar-luna-llena": {
    description: {
      es: "El Collar Luna Llena nace de la fascinación por las fases lunares. Su dije circular en plata, ligeramente abombado, refleja la luz como lo haría una luna en cuarto creciente. La cadena tipo cable de eslabones finos cae con elegancia sobre la clavícula sin sentirse pesada.\n\nLargo princesa (45 cm) — el más versátil para combinarlo con escotes V, redondos o cuello alto. Pieza ideal para usar sola como statement minimalista o combinada con otros collares más cortos para crear capas.",
      en: "The Luna Llena Necklace is born from a fascination with lunar phases. Its slightly domed circular silver pendant reflects light the way a crescent moon would. The fine-link cable chain drapes elegantly over the collarbone without feeling heavy.\n\nPrincess length (45 cm) — the most versatile for pairing with V-necks, round necklines, or turtlenecks. Ideal as a minimalist statement piece or layered with shorter necklaces.",
    },
    dimensions: {
      length: 45,
      weight: 3.8,
      notes: {
        es: "Cadena tipo cable. Cierre de mosquetón con extensor de 5 cm",
        en: "Cable chain. Lobster clasp with 5 cm extender",
      },
    },
    careInstructions: {
      es: [
        "Pónselo al final, después de maquillarte y perfumarte",
        "Evita guardarlo enrollado para que no se haga nudo",
        "Si pierde brillo, frótalo suavemente con un paño de joyería",
        "Plata 925 garantizada — el oscurecimiento es natural y reversible",
      ],
      en: [
        "Put it on last, after makeup and perfume",
        "Avoid storing it coiled to prevent tangling",
        "If it loses shine, gently rub it with a jewelry cloth",
        "Sterling silver 925 guaranteed — tarnishing is natural and reversible",
      ],
    },
    averageRating: 4.9,
    reviewCount: 31,
  },
  "pulsera-dalia": {
    description: {
      es: "Pulsera tejida a mano con hilos de algodón encerado en tonos cálidos. El nombre viene de la flor mexicana, y el diseño honra técnicas textiles tradicionales reinterpretadas en formato moderno y ponible.\n\nAjustable mediante nudo corredizo — se adapta a cualquier muñeca entre 14 y 22 cm. Perfecta sola o combinada con otras pulseras tejidas para un look bohemio. Resistente al uso diario, incluso al agua.",
      en: "Hand-woven bracelet with waxed cotton threads in warm tones. The name comes from the Mexican flower, and the design honors traditional textile techniques reinterpreted in a modern, wearable format.\n\nAdjustable with a sliding knot — fits any wrist between 14 and 22 cm. Perfect alone or layered with other woven bracelets for a bohemian look. Resistant to daily wear, even water.",
    },
    dimensions: {
      length: 22,
      width: 0.6,
      notes: {
        es: "Ajustable con nudo corredizo. Hilo de algodón encerado",
        en: "Adjustable with sliding knot. Waxed cotton thread",
      },
    },
    careInstructions: {
      es: [
        "Resistente al agua y al sudor",
        "Si se ensucia, lávala con agua tibia y jabón neutro",
        "Déjala secar al aire, nunca con calor directo",
        "Los colores pueden perder intensidad con el sol prolongado",
      ],
      en: [
        "Resistant to water and sweat",
        "If it gets dirty, wash with warm water and mild soap",
        "Let it air dry, never with direct heat",
        "Colors may fade with prolonged sun exposure",
      ],
    },
    averageRating: 4.6,
    reviewCount: 89,
  },
  "gargantilla-ofelia": {
    description: {
      es: "Pieza statement de nuestra edición limitada de invierno. La Gargantilla Ofelia combina una base de plata 925 con tres piedras naturales engarzadas a mano — ágata, ónix y cuarzo rosa — cada una elegida por su energía y simbolismo.\n\nSolo 50 piezas producidas. Diseñada para ocasiones especiales pero suficientemente versátil para usarse con un blazer minimalista de uso diario. El cierre regulable permite ajustar el largo entre 38 y 42 cm.",
      en: "Statement piece from our winter limited edition. The Ofelia Choker combines a sterling silver 925 base with three hand-set natural stones — agate, onyx, and rose quartz — each chosen for its energy and symbolism.\n\nOnly 50 pieces produced. Designed for special occasions but versatile enough to wear with a minimalist blazer for daily use. The adjustable clasp allows the length to be set between 38 and 42 cm.",
    },
    dimensions: {
      length: 42,
      width: 0.4,
      weight: 12.5,
      notes: {
        es: "Largo regulable 38-42 cm. Piedras: ágata, ónix, cuarzo rosa",
        en: "Adjustable length 38-42 cm. Stones: agate, onyx, rose quartz",
      },
    },
    careInstructions: {
      es: [
        "Las piedras naturales son frágiles — evita golpes",
        "Quítatela antes de actividades físicas intensas",
        "Limpia solo el metal, no sumerjas las piedras en líquido",
        "Guárdala plana en su caja para preservar el engarce",
      ],
      en: [
        "Natural stones are fragile — avoid impacts",
        "Take it off before intense physical activities",
        "Clean only the metal, do not submerge the stones in liquid",
        "Store it flat in its box to preserve the setting",
      ],
    },
    averageRating: 5.0,
    reviewCount: 12,
  },
  "aretes-aurora": {
    description: {
      es: "Los Aretes Aurora son nuestra propuesta más romántica. Baño de oro rosa sobre plata 925, con un diseño que recuerda a una gota de rocío sobre un pétalo. La curva del cuerpo del arete acaricia el lóbulo creando un efecto visual de movimiento, como si el oro estuviera fluyendo.\n\nLigeros y cómodos para uso prolongado. El oro rosa combina especialmente bien con tonos de piel cálidos y outfits en paleta beige, blanco roto, terracota.",
      en: "Aurora Earrings are our most romantic proposal. Rose gold plating over sterling silver 925, with a design reminiscent of a dewdrop on a petal. The curve of the earring's body caresses the earlobe creating a visual sense of movement, as if the gold were flowing.\n\nLight and comfortable for prolonged wear. Rose gold pairs especially well with warm skin tones and outfits in beige, off-white, and terracotta palettes.",
    },
    dimensions: {
      height: 1.4,
      width: 0.8,
      weight: 1.9,
      notes: {
        es: "Baño de oro rosa sobre plata 925. Cierre tipo presión",
        en: "Rose gold plating over sterling silver 925. Push-back clasp",
      },
    },
    careInstructions: {
      es: [
        "El baño de oro requiere cuidado extra — evita perfumes directos",
        "No te bañes con ellos",
        "Si pierden brillo, podemos re-bañarlos en taller (servicio disponible)",
        "Guárdalos separados de otras piezas para evitar rayones",
      ],
      en: [
        "Gold plating requires extra care — avoid direct contact with perfumes",
        "Do not bathe with them on",
        "If they lose shine, we can re-plate them at our workshop (service available)",
        "Store separately from other pieces to avoid scratches",
      ],
    },
    averageRating: 4.7,
    reviewCount: 68,
  },
  "collar-amatista": {
    description: {
      es: "Edición limitada con amatista natural certificada. Solo 30 piezas en esta serie. La amatista que usamos viene de Las Vigas, Veracruz — una de las pocas minas en México que extrae esta piedra y la trabaja localmente.\n\nLa piedra, talla cabujón pulido, va engarzada sobre una base de plata 925 con detalle de filigrana hecho a mano. Cadena tipo Singapur (eslabones cruzados que crean brillo al moverse).",
      en: "Limited edition with certified natural amethyst. Only 30 pieces in this series. The amethyst we use comes from Las Vigas, Veracruz — one of the few mines in Mexico that extracts and works this stone locally.\n\nThe stone, in polished cabochon cut, is hand-set on a sterling silver 925 base with handcrafted filigree detail. Singapore-style chain (crossed links that create shine when moving).",
    },
    dimensions: {
      length: 50,
      weight: 8.2,
      notes: {
        es: "Amatista de Veracruz, talla cabujón. Cadena Singapur 50 cm",
        en: "Veracruz amethyst, cabochon cut. Singapore chain 50 cm",
      },
    },
    careInstructions: {
      es: [
        "Amatista natural — frágil ante golpes e impactos",
        "Limpia solo con paño suave seco",
        "Evita exposición prolongada al sol (puede perder color)",
        "Pieza única — número de serie en el reverso del engarce",
      ],
      en: [
        "Natural amethyst — fragile against bumps and impacts",
        "Clean only with a soft dry cloth",
        "Avoid prolonged sun exposure (may lose color)",
        "Unique piece — serial number on the back of the setting",
      ],
    },
    averageRating: 4.9,
    reviewCount: 8,
  },
};

/**
 * defaultExtras — genera ProductExtras genérico bilingüe basado en el material.
 *
 * Cambios respecto a la versión anterior:
 *   - Firma simplificada: ya no recibe `name` como parámetro (la descripción
 *     genérica no lo necesita)
 *   - Devuelve LocalizedString / LocalizedStringArray en todos los campos
 *     de texto
 *
 * Para productos que NO están en productDetailsMap, esto devuelve una
 * descripción y cuidados razonables según el material de la pieza.
 *
 * Cuando tengas las descripciones reales de cada producto, simplemente las
 * agregas a productDetailsMap arriba y este fallback ya no se usa para ellos.
 */
export function defaultExtras(material: string): ProductExtras {
  // ─── Descripción genérica bilingüe basada en el material ───
  const materialDescriptions: Record<string, LocalizedString> = {
    "plata-925": {
      es: "Pieza elaborada en plata 925 (Sterling), el estándar de calidad para joyería duradera. Cada pieza es trabajada a mano por nuestros artesanos.\n\nParte de nuestra colección curada. Cada pieza pasa por revisión de calidad antes de ser empacada en nuestra caja con sello, lista para regalar.",
      en: "Piece crafted in sterling silver 925, the quality standard for durable jewelry. Each piece is handcrafted by our artisans.\n\nPart of our curated collection. Each piece undergoes quality inspection before being packed in our sealed box, ready to gift.",
    },
    "oro-rosa": {
      es: "Acabado de oro rosa sobre base de plata 925. El oro rosa aporta un toque romántico y cálido, ideal para tonos de piel cálidos.\n\nParte de nuestra colección curada. Cada pieza pasa por revisión de calidad antes de ser empacada en nuestra caja con sello, lista para regalar.",
      en: "Rose gold finish over a sterling silver 925 base. Rose gold adds a romantic, warm touch, ideal for warm skin tones.\n\nPart of our curated collection. Each piece undergoes quality inspection before being packed in our sealed box, ready to gift.",
    },
    "acero-quirurgico": {
      es: "Acero quirúrgico hipoalergénico — ideal para personas con piel sensible o alergias a otros metales. Resistente al agua y al uso diario.\n\nParte de nuestra colección curada. Cada pieza pasa por revisión de calidad antes de ser empacada en nuestra caja con sello, lista para regalar.",
      en: "Hypoallergenic surgical steel — ideal for people with sensitive skin or allergies to other metals. Water-resistant and built for daily wear.\n\nPart of our curated collection. Each piece undergoes quality inspection before being packed in our sealed box, ready to gift.",
    },
    "piedras-naturales": {
      es: "Pieza con piedras naturales seleccionadas a mano. Cada piedra es única, con variaciones de color y textura propias de su origen.\n\nParte de nuestra colección curada. Cada pieza pasa por revisión de calidad antes de ser empacada en nuestra caja con sello, lista para regalar.",
      en: "Piece with hand-selected natural stones. Each stone is unique, with variations in color and texture intrinsic to its origin.\n\nPart of our curated collection. Each piece undergoes quality inspection before being packed in our sealed box, ready to gift.",
    },
    cuero: {
      es: "Cuero genuino trabajado con técnicas tradicionales. Envejece con gracia, ganando carácter y suavidad con el uso.\n\nParte de nuestra colección curada. Cada pieza pasa por revisión de calidad antes de ser empacada en nuestra caja con sello, lista para regalar.",
      en: "Genuine leather worked with traditional techniques. Ages gracefully, gaining character and softness with use.\n\nPart of our curated collection. Each piece undergoes quality inspection before being packed in our sealed box, ready to gift.",
    },
    terciopelo: {
      es: "Terciopelo de alta calidad combinado con detalles metálicos. Pieza pensada para ocasiones especiales y looks editoriales.\n\nParte de nuestra colección curada. Cada pieza pasa por revisión de calidad antes de ser empacada en nuestra caja con sello, lista para regalar.",
      en: "High-quality velvet combined with metallic details. A piece designed for special occasions and editorial looks.\n\nPart of our curated collection. Each piece undergoes quality inspection before being packed in our sealed box, ready to gift.",
    },
  };

  const description: LocalizedString =
    materialDescriptions[material] ?? {
      es: "Pieza artesanal Katalina, hecha a mano en México con materiales de calidad.\n\nParte de nuestra colección curada. Cada pieza pasa por revisión de calidad antes de ser empacada en nuestra caja con sello, lista para regalar.",
      en: "Katalina artisanal piece, handmade in Mexico with quality materials.\n\nPart of our curated collection. Each piece undergoes quality inspection before being packed in our sealed box, ready to gift.",
    };

  // ─── Cuidados genéricos bilingues según material ───
  const materialCare: Record<string, LocalizedStringArray> = {
    "plata-925": {
      es: [
        "Evita el contacto con perfumes, cremas y productos químicos",
        "Quítatela antes de bañarte o entrar al mar",
        "Límpiala con un paño suave después de usarla",
        "Guárdala en su bolsita para evitar oxidación",
      ],
      en: [
        "Avoid contact with perfumes, creams, and chemicals",
        "Take it off before bathing or entering the sea",
        "Clean it with a soft cloth after use",
        "Store it in its pouch to prevent oxidation",
      ],
    },
    "oro-rosa": {
      es: [
        "El baño de oro requiere cuidado extra — evita perfumes directos",
        "No te bañes con la pieza puesta",
        "Si pierde brillo, podemos re-bañarla en taller",
        "Guárdala separada de otras piezas para evitar rayones",
      ],
      en: [
        "Gold plating requires extra care — avoid direct contact with perfumes",
        "Do not bathe with the piece on",
        "If it loses shine, we can re-plate it at our workshop",
        "Store separately from other pieces to avoid scratches",
      ],
    },
    "acero-quirurgico": {
      es: [
        "Hipoalergénico y resistente al agua",
        "Se puede usar diariamente sin perder brillo",
        "Limpia con agua tibia y jabón neutro si se ensucia",
        "Apto para personas con piel sensible",
      ],
      en: [
        "Hypoallergenic and water-resistant",
        "Can be worn daily without losing shine",
        "Clean with warm water and mild soap if it gets dirty",
        "Suitable for people with sensitive skin",
      ],
    },
    "piedras-naturales": {
      es: [
        "Las piedras naturales son frágiles — evita golpes",
        "Limpia solo el metal, no sumerjas las piedras",
        "Cada piedra es única — pequeñas variaciones son naturales",
        "Guárdala plana en su caja",
      ],
      en: [
        "Natural stones are fragile — avoid impacts",
        "Clean only the metal, do not submerge the stones",
        "Each stone is unique — small variations are natural",
        "Store it flat in its box",
      ],
    },
    cuero: {
      es: [
        "Resistente pero evita el agua prolongada",
        "Si se moja, déjalo secar al aire, nunca con calor",
        "Para limpieza profunda, usa una crema específica para cuero",
        "Con el tiempo desarrolla pátina natural — eso es parte de su carácter",
      ],
      en: [
        "Durable but avoid prolonged water exposure",
        "If it gets wet, let it air dry, never with heat",
        "For deep cleaning, use a leather-specific conditioner",
        "Develops natural patina over time — that's part of its character",
      ],
    },
    terciopelo: {
      es: [
        "Evita el contacto con agua y líquidos",
        "Cepilla suavemente en dirección del pelo si se aplasta",
        "No la guardes apretada con otras piezas",
        "Para manchas, consulta a un especialista en textiles delicados",
      ],
      en: [
        "Avoid contact with water and liquids",
        "Brush gently in the direction of the nap if flattened",
        "Don't store it pressed against other pieces",
        "For stains, consult a delicate textile specialist",
      ],
    },
  };

  const careInstructions: LocalizedStringArray =
    materialCare[material] ?? materialCare["plata-925"];

  return {
    description,
    dimensions: {
      notes: {
        es: "Consulta detalles específicos con nuestro equipo",
        en: "Check specific details with our team",
      },
    },
    careInstructions,
    /**
     * Ratings placeholder.
     *
     * Antes generábamos un rating "pseudoaleatorio" basado en name.length,
     * pero ahora name es LocalizedString (un objeto, no string). Sin name,
     * usamos un rating fijo razonable.
     *
     * En producción con backend, estos vendrán de la DB calculados a partir
     * de las reseñas reales.
     */
    averageRating: 4.7,
    reviewCount: 25,
  };
}