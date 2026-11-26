import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toCSV } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
    const rows = subs.map((s) => ({ email: s.email, subscribedAt: s.createdAt.toISOString() }));
    const csv = rows.length ? toCSV(rows) : "email,subscribedAt\n";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="abem-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("[admin/newsletter-csv]", err);
    return NextResponse.json({ ok: false, error: "Export failed" }, { status: 500 });
  }
}
