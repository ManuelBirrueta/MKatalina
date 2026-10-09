/**
 * ============================================================================
 * STATIC CONTENT — MKATALINA (Fase 12 Turno 3C: legales bilingües + disclaimer)
 * ============================================================================
 *
 * Cambios respecto a la versión anterior (Turno 3A):
 *   - policiesContent: campo `en` de las 2 secciones traducido al inglés
 *   - privacyContent: campo `en` de la sección traducido al inglés
 *   - termsContent: campo `en` de la sección traducido al inglés
 *   - termsContent.hero.subtitle.en: corregido de "plain English" a
 *     "plain language" (la traducción literal no tenía sentido lógico)
 *   - Agregado disclaimer de prevalencia del español al inicio de la
 *     primera sección de CADA documento legal en la versión `en`:
 *     "⚠️ This is an English translation provided for convenience.
 *      The original Spanish version is the legally binding text..."
 *
 * Lo que NO cambia:
 *   - aboutContent (Quiénes somos) — ya traducido en Turno 3A
 *   - contactContent (Contacto) — ya traducido en Turno 3A
 *   - faqContent (FAQ con 5 categorías) — ya traducido en Turno 3A
 *   - Toda la estructura de tipos (LegalSection, FaqQuestion, FaqCategory)
 *   - Los datos no localizados (URLs, emails, teléfonos, IDs)
 *
 * ─── ENFOQUE DEL DISCLAIMER ─────────────────────────────────────────────
 *
 * Decisión arquitectural: en lugar de agregar un campo `disclaimer` nuevo
 * a los objetos legales (que requeriría modificar LegalPageLayout para
 * renderizarlo), incluimos el disclaimer como el PRIMER PÁRRAFO de la
 * PRIMERA sección, SOLO en la versión inglesa.
 *
 * Esto significa:
 *   - paragraphs.es: [párrafo1, párrafo2, ...]
 *   - paragraphs.en: [DISCLAIMER, párrafo1_traducido, párrafo2_traducido, ...]
 *
 * Ventajas:
 *   - Cero cambios en LegalPageLayout (su contrato sigue igual)
 *   - Cero cambios en LegalSection (tipo sigue igual)
 *   - El disclaimer aparece automáticamente arriba del contenido en /en
 *   - En /es, las versiones tienen distinto número de párrafos pero esto
 *     no causa problemas porque LegalPageLayout renderiza paragraphs.length
 *     dinámicamente
 *
 * Desventajas:
 *   - El disclaimer no tiene estilo visual destacado (no es un banner amarillo)
 *   - Solo se distingue del contenido normal por el emoji ⚠️ al inicio
 *
 * Si en el futuro quisieras un disclaimer visualmente destacado, requeriría:
 *   - Agregar campo opcional `disclaimer?: LocalizedString` al objeto legal
 *   - Modificar LegalPageLayout para renderizar disclaimer (si existe) con
 *     un componente Banner separado arriba de las secciones
 * Por ahora, lo dejamos inline. Funcional y suficiente.
 *
 * ─── ADVERTENCIA CRÍTICA ────────────────────────────────────────────────
 *
 * El contenido legal actual es MÍNIMO y NO SUFICIENTE para producción.
 * Antes de comercializar el sitio, se DEBE expandir cada documento:
 *
 *   POLÍTICAS — falta: garantías por defectos de fábrica, envíos
 *     internacionales con tiempos y costos, productos personalizados
 *     (no retornables), aretes (no retornables por higiene), proceso
 *     paso a paso de devoluciones, costos de envío de retorno.
 *
 *   PRIVACIDAD — falta TODO menos la intro: qué datos recopilamos
 *     (registro, pedidos, navegación, cookies), finalidades (operativas
 *     vs comerciales/marketing), cómo se protegen, con quién se comparten
 *     (procesadores de pago, paqueterías, hosting), derechos ARCO, cómo
 *     ejercerlos, transferencias internacionales, cookies y tecnologías
 *     similares, cambios al aviso.
 *
 *   TÉRMINOS — falta TODO menos la aceptación: uso permitido del sitio,
 *     cuenta de usuario (creación, suspensión, eliminación), propiedad
 *     intelectual (diseños, marca, contenido), productos y precios
 *     (errores tipográficos, stock limitado), pagos (procesador, monedas,
 *     impuestos), envíos (referencia a políticas), devoluciones (referencia
 *     a políticas), garantía (referencia a políticas), limitación de
 *     responsabilidad, indemnización, jurisdicción aplicable y leyes,
 *     resolución de disputas, modificaciones a los términos.
 *
 * Adicionalmente, esto requiere REVISIÓN POR ABOGADO especialista en:
 *   - LFPDPPP México (Ley Federal de Protección de Datos Personales)
 *   - LFPC México (Ley Federal de Protección al Consumidor) — específicamente
 *     para garantías, devoluciones y cláusulas abusivas
 *   - Si vendes a otros países: GDPR (Europa), CCPA (California), LGPD (Brasil)
 * ─────────────────────────────────────────────────────────────────────
 */

import type { LocalizedString, LocalizedStringArray } from "@/lib/i18n-helpers";

/* ─── TIPOS COMPARTIDOS BILINGÜES ─────────────────────────────────────── */

/**
 * Sección legal bilingüe.
 */
export interface LegalSection {
  /** ID único en kebab-case (no localizado) */
  id: string;
  title: LocalizedString;
  paragraphs: LocalizedStringArray;
}

/**
 * Pregunta del FAQ bilingüe.
 */
export interface FaqQuestion {
  id: string;
  question: LocalizedString;
  answer: LocalizedStringArray;
}

/**
 * Categoría del FAQ bilingüe.
 */
export interface FaqCategory {
  id: string;
  title: LocalizedString;
  questions: FaqQuestion[];
}

/**
 * Disclaimer de prevalencia del español.
 *
 * Constante exportada para evitar repetirla en cada documento legal.
 * Solo aparece en la versión `en` (el español ES el original, no necesita
 * disclaimer de traducción).
 *
 * El emoji ⚠️ al inicio sirve como ancla visual sutil para distinguirlo
 * del contenido legal regular sin necesidad de styling especial.
 */
const ENGLISH_LEGAL_DISCLAIMER =
  "⚠️ This is an English translation provided for convenience. The original Spanish version is the legally binding text. In case of any discrepancy between this translation and the Spanish original, the Spanish version shall prevail.";

/* ─── QUIÉNES SOMOS (sin cambios respecto al Turno 3A) ────────────────── */
export const aboutContent = {
  hero: {
    eyebrow: {
      es: "Quiénes somos",
      en: "About us",
    },
    title: {
      es: "Hecho a mano, con intención",
      en: "Made by hand, with intention",
    },
    subtitle: {
      es: "MKatalina nace en el norte de México con una idea simple: crear joyería que cuente historias, sin perder la conexión con quien la usa.",
      en: "MKatalina was born in northern Mexico with a simple idea: to create jewelry that tells stories, without losing the connection with the person who wears it.",
    },
  },
  story: {
    eyebrow: {
      es: "Nuestra historia",
      en: "Our story",
    },
    title: {
      es: "De un taller pequeño a tu cuello",
      en: "From a small workshop to your neck",
    },
    paragraphs: {
      es: [
        "MKatalina empezó en 2024 en un taller modesto en Mazatlán, Sinaloa. Lo que comenzó como un proyecto personal —diseñar piezas únicas para amigas— se convirtió en algo más grande cuando entendimos que cada persona busca joyería que refleje quién es, no lo que está de moda.",
        "Trabajamos con artesanos locales que conocen su oficio desde generaciones atrás. Cada pieza pasa por sus manos antes de llegar a las tuyas. No producimos en masa, no buscamos volumen. Buscamos que cada arete, cada collar, cada pulsera tenga algo que valga la pena conservar.",
      ],
      en: [
        "MKatalina started in 2024 in a modest workshop in Mazatlán, Sinaloa. What began as a personal project —designing unique pieces for friends— became something bigger when we understood that everyone seeks jewelry that reflects who they are, not what's trending.",
        "We work with local artisans whose craft has been passed down through generations. Every piece goes through their hands before reaching yours. We don't mass produce, we don't chase volume. We aim for every earring, necklace, and bracelet to be worth keeping.",
      ],
    },
  },
  values: {
    eyebrow: {
      es: "Lo que nos guía",
      en: "What guides us",
    },
    title: {
      es: "Tres ideas que sostienen MKatalina",
      en: "Three ideas that sustain MKatalina",
    },
    items: [
      {
        icon: "Heart" as const,
        title: {
          es: "Hecho con tiempo",
          en: "Made with time",
        },
        description: {
          es: "Ninguna pieza sale del taller con prisa. Preferimos hacer menos y hacerlo mejor.",
          en: "No piece leaves the workshop in a rush. We prefer to make less and do it better.",
        },
      },
      {
        icon: "Sparkles" as const,
        title: {
          es: "Materiales honestos",
          en: "Honest materials",
        },
        description: {
          es: "Plata 925, oro rosa, piedras naturales. Sin chapados que se borran, sin metales que pican.",
          en: "Sterling silver 925, rose gold, natural stones. No plating that wears off, no metals that irritate.",
        },
      },
      {
        icon: "MapPin" as const,
        title: {
          es: "Raíz mexicana",
          en: "Mexican roots",
        },
        description: {
          es: "Diseñamos en México, producimos en México, vivimos en México. Cada pieza lleva ese acento.",
          en: "We design in Mexico, produce in Mexico, live in Mexico. Every piece carries that accent.",
        },
      },
    ],
  },
  team: {
    eyebrow: {
      es: "El equipo",
      en: "The team",
    },
    title: {
      es: "Quien está detrás",
      en: "Who's behind it",
    },
    members: [
      {
        name: "María Camila Reyes",
        role: {
          es: "Fundadora y diseñadora",
          en: "Founder and designer",
        },
        bio: {
          es: "Diseñadora industrial por formación, joyera por vocación. Después de años trabajando en agencias de branding, María decidió que quería crear algo que durara más que una campaña publicitaria. MKatalina es ese algo.",
          en: "Industrial designer by training, jeweler by vocation. After years working at branding agencies, María decided she wanted to create something that would last longer than an advertising campaign. MKatalina is that something.",
        },
      },
    ],
  },
  cta: {
    title: {
      es: "Conoce la colección",
      en: "Discover the collection",
    },
    description: {
      es: "Cada pieza tiene una historia. Las que diseñamos esta temporada están esperándote.",
      en: "Every piece has a story. The ones we designed this season are waiting for you.",
    },
    buttonText: {
      es: "Ver productos",
      en: "View products",
    },
    buttonHref: "/aretes",
  },
};

/* ─── CONTACTO (sin cambios respecto al Turno 3A) ─────────────────────── */
export const contactContent = {
  hero: {
    eyebrow: {
      es: "Contacto",
      en: "Contact",
    },
    title: {
      es: "Hablemos",
      en: "Let's talk",
    },
    subtitle: {
      es: "¿Tienes dudas sobre una pieza? ¿Quieres algo personalizado? ¿Quieres saber cuándo llega tu pedido? Escríbenos.",
      en: "Have questions about a piece? Want something custom? Need to know when your order arrives? Write to us.",
    },
  },
  details: {
    email: "hola@mkatalina.mx",
    phone: "+52 (669) 123 4567",
    phoneDisplay: "+52 669 123 4567",
    address: {
      street: "Av. del Mar 1234, Local 7",
      neighborhood: "Centro Histórico",
      city: "Mazatlán, Sinaloa",
      postalCode: "82000",
      country: {
        es: "México",
        en: "Mexico",
      },
    },
    hours: {
      es: "Lunes a sábado · 10:00 — 19:00",
      en: "Monday to Saturday · 10:00 — 19:00",
    },
    social: {
      instagram: {
        handle: "@mkatalina.mx",
        url: "https://instagram.com/mkatalina.mx",
      },
      facebook: {
        handle: "MKatalina Joyería",
        url: "https://facebook.com/mkatalina.mx",
      },
    },
  },
  form: {
    eyebrow: {
      es: "Envíanos un mensaje",
      en: "Send us a message",
    },
    title: {
      es: "Escríbenos directamente",
      en: "Write to us directly",
    },
    description: {
      es: "Te respondemos en menos de 24 horas hábiles. Si es urgente, llámanos.",
      en: "We reply within 24 business hours. If it's urgent, give us a call.",
    },
    labels: {
      name: { es: "Tu nombre", en: "Your name" },
      email: { es: "Email", en: "Email" },
      emailHint: {
        es: "Es a donde te responderemos",
        en: "This is where we'll reply",
      },
      subject: {
        es: "¿De qué quieres hablar?",
        en: "What would you like to talk about?",
      },
      subjectPlaceholder: {
        es: "Selecciona un asunto",
        en: "Select a topic",
      },
      message: { es: "Tu mensaje", en: "Your message" },
      messagePlaceholder: {
        es: "Cuéntanos qué necesitas...",
        en: "Tell us what you need...",
      },
      submit: { es: "Enviar mensaje", en: "Send message" },
      sending: { es: "Enviando...", en: "Sending..." },
      backendPending: {
        es: "Los mensajes se enviarán cuando integremos el backend de email. Por ahora puedes escribirnos directamente a",
        en: "Messages will be sent once we integrate the email backend. For now, you can email us directly at",
      },
    },
    subjectOptions: [
      {
        value: "pedido",
        label: {
          es: "Pregunta sobre un pedido",
          en: "Question about an order",
        },
      },
      {
        value: "devolucion",
        label: { es: "Devolución o cambio", en: "Return or exchange" },
      },
      {
        value: "personalizado",
        label: { es: "Diseño personalizado", en: "Custom design" },
      },
      {
        value: "mayoreo",
        label: { es: "Mayoreo o reventa", en: "Wholesale or resale" },
      },
      {
        value: "otro",
        label: { es: "Otro tema", en: "Another topic" },
      },
    ],
    errors: {
      nameRequired: {
        es: "Tu nombre es obligatorio",
        en: "Your name is required",
      },
      nameMin: {
        es: "Mínimo 2 caracteres",
        en: "Minimum 2 characters",
      },
      emailRequired: {
        es: "Tu email es obligatorio",
        en: "Your email is required",
      },
      emailInvalid: {
        es: "Formato de email inválido",
        en: "Invalid email format",
      },
      subjectRequired: {
        es: "Selecciona un asunto",
        en: "Select a topic",
      },
      messageRequired: {
        es: "Escribe tu mensaje",
        en: "Write your message",
      },
      messageMin: {
        es: "Mínimo 10 caracteres",
        en: "Minimum 10 characters",
      },
    },
    successMessage: {
      es: "¡Mensaje recibido!",
      en: "Message received!",
    },
    successDescription: {
      es: "Te responderemos a tu email pronto.",
      en: "We'll reply to your email soon.",
    },
    sectionTitles: {
      contactData: {
        es: "Datos de contacto",
        en: "Contact details",
      },
      hereForYou: {
        es: "Estamos aquí",
        en: "We're here",
      },
      chooseChannel: {
        es: "Elige el canal que te quede mejor",
        en: "Choose the channel that works best for you",
      },
      followUs: {
        es: "Síguenos",
        en: "Follow us",
      },
    },
    detailLabels: {
      email: { es: "Email", en: "Email" },
      emailHint: {
        es: "Te respondemos en menos de 24 horas hábiles",
        en: "We reply within 24 business hours",
      },
      phone: { es: "Teléfono", en: "Phone" },
      phoneHint: {
        es: "Llámanos para algo urgente",
        en: "Call us for anything urgent",
      },
      physicalStore: {
        es: "Tienda física",
        en: "Physical store",
      },
      hours: { es: "Horarios", en: "Hours" },
      hoursHint: {
        es: "Cerrado domingos y días festivos",
        en: "Closed Sundays and holidays",
      },
    },
  },
};


/* ════════════════════════════════════════════════════════════════════════════
 *  BLOQUE LEGAL — MKATALINA  ·  COMPLETO (es + en)
 * ────────────────────────────────────────────────────────────────────────────
 *  Reemplaza los TRES objetos legales (policiesContent, privacyContent,
 *  termsContent) en src/data/static-content.ts — entre contactContent y faqContent.
 *
 *  Ya está TODO rellenado: responsable, domicilio, jurisdicción y plazos.
 *  Reutiliza ENGLISH_LEGAL_DISCLAIMER y LegalSection (ya definidos arriba).
 *
 *  ⚠️ No soy abogado: sigue siendo un borrador conviene que revise un profesional,
 *     sobre todo el Aviso de Privacidad. Ajusta los plazos si usas otros.
 * ════════════════════════════════════════════════════════════════════════════ */

/* ─── POLÍTICAS (envíos, apartados, devoluciones, garantías) ───────────────── */
export const policiesContent = {
  hero: {
    eyebrow: { es: "Políticas", en: "Policies" },
    title: {
      es: "Envíos, apartados, devoluciones y garantías",
      en: "Shipping, reservations, returns and warranties",
    },
    subtitle: {
      es: "Todo lo que necesitas saber sobre cómo manejamos tu pedido, desde el carrito hasta tu casa.",
      en: "Everything you need to know about how we handle your order, from cart to home.",
    },
  },
  lastUpdated: {
    es: "6 de octubre de 2026",
    en: "October 6, 2026",
  },
  sections: [
    {
      id: "envios",
      title: { es: "Envíos", en: "Shipping" },
      paragraphs: {
        es: [
          "Enviamos a toda la República Mexicana a través de paqueterías de cobertura nacional. Los pedidos se procesan en un plazo de 1 a 2 días hábiles después de confirmado el pago; los apartados se procesan una vez cubierto el total.",
          "El tiempo estimado de entrega del envío estándar es de 3 a 5 días hábiles una vez despachado el pedido. Los tiempos pueden variar por zona, temporada alta o causas ajenas a nosotros, como el clima o retrasos de la paquetería.",
          "El costo de envío se calcula y se muestra en el checkout antes de que pagues.",
          "Cuando tu pedido sale de nuestro taller te enviamos por correo el número de guía para que lo rastrees. Por ahora no realizamos envíos internacionales.",
        ],
        en: [
          ENGLISH_LEGAL_DISCLAIMER,
          "We ship throughout Mexico via national couriers. Orders are processed within 1 to 2 business days after payment confirmation; reservations are processed once the total has been paid.",
          "The estimated delivery time for standard shipping is 3 to 5 business days after the order is dispatched. Times may vary by region, peak season, or causes beyond our control, such as weather or courier delays.",
          "The shipping cost is calculated and shown at checkout before you pay.",
          "When your order leaves our workshop, we email you the tracking number so you can follow it. We do not currently offer international shipping.",
        ],
      },
    },
    {
      id: "apartados",
      title: { es: "Apartados", en: "Reservations" },
      paragraphs: {
        es: [
          "Puedes apartar una pieza pagando un anticipo del 20% de su precio total. El 80% restante debe cubrirse dentro de los 5 días naturales siguientes.",
          "Durante esos 5 días la pieza queda reservada para ti. Al completar el pago eliges si la recoges en tienda o la recibes por envío, aplicando los tiempos y costos de la sección de Envíos.",
          "El anticipo del 20% no es reembolsable bajo ninguna circunstancia, incluyendo la cancelación voluntaria o el vencimiento del apartado. Si no completas el pago en el plazo, el apartado se cancela y la pieza vuelve a estar disponible.",
        ],
        en: [
          "You can reserve a piece by paying a 20% deposit of its total price. The remaining 80% must be paid within the following 5 calendar days.",
          "During those 5 days the piece is held for you. When you complete the payment you choose whether to pick it up in store or receive it by shipping, subject to the times and costs in the Shipping section.",
          "The 20% deposit is non-refundable under any circumstances, including voluntary cancellation or expiration of the reservation. If you do not complete the payment in time, the reservation is cancelled and the piece becomes available again.",
        ],
      },
    },
    {
      id: "devoluciones",
      title: { es: "Devoluciones y cambios", en: "Returns and exchanges" },
      paragraphs: {
        es: [
          "Aceptamos devoluciones y cambios dentro de los 30 días naturales posteriores a la fecha de entrega, siempre que la pieza esté sin uso, en su empaque original y con sus etiquetas.",
          "Por razones de higiene, los aretes no admiten devolución ni cambio, salvo defecto de fábrica. Las piezas personalizadas o grabadas tampoco son retornables, por tratarse de productos hechos a pedido.",
          "Para iniciar una devolución o cambio, escríbenos a hola@mkatalina.mx indicando tu número de pedido y el motivo. Te daremos los pasos a seguir.",
          "El costo del envío de retorno corre por cuenta del cliente, salvo que la devolución se deba a un error nuestro o a un defecto de fábrica.",
          "Una vez que recibimos y revisamos la pieza, procesamos el reembolso al mismo método de pago en un plazo de 5 a 10 días hábiles, o realizamos el cambio acordado.",
        ],
        en: [
          "We accept returns and exchanges within 30 calendar days following the delivery date, provided the piece is unused, in its original packaging and with its tags.",
          "For hygiene reasons, earrings cannot be returned or exchanged, except for manufacturing defects. Personalized or engraved pieces are also non-returnable, as they are made to order.",
          "To start a return or exchange, write to us at hola@mkatalina.mx with your order number and the reason. We will guide you through the steps.",
          "Return shipping costs are covered by the customer, unless the return is due to our error or a manufacturing defect.",
          "Once we receive and inspect the piece, we process the refund to the original payment method within 5 to 10 business days, or carry out the agreed exchange.",
        ],
      },
    },
    {
      id: "garantias",
      title: { es: "Garantías", en: "Warranties" },
      paragraphs: {
        es: [
          "Todas nuestras piezas cuentan con una garantía de 30 días por defectos de fabricación. Si tu pieza presenta una falla de origen, la reparamos o reemplazamos sin costo.",
          "La garantía no cubre el desgaste natural por el uso, el oscurecimiento propio de la plata, golpes, humedad, el contacto con perfumes o químicos, ni el mal uso de la pieza.",
          "Para hacer válida la garantía, escríbenos a hola@mkatalina.mx con tu número de pedido y fotografías de la pieza.",
        ],
        en: [
          "All our pieces come with a 30-day warranty against manufacturing defects. If your piece has a defect from origin, we repair or replace it at no cost.",
          "The warranty does not cover natural wear from use, the natural tarnishing of silver, impacts, moisture, contact with perfumes or chemicals, or misuse of the piece.",
          "To claim the warranty, write to us at hola@mkatalina.mx with your order number and photos of the piece.",
        ],
      },
    },
  ] satisfies LegalSection[],
};

/* ─── AVISO DE PRIVACIDAD (LFPDPPP) ───────────────────────────────────────── */
export const privacyContent = {
  hero: {
    eyebrow: { es: "Privacidad", en: "Privacy" },
    title: {
      es: "Aviso de privacidad",
      en: "Privacy notice",
    },
    subtitle: {
      es: "Te explicamos qué datos recabamos, para qué los usamos, con quién se comparten y cómo los proteges.",
      en: "We explain what data we collect, what we use it for, who it is shared with, and how we protect it.",
    },
  },
  lastUpdated: {
    es: "6 de octubre de 2026",
    en: "October 6, 2026",
  },
  sections: [
    {
      id: "responsable",
      title: {
        es: "Responsable y cómo contactarnos",
        en: "Data controller and how to contact us",
      },
      paragraphs: {
        es: [
          "En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), te informamos cómo tratamos tus datos personales.",
          "El responsable del tratamiento de tus datos es María Guadalupe Rubio Sandoval, con domicilio en Andalucía 15, Fraccionamiento Mediterráneo, Mazatlán, Sinaloa. Para cualquier asunto relacionado con tus datos personales puedes contactarnos en hola@mkatalina.mx.",
        ],
        en: [
          ENGLISH_LEGAL_DISCLAIMER,
          "In compliance with the Mexican Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP), we inform you how we process your personal data.",
          "The party responsible for processing your data is María Guadalupe Rubio Sandoval, with address at Andalucía 15, Fraccionamiento Mediterráneo, Mazatlán, Sinaloa. For any matter related to your personal data you may contact us at hola@mkatalina.mx.",
        ],
      },
    },
    {
      id: "datos",
      title: {
        es: "Datos que recabamos",
        en: "Data we collect",
      },
      paragraphs: {
        es: [
          "Para operar la tienda recabamos, según el caso, datos de identificación y contacto (nombre, correo electrónico y teléfono); datos de envío (domicilio, colonia, ciudad, estado y código postal); y datos de tu cuenta (correo y una contraseña, que se almacena de forma cifrada).",
          "Cuando realizas un pedido o un apartado, guardamos el historial de la transacción: productos, montos, dirección de envío y estado del pedido.",
          "No almacenamos los datos de tu tarjeta. Los pagos se procesan directamente por nuestro proveedor de pagos (PayPal), que recibe y resguarda esa información conforme a sus propias políticas.",
          "También podemos recabar datos de navegación, como las páginas que visitas, mediante cookies y tecnologías similares, con fines de funcionamiento y mejora del sitio.",
        ],
        en: [
          "To operate the store we collect, as applicable, identification and contact data (name, email and phone); shipping data (address, neighborhood, city, state and postal code); and account data (email and a password, stored in encrypted form).",
          "When you place an order or a reservation, we keep the transaction history: products, amounts, shipping address and order status.",
          "We do not store your card details. Payments are processed directly by our payment provider (PayPal), which receives and safeguards that information according to its own policies.",
          "We may also collect browsing data, such as the pages you visit, through cookies and similar technologies, for site functioning and improvement.",
        ],
      },
    },
    {
      id: "finalidades",
      title: {
        es: "Para qué usamos tus datos",
        en: "What we use your data for",
      },
      paragraphs: {
        es: [
          "Finalidades primarias, necesarias para darte el servicio: procesar y entregar tus pedidos y apartados; gestionar tu cuenta; brindarte atención y soporte; y cumplir obligaciones legales y fiscales.",
          "Finalidades secundarias, que no son necesarias y requieren tu consentimiento: enviarte comunicaciones comerciales, promociones y novedades (newsletter).",
          "Si no deseas que tus datos se usen para las finalidades secundarias, puedes manifestarlo en cualquier momento escribiendo a hola@mkatalina.mx. Negarte a estas finalidades no afecta la prestación del servicio.",
        ],
        en: [
          "Primary purposes, necessary to provide the service: process and deliver your orders and reservations; manage your account; provide customer care and support; and comply with legal and tax obligations.",
          "Secondary purposes, which are not necessary and require your consent: sending you commercial communications, promotions and news (newsletter).",
          "If you do not want your data used for secondary purposes, you may say so at any time by writing to hola@mkatalina.mx. Declining these purposes does not affect the service.",
        ],
      },
    },
    {
      id: "transferencias",
      title: {
        es: "Con quién se comparten (encargados)",
        en: "Who it is shared with (processors)",
      },
      paragraphs: {
        es: [
          "Para operar, compartimos ciertos datos con proveedores que nos prestan servicios (encargados), únicamente para las finalidades descritas: el procesador de pagos (PayPal), el proveedor de infraestructura y base de datos (Supabase) y las empresas de paquetería para la entrega de tus pedidos.",
          "Algunos de estos proveedores pueden almacenar o procesar información en servidores ubicados fuera de México. En esos casos tomamos medidas para que tus datos sigan protegidos conforme a este aviso.",
          "No vendemos ni rentamos tus datos personales a terceros.",
        ],
        en: [
          "To operate, we share certain data with providers that render services to us (processors), solely for the purposes described: the payment processor (PayPal), the infrastructure and database provider (Supabase), and courier companies for the delivery of your orders.",
          "Some of these providers may store or process information on servers located outside Mexico. In those cases we take measures so that your data remains protected under this notice.",
          "We do not sell or rent your personal data to third parties.",
        ],
      },
    },
    {
      id: "arco",
      title: {
        es: "Tus derechos ARCO",
        en: "Your ARCO rights",
      },
      paragraphs: {
        es: [
          "Tienes derecho a Acceder a tus datos, Rectificarlos cuando sean inexactos, Cancelarlos cuando consideres que no se requieren, y Oponerte a su tratamiento (derechos ARCO). También puedes revocar el consentimiento que nos hayas otorgado.",
          "Para ejercer cualquiera de estos derechos, envía tu solicitud a hola@mkatalina.mx indicando tu nombre, el derecho que deseas ejercer y los datos sobre los que recae. Podremos solicitarte una identificación para verificar tu identidad.",
          "Te responderemos dentro de los plazos que marca la ley.",
        ],
        en: [
          "You have the right to Access your data, Rectify it when inaccurate, Cancel it when you consider it is not needed, and Object to its processing (ARCO rights). You may also revoke any consent you have given us.",
          "To exercise any of these rights, send your request to hola@mkatalina.mx stating your name, the right you wish to exercise, and the data it concerns. We may ask for an ID to verify your identity.",
          "We will respond within the time frames established by law.",
        ],
      },
    },
    {
      id: "cookies",
      title: {
        es: "Cookies y tecnologías similares",
        en: "Cookies and similar technologies",
      },
      paragraphs: {
        es: [
          "Usamos cookies y almacenamiento local del navegador para recordar tu sesión, mantener tu carrito y mejorar tu experiencia. Algunas son necesarias para que el sitio funcione; otras nos ayudan a entender cómo se usa el sitio.",
          "Puedes configurar tu navegador para rechazar o eliminar cookies, pero algunas funciones del sitio podrían dejar de operar correctamente.",
        ],
        en: [
          "We use cookies and browser local storage to remember your session, keep your cart, and improve your experience. Some are necessary for the site to work; others help us understand how the site is used.",
          "You can set your browser to reject or delete cookies, but some site features may stop working correctly.",
        ],
      },
    },
    {
      id: "seguridad",
      title: {
        es: "Cómo protegemos tus datos",
        en: "How we protect your data",
      },
      paragraphs: {
        es: [
          "Aplicamos medidas de seguridad administrativas, técnicas y físicas razonables para proteger tus datos contra pérdida, uso indebido o acceso no autorizado. Las contraseñas se almacenan cifradas y el acceso a los datos está restringido.",
          "Ningún sistema es completamente infalible; en caso de una vulneración que afecte tus datos de forma significativa, te lo informaremos conforme a la ley.",
        ],
        en: [
          "We apply reasonable administrative, technical and physical security measures to protect your data against loss, misuse or unauthorized access. Passwords are stored encrypted and access to data is restricted.",
          "No system is completely infallible; in the event of a breach that significantly affects your data, we will inform you as required by law.",
        ],
      },
    },
    {
      id: "cambios",
      title: {
        es: "Cambios a este aviso",
        en: "Changes to this notice",
      },
      paragraphs: {
        es: [
          "Podemos actualizar este aviso de privacidad para reflejar cambios en nuestras prácticas o en la ley. Publicaremos la versión vigente en esta página e indicaremos la fecha de última actualización.",
        ],
        en: [
          "We may update this privacy notice to reflect changes in our practices or in the law. We will publish the current version on this page and indicate the date of last update.",
        ],
      },
    },
  ] satisfies LegalSection[],
};

/* ─── TÉRMINOS Y CONDICIONES ──────────────────────────────────────────────── */
export const termsContent = {
  hero: {
    eyebrow: { es: "Términos y condiciones", en: "Terms and conditions" },
    title: {
      es: "Términos y condiciones",
      en: "Terms and conditions",
    },
    subtitle: {
      es: "Al usar MKatalina aceptas estos términos. Los escribimos en lenguaje claro, no en jerga legal.",
      en: "By using MKatalina you accept these terms. We wrote them in plain language, not in legal jargon.",
    },
  },
  lastUpdated: {
    es: "6 de octubre de 2026",
    en: "October 6, 2026",
  },
  sections: [
    {
      id: "aceptacion",
      title: { es: "Aceptación de los términos", en: "Acceptance of terms" },
      paragraphs: {
        es: [
          "Al acceder y usar el sitio de MKatalina aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con ellos, te pedimos no utilizar el sitio.",
        ],
        en: [
          ENGLISH_LEGAL_DISCLAIMER,
          "By accessing and using the MKatalina website you accept these Terms and Conditions in their entirety. If you do not agree with them, please do not use the site.",
        ],
      },
    },
    {
      id: "uso",
      title: { es: "Uso del sitio", en: "Use of the site" },
      paragraphs: {
        es: [
          "Puedes usar el sitio para conocer y adquirir nuestros productos de forma personal y lícita.",
          "Te comprometes a no usar el sitio para fines fraudulentos o ilegales, a no intentar dañar o vulnerar su funcionamiento, y a no reproducir su contenido sin autorización.",
        ],
        en: [
          "You may use the site to browse and purchase our products for personal and lawful purposes.",
          "You agree not to use the site for fraudulent or illegal purposes, not to attempt to damage or compromise its operation, and not to reproduce its content without authorization.",
        ],
      },
    },
    {
      id: "cuenta",
      title: { es: "Cuenta de usuario", en: "User account" },
      paragraphs: {
        es: [
          "Puedes comprar como invitado o crear una cuenta. Al crear una cuenta eres responsable de la veracidad de tus datos y de mantener la confidencialidad de tu contraseña.",
          "Eres responsable de la actividad que ocurra en tu cuenta. Podemos suspender o cancelar cuentas que incumplan estos términos o que detectemos involucradas en un uso indebido.",
        ],
        en: [
          "You can shop as a guest or create an account. When creating an account you are responsible for the accuracy of your data and for keeping your password confidential.",
          "You are responsible for activity that occurs in your account. We may suspend or cancel accounts that breach these terms or that we detect involved in misuse.",
        ],
      },
    },
    {
      id: "productos",
      title: { es: "Productos y precios", en: "Products and prices" },
      paragraphs: {
        es: [
          "Procuramos que las descripciones, fotografías y precios sean exactos. Al tratarse de piezas artesanales, pueden existir ligeras variaciones de color, textura o acabado entre la imagen y la pieza física.",
          "Los precios se muestran en pesos mexicanos (MXN) e incluyen los impuestos aplicables, salvo que se indique lo contrario. El costo de envío se muestra por separado en el checkout.",
          "Nos reservamos el derecho de corregir errores de precio o de descripción, y de limitar las cantidades según las existencias disponibles. Si un error afecta tu pedido, te contactaremos antes de procesarlo.",
        ],
        en: [
          "We strive to keep descriptions, photographs and prices accurate. As these are handmade pieces, there may be slight variations in color, texture or finish between the image and the physical piece.",
          "Prices are shown in Mexican pesos (MXN) and include applicable taxes, unless otherwise stated. The shipping cost is shown separately at checkout.",
          "We reserve the right to correct pricing or description errors, and to limit quantities based on available stock. If an error affects your order, we will contact you before processing it.",
        ],
      },
    },
    {
      id: "pagos",
      title: { es: "Pagos", en: "Payments" },
      paragraphs: {
        es: [
          "Los pagos se procesan a través de nuestro proveedor de pagos (PayPal), que admite el pago con cuenta PayPal o con tarjeta. El cargo se realiza al confirmar la compra.",
          "Tu pedido se considera confirmado una vez que recibimos la confirmación del pago.",
        ],
        en: [
          "Payments are processed through our payment provider (PayPal), which supports payment with a PayPal account or card. The charge is made upon confirming the purchase.",
          "Your order is considered confirmed once we receive payment confirmation.",
        ],
      },
    },
    {
      id: "apartados",
      title: { es: "Apartados", en: "Reservations" },
      paragraphs: {
        es: [
          "El servicio de apartado te permite reservar una pieza pagando un anticipo del 20% de su precio total, cubriendo el 80% restante dentro de los 5 días naturales siguientes.",
          "El anticipo no es reembolsable. Si no se completa el pago en el plazo, el apartado se cancela y la pieza vuelve a estar disponible. Consulta el detalle en nuestras Políticas.",
        ],
        en: [
          "The reservation service lets you hold a piece by paying a 20% deposit of its total price, paying the remaining 80% within the following 5 calendar days.",
          "The deposit is non-refundable. If payment is not completed in time, the reservation is cancelled and the piece becomes available again. See the details in our Policies.",
        ],
      },
    },
    {
      id: "envios-devoluciones",
      title: {
        es: "Envíos, devoluciones y garantías",
        en: "Shipping, returns and warranties",
      },
      paragraphs: {
        es: [
          "Los envíos, devoluciones, cambios y garantías se rigen por lo establecido en nuestras Políticas, que forman parte de estos términos.",
        ],
        en: [
          "Shipping, returns, exchanges and warranties are governed by our Policies, which form part of these terms.",
        ],
      },
    },
    {
      id: "propiedad",
      title: { es: "Propiedad intelectual", en: "Intellectual property" },
      paragraphs: {
        es: [
          "La marca MKatalina, su logotipo, sus diseños, textos, fotografías y demás contenido del sitio son propiedad de María Guadalupe Rubio Sandoval o se usan con autorización, y están protegidos por las leyes de propiedad intelectual.",
          "No está permitido copiar, reproducir, distribuir ni usar comercialmente dicho contenido sin nuestro consentimiento por escrito.",
        ],
        en: [
          "The MKatalina brand, its logo, designs, texts, photographs and other site content are owned by María Guadalupe Rubio Sandoval or used with authorization, and are protected by intellectual property laws.",
          "You may not copy, reproduce, distribute or commercially use such content without our written consent.",
        ],
      },
    },
    {
      id: "responsabilidad",
      title: {
        es: "Limitación de responsabilidad",
        en: "Limitation of liability",
      },
      paragraphs: {
        es: [
          "El sitio y sus productos se ofrecen tal como se describen. En la medida que lo permita la ley, no seremos responsables por daños indirectos o incidentales derivados del uso del sitio ni por retrasos atribuibles a terceros, como las paqueterías o el procesador de pagos.",
          "Nada en estos términos limita los derechos que te correspondan como consumidor conforme a la legislación aplicable.",
        ],
        en: [
          "The site and its products are offered as described. To the extent permitted by law, we will not be liable for indirect or incidental damages arising from use of the site, nor for delays attributable to third parties such as couriers or the payment processor.",
          "Nothing in these terms limits the rights you may have as a consumer under applicable law.",
        ],
      },
    },
    {
      id: "modificaciones",
      title: {
        es: "Modificaciones a los términos",
        en: "Changes to the terms",
      },
      paragraphs: {
        es: [
          "Podemos modificar estos términos en cualquier momento. La versión vigente será la publicada en esta página, con su fecha de última actualización. El uso del sitio después de un cambio implica la aceptación de los términos actualizados.",
        ],
        en: [
          "We may modify these terms at any time. The current version will be the one published on this page, with its date of last update. Using the site after a change implies acceptance of the updated terms.",
        ],
      },
    },
    {
      id: "jurisdiccion",
      title: {
        es: "Legislación y jurisdicción",
        en: "Governing law and jurisdiction",
      },
      paragraphs: {
        es: [
          "Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de Mazatlán, Sinaloa, renunciando a cualquier otro fuero que pudiera corresponderles.",
        ],
        en: [
          "These terms are governed by the laws of the United Mexican States. For any dispute, the parties submit to the jurisdiction of the competent courts of Mazatlán, Sinaloa, waiving any other jurisdiction that may correspond to them.",
        ],
      },
    },
  ] satisfies LegalSection[],
};


/* ─── FAQ (sin cambios respecto al Turno 3A) ──────────────────────────── */
export const faqContent = {
  hero: {
    eyebrow: {
      es: "Preguntas frecuentes",
      en: "Frequently asked questions",
    },
    title: {
      es: "Lo que más nos preguntan",
      en: "What we get asked most",
    },
    subtitle: {
      es: "Reunimos aquí las dudas más comunes. Si no encuentras tu respuesta, escríbenos.",
      en: "We've gathered the most common questions here. If you don't find your answer, write to us.",
    },
  },
  searchPlaceholder: {
    es: "Busca tu pregunta...",
    en: "Search your question...",
  },
  noResults: {
    title: {
      es: "No encontramos resultados",
      en: "No results found",
    },
    description: {
      es: "No hay preguntas que coincidan con tu búsqueda. Intenta con otras palabras o escríbenos directamente.",
      en: "No questions match your search. Try different words or write to us directly.",
    },
  },
  searchingFor: {
    es: "Mostrando resultados para",
    en: "Showing results for",
  },
  cta: {
    title: {
      es: "¿No encontraste lo que buscabas?",
      en: "Couldn't find what you were looking for?",
    },
    description: {
      es: "Cada pregunta es bienvenida. Escríbenos directamente y te responderemos en menos de 24 horas hábiles.",
      en: "Every question is welcome. Write to us directly and we'll respond within 24 business hours.",
    },
    button: {
      es: "Escríbenos",
      en: "Contact us",
    },
  },

  categories: [
    {
      id: "productos",
      title: {
        es: "Sobre los productos",
        en: "About the products",
      },
      questions: [
        {
          id: "materiales-usados",
          question: {
            es: "¿Qué materiales usan en sus piezas?",
            en: "What materials do you use in your pieces?",
          },
          answer: {
            es: [
              "Trabajamos principalmente con plata 925, oro rosa (chapado de calidad sobre plata), acero quirúrgico, y piedras naturales como cuarzo, ágata, ónix y turquesa.",
              "Cada producto especifica sus materiales exactos en la página de detalle. Si tienes alguna alergia o preferencia específica, escríbenos antes de comprar.",
            ],
            en: [
              "We primarily work with sterling silver 925, rose gold (quality plating over silver), surgical steel, and natural stones such as quartz, agate, onyx, and turquoise.",
              "Each product specifies its exact materials on the detail page. If you have any allergy or specific preference, write to us before purchasing.",
            ],
          },
        },
        {
          id: "hipoalergenico",
          question: {
            es: "¿Sus piezas son hipoalergénicas?",
            en: "Are your pieces hypoallergenic?",
          },
          answer: {
            es: [
              "La plata 925 y el acero quirúrgico son hipoalergénicos para la mayoría de las personas.",
              "El oro rosa que usamos es chapado de alta calidad sobre plata, lo que reduce significativamente las reacciones alérgicas.",
            ],
            en: [
              "Sterling silver 925 and surgical steel are hypoallergenic for most people.",
              "The rose gold we use is high-quality plating over silver, which significantly reduces allergic reactions.",
            ],
          },
        },
        {
          id: "diseno-personalizado",
          question: {
            es: "¿Hacen piezas personalizadas?",
            en: "Do you make custom pieces?",
          },
          answer: {
            es: [
              "Sí, ofrecemos servicio de diseño personalizado para piezas únicas, grabados de nombres, fechas o iniciales, y modificaciones a nuestros diseños existentes.",
              "El tiempo de producción es de 2 a 3 semanas y el costo varía según la complejidad.",
            ],
            en: [
              "Yes, we offer custom design service for unique pieces, engraving of names, dates or initials, and modifications to our existing designs.",
              "Production time is 2 to 3 weeks and cost varies based on complexity.",
            ],
          },
        },
      ],
    },
    {
      id: "pedidos",
      title: {
        es: "Sobre los pedidos",
        en: "About orders",
      },
      questions: [
        {
          id: "cuanto-tarda-envio",
          question: {
            es: "¿Cuánto tarda en llegar mi pedido?",
            en: "How long does my order take to arrive?",
          },
          answer: {
            es: [
              "Los pedidos se procesan en 1-2 días hábiles. Después del despacho, el envío estándar tarda 3-5 días hábiles y el express 1-2 días hábiles.",
              "En total, desde que confirmas el pago hasta que recibes tu paquete son típicamente 4-7 días hábiles con envío estándar.",
            ],
            en: [
              "Orders are processed in 1-2 business days. After dispatch, standard shipping takes 3-5 business days and express 1-2 business days.",
              "In total, from payment confirmation to receiving your package is typically 4-7 business days with standard shipping.",
            ],
          },
        },
        {
          id: "rastreo-pedido",
          question: {
            es: "¿Cómo rastreo mi pedido?",
            en: "How do I track my order?",
          },
          answer: {
            es: [
              "Cuando tu paquete sale de nuestro taller, te enviamos un email con el número de guía y un link al sitio de la paquetería para rastrearlo en tiempo real.",
              "Si tienes cuenta, también puedes ver el estado en la sección \"Mis pedidos\".",
            ],
            en: [
              "When your package leaves our workshop, we send you an email with the tracking number and a link to the courier's site to track it in real time.",
              "If you have an account, you can also check the status in the \"My orders\" section.",
            ],
          },
        },
      ],
    },
    {
      id: "apartados",
      title: {
        es: "Sobre los apartados",
        en: "About reservations",
      },
      questions: [
        {
          id: "como-funciona-apartado",
          question: {
            es: "¿Cómo funciona el sistema de apartado?",
            en: "How does the reservation system work?",
          },
          answer: {
            es: [
              "Apartar un producto te permite reservarlo pagando un anticipo del 20% del precio total. Tienes 5 días naturales para completar el pago del 80% restante.",
              "Durante esos 5 días, el producto queda bloqueado para ti. Si completas el pago a tiempo, eliges recoger en tienda o recibir por envío.",
            ],
            en: [
              "Reserving a product lets you hold it by paying a 20% deposit of the total price. You have 5 calendar days to complete the remaining 80% payment.",
              "During those 5 days, the product is locked for you. If you complete the payment on time, you choose to pick up in store or receive by shipping.",
            ],
          },
        },
        {
          id: "anticipo-reembolso",
          question: {
            es: "¿El anticipo es reembolsable?",
            en: "Is the deposit refundable?",
          },
          answer: {
            es: [
              "No. El anticipo del 20% no es reembolsable bajo ninguna circunstancia, incluyendo cancelación voluntaria del cliente o expiración del apartado.",
              "Esta regla existe para que apartar sea un compromiso real.",
            ],
            en: [
              "No. The 20% deposit is non-refundable under any circumstances, including voluntary customer cancellation or reservation expiration.",
              "This rule exists so that reserving is a real commitment.",
            ],
          },
        },
      ],
    },
    {
      id: "cuenta",
      title: {
        es: "Sobre tu cuenta",
        en: "About your account",
      },
      questions: [
        {
          id: "necesito-cuenta",
          question: {
            es: "¿Necesito crear una cuenta para comprar?",
            en: "Do I need to create an account to buy?",
          },
          answer: {
            es: [
              "No es obligatorio. Puedes comprar como invitada sin crear cuenta, solo necesitas darnos tu email para enviarte la confirmación.",
              "Tener cuenta te da ventajas: guardar productos en wishlist, ver tu historial de pedidos, apartar productos.",
            ],
            en: [
              "It's not required. You can shop as a guest without creating an account, you just need to provide your email for the confirmation.",
              "Having an account gives you benefits: save products to wishlist, view your order history, reserve products.",
            ],
          },
        },
      ],
    },
    {
      id: "otros",
      title: {
        es: "Otras dudas",
        en: "Other questions",
      },
      questions: [
        {
          id: "tienda-fisica",
          question: {
            es: "¿Tienen tienda física?",
            en: "Do you have a physical store?",
          },
          answer: {
            es: [
              "Sí, tenemos una tienda en el Centro Histórico de Mazatlán, Sinaloa. La dirección y horarios están en la página de contacto.",
            ],
            en: [
              "Yes, we have a store in the Historic Center of Mazatlán, Sinaloa. Address and hours are on the contact page.",
            ],
          },
        },
        {
          id: "empaque-regalo",
          question: {
            es: "¿Empacan los pedidos para regalo?",
            en: "Do you gift-wrap orders?",
          },
          answer: {
            es: [
              "Todos nuestros pedidos vienen en un empaque cuidado por defecto: bolsita de tela, caja con el logotipo, y una tarjeta con la historia de la pieza.",
            ],
            en: [
              "All our orders come in carefully designed packaging by default: fabric pouch, box with the logo, and a card with the story of the piece.",
            ],
          },
        },
      ],
    },
  ] satisfies FaqCategory[],
};