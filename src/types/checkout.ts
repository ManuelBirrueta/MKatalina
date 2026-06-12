/**
 * ============================================================================
 * CHECKOUT TYPES — KATALINA (Fase 12 Turno 3B.3: SHIPPING_METHODS bilingüe)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior:
 *   - SHIPPING_METHODS se simplifica a solo {id, price} (sin labels)
 *   - Los labels y descriptions se resuelven en runtime con next-intl,
 *     vía el helper `getShippingMethodWithLabels(id, t)` o directamente
 *     en el componente que renderiza.
 *   - ShippingMethod sigue siendo el tipo "resuelto" con label+description
 *     como strings. Los componentes lo construyen al renderizar y lo pasan
 *     a sub-componentes (CheckoutSummary, snapshot del checkout).
 *
 * Por qué este patrón:
 *   - Los enums (ids) son STABLE en URLs/snapshots/backend. No cambian con
 *     el idioma. Mismo patrón que material/color/category.
 *   - Los labels visibles se resuelven a-tiempo en cada componente con
 *     useTranslations. Misma fuente de verdad: messages.json.
 *   - Snapshots viejos (en sessionStorage con label en español) siguen
 *     funcionando gracias al defensive parsing en la página de confirmación.
 *
 * Cómo usar:
 *
 *   // En un componente Client:
 *   const t = useTranslations("checkout.shippingMethods");
 *   const methods = SHIPPING_METHOD_IDS.map((id) => ({
 *     id,
 *     price: SHIPPING_METHOD_PRICES[id],
 *     label: t(`${id}.label`),
 *     description: t(`${id}.description`),
 *   }));
 *
 *   // O usando el helper:
 *   const methods = getShippingMethodsResolved(t);
 *
 * En Fase 12 con backend, los métodos vendrán de un endpoint con sus
 * labels ya traducidos al locale del request. El frontend deja de
 * preocuparse por construir labels.
 * ============================================================================
 */

/**
 * ShippingMethodId — enum de los métodos disponibles.
 *
 * Estos IDs:
 *   - Son STABLE: nunca cambian con el idioma
 *   - Aparecen en sessionStorage, en snapshots, en URLs (si aplicara)
 *   - Son la "llave" que el código usa para comparar métodos
 *
 * Si agregas un nuevo método en el futuro:
 *   1. Agrega el ID aquí
 *   2. Agrega el precio en SHIPPING_METHOD_PRICES
 *   3. Agrega los labels en messages.json: checkout.shippingMethods.{newId}
 *   4. TypeScript te dirá dónde más hay que actualizar
 */
export type ShippingMethodId = "estandar" | "express";

/**
 * ShippingMethod — el tipo "resuelto" con label+description ya traducidos.
 *
 * Este es el tipo que reciben los componentes que renderizan información
 * del método (CheckoutSummary, página de checkout, snapshot de la orden).
 *
 * Los labels y descriptions son strings (ya resueltos por el caller con
 * useTranslations). No usamos LocalizedString aquí porque:
 *   a) El caller ya conoce el locale activo, no tiene sentido pasarle
 *      ambos idiomas para que elija
 *   b) Los snapshots se guardan con label/description ya resueltos
 *      (factura inmutable, igual que orderSnapshot.items[].name)
 */
export interface ShippingMethod {
  id: ShippingMethodId;
  /** Nombre visible YA RESUELTO al locale activo */
  label: string;
  /** Descripción del tiempo de entrega YA RESUELTA al locale activo */
  description: string;
  /** Precio en pesos mexicanos (universal, no se traduce) */
  price: number;
}

/**
 * SHIPPING_METHOD_IDS — orden de los métodos disponibles.
 *
 * Es el array que los componentes iteran para mostrar opciones.
 * El orden importa: "estandar" primero (default), "express" segundo.
 */
export const SHIPPING_METHOD_IDS: ShippingMethodId[] = ["estandar", "express"];

/**
 * SHIPPING_METHOD_PRICES — precios por id.
 *
 * Map id → precio en pesos mexicanos.
 * En Fase 12 puede venir del CMS/admin sin redeploy.
 */
export const SHIPPING_METHOD_PRICES: Record<ShippingMethodId, number> = {
  estandar: 99,
  express: 199,
};

/**
 * Helper type para la función de traducción de next-intl.
 *
 * Tipamos esto vagamente como (key: string) => string para no acoplar
 * a la API exacta de next-intl. Lo importante es que el caller le pase
 * algo que pueda resolver claves a strings.
 *
 * En la práctica, el caller hace:
 *   const t = useTranslations("checkout.shippingMethods");
 *   getShippingMethodsResolved(t);
 */
type Translator = (key: string) => string;

/**
 * getShippingMethodsResolved — construye el array de métodos con labels
 * ya traducidos.
 *
 * Recibe la función `t` del namespace "checkout.shippingMethods" y
 * devuelve los métodos con label+description resueltos al locale activo.
 *
 * Uso:
 *   import { useTranslations } from "next-intl";
 *   import { getShippingMethodsResolved } from "@/types/checkout";
 *
 *   function MyComponent() {
 *     const t = useTranslations("checkout.shippingMethods");
 *     const methods = getShippingMethodsResolved(t);
 *     // methods: ShippingMethod[] con label/description ya en idioma activo
 *   }
 *
 * Este helper centraliza la lógica de construcción. Si cambian las
 * claves de messages.json, se actualiza aquí y todos los consumers se
 * benefician sin cambios.
 */
export function getShippingMethodsResolved(t: Translator): ShippingMethod[] {
  return SHIPPING_METHOD_IDS.map((id) => ({
    id,
    label: t(`${id}.label`),
    description: t(`${id}.description`),
    price: SHIPPING_METHOD_PRICES[id],
  }));
}

/**
 * getShippingMethodResolved — versión single de getShippingMethodsResolved.
 *
 * Cuando solo necesitas UN método (ya seleccionado), evita construir
 * el array completo. Útil en checkout page donde tenemos el id seleccionado
 * y queremos su objeto resuelto.
 *
 * Uso:
 *   const t = useTranslations("checkout.shippingMethods");
 *   const method = getShippingMethodResolved("estandar", t);
 */
export function getShippingMethodResolved(
  id: ShippingMethodId,
  t: Translator
): ShippingMethod {
  return {
    id,
    label: t(`${id}.label`),
    description: t(`${id}.description`),
    price: SHIPPING_METHOD_PRICES[id],
  };
}

/**
 * CheckoutFormData — todos los campos del formulario del checkout.
 * Sin cambios respecto a la versión anterior.
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
 * Sin cambios.
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
 * Sin cambios estructurales. La diferencia ahora está en CHEMO se llenan:
 * la función validateField ahora recibe `t` para generar los mensajes
 * en el idioma activo.
 */
export type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;

/**
 * ============================================================================
 * COMPATIBILIDAD HACIA ATRÁS — SHIPPING_METHODS (deprecated)
 * ============================================================================
 *
 * Mantenemos `SHIPPING_METHODS` como export con labels en español por
 * compatibilidad con código viejo que aún no se haya migrado al patrón
 * nuevo `getShippingMethodsResolved(t)`.
 *
 * @deprecated Usa SHIPPING_METHOD_IDS + getShippingMethodsResolved(t) en
 *             su lugar para soporte bilingüe.
 *
 * Este export se eliminará cuando todos los consumers estén migrados.
 * ============================================================================
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