/**
 * ============================================================================
 * REVIEWS DATA — MKATALINA (mock + rebrand)
 * ============================================================================
 * Mock data para probar todos los estados visuales:
 *   - aretes-camelia: 4 reseñas (ratings altos)
 *   - collar-luna-llena: 3 reseñas (mixtas)
 *   - pulsera-dalia: 6 reseñas (para probar "Ver más")
 *   - gargantilla-ofelia: 2 reseñas
 *   - collar-amatista: 1 reseña
 *   - Resto: 0 reseñas (caso "Aún no hay reseñas")
 *
 * Cambio respecto a la versión anterior (rebrand):
 *   - rev-011 (Mariana D): comentario menciona "el sello de MKatalina"
 *     en lugar de "el sello de Katalina"
 *
 * Nota sobre reseñas mock:
 *   En un sistema real, las reseñas son contenido generado por usuarios
 *   y NO se modifican retroactivamente cuando cambia el nombre de la marca.
 *   Sin embargo, estos son mocks de desarrollo creados por nosotros, por lo
 *   que mantenerlos coherentes con el branding actual es lo correcto.
 *
 *   Cuando llegue el backend real, las reseñas que un cliente real haya
 *   escrito mencionando "Katalina" SE QUEDARÍAN como están (es la voz
 *   del cliente, no del sitio).
 * ============================================================================
 */

import type { Review, ReviewStats } from "@/types/review";

export const reviewsData: Review[] = [
  /* Aretes Camelia */
  {
    id: "rev-001",
    productSlug: "aretes-camelia",
    userId: "u-001",
    userName: "María L.",
    rating: 5,
    title: "Hermosos y bien empacados",
    comment:
      "Encargué unos para mi mamá y llegaron impecablemente empacados. La calidad supera por mucho lo que esperaba — se ven mucho mejor en persona que en las fotos. La caja viene perfecta para regalar.",
    createdAt: "2026-04-15T14:23:00.000Z",
    verified: true,
    helpful: 12,
  },
  {
    id: "rev-002",
    productSlug: "aretes-camelia",
    userId: "u-002",
    userName: "Sofía R.",
    rating: 5,
    title: "Cómodos para uso diario",
    comment:
      "Los uso todos los días desde hace 3 semanas y se mantienen como nuevos. No me han dado alergia (tengo piel sensible) y el cierre es seguro. Súper recomendados.",
    createdAt: "2026-04-08T09:15:00.000Z",
    verified: true,
    helpful: 8,
  },
  {
    id: "rev-003",
    productSlug: "aretes-camelia",
    userId: "u-003",
    userName: "Ana M.",
    rating: 4,
    title: "Bonitos pero más pequeños de lo esperado",
    comment:
      "Son hermosos, calidad excelente. Solo restaría puntos porque me los imaginaba un poco más grandes. Si te gusta lo minimalista son perfectos, si buscas algo más statement quizá no.",
    createdAt: "2026-03-22T18:40:00.000Z",
    verified: true,
    helpful: 15,
  },
  {
    id: "rev-004",
    productSlug: "aretes-camelia",
    userId: "u-004",
    userName: "Lucía P.",
    rating: 5,
    title: "Excelente atención",
    comment:
      "Además del producto excelente, la atención por WhatsApp fue rapidísima. Me ayudaron a confirmar el material y a coordinar la entrega.",
    createdAt: "2026-03-10T11:20:00.000Z",
    verified: false,
    helpful: 3,
  },

  /* Collar Luna Llena */
  {
    id: "rev-005",
    productSlug: "collar-luna-llena",
    userId: "u-005",
    userName: "Valentina G.",
    rating: 5,
    title: "Versátil y elegante",
    comment:
      "El collar perfecto para regalar. Lo compré para mi hermana en su cumpleaños y le encantó. Se ve igualito a las fotos y la cadena es resistente.",
    createdAt: "2026-04-20T16:00:00.000Z",
    verified: true,
    helpful: 9,
  },
  {
    id: "rev-006",
    productSlug: "collar-luna-llena",
    userId: "u-006",
    userName: "Daniela C.",
    rating: 4,
    title: "Muy bonito, llegó algo tarde",
    comment:
      "El producto es lindo, la calidad muy buena. El único pero es que la entrega tardó más de lo que esperaba (8 días en lugar de 3-5). Pero el producto compensa.",
    createdAt: "2026-04-05T10:30:00.000Z",
    verified: true,
    helpful: 5,
  },
  {
    id: "rev-007",
    productSlug: "collar-luna-llena",
    userId: "u-007",
    userName: "Regina F.",
    rating: 3,
    title: "Bonito pero la cadena se enreda fácil",
    comment:
      "El dije es muy bonito y bien hecho. Mi único problema es que la cadena se enreda con mucha facilidad si no la guardo extendida. Cuidado al guardarlo.",
    createdAt: "2026-03-18T13:45:00.000Z",
    verified: true,
    helpful: 21,
  },

  /* Pulsera Dalia (6 reseñas para probar "Ver más") */
  {
    id: "rev-008",
    productSlug: "pulsera-dalia",
    userId: "u-008",
    userName: "Camila T.",
    rating: 5,
    title: "Resistente al uso diario",
    comment:
      "La uso desde hace 2 meses todos los días, incluso para nadar, y se mantiene perfecta. Los colores no han perdido intensidad. Calidad excelente para el precio.",
    createdAt: "2026-04-25T12:00:00.000Z",
    verified: true,
    helpful: 18,
  },
  {
    id: "rev-009",
    productSlug: "pulsera-dalia",
    userId: "u-009",
    userName: "Fernanda B.",
    rating: 5,
    title: "Compré 3 para combinar",
    comment:
      "Compré 3 colores distintos para combinarlas. Quedan increíbles juntas. El ajuste corredizo es muy práctico, se adapta a muñeca normal o más gruesa sin problema.",
    createdAt: "2026-04-18T15:30:00.000Z",
    verified: true,
    helpful: 11,
  },
  {
    id: "rev-010",
    productSlug: "pulsera-dalia",
    userId: "u-010",
    userName: "Isabel N.",
    rating: 4,
    title: "Linda pero el nudo aprieta",
    comment:
      "Me encanta el diseño y los colores. El único detalle es que el nudo corredizo a veces aprieta más de lo necesario y hay que ajustarlo. Una vez ajustada, comodísima.",
    createdAt: "2026-04-10T09:45:00.000Z",
    verified: true,
    helpful: 7,
  },
  {
    id: "rev-011",
    productSlug: "pulsera-dalia",
    userId: "u-011",
    userName: "Mariana D.",
    rating: 5,
    title: "Perfecta para regalo",
    // Mención rebrandeada: "el sello de Katalina" → "el sello de MKatalina"
    comment:
      "Compré 2 para regalar y a las dos personas les fascinó. La caja con el sello de MKatalina hace que se vea aún más especial.",
    createdAt: "2026-03-28T14:20:00.000Z",
    verified: true,
    helpful: 6,
  },
  {
    id: "rev-012",
    productSlug: "pulsera-dalia",
    userId: "u-012",
    userName: "Paola S.",
    rating: 5,
    title: "Calidad del hilo encerado increíble",
    comment:
      "El hilo se ve y se siente de muy buena calidad. No es el típico hilo de pulserita barata, este se siente sólido y bien tejido. Vale cada peso.",
    createdAt: "2026-03-15T11:10:00.000Z",
    verified: false,
    helpful: 4,
  },
  {
    id: "rev-013",
    productSlug: "pulsera-dalia",
    userId: "u-013",
    userName: "Renata V.",
    rating: 4,
    title: "Bonita aunque más pequeña que en fotos",
    comment:
      "Es preciosa y bien hecha, pero los colores se ven un poco diferentes a las fotos (más apagados en persona). Sigue siendo bonita, solo gestionar expectativas.",
    createdAt: "2026-02-28T16:50:00.000Z",
    verified: true,
    helpful: 9,
  },

  /* Gargantilla Ofelia (2 reseñas) */
  {
    id: "rev-014",
    productSlug: "gargantilla-ofelia",
    userId: "u-014",
    userName: "Andrea M.",
    rating: 5,
    title: "Pieza statement perfecta",
    comment:
      "Compré esta gargantilla para una boda y me llovieron preguntas sobre dónde la había conseguido. Las piedras son hermosas, el engarce es impecable. Vale completamente la edición limitada.",
    createdAt: "2026-04-26T20:00:00.000Z",
    verified: true,
    helpful: 14,
  },
  {
    id: "rev-015",
    productSlug: "gargantilla-ofelia",
    userId: "u-015",
    userName: "Patricia O.",
    rating: 5,
    title: "Lujo accesible",
    comment:
      "Me costó decidirme por el precio pero al recibirla entendí. Se siente como una pieza de joyería fina pero a precio mucho más accesible. La caja viene con certificado de las piedras.",
    createdAt: "2026-04-12T13:30:00.000Z",
    verified: true,
    helpful: 7,
  },

  /* Collar Amatista (1 reseña) */
  {
    id: "rev-016",
    productSlug: "collar-amatista",
    userId: "u-016",
    userName: "Beatriz H.",
    rating: 5,
    title: "Amatista de calidad real",
    comment:
      "Soy coleccionista de piedras y puedo confirmar que esta amatista es de buena calidad — color uniforme, sin inclusiones obvias, talla bien pulida. Por el precio es una joya (literalmente).",
    createdAt: "2026-04-22T17:15:00.000Z",
    verified: true,
    helpful: 22,
  },
];

/**
 * Devuelve las reseñas de un producto ordenadas por fecha descendente.
 */
export function getReviewsByProduct(productSlug: string): Review[] {
  return reviewsData
    .filter((r) => r.productSlug === productSlug)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Calcula estadísticas agregadas. Si no hay reseñas, devuelve ceros
 * (no null) para que la UI siempre tenga un objeto válido.
 */
export function calculateReviewStats(productSlug: string): ReviewStats {
  const reviews = getReviewsByProduct(productSlug);

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = sum / reviews.length;

  const distribution: Record<"1" | "2" | "3" | "4" | "5", number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };

  for (const review of reviews) {
    const key = review.rating.toString() as "1" | "2" | "3" | "4" | "5";
    distribution[key]++;
  }

  return {
    averageRating,
    totalReviews: reviews.length,
    distribution,
  };
}