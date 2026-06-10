/**
 * Configuración centralizada de fuentes — Katalina
 * ================================================
 *
 * Este archivo declara las fuentes que usa toda la aplicación.
 * Se importa desde `src/app/layout.tsx` y las variables CSS que expone
 * (--font-display, --font-sans) se aplican al elemento <html>, lo que
 * las hace disponibles globalmente en toda la app vía CSS custom props.
 *
 * Tailwind las consume desde `globals.css` mediante la directiva @theme,
 * y a partir de ahí las clases `font-display` y `font-sans` funcionan
 * en cualquier componente.
 *
 * Stack: next/font/google (auto-alojamiento de fuentes en build time)
 */
 
import { Playfair_Display, DM_Sans } from "next/font/google";
 
/**
 * playfair — fuente serif para titulares y momentos editoriales
 * --------------------------------------------------------------
 * Playfair Display es una "Didone moderna": alto contraste entre los
 * trazos gruesos y delgados, terminales finos, ascendentes elegantes.
 * Ideal para joyería de lujo porque comparte ADN tipográfico con marcas
 * como Vogue, Tiffany & Co., y Pandora (que usan fuentes muy similares).
 *
 * Lo usamos para: <h1>, <h2>, <h3>, nombres de colecciones, precios
 * destacados, cualquier "momento editorial" que pida elegancia.
 *
 * NO lo usamos para: párrafos largos, UI (botones, labels), texto pequeño
 * — la Didone se vuelve difícil de leer a tamaños chicos.
 */
export const playfair = Playfair_Display({
  // Solo cargamos caracteres latinos: español + inglés se cubren con esto.
  // Si algún día necesitas griego, cirílico, etc, agregas el subset aquí.
  subsets: ["latin"],
 
  // Pesos que vamos a usar en la app:
  // 400 = regular (cuerpo si llegara a usarse en serif)
  // 500 = medium (titulares principales — el peso "default" de Katalina)
  // 600 = semibold (énfasis dentro de titulares)
  // 700 = bold (titulares hero muy ocasionales)
  weight: ["400", "500", "600", "700"],
 
  // Esta es la clave: declara una variable CSS que aparecerá en el HTML.
  // En layout.tsx la aplicamos al <html> con `className={playfair.variable}`,
  // y en globals.css la consumimos con `--font-display: var(--font-display)`.
  variable: "--font-display",
 
  // 'swap' = muestra texto inmediatamente con la fuente fallback del sistema,
  // y reemplaza por Playfair cuando carga. Evita FOIT (Flash of Invisible Text)
  // que pasaría con 'block'. La transición es imperceptible al usuario.
  display: "swap",
});
 
/**
 * dmSans — fuente sans-serif para todo el cuerpo, UI y navegación
 * ----------------------------------------------------------------
 * DM Sans tiene la legibilidad de las geométricas modernas (Inter, Helvetica)
 * pero con un toque más cálido y humanista. Es importante esta calidez
 * para que el sitio no se sienta frío/corporativo: estamos vendiendo
 * joyería artesanal mexicana, no software B2B.
 *
 * Por qué NO Inter: aunque es excelente, Inter ya está en literalmente
 * todos lados — usar otra fuente diferenciada le da identidad propia
 * a Katalina sin sacrificar legibilidad.
 *
 * Lo usamos para: párrafos, descripciones de producto, navegación,
 * formularios, botones, labels, footer, todo lo que NO sea heading.
 */
export const dmSans = DM_Sans({
  subsets: ["latin"],
 
  // Más pesos porque la UI los necesita:
  // 300 = light (texto micro como "Envío gratis en compras +$1,000")
  // 400 = regular (cuerpo de texto, default)
  // 500 = medium (énfasis ligero, nombres de producto en cards)
  // 600 = semibold (botones, enlaces de navegación importantes)
  // 700 = bold (precios en cards de producto)
  weight: ["300", "400", "500", "600", "700"],
 
  // Variable CSS para Tailwind. La razón de llamarle "--font-sans" y no
  // "--font-body": es la convención que shadcn/ui espera, así sus componentes
  // (Toast, Dialog, etc.) leen automáticamente esta fuente sin configurar nada.
  variable: "--font-sans",
 
  display: "swap",
});
 
/**
 * NOTA SOBRE EXTENSIBILIDAD
 * -------------------------
 * Si en el futuro necesitas:
 *
 *   - Una fuente monoespaciada (para mostrar SKUs o códigos de producto):
 *     export const jetbrains = JetBrains_Mono({ ..., variable: "--font-mono" });
 *
 *   - Un peso adicional de Playfair para un hero gigante:
 *     Solo agrégalo al array `weight` arriba. next/font solo descarga
 *     los pesos que listas, así que mantener el array corto = bundle más chico.
 *
 *   - Una fuente local (.woff2 propia, ej. el logo tipográfico):
 *     import localFont from "next/font/local";
 *     export const katalinaLogo = localFont({
 *       src: "./fonts/KatalinaScript.woff2",
 *       variable: "--font-logo"
 *     });
 */