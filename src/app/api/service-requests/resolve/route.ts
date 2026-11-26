import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Ops: resolve (close) a table service request. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const parsed = (body as { id?: unknown }) ?? {};
  if (typeof parsed.id !== "string" || !parsed.id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 422 });
  }
  const existing = await db.serviceRequest.findUnique({ where: { id: parsed.id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
  if (existing.status === "DONE") return NextResponse.json({ ok: true, already: true });

  await db.serviceRequest.update({
    where: { id: parsed.id },
    data: { status: "DONE", resolvedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
