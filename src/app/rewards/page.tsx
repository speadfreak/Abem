import type { Metadata } from "next";
import Link from "next/link";
import { Award, Cake, Gift, Sparkles, Users } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import { Reveal } from "@/components/shared/Primitives";
import RewardsPanels from "@/components/rewards/RewardsPanels";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Abem Rewards — Every Birr Comes Back | ሽልማቶች",
    description:
      "Earn Abem points on every order, unlock Bronze to Ember tiers, birthday bonuses and referrals. Join Abem Rewards, Addis Ababa's most generous loyalty table.",
    openGraph: { images: [{ url: "/images/spices.jpg" }] },
  };
}

export default async function RewardsPage() {
  const s = await getSettings();
  const tiers = s.loyalty.tiers;
  const maxMin = Math.max(1, ...tiers.map((t) => t.min));

  const rules: { icon: React.ElementType; title: string; body: string }[] = [
    { icon: Sparkles, title: "Earn on every order", body: `Every 100 ETB earns ${s.loyalty.pointsPer100} points — dine-in, takeaway or delivery. Add your loyalty phone at checkout.` },
    { icon: Cake, title: "Birthday bonus", body: `Your birthday week pays ${s.loyalty.birthdayBonus} bonus points. Add your birthday when you join.` },
    { icon: Users, title: "Bring a friend", body: `Share your referral code — when they join, you both collect ${s.loyalty.referralPoints} points.` },
    { icon: Gift, title: "Spend like cash", body: "Points redeem at the counter against any menu item, buna ceremony or tej flight. They never expire." },
  ];

  return (
    <main>
      <PageHero
        eyebrow="Abem Rewards · ሽልማቶች"
        title="Every birr comes back to you."
        titleAm="ሁሉም ብር ወደ እርስዎ ይመለሳል"
        description="Four tiers, real perks, no fine print. Points land the moment you order — spend them on doro, buna or the chef's table."
        image="/images/spices.jpg"
      />

      {/* Tiers */}
      <section className="container-x py-16" aria-label="Reward tiers">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {tiers.map((t, i) => {
            const pct = Math.round((t.min / maxMin) * 100);
            return (
              <Reveal key={t.name} delay={i * 0.08}>
                <div className="card-elevated card-hover h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                      <Award className="h-3.5 w-3.5" aria-hidden="true" /> {t.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">{t.min.toLocaleString("en-US")} pts</span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-elevated" aria-hidden="true">
                    <div className="h-full rounded-full bg-gradient-to-r from-ember via-gold to-[#f5d47a]" style={{ width: `${Math.max(8, pct)}%` }} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-cream/85">{t.perk}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {i === 0 ? "Auto-enrolled from your first order" : `Unlocks at ${t.min.toLocaleString("en-US")} lifetime points`}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Panels */}
      <section className="container-x pb-16" aria-label="Rewards account">
        <Reveal>
          <RewardsPanels />
        </Reveal>
      </section>

      {/* Rules */}
      <section className="container-x pb-24" aria-label="How rewards work">
        <Reveal>
          <div className="card-elevated p-7 sm:p-10">
            <p className="eyebrow">The rules, plain</p>
            <h2 className="display-2 mt-3 text-cream">How points work.</h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              {rules.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
                      <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-cream">{r.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Questions or a missing point balance? Ask at the host desk or track an order at{" "}
              <Link href="/track" className="text-gold underline-offset-4 hover:underline">/track</Link>. Points post within a minute of checkout.
            </p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
