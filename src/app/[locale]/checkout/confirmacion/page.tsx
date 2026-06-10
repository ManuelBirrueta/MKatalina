/**
 * ============================================================================
 * PAGE: /[locale]/checkout/confirmacion — KATALINA (Fase 12 Turno 3B.3: bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - import Link cambia de "next/link" a "@/i18n/navigation"
 *   - Todos los textos hardcoded ahora vienen de messages.json bajo el
 *     namespace checkout.confirmation
 *   - DEFENSIVE PARSING: `item.name` puede ser string (formato legacy)
 *     o LocalizedString (formato nuevo). Usamos getLocalizedSafe() para
 *     manejar ambos sin crashear
 *   - shippingMethod.label y shippingMethod.description también pueden
 *     ser string|LocalizedString — defensive parsing aplicado
 *
 * IMPORTANTE — sobre el OrderSnapshot:
 *   El tipo declara `name: string` pero los datos reales en sessionStorage
 *   pueden tener objetos {es, en} si la orden se creó después del Turno
 *   3B.1 sin que el código que construye el snapshot haya sido actualizado.
 *
 *   El fix DEFINITIVO es actualizar `[locale]/checkout/page.tsx` para que
 *   resuelva los nombres al locale antes de guardar el snapshot. Eso vendrá
 *   en el siguiente turno. Este archivo agrega defensa por si acaso.
 *
 * Lo que NO cambia:
 *   - La arquitectura de sub-componentes (FullConfirmation,
 *     MinimalConfirmation, GuestAccountPrompt, etc.)
 *   - El flujo de sessionStorage + URL param
 *   - Los CTAs y links
 *   - Los colores y layout
 * ============================================================================
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
 *
 * En la versión anterior del checkout, el snapshot guardaba `name: string`
 * (nombre ya resuelto). Pero si el código que construye el snapshot pasa
 * directamente `cartItem.product.name`, ahora será LocalizedString
 * porque cambiamos el tipo Product.
 *
 * Aceptamos AMBOS formatos para resiliencia. getLocalizedSafe() los
 * resuelve correctamente.
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
    /**
     * Label puede ser string (legacy) o LocalizedString si el código
     * que crea la orden cambió.
     */
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

  /**
   * Resolver shippingMethod.label y description con defensive parsing.
   * Pueden ser string o LocalizedString según cuándo se creó la orden.
   */
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
                  /**
                   * Defensive parsing: item.name puede ser string o
                   * LocalizedString. getLocalizedSafe() devuelve siempre
                   * un string que React puede renderizar.
                   */
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
                  {/* shippingLabel ya resuelto con defensive parsing arriba */}
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

                {/* shippingDescription ya resuelto con defensive parsing */}
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
 * Toda la lógica original se mantiene. Solo cambian los textos hardcoded
 * por traducciones via namespace checkout.confirmation.guestAccount.
 *
 * NOTA sobre PASSWORD_RULES.message:
 *   Los mensajes de los requisitos de password vienen de mock-users.ts en
 *   español. NO los traducimos en este turno — quedan en español incluso
 *   en /en. Para traducir correctamente, habría que refactorizar
 *   mock-users.ts para que cada regla tenga un id (no message) y mapear
 *   por id en messages.json. Es un cambio invasivo que dejamos para más
 *   adelante.
 */
function GuestAccountPrompt({ order }: { order: OrderSnapshot }) {
  const t = useTranslations("checkout.confirmation.guestAccount");
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
       * result.error viene del hook useAuth en español.
       * Si quieres traducir esto también, habría que refactorizar useAuth
       * para devolver códigos de error en lugar de mensajes.
       * Por ahora, fallback a la traducción genérica.
       */
      setError(result.error ?? t("errorGeneric"));
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
                 * Requisitos de password.
                 * rule.message viene en español de mock-users.ts.
                 * No los traducimos en este turno (ver nota arriba).
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
                        <span>{rule.message}</span>
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