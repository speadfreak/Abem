export function formatETB(n: number): string {
  return `ETB ${Math.round(n).toLocaleString("en-US")}`;
}

export function formatPriceShort(n: number): string {
  return `${Math.round(n).toLocaleString("en-US")} ETB`;
}

export function formatDateLong(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function minutesSince(iso: string | Date): number {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
}

export function whatsappLink(phone: string, text: string): string {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mapsDirectionsLink(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function orderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `ABM-${s}`;
}

export function reservationCode(): string {
  return `RES-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function referralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "ABEM";
  return `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function otp4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  return lines.join("\n");
}

export const STATUS_FLOW = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"] as const;

export function nextStatus(status: string): string | null {
  const idx = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NEW: "New ticket",
    PREPARING: "In the fire",
    READY: "Ready",
    OUT_FOR_DELIVERY: "On the way",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    PENDING: "Pending review",
    CONFIRMED: "Confirmed",
    DECLINED: "Declined",
    SEATED: "Seated",
  };
  return map[status] ?? status;
}
