/**
 * ============================================================================
 * PAGE: /[locale]/(account)/perfil — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - useLocale + useTranslations agregados con namespace profile
 *   - Todos los textos hardcoded traducidos:
 *     * Header (título + subtítulo)
 *     * Sección "Datos personales" (heading, labels, botones, errores, toast)
 *     * Sección "Seguridad" (heading, password info, botón, toast pending)
 *     * Sección "Zona de peligro" (heading, eliminar cuenta, botón, toast)
 *   - Date formatting de "Miembro desde" con locale dinámico
 *   - Validación de "Mínimo 2 caracteres" desde messages.json
 *
 * Lo que NO cambia:
 *   - Lógica de edit/save/cancel
 *   - Validación de length (sigue siendo >= 2)
 *   - setCurrentUser del auth store
 *   - Email read-only
 *   - Botones de cambiar password / eliminar cuenta siguen siendo
 *     placeholders que muestran toast info
 *
 * ─── SOBRE LA VALIDACIÓN ─────────────────────────────────────────────────
 *
 * Validación de "mínimo 2 caracteres" hardcoded. Si quisieras hacer la
 * regla configurable (ej. mínimo 3 en producción), podrías pasar el
 * número en el mensaje: errorMinChars: "Mínimo {count} caracteres" e
 * interpolarlo con count: MIN_CHARS.
 *
 * Por ahora lo dejo como mensaje fijo "Mínimo 2 caracteres" porque ese
 * número está hardcoded en la lógica también. Si cambias uno, cambia
 * el otro.
 * ─────────────────────────────────────────────────────────────────────────
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Locale } from "@/i18n/routing";

export default function ProfilePage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("profile");

  const { user } = useAuth();

  /**
   * Acceso directo a setCurrentUser del store.
   * No exponemos esto en useAuth porque es admin-like.
   */
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  // Estado del formulario de edición
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  // Guard: si no hay user, no renderizamos (el layout debió redirigir)
  if (!user) return null;

  /**
   * Formatear "Miembro desde" según el locale activo.
   *   - es → "1 de mayo de 2026"
   *   - en → "May 1, 2026"
   */
  const intlLocale = locale === "es" ? "es-MX" : "en-US";
  const memberSince = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  const startEditing = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setErrors({});
    setIsEditing(false);
  };

  const saveChanges = () => {
    const newErrors: typeof errors = {};
    // Mensaje de error desde namespace traducido
    const errorMsg = t("personalData.errorMinChars");

    if (!firstName.trim() || firstName.trim().length < 2) {
      newErrors.firstName = errorMsg;
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      newErrors.lastName = errorMsg;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Aplicar cambios al store
    setCurrentUser({
      ...user,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    toast.success(t("personalData.toastSuccessTitle"), {
      description: t("personalData.toastSuccessDescription"),
    });

    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header de la página */}
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* ─── SECCIÓN: DATOS PERSONALES ─────────────────────────────── */}
      <section
        className={cn(
          "border border-border rounded-md p-6 bg-card",
          "space-y-6"
        )}
        aria-labelledby="personal-data-heading"
      >
        <div className="flex items-center justify-between">
          <h2
            id="personal-data-heading"
            className="text-xs uppercase tracking-[0.2em] font-medium"
          >
            {t("personalData.heading")}
          </h2>

          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              className="gap-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("personalData.editButton")}
            </Button>
          )}
        </div>

        {/* Vista de los campos: texto en modo "ver", inputs en modo "editar" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              {t("personalData.firstNameLabel")}
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName)
                      setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  className={cn(
                    "w-full h-10 px-3 bg-background",
                    "border rounded-md text-sm",
                    "focus:outline-none transition-colors",
                    errors.firstName
                      ? "border-destructive"
                      : "border-input focus:border-ring"
                  )}
                  autoFocus
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.firstName}
                  </p>
                )}
              </>
            ) : (
              <p className="text-base font-medium">{user.firstName}</p>
            )}
          </div>

          {/* Apellido */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              {t("personalData.lastNameLabel")}
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName)
                      setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                  className={cn(
                    "w-full h-10 px-3 bg-background",
                    "border rounded-md text-sm",
                    "focus:outline-none transition-colors",
                    errors.lastName
                      ? "border-destructive"
                      : "border-input focus:border-ring"
                  )}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.lastName}
                  </p>
                )}
              </>
            ) : (
              <p className="text-base font-medium">{user.lastName}</p>
            )}
          </div>

          {/* Email — NO editable */}
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground block mb-1">
              {t("personalData.emailLabel")}
            </label>
            <p className="text-base font-medium">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("personalData.emailNote")}
            </p>
          </div>

          {/* Miembro desde */}
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground block mb-1">
              {t("personalData.memberSinceLabel")}
            </label>
            <p className="text-sm">{memberSince}</p>
          </div>
        </div>

        {/* Botones de acción en modo edición */}
        {isEditing && (
          <div className="flex gap-3 pt-2 border-t border-border">
            <Button onClick={saveChanges} className="gap-2">
              <Check className="h-4 w-4" />
              {t("personalData.saveButton")}
            </Button>
            <Button onClick={cancelEditing} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              {t("personalData.cancelButton")}
            </Button>
          </div>
        )}
      </section>

      {/* ─── SECCIÓN: SEGURIDAD ────────────────────────────────────── */}
      <section
        className="border border-border rounded-md p-6 bg-card space-y-4"
        aria-labelledby="security-heading"
      >
        <h2
          id="security-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium"
        >
          {t("security.heading")}
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">{t("security.passwordTitle")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("security.passwordDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info(t("security.toastPendingTitle"), {
                description: t("security.toastPendingDescription"),
              })
            }
          >
            {t("security.changeButton")}
          </Button>
        </div>
      </section>

      {/* ─── SECCIÓN: ZONA DE PELIGRO ──────────────────────────────── */}
      <section
        className={cn(
          "border border-destructive/30 rounded-md p-6",
          "bg-destructive/5 space-y-4"
        )}
        aria-labelledby="danger-heading"
      >
        <h2
          id="danger-heading"
          className="text-xs uppercase tracking-[0.2em] font-medium text-destructive"
        >
          {t("dangerZone.heading")}
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {t("dangerZone.deleteAccountTitle")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dangerZone.deleteAccountDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info(t("dangerZone.toastPendingTitle"), {
                description: t("dangerZone.toastPendingDescription"),
              })
            }
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            {t("dangerZone.deleteButton")}
          </Button>
        </div>
      </section>
    </div>
  );
}