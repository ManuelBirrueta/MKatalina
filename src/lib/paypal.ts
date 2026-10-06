/**
 * ============================================================================
 *  MKatalina · Cliente de PayPal (SERVIDOR) · Fase 13 · Etapa 4
 * ============================================================================
 *
 *  Habla con la API REST de PayPal (sandbox) desde el servidor. Tres funciones:
 *    - getAccessToken      : obtiene un token con tus credenciales.
 *    - createPaypalOrderApi: crea una orden de PayPal por un monto (MXN).
 *    - capturePaypalOrderApi: captura (cobra) una orden aprobada.
 *
 *  SOLO SERVIDOR: usa PAYPAL_CLIENT_SECRET, que nunca debe llegar al navegador.
 *  Este archivo se importa únicamente desde acciones de servidor.
 *
 *  SANDBOX: la URL base es la de pruebas (api-m.sandbox.paypal.com). Cuando
 *  pasemos a cobros reales, se cambia a api-m.paypal.com.
 * ============================================================================
 */

const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

/**
 * Obtiene un token de acceso de PayPal (OAuth client_credentials).
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("Faltan credenciales de PayPal (revisa el .env)");
  }

  // Autenticación básica: base64 de "clientId:secret".
  const auth = btoa(`${clientId}:${secret}`);

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo autenticar con PayPal");
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Crea una orden de PayPal por el monto total (en pesos, con 2 decimales).
 * Devuelve el ID de la orden de PayPal.
 */
export async function createPaypalOrderApi(totalPesos: number): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "MXN",
            value: totalPesos.toFixed(2),
          },
        },
      ],
    }),
    cache: "no-store",
  });

  const data = (await res.json()) as { id?: string };
  if (!res.ok || !data.id) {
    throw new Error("No se pudo crear la orden en PayPal");
  }
  return data.id;
}

/**
 * Captura (cobra) una orden de PayPal aprobada por el cliente.
 * Devuelve true solo si el pago quedó COMPLETED.
 */
export async function capturePaypalOrderApi(
  paypalOrderId: string,
): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as { status?: string };
  return res.ok && data.status === "COMPLETED";
}