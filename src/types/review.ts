/**
 * ============================================================================
 * REVIEW TYPES — KATALINA
 * ============================================================================
 * Tipos para el sistema de reseñas. Cuando integremos backend:
 *   - Tabla `reviews` con estos campos.
 *   - Flujo: usuario escribe → estado pending → admin aprueba → aparece pública.
 *   - `verified` se calcula buscando orders completados del usuario con
 *     este producto.
 * ============================================================================
 */

export interface Review {
  id: string;
  productSlug: string;
  userId: string;
  /**
   * Nombre cacheado en la reseña al momento de escribir.
   * Práctica correcta para histórico (alternativa: JOIN costoso + problemas
   * de privacidad al editar el nombre del usuario).
   */
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Título breve, máximo 80 chars en UI */
  title: string;
  /** Comentario, mínimo 20 / máximo 1000 chars en UI */
  comment: string;
  createdAt: string;
  /**
   * ¿Compra verificada? En backend se calcula buscando si el userId
   * tiene un order completado con este productId.
   */
  verified: boolean;
  /** Cuántos usuarios marcaron "Esto me sirvió" */
  helpful: number;
}

/** Campos que envía el usuario al crear una reseña (lo demás lo pone backend) */
export interface NewReviewInput {
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  comment: string;
}

/** Estadísticas agregadas mostradas arriba del listado */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  /** Conteo de reseñas por cada nivel de rating */
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}