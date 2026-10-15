/**
 * ============================================================================
 *  MKatalina · Hook: estados / provincias del país elegido · Etapa 7
 * ============================================================================
 *
 *  const { subdivisions, isLoading } = useSubdivisions("US");
 *
 *  Pide a /api/subdivisions (src/app/api/subdivisions/route.ts) la lista de
 *  estados o provincias del país y la guarda en una caché en memoria: si el
 *  cliente cambia de país y regresa, la lista sale al instante sin volver a
 *  pedirla. Lista vacía = el país no tiene lista (el formulario muestra un
 *  campo de texto libre).
 *
 *  Lo usa AddressFields.tsx (checkout y modal de apartados).
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";

/** Caché compartida por toda la página: país → lista. */
const cache = new Map<string, string[]>();

export function useSubdivisions(country: string): {
  subdivisions: string[];
  isLoading: boolean;
} {
  // Resultado guardado por país; si el país cambia, se muestra lo que haya
  // en caché (o lista vacía) mientras llega la respuesta.
  const [loaded, setLoaded] = useState<{ country: string; list: string[] } | null>(null);

  useEffect(() => {
    if (!country || cache.has(country)) return;

    let cancelled = false;
    fetch(`/api/subdivisions?country=${encodeURIComponent(country)}`)
      .then((res) => (res.ok ? res.json() : { subdivisions: [] }))
      .then((data: { subdivisions?: string[] }) => {
        const list = Array.isArray(data.subdivisions) ? data.subdivisions : [];
        cache.set(country, list);
        if (!cancelled) setLoaded({ country, list });
      })
      .catch(() => {
        // Sin conexión: lista vacía → campo de texto libre (el cliente
        // puede seguir escribiendo su estado a mano).
        if (!cancelled) setLoaded({ country, list: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [country]);

  const cached = cache.get(country);
  if (cached) return { subdivisions: cached, isLoading: false };
  if (loaded?.country === country) return { subdivisions: loaded.list, isLoading: false };
  return { subdivisions: [], isLoading: Boolean(country) };
}