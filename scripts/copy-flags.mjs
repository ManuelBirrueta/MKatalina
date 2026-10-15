/**
 * ============================================================================
 *  MKatalina · Copiar banderas a /public/flags · Fase 13 · Etapa 7.1
 * ============================================================================
 *
 *  Copia las banderas de los países (archivos SVG del paquete
 *  "country-flag-icons", licencia MIT) a la carpeta public/flags del
 *  proyecto, para que el sitio las sirva como archivos normales:
 *
 *      public/flags/MX.svg  →  https://mkatalina.com/flags/MX.svg
 *
 *  ¿Por qué archivos sueltos y no importarlas en el código?
 *    Son ~265 banderas (≈180 KB en total). Si se importaran en el código,
 *    TODAS viajarían en el JavaScript del checkout aunque el cliente solo
 *    vea 8. Como archivos sueltos, el navegador descarga solo las que se ven
 *    en pantalla (≈0.7 KB cada una) y las guarda en caché.
 *
 *  Cómo usarlo (una sola vez, desde la carpeta frontend):
 *      npm install -D country-flag-icons
 *      node scripts/copy-flags.mjs
 *
 *  Después se suben a GitHub junto con el resto (git add public/flags).
 *  Solo hay que volver a correrlo si se actualiza el paquete.
 *
 *  Lo usa: CountryFlag.tsx (dibuja <img src="/flags/XX.svg">).
 * ============================================================================
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

// Origen: banderas en proporción 3:2 (la forma clásica de una bandera).
const SOURCE = path.join(process.cwd(), "node_modules", "country-flag-icons", "3x2");
// Destino: carpeta pública de Next.js (todo lo de /public se sirve tal cual).
const TARGET = path.join(process.cwd(), "public", "flags");

if (!existsSync(SOURCE)) {
  console.error(
    "✗ No encontré node_modules/country-flag-icons.\n" +
      "  Corre primero:  npm install -D country-flag-icons\n" +
      "  (y ejecuta este script desde la carpeta frontend).",
  );
  process.exit(1);
}

mkdirSync(TARGET, { recursive: true });

// Copia cada archivo .svg (MX.svg, US.svg, ES.svg…).
const files = readdirSync(SOURCE).filter((name) => name.endsWith(".svg"));
for (const name of files) {
  copyFileSync(path.join(SOURCE, name), path.join(TARGET, name));
}

// La licencia MIT pide conservar el aviso de copyright junto a los archivos.
const license = path.join(SOURCE, "..", "LICENSE");
if (existsSync(license)) {
  copyFileSync(license, path.join(TARGET, "LICENSE.txt"));
}

console.log(`✓ ${files.length} banderas copiadas a public/flags`);
