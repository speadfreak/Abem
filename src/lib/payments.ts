/* ─────────────────────────────────────────────────────────────
   ABEM PAYMENTS — adapter registry (never fake a success).
   COD ships active. To enable Telebirr / CBE Birr / Chapa /
   Santimpay: implement initiate + verify with the provider's
   API, add env keys, register the adapter below. The order
   stays UNPAID until the provider's webhook confirms.
   ───────────────────────────────────────────────────────────── */

export interface PaymentInitiation {
  orderId: string;
  amount: number;
  phone?: string;
  returnUrl: string;
}

export interface PaymentInitiationResult {
  ok: boolean;
  redirectUrl?: string; // hosted checkout / USSD deep link
  instructions?: string;
  error?: string;
}

export interface PaymentAdapter {
  id: string;
  label: string;
  available: boolean; // false shows "coming soon" chip in checkout
  initiate?(p: PaymentInitiation): Promise<PaymentInitiationResult>;
  verify?(providerRef: string): Promise<{ paid: boolean; amount?: number }>;
}

export const CashOnDeliveryAdapter: PaymentAdapter = {
  id: "COD",
  label: "Cash on delivery / at the table",
  available: true,
  async initiate(p) {
    return {
      ok: true,
      instructions: "Pay in cash when your order arrives. Change will be prepared for ETB rounds.",
    };
  },
};

/* Reference shapes for production integrations:
 *
 * export const TelebirrAdapter: PaymentAdapter = {
 *   id: "TELEBIRR", label: "Telebirr", available: false,
 *   async initiate(p) {
 *     // 1. POST /payment/preorder on Ethio Telecom gateway with appid + publicKey
 *     // 2. Encrypt payload (RSA), receive checkout URL, return { redirectUrl }
 *     return { ok: false, error: "Not configured" };
 *   },
 *   async verify(ref) { /* webhook callback: verify sign, return paid *\/ },
 * };
 *
 * export const ChapaAdapter: PaymentAdapter = {
 *   id: "CHAPA", label: "Chapa", available: false,
 *   async initiate(p) {
 *     // POST https://api.chapa.co/v1/transaction/initialize (Bearer CHAPA_SECRET_KEY)
 *     // return { redirectUrl: data.checkout_url }
 *   },
 * };
 *
 * CBE Birr & Santimpay follow the same initiate/verify contract.
 */

export const PAYMENT_ADAPTERS: PaymentAdapter[] = [CashOnDeliveryAdapter];

export function findAdapter(id: string): PaymentAdapter | undefined {
  return PAYMENT_ADAPTERS.find((a) => a.id === id);
}

export function availableMethods(): { id: string; label: string; available: boolean }[] {
  const upcoming: { id: string; label: string; available: boolean }[] = [
    { id: "TELEBIRR", label: "Telebirr", available: false },
    { id: "CBE_BIRR", label: "CBE Birr", available: false },
    { id: "CHAPA", label: "Chapa", available: false },
    { id: "SANTIMPAY", label: "Santimpay", available: false },
  ];
  return [...PAYMENT_ADAPTERS.map((a) => ({ id: a.id, label: a.label, available: a.available })), ...upcoming];
}
