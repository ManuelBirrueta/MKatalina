/**
 * ============================================================================
 * PAGE: /[locale]/checkout — MKATALINA (Fase 13 · Etapa 4: PayPal real)
 * ============================================================================
 *
 * Cambio de esta etapa:
 *   - Se eliminó el "pago simulado" (setTimeout + createOrder antes de pagar).
 *   - Ahora el pago lo hace el botón real de PayPal (PaypalCheckoutButton).
 *   - El pedido se crea EN EL SERVIDOR cuando el pago se confirma (dentro de
 *     capturePaypalOrder). Aquí solo: validamos el formulario, y al tener éxito
 *     guardamos el snapshot para la confirmación, vaciamos el carrito y vamos a
 *     la página de confirmación.
 *
 * Lo que NO cambia:
 *   - La UI, el formulario y su validación, el resumen.
 *   - La confirmación sigue leyendo el snapshot de sessionStorage.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { CheckoutForm, validateField } from "@/components/shop/CheckoutForm";
import { CheckoutSummary } from "@/components/shop/CheckoutSummary";
import { PaypalCheckoutButton } from "@/components/shop/PaypalCheckoutButton";
import { useCart } from "@/hooks/use-cart";
import {
  EMPTY_FORM_DATA,
  getShippingMethodResolved,
  type CheckoutFormData,
  type FormErrors,
  type ShippingMethodId,
} from "@/types/checkout";
import { toast } from "sonner";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, isEmpty, clear } = useCart();

  const locale = useLocale() as Locale;
  const t = useTranslations("checkout.page");
  const tForm = useTranslations("checkoutForm");
  const tShipping = useTranslations("checkout.shippingMethods");

  const [formData, setFormData] = useState<CheckoutFormData>(EMPTY_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shippingMethodId, setShippingMethodId] =
    useState<ShippingMethodId>("estandar");

  // Evita que el guard de "carrito vacío" nos saque mientras finalizamos
  // (al vaciar el carrito tras un pago exitoso).
  const [isCompleting, setIsCompleting] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isEmpty && !isCompleting) {
      router.push("/carrito");
    }
  }, [mounted, isEmpty, isCompleting, router]);

  const shippingMethod = getShippingMethodResolved(shippingMethodId, tShipping);
  const total = subtotal + shippingMethod.price;

  const handleFieldChange = (
    field: keyof CheckoutFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFieldBlur = (field: keyof CheckoutFormData) => {
    const error = validateField(field, formData[field], tForm);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof CheckoutFormData>).forEach((field) => {
      const error = validateField(field, formData[field], tForm);
      if (error) {
        newErrors[field] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * validate — se llama al hacer clic en el botón de PayPal, ANTES de abrirlo.
   * Si hay errores, enfoca el primero, avisa, y devuelve false (no abre PayPal).
   */
  const validate = (): boolean => {
    if (validateAll()) return true;

    const firstErrorField = (
      Object.keys(formData) as Array<keyof CheckoutFormData>
    ).find((f) => validateField(f, formData[f], tForm) !== undefined);

    if (firstErrorField) {
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
    }

    toast.error(t("errorToast.title"), {
      description: t("errorToast.description"),
    });
    return false;
  };

  // Items preparados para la orden (nombre resuelto al idioma = snapshot).
  const preparedItems = items.map((item) => ({
    slug: item.slug,
    quantity: item.quantity,
    nameSnapshot: getLocalized(item.product.name, locale),
    imageSnapshot: item.product.images[0]?.src ?? "",
    categorySnapshot: item.product.category,
  }));

  /**
   * handleSuccess — tras un pago capturado (el pedido ya se creó en el
   * servidor). Guardamos el snapshot para la confirmación, vaciamos el carrito
   * y navegamos.
   */
  const handleSuccess = (orderId: string) => {
    setIsCompleting(true); // bloquea el guard de carrito vacío

    const orderSnapshot = {
      orderId,
      formData,
      shippingMethod,
      items: items.map((item) => ({
        slug: item.slug,
        name: getLocalized(item.product.name, locale),
        price: item.product.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        image: item.product.images[0]?.src ?? "",
        category: item.product.category,
      })),
      subtotal,
      total,
      createdAt: new Date().toISOString(),
      locale,
    };

    try {
      sessionStorage.setItem(
        "katalina-last-order",
        JSON.stringify(orderSnapshot),
      );
    } catch {
      // sessionStorage puede fallar (incógnito); no es crítico.
    }

    clear();
    router.push(`/checkout/confirmacion?orden=${orderId}`);
  };

  if (!mounted || (isEmpty && !isCompleting)) {
    return (
      <Container>
        <div className="h-96" aria-hidden="true" />
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Breadcrumb
          items={[
            { label: t("breadcrumbCart"), href: "/carrito" },
            { label: t("breadcrumbCheckout") },
          ]}
        />
      </Container>

      <Container>
        <div className="pb-16">
          <header className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-medium">
              {t("title")}
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
            <div>
              <CheckoutForm
                formData={formData}
                errors={errors}
                shippingMethod={shippingMethodId}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                onShippingMethodChange={setShippingMethodId}
              />
            </div>

            <aside className="lg:sticky lg:top-24">
              <CheckoutSummary
                items={items}
                subtotal={subtotal}
                shippingMethod={shippingMethod}
                total={total}
                paymentButton={
                  <PaypalCheckoutButton
                    items={preparedItems}
                    shippingMethodId={shippingMethodId}
                    shippingLabel={shippingMethod.label}
                    formData={formData}
                    locale={locale}
                    validate={validate}
                    onSuccess={handleSuccess}
                  />
                }
              />
            </aside>
          </div>
        </div>
      </Container>
    </>
  );
}