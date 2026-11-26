/* ─────────────────────────────────────────────────────────────
   ABEM NOTIFICATIONS ADAPTER
   Dev implementation logs to console. Production: implement one
   of the adapters below with a provider API key and register it.
   ───────────────────────────────────────────────────────────── */

export type NotificationChannel = "SMS" | "WHATSAPP" | "EMAIL";
export interface NotificationPayload {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface NotificationAdapter {
  id: string;
  send(p: NotificationPayload): Promise<{ ok: boolean; providerId?: string; error?: string }>;
}

/** Default dev adapter — everything lands in the server console. */
export const ConsoleAdapter: NotificationAdapter = {
  id: "console",
  async send(p) {
    console.log(
      `[notify:${p.channel}] → ${p.to} | ${p.subject ?? "-"} | ${p.message.slice(0, 140)}`
    );
    return { ok: true, providerId: `console-${Date.now()}` };
  },
};

/* Production adapters (documented, not active):
 *
 * // SMS via Africa's Talking (popular in Ethiopia):
 * export const AfricaTalkingAdapter: NotificationAdapter = {
 *   id: "africastalking",
 *   async send(p) {
 *     const res = await fetch("https://api.africastalking.com/version1/messaging", {
 *       method: "POST",
 *       headers: {
 *         apiKey: process.env.AT_API_KEY!,
 *         "Content-Type": "application/x-www-form-urlencoded",
 *         Accept: "application/json",
 *       },
 *       body: new URLSearchParams({ username: process.env.AT_USERNAME!, to: p.to, message: p.message }),
 *     });
 *     return res.ok ? { ok: true } : { ok: false, error: await res.text() };
 *   },
 * };
 *
 * // WhatsApp via Meta Cloud API, Email via Resend/SES — same shape.
 */

const active: NotificationAdapter[] = [ConsoleAdapter];

export async function notify(p: NotificationPayload): Promise<void> {
  for (const a of active) {
    try {
      await a.send(p);
    } catch (e) {
      console.error(`[notify:${a.id}] failed`, e);
    }
  }
}

/** Reservation confirmation copy. */
export function reservationMsg(name: string, date: string, time: string, party: number, code: string): string {
  return `Abem Restaurant: ${name}, your table for ${party} on ${date} at ${time} is received (ref ${code}). We will confirm shortly. Mesob awaits!`;
}

/** Order confirmation copy. */
export function orderMsg(name: string, code: string, total: number): string {
  return `Abem Restaurant: thank you ${name}! Order ${code} is received (ETB ${total}). Track it live at /track/${code}`;
}
