import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { rewardsJoinSchema } from "@/lib/validation";
import { guardForm } from "@/lib/rate-limit";
import { referralCode } from "@/lib/format";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function tierFor(lifetime: number, tiers: { name: string; min: number; perk: string }[]): { name: string; perk: string } {
  let current = tiers[0] ?? { name: "Bronze", min: 0, perk: "" };
  for (const t of tiers) if (lifetime >= t.min) current = t;
  return { name: current.name, perk: current.perk };
}

export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone");
  if (!phone) return NextResponse.json({ ok: false, error: "phone required" }, { status: 400 });
  const s = await getSettings();
  const member = await db.loyaltyMember.findUnique({ where: { phone } });
  if (!member) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const tier = tierFor(member.lifetime, s.loyalty.tiers);
  const nextTier = s.loyalty.tiers.find((t) => t.min > member.lifetime);
  return NextResponse.json({
    ok: true,
    member: {
      name: member.name,
      phone: member.phone,
      points: member.points,
      lifetime: member.lifetime,
      tier: member.tier || tier.name,
      perk: tier.perk,
      nextTier: nextTier ? { name: nextTier.name, at: nextTier.min } : null,
      referralCode: member.referralCode,
      birthday: member.birthday,
    },
  });
}

export async function POST(req: Request) {
  const g = guardForm(req, "rewards", 5);
  if (!g.ok) return g.response;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const parsed = rewardsJoinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 422 });
  const d = parsed.data;

  let referredBy: string | undefined;
  if (d.referral) {
    const referrer = await db.loyaltyMember.findUnique({ where: { referralCode: d.referral } });
    if (referrer) {
      referredBy = d.referral;
      await db.loyaltyMember.update({
        where: { id: referrer.id },
        data: { points: { increment: (await getSettings()).loyalty.referralPoints }, lifetime: { increment: (await getSettings()).loyalty.referralPoints } },
      });
    }
  }

  const existing = await db.loyaltyMember.findUnique({ where: { phone: d.phone } });
  if (existing) {
    return NextResponse.json({ ok: true, member: existing, existing: true });
  }
  const s = await getSettings();
  const member = await db.loyaltyMember.create({
    data: {
      phone: d.phone,
      name: d.name,
      birthday: d.birthday || null,
      referredBy,
      referralCode: referralCode(d.name),
      points: d.birthday ? 0 : 0,
    },
  });
  return NextResponse.json({ ok: true, member, bonusNote: d.birthday ? `Birthday bonus unlocks ${s.loyalty.birthdayBonus} points in your birthday week.` : undefined });
}
