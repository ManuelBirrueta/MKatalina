/**
 * ============================================================================
 * SHIPMENT FORM — MKATALINA · Fase 13 · Etapa 6B
 * ============================================================================
 *
 * Formulario "Marcar como enviado" del panel: paquetería, número de guía y
 * casilla "Avisar al cliente por correo". Lo usan dos páginas, que lo
 * muestran desplegado debajo de la fila correspondiente:
 *   - Pedidos   (src/app/[locale]/admin/page.tsx)            → shipOrder
 *   - Apartados (src/app/[locale]/admin/apartados/page.tsx)  → shipReservation
 *
 * Este componente NO guarda nada por sí mismo: revisa los datos con las
 * mismas reglas del servidor (parseShipmentInput, src/lib/shipping-carriers.ts)
 * y se los pasa a la página con onSubmit. La página llama a la acción y
 * actualiza su tabla.
 *
 * Bilingüe (es/en) como el resto del panel de pedidos y apartados.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import {
  CARRIERS,
  CARRIER_IDS,
  parseShipmentInput,
  type CarrierId,
  type ShipmentData,
} from "@/lib/shipping-carriers";
import { cn } from "@/lib/utils";

const COPY = {
  es: {
    carrier: "Paquetería",
    tracking: "Número de guía",
    trackingPlaceholder: "Ej. 1234567890",
    noTracking: "La entrega local no lleva número de guía.",
    notify: "Avisar al cliente por correo",
    save: "Guardar envío",
    saving: "Guardando…",
    cancel: "Cancelar",
    invalid: "Escribe un número de guía válido (letras, números o guiones; de 5 a 40 caracteres).",
  },
  en: {
    carrier: "Carrier",
    tracking: "Tracking number",
    trackingPlaceholder: "e.g. 1234567890",
    noTracking: "Local delivery has no tracking number.",
    notify: "Email the customer",
    save: "Save shipment",
    saving: "Saving…",
    cancel: "Cancel",
    invalid: "Enter a valid tracking number (letters, numbers or hyphens; 5 to 40 characters).",
  },
} as const;

export function ShipmentForm({
  lang,
  title,
  initialCarrier,
  initialTracking,
  defaultNotify,
  onSubmit,
  onCancel,
}: {
  lang: "es" | "en";
  /** Título del bloque (ej. "Marcar como enviado"). */
  title: string;
  initialCarrier?: string | null;
  initialTracking?: string | null;
  /** Marcado al enviar por primera vez; desmarcado al corregir una guía. */
  defaultNotify: boolean;
  /** Guarda; devuelve true si salió bien (entonces la página cierra el bloque). */
  onSubmit: (shipment: ShipmentData, notify: boolean) => Promise<boolean>;
  onCancel: () => void;
}) {
  const t = COPY[lang];

  const [carrier, setCarrier] = useState<CarrierId>(
    CARRIER_IDS.includes(initialCarrier as CarrierId)
      ? (initialCarrier as CarrierId)
      : "estafeta",
  );
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [notify, setNotify] = useState(defaultNotify);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsTracking = CARRIERS[carrier].needsTracking;

  const handleSave = async () => {
    // Mismas reglas que el servidor: si no pasan aquí, no se manda nada.
    const shipment = parseShipmentInput({ carrier, trackingNumber: tracking });
    if (!shipment) {
      setError(t.invalid);
      return;
    }
    setError(null);
    setSaving(true);
    await onSubmit(shipment, notify);
    setSaving(false);
  };

  return (
    <div className="rounded-md border border-border bg-background p-4 space-y-3 max-w-xl">
      <p className="text-xs uppercase tracking-[0.15em] font-medium">{title}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium">
          {t.carrier}
          <select
            value={carrier}
            onChange={(e) => {
              setCarrier(e.target.value as CarrierId);
              setError(null);
            }}
            disabled={saving}
            className="mt-1 block h-9 w-full px-2 rounded-md border border-input bg-background text-sm cursor-pointer"
          >
            {CARRIER_IDS.map((id) => (
              <option key={id} value={id}>
                {CARRIERS[id].label[lang]}
              </option>
            ))}
          </select>
        </label>

        {needsTracking ? (
          <label className="block text-xs font-medium">
            {t.tracking}
            <input
              type="text"
              value={tracking}
              onChange={(e) => {
                setTracking(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
              placeholder={t.trackingPlaceholder}
              disabled={saving}
              maxLength={60}
              className={cn(
                "mt-1 block h-9 w-full px-2 rounded-md border bg-background text-sm font-mono",
                "focus:outline-none focus:border-ring",
                error ? "border-destructive" : "border-input",
              )}
            />
          </label>
        ) : (
          <p className="text-xs text-muted-foreground self-end pb-2">{t.noTracking}</p>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          disabled={saving}
          className="h-4 w-4 accent-accent"
        />
        {t.notify}
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t.saving : t.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-9 px-4 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-50"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}