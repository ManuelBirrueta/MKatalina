/**
 * ============================================================================
 *  MKatalina · API: estados / provincias de un país · Fase 13 · Etapa 7
 * ============================================================================
 *
 *  GET /api/subdivisions?country=US
 *    → { "subdivisions": ["Alabama", "Alaska", …] }
 *
 *  La usa el formulario de dirección (hook useSubdivisions) cada vez que el
 *  cliente elige un país, para llenar la lista de estados o provincias.
 *
 *  ¿Por qué una ruta del servidor y no importar la lista en el navegador?
 *  La base de datos de estados de TODOS los países (librería
 *  country-state-city) pesa varios megas. Con esta ruta el navegador solo
 *  descarga la lista del país elegido (unos cuantos KB), y la respuesta se
 *  guarda en caché un día (los estados de un país no cambian).
 *
 *  México usa la lista oficial de 32 estados en español
 *  (src/data/mexican-states.ts), igual que siempre. Para los demás países,
 *  los nombres vienen de la librería (en inglés o en su idioma local).
 *  Si un país no tiene lista, devuelve una lista vacía y el formulario
 *  muestra un campo de texto libre.
 *
 *  Esta ruta no pasa por el middleware de idiomas (el matcher de
 *  src/proxy.ts excluye /api).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { State } from "country-state-city";
import { MEXICAN_STATES } from "@/data/mexican-states";
import { isCountryCode } from "@/lib/countries";

export function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country")?.toUpperCase() ?? "";

  if (!isCountryCode(country)) {
    return NextResponse.json({ subdivisions: [] }, { status: 400 });
  }

  const subdivisions =
    country === "MX"
      ? [...MEXICAN_STATES]
      : State.getStatesOfCountry(country)
          .map((s) => s.name)
          .sort((a, b) => a.localeCompare(b));

  return NextResponse.json(
    { subdivisions },
    {
      headers: {
        // Un día en el navegador y en la CDN; los estados no cambian.
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    },
  );
}