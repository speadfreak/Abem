import { db } from "@/lib/db";
import { serviceRequestSchema } from "@/lib/validation";
import { guardForm } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Table QR: call waiter / request bill / water. */
export async function POST(req: Request) {
  const g = guardForm(req, "service-req", 10);
  if (!g.ok) return g.response;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }
  const parsed = serviceRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 422 });
  const table = await db.diningTable.findUnique({ where: { qrToken: parsed.data.tableToken } });
  if (!table) return NextResponse.json({ ok: false, error: "Unknown table" }, { status: 422 });

  await db.serviceRequest.create({
    data: { tableToken: table.qrToken, tableLabel: table.label, type: parsed.data.type },
  });
  return NextResponse.json({ ok: true, label: table.label });
}
