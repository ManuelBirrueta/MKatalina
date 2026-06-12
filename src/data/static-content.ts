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

/* ─── POLÍTICAS (Turno 3C: traducido + disclaimer en /en) ─────────────── */
/**
 * Contenido placeholder. Necesita EXPANSIÓN antes de producción
 * (ver advertencia crítica al inicio de este archivo).
 */
export const policiesContent = {
  hero: {
    eyebrow: {
      es: "Políticas",
      en: "Policies",
    },
    title: {
      es: "Envíos, devoluciones y garantías",
      en: "Shipping, returns and warranties",
    },
    subtitle: {
      es: "Todo lo que necesitas saber sobre cómo manejamos tu pedido desde el carrito hasta tu casa.",
      en: "Everything you need to know about how we handle your order from cart to home.",
    },
  },
  lastUpdated: {
    es: "1 de mayo de 2026",
    en: "May 1, 2026",
  },
  sections: [
    {
      id: "envios",
      title: {
        es: "Envíos",
        en: "Shipping",
      },
      paragraphs: {
        es: [
          "Enviamos a toda la República Mexicana. Los pedidos se procesan en un plazo de 1 a 2 días hábiles después de confirmado el pago.",
          "El tiempo de entrega varía según el método de envío elegido: el envío estándar tarda entre 3 y 5 días hábiles.",
          "Por ahora no realizamos envíos internacionales. Estamos trabajando en habilitar esta opción próximamente.",
        ],
        /**
         * Primera sección de /en: el disclaimer va como primer párrafo,
         * seguido de los párrafos traducidos. Esta es la única sección con
         * disclaimer en este documento — las siguientes solo tienen contenido.
         */
        en: [
          ENGLISH_LEGAL_DISCLAIMER,
          "We ship throughout Mexico. Orders are processed within 1 to 2 business days after payment confirmation.",
          "Delivery time varies depending on the shipping method chosen: standard shipping takes between 3 and 5 business days.",
          "We do not currently offer international shipping. We are working on enabling this option soon.",
        ],
      },
    },
    {
      id: "devoluciones",
      title: {
        es: "Devoluciones y cambios",
        en: "Returns and exchanges",
      },
      paragraphs: {
        es: [
          "Aceptamos devoluciones dentro de los 30 días posteriores a la fecha de entrega.",
          "Para iniciar una devolución, escríbenos a hola@mkatalina.mx indicando tu número de pedido.",
        ],
        en: [
          "We accept returns within 30 days following the delivery date.",
          "To start a return, write to us at hola@mkatalina.mx indicating your order number.",
        ],
      },
    },
  ] satisfies LegalSection[],
};

/* ─── PRIVACIDAD (Turno 3C: traducido + disclaimer en /en) ────────────── */
/**
 * Contenido placeholder. Necesita EXPANSIÓN COMPLETA antes de producción.
 * Faltan: datos recopilados, finalidades, derechos ARCO, cookies, etc.
 * (ver advertencia crítica al inicio de este archivo).
 */
export const privacyContent = {
  hero: {
    eyebrow: {
      es: "Privacidad",
      en: "Privacy",
    },
    title: {
      es: "Cómo cuidamos tus datos",
      en: "How we care for your data",
    },
    subtitle: {
      es: "Te explicamos qué información guardamos, por qué la necesitamos y cómo la protegemos.",
      en: "We explain what information we keep, why we need it, and how we protect it.",
    },
  },
  lastUpdated: {
    es: "1 de mayo de 2026",
    en: "May 1, 2026",
  },
  sections: [
    {
      id: "introduccion",
      title: {
        es: "Quiénes somos y cómo contactarnos",
        en: "Who we are and how to contact us",
      },
      paragraphs: {
        es: [
          "MKatalina es responsable del tratamiento de tus datos personales. Operamos en México y cumplimos con la LFPDPPP.",
        ],
        /**
         * Primera (y única) sección de /en: disclaimer + párrafo traducido.
         * Nota: "LFPDPPP" se mantiene en español porque es el nombre oficial
         * de la ley mexicana — no se traduce. Se podría expandir a
         * "Mexican Federal Law on Protection of Personal Data Held by Private
         * Parties (LFPDPPP)" cuando el contenido se expanda en producción.
         */
        en: [
          ENGLISH_LEGAL_DISCLAIMER,
          "MKatalina is responsible for the processing of your personal data. We operate in Mexico and comply with the LFPDPPP (Mexican Federal Law on Protection of Personal Data Held by Private Parties).",
        ],
      },
    },
  ] satisfies LegalSection[],
};

/* ─── TÉRMINOS (Turno 3C: traducido + disclaimer en /en) ──────────────── */
/**
 * Contenido placeholder. Necesita EXPANSIÓN COMPLETA antes de producción.
 * Faltan: uso del sitio, cuenta de usuario, propiedad intelectual, etc.
 * (ver advertencia crítica al inicio de este archivo).
 */
export const termsContent = {
  hero: {
    eyebrow: {
      es: "Términos y condiciones",
      en: "Terms and conditions",
    },
    title: {
      es: "Las reglas del juego",
      en: "The rules of the game",
    },
    subtitle: {
      es: "Al usar MKatalina aceptas estos términos. Los escribimos en español claro, no en jerga legal.",
      /**
       * Corregido de "plain English" a "plain language" — la traducción
       * literal "We wrote them in plain English" no tenía sentido lógico
       * (los términos están en lenguaje claro, no específicamente en inglés).
       * "Plain language" preserva la intención del original.
       */
      en: "By using MKatalina you accept these terms. We wrote them in plain language, not in legal jargon.",
    },
  },
  lastUpdated: {
    es: "1 de mayo de 2026",
    en: "May 1, 2026",
  },
  sections: [
    {
      id: "aceptacion",
      title: {
        es: "Aceptación de los términos",
        en: "Acceptance of terms",
      },
      paragraphs: {
        es: [
          "Al acceder al sitio web de MKatalina y realizar cualquier interacción, aceptas estos términos y condiciones en su totalidad.",
        ],
        en: [
          ENGLISH_LEGAL_DISCLAIMER,
          "By accessing MKatalina's website and engaging in any interaction, you accept these terms and conditions in their entirety.",
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