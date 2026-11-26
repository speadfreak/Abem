import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/shared/Primitives";
import { db } from "@/lib/db";
import RitualSections from "@/components/sections/experience/RitualSections";
import SpecialsCalendar from "@/components/sections/experience/SpecialsCalendar";
import VenueTour from "@/components/sections/experience/VenueTour";
import ExperienceFaq, { type FaqDTO } from "@/components/sections/experience/ExperienceFaq";
import CtaBand from "@/components/sections/experience/CtaBand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Experience — Buna, Gursha & Azmari Nights",
  description:
    "Coffee roasted at your table, gursha shared by hand, azmari music on Fridays and tej in the berele — the full Ethiopian evening, at Abem, Addis Ababa.",
  openGraph: {
    title: "The Experience — Buna, Gursha & Azmari Nights | Abem Restaurant",
    description: "The full Ethiopian evening: buna ceremony, gursha, azmari nights and house-brewed tej.",
    images: [{ url: "/images/music.jpg", width: 1440, height: 720, alt: "Azmari band night at Abem" }],
  },
};

async function getFaqs(): Promise<FaqDTO[]> {
  try {
    const rows = await db.faq.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, question: true, answer: true },
    });
    return rows;
  } catch {
    return [];
  }
}

export default async function ExperiencePage() {
  const faqs = await getFaqs();

  return (
    <main>
      <PageHero
        eyebrow="The Experience · ልምዱ"
        title="An evening at Abem."
        titleAm="አንድ ምሽት በአቤም"
        description="Three hours, four rituals, one long table. Here is how an Ethiopian evening unfolds when nobody is watching the clock."
        image="/images/music.jpg"
      />

      <RitualSections />

      <section className="py-24 md:py-32 bg-surface/60 border-y border-gold/10" aria-labelledby="specials-heading">
        <div className="container-x">
          <SectionHeading
            eyebrow="This Month · የወሩ ልዩ ምሽቶች"
            title="The monthly specials calendar."
            titleAm="የወር መርሃ ግብር"
            description="Recurring rituals and festival feasts, month by month. Reserve early — the long tables fill fast."
          />
          <SpecialsCalendar />
        </div>
      </section>

      <VenueTour />

      <ExperienceFaq faqs={faqs} />

      <CtaBand />
    </main>
  );
}
