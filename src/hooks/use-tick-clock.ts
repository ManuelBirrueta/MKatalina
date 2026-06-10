/**
 * ============================================================================
 * USE TICK CLOCK — KATALINA
 * ============================================================================
 *
 * Hook que dispara re-render del componente cada cierto intervalo.
 *
 * Caso de uso principal: contadores en vivo que dependen de Date.now().
 * Sin este hook, el componente solo recalcula el tiempo cuando algo más
 * cambia (props, otro state), así que el contador se queda congelado.
 *
 * Cómo funciona:
 *   - Mantenemos un state interno (un counter simple)
 *   - Cada `intervalMs` milisegundos, incrementamos el counter
 *   - El cambio de state dispara re-render del componente
 *   - Las funciones que dependen de Date.now() recalculan automáticamente
 *
 * Uso típico:
 *   ```
 *   useTickClock(60_000); // tick cada minuto
 *   const remaining = getTimeRemaining(reservation); // se recalcula al render
 *   ```
 *
 * No necesitamos el valor devuelto por el hook — solo nos importa que
 * dispare el re-render. Por eso devolvemos `void` implícitamente.
 *
 * Performance:
 *   El setInterval se crea una sola vez (useEffect con deps [intervalMs])
 *   y se limpia al desmontar. No hay leaks de memoria. Si el componente
 *   se desmonta antes de un tick pendiente, el cleanup cancela el timer.
 *
 * Importante: cada componente que llama a useTickClock crea su PROPIO
 * timer. Si tienes 10 cards de reservaciones, hay 10 timers. Para
 * volúmenes pequeños (típicamente <50 apartados por usuario) esto es
 * totalmente aceptable. Para volúmenes masivos, un patrón mejor sería
 * un contexto compartido, pero KISS por ahora.
 *
 * Compatibilidad con SSR:
 *   useEffect solo corre en cliente, así que en SSR no se inicia ningún
 *   timer. Esto es correcto — Next.js no necesita "tick" durante el
 *   pre-render server-side.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";

/**
 * @param intervalMs - Intervalo entre ticks en milisegundos. Default 60_000 (1 min).
 *                     Para contadores de "X días Y horas", 1 minuto es suficiente.
 *                     Si necesitas mostrar segundos, pasa 1000.
 */
export function useTickClock(intervalMs: number = 60_000): void {
  /**
   * El state guarda un número arbitrario. No usamos el valor — solo
   * importa que cambie para disparar re-render.
   *
   * Empezamos con 0 y aumentamos en cada tick.
   *
   * Notación `[, setTick]`: ignoramos el valor (primer elemento del array)
   * porque no lo usamos. Solo nos interesa el setter para llamarlo en el
   * interval.
   */
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);
}