/* ABEM — robust public site URL resolution.
   Tolerates NEXT_PUBLIC_SITE_URL values without a protocol (e.g. "abem-one.vercel.app")
   and never throws during static generation. */

function normalize(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

/** Absolute site origin, safe for metadataBase / sitemap / robots / QR codes. */
export function getSiteUrl(): string {
  const fromEnv = normalize(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    const fromVercel = normalize(process.env.VERCEL_URL);
    if (fromVercel) return fromVercel;
  }
  return "http://localhost:3000";
}
