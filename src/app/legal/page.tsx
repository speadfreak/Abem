import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy & Terms",
  description: "Privacy policy, terms of service and cookie notice for Abem Restaurant, Addis Ababa.",
};

const SECTIONS: { id: string; title: string; body: string[] }[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    body: [
      "Abem Restaurant (\"Abem\", \"we\"), located on Bole Road, Addis Ababa, collects only what we need to cook for you: your name, phone number, delivery address and order history when you order online or join Abem Rewards; reservation details when you book a table; and application details when you apply for a role.",
      "We use your details to prepare and deliver your order, send order confirmations by SMS, calculate loyalty points, and contact you about your visit. We never sell your data, and we do not send marketing you have not asked for.",
      "Payments made in cash are recorded only as amounts; we do not store card numbers anywhere on our systems. Delivery proof codes (OTP) are shared with you and your rider only, and expire with the order.",
      "You can ask us to correct or delete your data at any time by emailing hello@abemrestaurant.et or calling the front desk. We will action it within 7 days. Order records we must keep for accounting are anonymised after 24 months.",
    ],
  },
  {
    id: "terms",
    title: "Terms of Service",
    body: [
      "Ordering. Prices on the site are in Ethiopian Birr (ETB) and include VAT where applicable. An order is accepted once you receive your ABM order code. In the rare case a dish is 86'd after you order, we will call you to swap or refund that line.",
      "Delivery. Delivery zones and fees are shown at checkout. A rider proof code is issued for every delivery — hand it over only when your food is physically in your hands. Undeliverable addresses (rider cannot reach you by phone) are returned to the kitchen; the food is re-cooked and re-delivered at a repeat delivery fee.",
      "Tables & QR ordering. Ordering from a table QR is binding like any order; service requests (waiter, bill, water) are handled by the floor team in order of arrival. Please settle bills at the table or counter before leaving.",
      "Rewards. Abem Rewards points are earned on completed orders, have no cash value, cannot be transferred, and are void where abused (self-referrals, refund cycling). Birthday bonuses are issued once per calendar year on the phone number on file.",
      "Cancellations. Dine-in and takeaway orders can be cancelled free within 3 minutes of placement, before the kitchen fires the ticket — track your order and call the desk. Delivered orders past 3 minutes may incur cost recovery for prepared items.",
    ],
  },
  {
    id: "cookies",
    title: "Cookie Notice",
    body: [
      "We use a small number of cookies and browser storage entries to make the site work: your language preference and cart are stored locally on your device (\"abem_lang\", \"abem_cart\") and are never sent to us until you actually place an order.",
      "Signed-in staff use a session cookie (\"abem_session\") to keep the operations boards secure. We do not run advertising or third-party tracking cookies, and nothing on this site follows you around the internet.",
      "Clearing your browser storage removes your cart and language choice — nothing else breaks.",
    ],
  },
];

export default function LegalPage() {
  return (
    <main>
      <PageHero
        eyebrow="The paperwork · ሕግጋት"
        title="Privacy & terms, in plain words."
        description="Short, honest and readable — the same care we put into the berbere, put into your data."
        compact
      />

      <section className="container-tight pb-28 pt-4">
        {/* Anchor nav */}
        <nav aria-label="Legal sections" className="mb-12 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex h-10 items-center rounded-full border border-gold/25 bg-card px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-cream/75 transition-all hover:border-gold/60 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">Last updated: January 2025 · Abem Restaurant, Bole Road, Addis Ababa, Ethiopia</p>

        <div className="mt-10 space-y-14">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} aria-label={s.title} className="scroll-mt-32">
              <h2 className="display-2 text-cream">{s.title}</h2>
              <div className="mt-6 space-y-5">
                {s.body.map((p, i) => (
                  <p key={i} className="font-sans text-[1.02rem] leading-[1.85] text-foreground/85">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="card-elevated mt-16 p-6 sm:p-8">
          <h2 className="display-3 text-cream">Questions?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Write to <a href="mailto:hello@abemrestaurant.et" className="text-gold underline-offset-4 hover:underline">hello@abemrestaurant.et</a> with the subject
            &ldquo;Privacy&rdquo; or &ldquo;Terms&rdquo;, or call the front desk on +251 911 234 567 during opening hours. A human — usually Wubet — answers within two working days.
          </p>
        </div>
      </section>
    </main>
  );
}
