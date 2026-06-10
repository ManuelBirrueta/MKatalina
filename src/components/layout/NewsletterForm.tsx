/**
 * ============================================================================
 * NEWSLETTER FORM — KATALINA
 * ============================================================================
 *
 * Formulario de suscripción al newsletter. Extraído del Footer.tsx como un
 * componente independiente porque NECESITA ser Client Component (tiene un
 * onSubmit handler), mientras que el resto del Footer es Server Component.
 *
 * Este patrón se llama "Islands Architecture" en Next.js App Router:
 *   - El "océano" (la mayoría del footer: logo, columnas, links) es Server
 *     Component → no envía JavaScript al cliente
 *   - La "isla" (este formulario) es Client Component → solo este pedazo
 *     pequeño envía JS
 *
 * Resultado: bundle más chico, mejor performance, sin sacrificar interactividad.
 *
 * ROADMAP — qué va a cambiar en este componente:
 *
 *   Ahora (placeholder):
 *     - onSubmit muestra un alert
 *
 *   Fase 7 (integración con Resend):
 *     - Estado de loading mientras el email se procesa
 *     - Validación de formato de email
 *     - Llamada a una Server Action que:
 *         1. Valida el email
 *         2. Llama a Resend API para agregar a la lista
 *         3. Envía email de welcome con código de descuento
 *     - Muestra mensaje de éxito o error
 *     - El input se limpia tras éxito
 * ============================================================================
 */

"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * NewsletterForm — el formulario de suscripción.
 *
 * Por ahora es simple: input + botón + alert al submit.
 * Cuando integremos Resend en Fase 7, este componente crecerá con:
 *   - useState para tracking del email y estado del submit
 *   - useFormState (de React) o useMutation (de TanStack Query) para el envío
 *   - Toast de éxito/error en lugar de alert
 */
export function NewsletterForm() {
  return (
    <form
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      onSubmit={(e) => {
        // preventDefault evita que el form recargue la página al submit
        e.preventDefault();
        alert("Newsletter — integración con Resend pendiente (Fase 7)");
      }}
    >
      <input
        type="email"
        placeholder="tu@email.com"
        required
        aria-label="Tu dirección de email"
        className={cn(
          "flex-1 h-11 px-4",
          // Fondo transparente: el input "respira" sobre el cacao del footer
          "bg-transparent border border-primary-foreground/30",
          "text-primary-foreground placeholder:text-primary-foreground/40",
          "rounded-md",
          // Focus: borde cobre (no rosa polvo) porque el footer es oscuro
          // y el cobre destaca mejor que el rosa contra cacao
          "focus:outline-none focus:border-accent",
          "transition-colors"
        )}
      />
      <Button type="submit" variant="gold" className="sm:w-auto">
        <Send className="h-3.5 w-3.5" />
        Suscribirme
      </Button>
    </form>
  );
}