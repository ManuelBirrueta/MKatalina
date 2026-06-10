/**
 * ============================================================================
 * CHECKOUT TYPES — KATALINA
 * ============================================================================
 *
 * Tipos para el flujo de checkout: datos del formulario, métodos de envío,
 * y estructura de la orden final.
 *
 * Cuando integremos backend (Fase 12):
 *   - `Order` se convierte en el record que se guarda en la tabla `orders`
 *   - `CheckoutFormData` es el body del POST al endpoint `/api/orders`
 *   - `ShippingMethod` puede venir del backend (configurable por admin) en
 *     lugar de hardcoded
 * ============================================================================
 */

/**
 * ShippingMethodId — los métodos de envío disponibles.
 *
 * Por ahora dos opciones simples. Si en el futuro agregas "Recoger en
 * tienda" o "Envío internacional", se extiende este union type.
 */
export type ShippingMethodId = "estandar" | "express";

/**
 * ShippingMethod — un método de envío con su precio y tiempo estimado.
 */
export interface ShippingMethod {
  id: ShippingMethodId;
  /** Nombre visible (ej. "Envío estándar") */
  label: string;
  /** Descripción del tiempo de entrega */
  description: string;
  /** Precio en pesos mexicanos */
  price: number;
}

/**
 * SHIPPING_METHODS — los métodos disponibles.
 *
 * Hardcoded aquí porque son parte del catálogo de servicios de la tienda,
 * no data dinámica. Si cambian los precios, se ajusta este array y se
 * propaga automáticamente.
 *
 * En Fase 12 podría venir del CMS para que el admin pueda ajustar precios
 * sin redeploy. Por ahora, simplicidad.
 */
export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "estandar",
    label: "Envío estándar",
    description: "3-5 días hábiles",
    price: 99,
  },
  {
    id: "express",
    label: "Envío express",
    description: "1-2 días hábiles",
    price: 199,
  },
];

/**
 * CheckoutFormData — todos los campos del formulario del checkout.
 *
 * Separado en tres "secciones lógicas" pero unidos en un solo type plano
 * para que sea más fácil pasarlo como prop a componentes.
 *
 * Las "secciones" son visuales (en el formulario aparecen separadas con
 * headers) pero estructuralmente todo es un solo objeto.
 */
export interface CheckoutFormData {
  /* ─── Sección 1: Contacto ─── */
  email: string;

  /* ─── Sección 2: Datos personales ─── */
  firstName: string;
  lastName: string;
  phone: string;

  /* ─── Sección 3: Dirección de envío ─── */
  /** Calle y número */
  address: string;
  /** Departamento, interior, opcional */
  addressLine2: string;
  /** Colonia */
  neighborhood: string;
  /** Ciudad */
  city: string;
  /** Estado de la república */
  state: string;
  /** Código postal — string para preservar ceros iniciales */
  postalCode: string;
  /** Notas opcionales para el repartidor */
  notes: string;
}

/**
 * EMPTY_FORM_DATA — valores iniciales del formulario.
 *
 * Todos los campos arrancan como string vacío. El usuario los llena.
 * Esto evita tener que manejar `undefined` vs `""` en cada campo.
 */
export const EMPTY_FORM_DATA: CheckoutFormData = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  addressLine2: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  notes: "",
};

/**
 * FormErrors — mensajes de error por campo.
 *
 * La llave es el nombre del campo (mismo que CheckoutFormData), el valor
 * es el mensaje a mostrar. Si un campo es válido, su entrada es undefined.
 *
 * Partial<...> porque no todos los campos necesariamente tienen error
 * en un momento dado.
 */
export type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;