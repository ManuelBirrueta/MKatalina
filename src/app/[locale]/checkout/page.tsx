/**
 * ============================================================================
 * PAGE: /[locale]/checkout — MKATALINA (Fase 12 fix: validateField + rebrand)
 * ============================================================================
 *
 * BUG anterior:
 *   En el archivo del rebrand-2 yo copié una versión VIEJA del archivo donde
 *   `validateField()` se llamaba con 2 argumentos. Pero el contrato real
 *   de validateField (de CheckoutForm.tsx, Turno 3B.3) requiere 3 argumentos:
 *   validateField(field, value, t). El compiler de TypeScript falló con:
 *     "Expected 3 arguments, but got 2."
 *
 * Este archivo restaura la versión CORRECTA del Turno 3B.3 (con
 * validateField recibiendo `t`) Y mantiene el cambio del rebrand:
 *   - Prefijo de orderId: KTL- → MKTL-
 *
 * Cambios respecto a la versión anterior (Turno 3B.3):
 *
 *   1) validateField recibe `t` como 3er parámetro (sin cambios desde 3B.3).
 *      Tres llamadas en este archivo lo necesitan:
 *        - handleFieldBlur (1 llamada)
 *        - validateAll (1 llamada dentro del forEach)
 *        - handlePay (1 llamada en el find del primer error)
 *      A todas les pasamos el `t` del namespace "checkoutForm" obtenido
 *      del hook useTranslations.
 *
 *   2) SHIPPING_METHODS.find(...) reemplazado por
 *      getShippingMethodResolved(shippingMethodId, tShipping)
 *      que devuelve el método con label/description ya traducidos.
 *
 *   3) Snapshot inmutable: item.name resuelto al locale activo del momento
 *      de la compra usando getLocalized(). El snapshot guarda strings, no
 *      objetos LocalizedString.
 *
 *   4) REBRAND: prefijo de orderId KTL- → MKTL-
 *      "MKTL-K38QZ7BA9X3F" en lugar de "KTL-K38QZ7BA9X3F".
 *      Visible al usuario en la página de confirmación y en sus pedidos.
 *
 * Lo que NO cambia:
 *   - La key de sessionStorage "katalina-last-order" (decisión técnica:
 *     no la cambiamos para no romper estados guardados)
 *   - El flujo del handlePay (validar → loading → snapshot → clear → redirect)
 *   - La estructura del layout (form izquierda, summary derecha)
 *   - La compatibilidad con snapshots viejos via defensive parsing en
 *     la página de confirmación
 *
 * ─── POR QUÉ PASÓ ESTO ─────────────────────────────────────────────────
 *
 * En el rebrand-2 mi proceso fue: copiar el archivo más reciente de mi
 * sandbox y aplicar sed para cambiar KTL- → MKTL-. El error fue elegir
 * la versión equivocada de mi sandbox (una vieja con la firma anterior
 * de validateField).
 *
 * Lección: cuando aplico un cambio quirúrgico (solo una línea), debo
 * partir del archivo MÁS RECIENTE que el usuario tenga aplicado, no
 * de versiones intermedias en mi sandbox.
 * ─────────────────────────────────────────────────────────────────────
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

  /**
   * Hooks de i18n:
   *   - locale: idioma activo, para resolver nombres de productos al
   *     construir el snapshot. Esto "congela" el idioma de la factura.
   *   - t: traducciones del namespace checkout.page (UI de esta página)
   *   - tForm: traducciones del namespace checkoutForm (mensajes de error
   *     de validación). Lo pasamos a validateField cada vez que lo llamamos.
   *   - tShipping: traducciones de checkout.shippingMethods (labels y
   *     descriptions del método de envío). Lo pasamos a
   *     getShippingMethodResolved.
   */
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout.page");
  const tForm = useTranslations("checkoutForm");
  const tShipping = useTranslations("checkout.shippingMethods");

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
   * Método de envío seleccionado, RESUELTO al locale activo.
   *
   * getShippingMethodResolved construye el objeto con label y
   * description traducidos al locale activo.
   */
  const shippingMethod = getShippingMethodResolved(
    shippingMethodId,
    tShipping
  );

  /** Total = subtotal del carrito + costo del envío */
  const total = subtotal + shippingMethod.price;

  /**
   * handleFieldChange — actualiza valor + limpia error automáticamente.
   * No necesita cambios para el i18n.
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
   *
   * Pasa tForm como 3er parámetro de validateField. Los mensajes
   * de error que se guardan en `errors` ya vienen traducidos.
   */
  const handleFieldBlur = (field: keyof CheckoutFormData) => {
    const error = validateField(field, formData[field], tForm);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  /**
   * validateAll — valida TODOS los campos antes de submit.
   * Pasa tForm a validateField dentro del forEach.
   */
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};

    (Object.keys(formData) as Array<keyof CheckoutFormData>).forEach(
      (field) => {
        const error = validateField(field, formData[field], tForm);
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
   * El snapshot guarda los nombres de productos y los labels del shipping
   * method YA RESUELTOS al locale activo del momento de la compra.
   * Esto convierte el snapshot en una factura inmutable.
   *
   * La búsqueda del primer campo con error también pasa tForm
   * a validateField.
   */
  const handlePay = async () => {
    // Paso 1-2: validar
    const isValid = validateAll();

    if (!isValid) {
      // Scroll al primer campo con error.
      const firstErrorField =
        Object.keys(errors)[0] ||
        (Object.keys(formData) as Array<keyof CheckoutFormData>).find(
          (f) => validateField(f, formData[f], tForm) !== undefined
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

    /**
     * Paso 5: generar número de orden client-side.
     *
     * REBRAND: prefijo cambiado de "KTL-" a "MKTL-".
     * El order ID resultante: "MKTL-K38QZ7BA9X3F" (timestamp + random).
     */
    const orderId = `MKTL-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    /**
     * Paso 6: snapshot del pedido para mostrar en /confirmacion.
     *
     * Factura inmutable:
     *   - item.name: resuelto con getLocalized() al locale activo
     *   - shippingMethod: ya viene con label y description resueltos
     *     (los obtuvimos arriba con getShippingMethodResolved)
     *
     * Si el usuario cambia idioma DESPUÉS de pagar, la confirmación
     * mostrará los textos del idioma original (snapshot inmutable).
     */
    const orderSnapshot = {
      orderId,
      formData,
      // shippingMethod ya tiene label/description como strings resueltos
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
       * Locale al momento de la compra. Útil para:
       *   - Detectar en qué idioma se hizo el pedido (emails de seguimiento)
       *   - Auditar / soporte al cliente
       */
      locale,
    };

    try {
      /**
       * Storage key intencionalmente NO se cambió en el rebrand:
       * "katalina-last-order" es una llave técnica de sessionStorage,
       * no visible al usuario. Cambiarla rompería sesiones de checkout
       * en progreso (usuarios actuales perderían sus órdenes recién creadas).
       */
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

          {/* Layout dos columnas: form a la izq, summary a la der. */}
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