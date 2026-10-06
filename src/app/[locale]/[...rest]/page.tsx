/**
 * ============================================================================
 * CATCH-ALL 404 — MKATALINA · Fase 13 · Mantenimiento
 * ============================================================================
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ---------------------------
 * En Next.js, un not-found.tsx dentro de un segmento dinámico ([locale]) SOLO
 * se activa cuando se llama a notFound() desde una ruta existente. Para una URL
 * que no coincide con NINGUNA ruta (ej. /en/pagina-inexistente), Next no sabe a
 * qué locale pertenecería y cae al 404 RAÍZ (que no tiene <html>/<body>) → crash.
 *
 * Esta ruta "atrapa todo" ([...rest] = cualquier cantidad de segmentos bajo
 * [locale]) y simplemente llama a notFound(). Con eso:
 *   1) La URL inexistente SÍ coincide con una ruta → se renderiza el layout de
 *      [locale] (que tiene <html>/<body>, Header y Footer).
 *   2) notFound() dispara el [locale]/not-found.tsx, que se muestra DENTRO de
 *      ese layout → 404 bonito, sin crash.
 *
 * PRIORIDAD DE RUTAS
 * ------------------
 * Las rutas específicas (aretes, perfil, checkout, etc.) SIEMPRE ganan sobre
 * esta catch-all, así que las páginas reales no se ven afectadas: aquí solo
 * caen las URLs que no coinciden con nada.
 * ============================================================================
 */

import { notFound } from "next/navigation";

export default function CatchAllNotFound() {
  // Convierte cualquier ruta inexistente bajo /es o /en en un 404 localizado.
  notFound();
}