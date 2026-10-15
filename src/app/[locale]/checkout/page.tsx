/**
 * ============================================================================
 * PAGE: /[locale]/checkout — MKATALINA (Fase 13 · Etapa 7: envíos al mundo)
 * ============================================================================
 *
 * Página de pago: formulario (CheckoutForm) a la izquierda y resumen con los
 * botones de pago (CheckoutSummary + PaypalCheckoutButton) a la derecha.
 * El pedido se crea EN EL SERVIDOR al confirmarse el cobro
 * (capturePaypalOrder, src/actions/paypal.ts); aquí se valida el formulario,
 * y al tener éxito se guarda el snapshot para la confirmación, se vacía el
 * carrito y se va a la página de confirmación.
 *
 * CAMBIOS DE LA ETAPA 7 — COMPRAS DESDE CUALQUIER PAÍS:
 *   - El formulario tiene PAÍS de entrega. Al cambiarlo:
 *       · se borra el estado elegido (cada país tiene su lista);
 *       · el método de envío pasa al primero disponible para ese país
 *         (México: estándar; extranjero: DHL Express internacional);
 *       · la lada del teléfono cambia al nuevo país, SALVO que el cliente
 *         ya la haya cambiado a mano (phoneCountryTouched).
 *   - Los métodos y el precio del envío salen de src/lib/shipping-rates.ts
 *     según el país; el servidor los vuelve a calcular al cobrar.
 *   - La lista de estados/provincias se pide con useSubdivisions; si el país
 *     tiene lista, el estado es obligatorio (stateRequired).
 *   - Las reglas de validación son las de src/lib/address.ts.
 *
 * La confirmación sigue leyendo el snapshot de sessionStorage.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { CheckoutForm, validateCheckoutField } from "@/components/shop/CheckoutForm";
import { CheckoutSummary } from "@/components/shop/CheckoutSummary";
import { PaypalCheckoutButton } from "@/components/shop/PaypalCheckoutButton";
import { useCart } from "@/hooks/use-cart";
import { useSubdivisions } from "@/hooks/use-subdivisions";
import {
  EMPTY_FORM_DATA,
  type CheckoutFormData,
  type FormErrors,
  type ShippingMethod,
  type ShippingMethodId,
} from "@/types/checkout";
import {
  CUSTOMS_NOTICE,
  getShippingOptions,
  isInternational,
} from "@/lib/shipping-rates";
import { toast } from "sonner";
import { getLocalized } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, isEmpty, clear } = useCart();

  const locale = useLocale() as Locale;
  const t = useTranslations("checkout.page");

  const [formData, setFormData] = useState<CheckoutFormData>(EMPTY_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>("estandar");
  // true cuando el cliente cambió la lada a mano (ya no sigue al país).
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);

  // Estados / provincias del país elegido.
  const { subdivisions, isLoading: subdivisionsLoading } = useSubdivisions(formData.country);
  const validationOptions = { stateRequired: subdivisions.length > 0 };

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

  // Métodos de envío para el país elegido y el que está seleccionado.
  const shippingOptions = getShippingOptions(formData.country, locale);
  const selectedOption =
    shippingOptions.find((o) => o.id === shippingMethodId) ?? shippingOptions[0];
  const shippingMethod: ShippingMethod = selectedOption;
  const total = subtotal + shippingMethod.price;

  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    if (field === "country") {
      // Nuevo país: estado vacío, primer método disponible y (si no se
      // tocó) la lada del mismo país.
      setFormData((prev) => ({
        ...prev,
        country: value,
        state: "",
        phoneCountry: phoneCountryTouched ? prev.phoneCountry : value,
      }));
      setShippingMethodId(getShippingOptions(value, locale)[0].id);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.country;
        delete next.state;
        delete next.neighborhood;
        delete next.postalCode;
        return next;
      });
      return;
    }

    if (field === "phoneCountry") setPhoneCountryTouched(true);

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
    const error = validateCheckoutField(field, formData, locale, validationOptions);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  /** Revisa todo el formulario; devuelve los errores encontrados. */
  const collectErrors = (): FormErrors => {
    const found: FormErrors = {};
    (Object.keys(formData) as Array<keyof CheckoutFormData>).forEach((field) => {
      const error = validateCheckoutField(field, formData, locale, validationOptions);
      if (error) found[field] = error;
    });
    return found;
  };

  /**
   * validate — se llama al hacer clic en un botón de pago, ANTES de abrirlo.
   * Si hay errores, enfoca el primero, avisa, y devuelve false (no abre PayPal).
   */
  const validate = (): boolean => {
    const found = collectErrors();
    setErrors(found);
    const firstErrorField = (Object.keys(formData) as Array<keyof CheckoutFormData>).find(
      (f) => found[f],
    );
    if (!firstErrorField) return true;

    const element = document.getElementById(firstErrorField);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
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
      sessionStorage.setItem("katalina-last-order", JSON.stringify(orderSnapshot));
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
            <h1 className="font-display text-4xl md:text-5xl font-medium">{t("title")}</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
            <div>
              <CheckoutForm
                formData={formData}
                errors={errors}
                shippingMethod={shippingMethod.id}
                shippingOptions={shippingOptions}
                subdivisions={subdivisions}
                subdivisionsLoading={subdivisionsLoading}
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
                notice={
                  isInternational(formData.country)
                    ? CUSTOMS_NOTICE[locale === "en" ? "en" : "es"]
                    : undefined
                }
                paymentButton={
                  <PaypalCheckoutButton
                    items={preparedItems}
                    shippingMethodId={shippingMethod.id}
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