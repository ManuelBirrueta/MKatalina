/**
 * ============================================================================
 * PAGE: /[locale]/checkout/confirmacion — KATALINA (Fase 12 Turno 3B.4 fix)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior (Turno 3B.3):
 *   - GuestAccountPrompt actualizado para consumir el nuevo contrato de
 *     useAuth().register() que ahora devuelve `errorCode` en lugar de
 *     `error` (cambio del Grupo D).
 *   - PASSWORD_RULES ahora usa `messageKey` en lugar de `message` (cambio
 *     del Grupo D). El componente resuelve los textos con tPasswordRules.
 *   - Comentarios obsoletos eliminados/actualizados: las notas que decían
 *     "esto se queda en español porque sería invasivo refactorizar" ya no
 *     aplican porque ese refactor invasivo YA se hizo en el Grupo D.
 *
 * Lo que NO cambia:
 *   - Toda la arquitectura del archivo (FullConfirmation, MinimalConfirmation,
 *     GuestAccountPrompt, SuccessHeader, CTAButtons, InvalidOrderState)
 *   - Defensive parsing de item.name y shippingMethod.label/description
 *   - El flujo de sessionStorage + URL param
 *   - Las traducciones de checkout.confirmation.* (intactas)
 *
 * ─── DETALLE DEL FIX ───────────────────────────────────────────────────
 *
 * BUG 1 (línea original ~388): result.error
 *   Antes:
 *     setError(result.error ?? t("errorGeneric"));
 *   Después:
 *     setError(
 *       result.errorCode
 *         ? tAuthErrors(result.errorCode as any)
 *         : t("errorGeneric")
 *     );
 *
 *   Razón: useAuth().register() ahora devuelve { success, errorCode? } donde
 *   errorCode es uno de: "registerEmptyFields" | "registerInvalidPassword" |
 *   "registerEmailTaken". El componente traduce el código contra
 *   auth.errors.{code}.
 *
 * BUG 2 (línea original ~430): rule.message
 *   Antes:
 *     <span>{rule.message}</span>
 *   Después:
 *     <span>{tPasswordRules(rule.messageKey as any)}</span>
 *
 *   Razón: PASSWORD_RULES ahora es PasswordRule[] con messageKey en lugar
 *   de message. Las claves disponibles son "minChars" | "uppercase" | "number"
 *   bajo el namespace auth.passwordRules.
 *
 * ─── POR QUÉ EL CAST A `any` ───────────────────────────────────────────
 *
 * next-intl tipa las claves de t() estrictamente con TypeScript. Cuando
 * el código pasa una clave DINÁMICA (como result.errorCode que es un string
 * en runtime), TS no puede verificar en compile-time que ese string sea
 * una clave válida del namespace.
 *
 * Soluciones consideradas:
 *
 *   A) Verificar manualmente con un type guard:
 *      const KNOWN_CODES = ["registerEmptyFields", ...] as const;
 *      if (KNOWN_CODES.includes(result.errorCode)) { ... }
 *      → Muy verboso, duplica info.
 *
 *   B) Cast a `any`:
 *      tAuthErrors(result.errorCode as any)
 *      → Pragmático. Confiamos en que el hook devuelve códigos válidos.
 *
 *   C) Tipar errorCode con el union literal:
 *      errorCode?: "registerEmptyFields" | "registerInvalidPassword" | ...
 *      → Mejor diseño pero requiere refactorizar el hook ahora.
 *
 * Elegimos B por simplicidad y consistencia con LoginForm/RegisterForm
 * que ya usan este patrón. Cuando lleguemos a backend real, los códigos
 * los define el server y este patrón se mantiene válido.
 * ─────────────────────────────────────────────────────────────────────
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ShoppingBag,
  ArrowRight,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { PASSWORD_RULES } from "@/data/mock-users";
import { toast } from "sonner";
import { getLocalizedSafe } from "@/lib/i18n-helpers";
import type { LocalizedString } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

/**
 * Tipo del item de la orden con soporte para datos legacy.
 */
interface OrderItem {
  slug: string;
  name: string | LocalizedString;
  price: number;
  quantity: number;
  lineTotal: number;
  image: string;
  category: string;
}

interface OrderSnapshot {
  orderId: string;
  formData: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    addressLine2: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    notes: string;
  };
  shippingMethod: {
    id: string;
    label: string | LocalizedString;
    description: string | LocalizedString;
    price: number;
  };
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
}

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("orden");

  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [hasReadStorage, setHasReadStorage] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("katalina-last-order");
      if (raw) {
        const parsed: OrderSnapshot = JSON.parse(raw);
        if (parsed.orderId === orderIdFromUrl) {
          setOrder(parsed);
        }
      }
    } catch {
      // Ignorar fallas de sessionStorage
    }
    setHasReadStorage(true);
  }, [orderIdFromUrl]);

  if (!orderIdFromUrl) {
    return <InvalidOrderState />;
  }

  if (!hasReadStorage) {
    return (
      <Container>
        <div className="h-96" aria-hidden="true" />
      </Container>
    );
  }

  if (order) {
    return <FullConfirmation order={order} />;
  }

  return <MinimalConfirmation orderId={orderIdFromUrl} />;
}

function FullConfirmation({ order }: { order: OrderSnapshot }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout.confirmation");

  const shippingLabel = getLocalizedSafe(order.shippingMethod.label, locale);
  const shippingDescription = getLocalizedSafe(
    order.shippingMethod.description,
    locale
  );

  return (
    <>
      <Container>
        <div className="py-12 lg:py-16">
          <SuccessHeader orderId={order.orderId} email={order.formData.email} />

          <GuestAccountPrompt order={order} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* COLUMNA 1: Items + totales */}
            <section className="border border-border rounded-md p-6 bg-card">
              <h2 className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border">
                {t("order.title")}
              </h2>

              <ul className="space-y-4 mb-6">
                {order.items.map((item) => {
                  const itemName = getLocalizedSafe(item.name, locale);

                  return (
                    <li key={item.slug} className="flex gap-3">
                      <div
                        className={cn(
                          "relative w-14 h-[70px] flex-shrink-0",
                          "bg-secondary-subtle overflow-hidden"
                        )}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {item.category[0]}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{itemName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("order.quantityLabel")} {item.quantity} ×{" "}
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <p className="text-sm font-medium tabular-nums whitespace-nowrap">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("order.subtotal")}
                  </span>
                  <span className="tabular-nums">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{shippingLabel}</span>
                  <span className="tabular-nums">
                    {formatPrice(order.shippingMethod.price)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-medium pt-2 border-t border-border mt-2">
                  <span>{t("order.totalPaid")}</span>
                  <span className="tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </section>

            {/* COLUMNA 2: Dirección + tiempo estimado */}
            <section className="space-y-6">
              <div className="border border-border rounded-md p-6 bg-card">
                <h2 className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border">
                  {t("shipping.title")}
                </h2>

                <address className="not-italic text-sm leading-relaxed">
                  <p className="font-medium">
                    {order.formData.firstName} {order.formData.lastName}
                  </p>
                  <p className="text-muted-foreground">
                    {order.formData.address}
                    {order.formData.addressLine2 &&
                      `, ${order.formData.addressLine2}`}
                  </p>
                  <p className="text-muted-foreground">
                    {order.formData.neighborhood}
                  </p>
                  <p className="text-muted-foreground">
                    {order.formData.city}, {order.formData.state}{" "}
                    {order.formData.postalCode}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {t("shipping.phoneLabel")} {order.formData.phone}
                  </p>
                </address>

                {order.formData.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      {t("shipping.notesLabel")}
                    </p>
                    <p className="text-sm">{order.formData.notes}</p>
                  </div>
                )}
              </div>

              <div className="border border-border rounded-md p-6 bg-card">
                <h2 className="text-xs uppercase tracking-[0.2em] font-medium mb-4 pb-2 border-b border-border">
                  {t("estimatedTime.title")}
                </h2>

                <p className="font-display text-lg font-medium">
                  {shippingDescription}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("estimatedTime.emailFollowUp")}
                </p>
              </div>
            </section>
          </div>

          <CTAButtons />
        </div>
      </Container>
    </>
  );
}

/**
 * GuestAccountPrompt — banner que invita a invitados a crear cuenta.
 *
 * CAMBIO Turno 3B.4 (fix):
 *   - result.error → result.errorCode + tAuthErrors() para traducir
 *   - rule.message → tPasswordRules(rule.messageKey) para traducir requisitos
 *
 * Ahora los password rules y los errores del hook se muestran en el idioma
 * activo (antes quedaban en español incluso en /en).
 */
function GuestAccountPrompt({ order }: { order: OrderSnapshot }) {
  const t = useTranslations("checkout.confirmation.guestAccount");
  /**
   * Dos namespaces nuevos:
   *   - tAuthErrors: para traducir result.errorCode del hook
   *     (registerEmptyFields, registerInvalidPassword, registerEmailTaken)
   *   - tPasswordRules: para traducir los requisitos de contraseña
   *     (minChars, uppercase, number)
   */
  const tAuthErrors = useTranslations("auth.errors");
  const tPasswordRules = useTranslations("auth.passwordRules");

  const { isAuthenticated, register } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  if (isAuthenticated) return null;

  if (accountCreated) {
    return (
      <div
        className={cn(
          "max-w-4xl mx-auto mb-8",
          "border border-success/30 rounded-md p-6",
          "bg-success/5 text-center"
        )}
      >
        <Check className="h-6 w-6 text-success mx-auto mb-2" />
        <p className="font-medium">{t("successTitle")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("successDescription")}
        </p>
      </div>
    );
  }

  const handleCreateAccount = async () => {
    setError(null);

    if (!password) {
      setError(t("errorEmpty"));
      return;
    }

    if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
      setError(t("errorRequirements"));
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      email: order.formData.email,
      password,
      firstName: order.formData.firstName,
      lastName: order.formData.lastName,
    });

    if (result.success) {
      toast.success(t("toastSuccess"), {
        description: t("toastSuccessDescription", {
          firstName: order.formData.firstName,
        }),
      });
      setAccountCreated(true);
    } else {
      /**
       * El hook ahora devuelve `errorCode` (no `error`).
       * Traducimos el código contra el namespace auth.errors.
       * Si por alguna razón no viene código, usamos el genérico
       * del namespace guestAccount.errorGeneric.
       */
      const errorMessage = result.errorCode
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tAuthErrors(result.errorCode as any)
        : t("errorGeneric");
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "max-w-4xl mx-auto mb-8",
        "border border-accent/30 rounded-md p-6",
        "bg-accent-subtle"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex w-12 h-12 rounded-full bg-accent/10 items-center justify-center flex-shrink-0">
          <UserPlus className="h-5 w-5 text-accent" />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-xl font-medium mb-1">
            {t("title")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("description")}
          </p>

          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {t("createButton")}
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Email (read-only) */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("emailLabel")}
                </p>
                <p className="text-sm font-medium">{order.formData.email}</p>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="guest-password"
                  className="block text-xs text-muted-foreground mb-1"
                >
                  {t("passwordLabel")}
                </label>
                <div className="relative max-w-sm">
                  <input
                    id="guest-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className={cn(
                      "w-full h-10 px-3 pr-10",
                      "bg-background border rounded-md",
                      "text-sm",
                      "focus:outline-none transition-colors",
                      error
                        ? "border-destructive"
                        : "border-input focus:border-ring"
                    )}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? t("hidePassword") : t("showPassword")
                    }
                    tabIndex={-1}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2",
                      "text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    )}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/*
                 * Requisitos de password traducidos al idioma activo.
                 * Cada rule.messageKey ("minChars" | "uppercase" | "number")
                 * se resuelve contra auth.passwordRules.{key}.
                 *
                 * Cast a any necesario porque next-intl tipa estrictamente
                 * las claves; el messageKey de PasswordRule es un union
                 * literal pero el lookup dinámico necesita el cast.
                 */}
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule, index) => {
                    const passes = rule.test(password);
                    return (
                      <li
                        key={index}
                        className={cn(
                          "flex items-center gap-2 text-xs transition-colors",
                          passes ? "text-success" : "text-muted-foreground"
                        )}
                      >
                        {passes ? "✓" : "○"}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <span>{tPasswordRules(rule.messageKey as any)}</span>
                      </li>
                    );
                  })}
                </ul>

                {error && (
                  <p className="text-xs text-destructive mt-2">{error}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleCreateAccount}
                  disabled={isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? t("submitting") : t("submitButton")}
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setPassword("");
                    setError(null);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  {t("cancelButton")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MinimalConfirmation({ orderId }: { orderId: string }) {
  const t = useTranslations("checkout.confirmation");

  return (
    <Container>
      <div className="py-12 lg:py-16">
        <SuccessHeader orderId={orderId} email={null} />
        <div className="text-center max-w-md mx-auto mb-12">
          <p className="text-sm text-muted-foreground">{t("minimalNotice")}</p>
        </div>
        <CTAButtons />
      </div>
    </Container>
  );
}

function InvalidOrderState() {
  const t = useTranslations("checkout.confirmation.invalidOrder");

  return (
    <Container>
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl font-medium mb-3">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
          {t("description")}
        </p>
        <Button asChild>
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </Container>
  );
}

function SuccessHeader({
  orderId,
  email,
}: {
  orderId: string;
  email: string | null;
}) {
  const t = useTranslations("checkout.confirmation.successHeader");

  return (
    <div className="text-center mb-12">
      <div
        className={cn(
          "inline-flex items-center justify-center",
          "w-20 h-20 rounded-full",
          "bg-success/10 mb-6"
        )}
      >
        <Check className="h-10 w-10 text-success" strokeWidth={1.5} />
      </div>

      <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">
        {t("title")}
      </h1>

      {email && (
        <p className="text-sm text-muted-foreground mb-4">
          {t("emailSent")} <strong>{email}</strong>
        </p>
      )}

      <div className="inline-block">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
          {t("orderNumber")}
        </p>
        <p className="font-mono text-lg font-medium tabular-nums">{orderId}</p>
      </div>
    </div>
  );
}

function CTAButtons() {
  const t = useTranslations("checkout.confirmation.cta");

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-12 max-w-md mx-auto">
      <Button asChild className="flex-1">
        <Link href="/aretes">
          <ShoppingBag className="h-4 w-4" />
          {t("continueShopping")}
        </Link>
      </Button>
      <Button asChild variant="outline" className="flex-1">
        <Link href="/mis-pedidos">
          {t("viewOrders")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="h-96" aria-hidden="true" />
        </Container>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}