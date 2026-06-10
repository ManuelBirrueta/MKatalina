/**
 * ============================================================================
 * PAGE: /[locale]/checkout — KATALINA (Fase 12 Turno 3B.3: fix de raíz)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *
 *   FIX DE RAÍZ — Snapshot inmutable con nombres resueltos:
 *     Cuando el usuario "paga", construimos el orderSnapshot que se
 *     guardará en sessionStorage. Antes, `name: item.product.name`
 *     guardaba el LocalizedString completo (objeto {es, en}).
 *
 *     Ahora resolvemos el nombre al locale ACTIVO al momento de la
 *     compra usando getLocalized(). El snapshot guarda strings, no
 *     objetos. Esto:
 *       - Elimina el error "Objects are not valid as a React child"
 *       - Convierte el snapshot en una "factura inmutable": el idioma
 *         de la confirmación queda congelado al momento de la compra
 *         (como una factura impresa real)
 *
 *   TRADUCCIONES:
 *     - import Link cambia a "@/i18n/navigation"
 *     - useRouter cambia a "@/i18n/navigation" (mantiene prefijo de locale)
 *     - Breadcrumb "Carrito / Checkout" traducido
 *     - "Finalizar compra" traducido
 *     - Toast de error traducido
 *
 * ─── DETALLE TÉCNICO SOBRE shippingMethod ──────────────────────────────
 *   SHIPPING_METHODS viene de @/types/checkout. Asumimos que sus campos
 *   label y description son strings (no LocalizedString) — son textos
 *   que se definen estáticamente en el array.
 *
 *   Si más adelante quieres traducir los métodos de envío, habría dos
 *   formas:
 *     A) Hacer ShippingMethod.label/description LocalizedString y resolver
 *        aquí al construir el snapshot
 *     B) Mover los métodos a messages.json bajo namespace checkout.methods
 *        y construir el array dinámicamente con useTranslations()
 *
 *   Por ahora se mantienen en español. El defensive parsing en la página
 *   de confirmación tolera ambas formas si en el futuro cambias.
 *
 * ─── COMPATIBILIDAD CON SNAPSHOTS VIEJOS ───────────────────────────────
 *   El defensive parsing en la página de confirmación seguirá funcionando
 *   para snapshots que se hayan guardado ANTES de este fix (con objetos
 *   en name). Los snapshots NUEVOS se guardarán correctamente con strings.
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
import { useCart } from "@/hooks/use-cart";
import {
  EMPTY_FORM_DATA,
  SHIPPING_METHODS,
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

  /**
   * Hooks de i18n:
   *   - locale: idioma activo, para resolver nombres de productos al
   *     construir el snapshot. Esto "congela" el idioma de la factura.
   *   - t: traducciones del namespace checkout.page para el UI de esta
   *     página específica.
   */
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout.page");

  /**
   * Estado del formulario. Empieza con todos los campos vacíos.
   */
  const [formData, setFormData] = useState<CheckoutFormData>(EMPTY_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shippingMethodId, setShippingMethodId] =
    useState<ShippingMethodId>("estandar");
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Flag mounted — mismo patrón que en /carrito para evitar flash de
   * "carrito vacío" durante hidratación.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Redirigir a /carrito si el carrito está vacío (solo después de mounted).
   */
  useEffect(() => {
    if (mounted && isEmpty && !isProcessing) {
      router.push("/carrito");
    }
  }, [mounted, isEmpty, isProcessing, router]);

  /**
   * Método de envío seleccionado (objeto completo, derivado del id).
   */
  const shippingMethod = SHIPPING_METHODS.find(
    (m) => m.id === shippingMethodId
  )!;

  /** Total = subtotal del carrito + costo del envío */
  const total = subtotal + shippingMethod.price;

  /**
   * handleFieldChange — actualiza el valor de un campo + limpia error
   * automáticamente cuando el usuario empieza a corregir.
   */
  const handleFieldChange = (
    field: keyof CheckoutFormData,
    value: string
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

  /**
   * handleFieldBlur — valida un campo cuando el usuario sale de él.
   */
  const handleFieldBlur = (field: keyof CheckoutFormData) => {
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  /**
   * validateAll — valida TODOS los campos antes de submit.
   */
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};

    (Object.keys(formData) as Array<keyof CheckoutFormData>).forEach(
      (field) => {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * handlePay — simula el flujo de pago con PayPal.
   *
   * ─── CAMBIO IMPORTANTE EN PASO 6 ───────────────────────────────────
   *   Antes:
   *     items: items.map((item) => ({
   *       name: item.product.name,      ← objeto {es, en} → bug
   *       ...
   *     }))
   *
   *   Ahora:
   *     items: items.map((item) => ({
   *       name: getLocalized(item.product.name, locale),  ← string resuelto
   *       ...
   *     }))
   *
   *   Esto guarda el nombre traducido al idioma activo en el momento
   *   de la compra. La confirmación lee strings, no objetos.
   */
  const handlePay = async () => {
    // Paso 1-2: validar
    const isValid = validateAll();

    if (!isValid) {
      // Scroll al primer campo con error
      const firstErrorField =
        Object.keys(errors)[0] ||
        (Object.keys(formData) as Array<keyof CheckoutFormData>).find(
          (f) => validateField(f, formData[f]) !== undefined
        );

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
      return;
    }

    // Paso 3: marcar como procesando
    setIsProcessing(true);

    // Paso 4: simular latencia
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Paso 5: generar número de orden client-side
    const orderId = `KTL-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    /**
     * Paso 6: snapshot del pedido para mostrar en /confirmacion.
     *
     * Resolvemos cada item.product.name con getLocalized() AHORA. Esto
     * "congela" el idioma de la factura al momento de la compra.
     *
     * Decisión arquitectural (Opción 2): la confirmación es como una
     * factura impresa — no cambia retroactivamente si el usuario cambia
     * idioma después. Es el comportamiento estándar de plataformas
     * como Amazon, Mejuri, etc.
     */
    const orderSnapshot = {
      orderId,
      formData,
      shippingMethod,
      items: items.map((item) => ({
        slug: item.slug,
        // Resolver el nombre al locale activo del momento de la compra
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
      /**
       * Agregamos el locale al snapshot para referencia.
       * Esto permite que en el futuro podamos detectar en qué idioma
       * se hizo la compra (útil para emails de seguimiento, soporte, etc.)
       */
      locale,
    };

    try {
      sessionStorage.setItem(
        "katalina-last-order",
        JSON.stringify(orderSnapshot)
      );
    } catch {
      // sessionStorage falla en modo incógnito Safari, etc. No es crítico.
    }

    // Paso 7: vaciar carrito
    clear();

    // Paso 8: navegar a confirmación.
    // router.push de @/i18n/navigation mantiene el prefijo de locale automático.
    router.push(`/checkout/confirmacion?orden=${orderId}`);
  };

  /**
   * Mientras no está montado o el carrito está vacío, no renderizamos.
   */
  if (!mounted || (isEmpty && !isProcessing)) {
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
            {
              label: t("breadcrumbCart"),
              href: "/carrito",
            },
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

          {/*
           * Layout dos columnas: form a la izq, summary a la der.
           */}
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
                onPay={handlePay}
                isProcessing={isProcessing}
              />
            </aside>
          </div>
        </div>
      </Container>
    </>
  );
}