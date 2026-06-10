/**
 * ============================================================================
 * CONTACT FORM — KATALINA (Fase 12 Turno 3A: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - Recibe `uiText` como prop con TODOS los strings ya traducidos
 *     (labels, placeholders, errores, mensajes de éxito, opciones del
 *     dropdown). El padre (page.tsx) los resuelve según el locale activo.
 *   - Recibe `fallbackEmail` como prop (el email mostrado en el banner
 *     informativo de "envíanos directamente")
 *   - Eliminamos el import de `contactContent` — ya no leemos data
 *     directamente, todo entra por props
 *   - Eliminamos el array hardcoded `SUBJECT_OPTIONS` — ahora viene
 *     en `uiText.subjectOptions`
 *   - `validateField` recibe los mensajes de error como parámetro en
 *     lugar de tenerlos hardcoded en español
 *
 * La lógica funcional NO cambia:
 *   - Validación inline en blur
 *   - Scroll al primer campo con error en submit
 *   - Simulación de 1 segundo de envío
 *   - Toast verde de éxito
 *   - Limpieza del form después de éxito
 *
 * Patrón "el padre decide":
 *   Este componente ahora es "tonto" en cuanto a contenido — solo
 *   muestra lo que recibe. El padre (page.tsx que conoce el locale)
 *   resuelve qué strings pasarle. Ventajas:
 *     - El componente es testeable con cualquier set de strings
 *     - Si en el futuro agregamos más idiomas, no toca este archivo
 *     - El componente puede usarse en distintos contextos con distintos
 *       textos (ej. un modal "Contáctanos" con título diferente)
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── TIPOS ───────────────────────────────────────────────────────────── */

/**
 * Estructura de los datos del formulario.
 * Sigue siendo idéntica a la versión anterior.
 */
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

/**
 * uiText: todos los strings traducidos que el componente necesita.
 *
 * Forma exhaustiva: contiene cada label, placeholder, mensaje de error
 * y opción del dropdown. El padre los resuelve con getLocalized() según
 * el locale activo y nos los pasa todos juntos.
 */
export interface ContactFormUiText {
  eyebrow: string;
  title: string;
  description: string;
  labels: {
    name: string;
    email: string;
    emailHint: string;
    subject: string;
    subjectPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    backendPending: string;
  };
  errors: {
    nameRequired: string;
    nameMin: string;
    emailRequired: string;
    emailInvalid: string;
    subjectRequired: string;
    messageRequired: string;
    messageMin: string;
  };
  subjectOptions: Array<{
    value: string;
    label: string;
  }>;
  successMessage: string;
  successDescription: string;
}

interface ContactFormProps {
  uiText: ContactFormUiText;
  /** Email mostrado en el banner "envíanos directamente a..." */
  fallbackEmail: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

/**
 * Validar un campo individual.
 *
 * Cambio respecto a la versión anterior:
 *   Ahora recibe `errorMessages` como parámetro en lugar de tener los
 *   mensajes hardcoded en español. Así puede devolver el mensaje en el
 *   idioma activo.
 */
function validateField(
  field: keyof FormData,
  value: string,
  errorMessages: ContactFormUiText["errors"]
): string | undefined {
  const trimmed = value.trim();

  switch (field) {
    case "name":
      if (!trimmed) return errorMessages.nameRequired;
      if (trimmed.length < 2) return errorMessages.nameMin;
      return undefined;

    case "email": {
      if (!trimmed) return errorMessages.emailRequired;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return errorMessages.emailInvalid;
      return undefined;
    }

    case "subject":
      if (!trimmed) return errorMessages.subjectRequired;
      return undefined;

    case "message":
      if (!trimmed) return errorMessages.messageRequired;
      if (trimmed.length < 10) return errorMessages.messageMin;
      return undefined;

    default:
      return undefined;
  }
}

export function ContactForm({ uiText, fallbackEmail }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Actualizar un campo. Limpia el error de ese campo si existía.
   *
   * El generic K asegura que `value` sea del tipo correcto para el field
   * (todos son string en este caso, pero el patrón es escalable).
   */
  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Validar todos los campos antes de submit.
   * Devuelve true si todo OK.
   *
   * Pasamos uiText.errors a validateField para que use los mensajes
   * en el idioma activo.
   */
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const error = validateField(field, formData[field], uiText.errors);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handler del submit. Valida y simula envío.
   *
   * Si hay errores, hace scroll al primer campo con error y le da focus.
   * Si no hay errores, simula latencia de 1 segundo y muestra toast verde.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      // Scroll al primer campo con error
      const firstErrorField = (Object.keys(formData) as Array<keyof FormData>)
        .find(
          (field) =>
            validateField(field, formData[field], uiText.errors) !== undefined
        );

      if (firstErrorField) {
        const element = document.getElementById(`contact-${firstErrorField}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    // Simular envío (1 segundo) — en Fase de backend será POST real a /api/contact
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(uiText.successMessage, {
      description: uiText.successDescription,
    });

    setFormData(EMPTY_FORM);
    setIsSubmitting(false);
  };

  /**
   * Helper para clases de input. Si hay error, agrega border destructive.
   */
  const inputClass = (field: keyof FormErrors) =>
    cn(
      "w-full h-11 px-3",
      "bg-background border border-input rounded-md",
      "text-sm",
      "focus:outline-none focus:border-ring transition-colors",
      errors[field] && "border-destructive"
    );

  /**
   * Helper para renderizar el mensaje de error de un campo.
   */
  const fieldError = (field: keyof FormErrors) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1" role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div>
      {/*
       * Header del formulario.
       * Ahora viene del uiText (antes estaba hardcoded en la página).
       */}
      <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
        {uiText.eyebrow}
      </p>
      <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
        {uiText.title}
      </h2>
      <p className="text-sm text-muted-foreground mb-8">{uiText.description}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium mb-1.5"
          >
            {uiText.labels.name}
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            onBlur={() => {
              const error = validateField("name", formData.name, uiText.errors);
              if (error) setErrors((prev) => ({ ...prev, name: error }));
            }}
            className={inputClass("name")}
          />
          {fieldError("name")}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium mb-1.5"
          >
            {uiText.labels.email}
          </label>
          <input
            id="contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => {
              const error = validateField(
                "email",
                formData.email,
                uiText.errors
              );
              if (error) setErrors((prev) => ({ ...prev, email: error }));
            }}
            placeholder="tu@email.com"
            className={inputClass("email")}
          />
          {fieldError("email")}
          <p className="text-xs text-muted-foreground mt-1">
            {uiText.labels.emailHint}
          </p>
        </div>

        {/* Asunto (dropdown) */}
        <div>
          <label
            htmlFor="contact-subject"
            className="block text-sm font-medium mb-1.5"
          >
            {uiText.labels.subject}
          </label>
          <select
            id="contact-subject"
            value={formData.subject}
            onChange={(e) => updateField("subject", e.target.value)}
            onBlur={() => {
              const error = validateField(
                "subject",
                formData.subject,
                uiText.errors
              );
              if (error) setErrors((prev) => ({ ...prev, subject: error }));
            }}
            className={cn(inputClass("subject"), "cursor-pointer pr-8")}
          >
            <option value="">{uiText.labels.subjectPlaceholder}</option>
            {uiText.subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("subject")}
        </div>

        {/* Mensaje */}
        <div>
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium mb-1.5"
          >
            {uiText.labels.message}
          </label>
          <textarea
            id="contact-message"
            rows={5}
            value={formData.message}
            onChange={(e) => updateField("message", e.target.value)}
            onBlur={() => {
              const error = validateField(
                "message",
                formData.message,
                uiText.errors
              );
              if (error) setErrors((prev) => ({ ...prev, message: error }));
            }}
            placeholder={uiText.labels.messagePlaceholder}
            className={cn(
              "w-full px-3 py-2",
              "bg-background border rounded-md",
              "text-sm resize-none",
              "focus:outline-none transition-colors",
              errors.message
                ? "border-destructive"
                : "border-input focus:border-ring"
            )}
          />
          {fieldError("message")}
        </div>

        {/*
         * Banner informativo: simulación.
         * Cuando integremos backend, este banner desaparece y el form
         * funciona de verdad enviando a /api/contact.
         */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-md",
            "bg-accent-subtle border border-accent/20",
            "text-xs text-muted-foreground"
          )}
        >
          <AlertCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
          <p>
            {uiText.labels.backendPending}{" "}
            <a
              href={`mailto:${fallbackEmail}`}
              className="text-foreground underline underline-offset-2 hover:text-accent"
            >
              {fallbackEmail}
            </a>
            .
          </p>
        </div>

        {/* Botón submit */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            uiText.labels.sending
          ) : (
            <>
              <Send className="h-4 w-4" />
              {uiText.labels.submit}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}