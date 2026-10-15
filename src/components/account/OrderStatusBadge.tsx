/**
 * ============================================================================
 * ORDER STATUS BADGE — MKATALINA · Fase 13 · Etapa 6B (corrección) y 6C
 * ============================================================================
 *
 * Etiqueta con el ESTADO REAL de un pedido, para el cliente. La usan:
 *   - Mis pedidos (lista):  src/app/[locale]/(account)/mis-pedidos/page.tsx
 *   - Detalle del pedido:   src/app/[locale]/(account)/mis-pedidos/[orderId]/page.tsx
 *
 * Por qué existe: la lista mostraba siempre "Confirmado" (texto fijo de la
 * Fase 12, cuando los pedidos aún no tenían estados reales), y el detalle
 * pintaba cualquier estado de verde. Ahora las dos páginas muestran el estado
 * guardado en la base, con un color que lo distingue:
 *
 *   PENDIENTE  → gris     (el pago aún no se confirma)
 *   PAGADO     → verde
 *   PROCESANDO → cobre    (en preparación)
 *   ENVIADO    → cobre
 *   ENTREGADO  → verde
 *   CANCELADO  → rojo
 *
 * Etapa 6C: el verde se escribe directo (#5A8A4F) porque el color "success"
 * nunca se definió en globals.css; las clases bg-success / text-success no
 * pintaban nada. Es el verde que el propio globals.css sugiere en su
 * comentario de colores futuros.
 *
 * Los nombres están pensados para el cliente (por ejemplo, PROCESANDO se
 * muestra como "En preparación"). Bilingüe es/en según el idioma activo.
 * ============================================================================
 */

"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const STATUS: Record<
  string,
  { es: string; en: string; className: string; dotClassName: string }
> = {
  PENDIENTE: {
    es: "Pago pendiente",
    en: "Payment pending",
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  },
  PAGADO: {
    es: "Pagado",
    en: "Paid",
    className: "bg-[#5A8A4F]/10 text-[#5A8A4F]",
    dotClassName: "bg-[#5A8A4F]",
  },
  PROCESANDO: {
    es: "En preparación",
    en: "Being prepared",
    className: "bg-accent/10 text-accent",
    dotClassName: "bg-accent",
  },
  ENVIADO: {
    es: "Enviado",
    en: "Shipped",
    className: "bg-accent/10 text-accent",
    dotClassName: "bg-accent",
  },
  ENTREGADO: {
    es: "Entregado",
    en: "Delivered",
    className: "bg-[#5A8A4F]/10 text-[#5A8A4F]",
    dotClassName: "bg-[#5A8A4F]",
  },
  CANCELADO: {
    es: "Cancelado",
    en: "Cancelled",
    className: "bg-destructive/10 text-destructive",
    dotClassName: "bg-destructive",
  },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  /** Estado tal como está en la base (PAGADO, ENVIADO…). */
  status: string;
  className?: string;
}) {
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "es";
  // Estado desconocido: se muestra tal cual, en gris (no debería pasar).
  const info = STATUS[status] ?? {
    es: status,
    en: status,
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
        "text-xs font-medium whitespace-nowrap",
        info.className,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", info.dotClassName)} />
      {info[lang]}
    </span>
  );
}