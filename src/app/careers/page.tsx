import type { Metadata } from "next";
import { Briefcase, MapPin, UtensilsCrossed } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import { Reveal } from "@/components/shared/Primitives";
import CareersForm from "@/components/careers/CareersForm";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Careers — Work the Fire | ሥራ መደቦች",
    description:
      "Join Abem Restaurant in Addis Ababa: kitchen, floor, pastry and buna roles. Free shift meals, buna masterclasses and tej Fridays for the whole team.",
    openGraph: { images: [{ url: "/images/chef.jpg" }] },
  };
}

const TYPE_STYLE: Record<string, string> = {
  FULL_TIME: "border-gold/50 bg-gold/15 text-gold",
  PART_TIME: "border-highland/50 bg-highland/15 text-[#8fd0a0]",
  SEASONAL: "border-ember/50 bg-ember/15 text-ember",
};

const PERKS: { title: string; body: string }[] = [
  { title: "Free shift meal", body: "Every shift ends with a full buna break and a plate off the family menu." },
  { title: "Buna masterclasses", body: "Monthly roasting and ceremony workshops led by our own buna masters." },
  { title: "Staff tej Fridays", body: "First Friday of the month, the tej bar opens for the team and their families." },
];

function typeLabel(t: string): string {
  return t.replace(/_/g, " ");
}

export default async function CareersPage() {
  const s = await getSettings();
  let openings: Awaited<ReturnType<typeof fetchOpenings>> = [];
  try {
    openings = await fetchOpenings();
  } catch {
    openings = [];
  }

  return (
    <main>
      <PageHero
        eyebrow="Careers · ሥራ መደቦች"
        title="Work the fire."
        titleAm="ከእሳቱ ጋር ይሥሩ"
        description="A family kitchen in the heart of Addis. We hire for attitude and teach the craft — from the mitad station to the tej bar."
        image="/images/chef.jpg"
      />

      <section className="container-x py-16" aria-label="Open positions">
        {openings.length === 0 ? (
          <div className="card-elevated flex flex-col items-center gap-4 py-16 text-center" role="status">
            <UtensilsCrossed className="h-10 w-10 text-gold/30" aria-hidden="true" />
            <h2 className="display-3 text-cream">No openings posted right now</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              We are always glad to meet good people. Send a general application and we will keep you first in line.
            </p>
            <div className="mt-2">
              <CareersForm openings={[]} label="Send a general application" />
            </div>
          </div>
        ) : (
          <>
            <Reveal>
              <p className="eyebrow">{openings.length} open {openings.length === 1 ? "role" : "roles"}</p>
              <h2 className="display-2 mt-3 text-cream">Where do you burn brightest?</h2>
            </Reveal>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {openings.map((o, i) => (
                <Reveal key={o.id} delay={Math.min(i * 0.06, 0.25)}>
                  <div className="card-elevated card-hover flex h-full flex-col p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${TYPE_STYLE[o.type] ?? "border-cream/25 text-cream/75"}`}>
                        {typeLabel(o.type)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-gold" aria-hidden="true" /> {o.location}
                      </span>
                    </div>
                    <h3 className="display-3 mt-4 text-cream">{o.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{o.description}</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> Based at Bole Road, Addis Ababa
                      </span>
                      <CareersForm
                        openings={openings.map((x) => ({ id: x.id, title: x.title, type: x.type, location: x.location }))}
                        defaultOpeningId={o.id}
                      />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-8">
              <CareersForm
                openings={openings.map((x) => ({ id: x.id, title: x.title, type: x.type, location: x.location }))}
                label="Send a general application"
                className="btn-ghost"
              />
            </div>
          </>
        )}
      </section>

      {/* Perks */}
      <section className="container-x pb-24" aria-label="Team perks">
        <Reveal>
          <div className="card-elevated p-7 sm:p-10">
            <p className="eyebrow">Why the team stays</p>
            <h2 className="display-2 mt-3 text-cream">Fed, taught, toasted.</h2>
            <div className="mt-7 grid gap-6 md:grid-cols-3">
              {PERKS.map((p, i) => (
                <div key={p.title} className="rounded-2xl border border-gold/15 bg-elevated p-5">
                  <span className="font-display text-3xl font-semibold text-gold/40" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 text-[15px] font-semibold text-cream">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Prefer to talk first? Call {s.contact.phone} and ask for the floor manager.
            </p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

async function fetchOpenings() {
  return db.careerOpening.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, title: true, type: true, location: true, description: true },
  });
}
