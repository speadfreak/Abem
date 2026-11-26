/* In-memory sliding-window rate limiter.
   NOTE: per-instance only — acceptable for the single-region deployment;
   swap for Upstash Redis in multi-instance production (interface compatible). */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > opts.limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: opts.limit - b.count, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

/** Standard guard for public POST endpoints. */
export function guardForm(
  req: Request,
  formKey: string,
  limit = 6,
  windowMs = 60_000
): { ok: boolean; response?: Response } {
  const ip = clientIp(req);
  const rl = rateLimit(`${formKey}:${ip}`, { limit, windowMs });
  if (!rl.ok) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Too many requests. Please try again in a moment." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      ),
    };
  }
  return { ok: true };
}
