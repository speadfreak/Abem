import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import { guardForm } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = guardForm(req, "login", 6, 60_000);
  if (!g.ok) return g.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 422 });

  const user = await db.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.active) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

  const token = await signSession({ id: user.id, email: user.email, name: user.name, role: user.role as "OWNER" | "MANAGER" | "STAFF" });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
