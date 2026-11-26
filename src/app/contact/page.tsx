import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import ContactForm from "@/components/sections/contact/ContactForm";
import InfoCards from "@/components/sections/contact/InfoCards";
import BranchMaps from "@/components/sections/contact/BranchMaps";
import FaqTeaser, { type FaqDTO } from "@/components/sections/contact/FaqTeaser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact — Come Find the Fire",
  description:
    "Call, WhatsApp or email Abem Restaurant — Bole flagship and Kazanchis branches, Addis Ababa. Maps, directions, opening hours and a direct line to the events team.",
  openGraph: {
    title: "Contact — Come Find the Fire | Abem Restaurant",
    description: "Maps, directions, hours and a direct line to both Abem branches in Addis Ababa.",
    images: [{ url: "/images/interior.jpg", width: 1440, height: 720, alt: "The Abem dining hall" }],
  },
};

async function getFaqs(): Promise<FaqDTO[]> {
  try {
    return await db.faq.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      take: 3,
      select: { id: true, question: true, answer: true },
    });
  } catch {
    return [];
  }
}

export default async function ContactPage() {
  const s = await getSettings();
  const faqs = await getFaqs();

  return (
    <main>
      <PageHero
        eyebrow="Contact · አግኙን"
        title="Come find the fire."
        titleAm="ይምጡ፣ እሳቱ ይጠብቃል።"
        description="Two houses in Addis Ababa, one front desk. Call, WhatsApp, or just follow the smoke of the flame grill down Bole Road."
        compact
        hours={s.hours}
        holidays={s.holidays}
      />

      <section className="container-x py-16 md:py-24" aria-label="Contact details and form">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <ContactForm />
          <InfoCards />
        </div>
      </section>

      <BranchMaps />

      <section className="container-x pb-24 md:pb-32" aria-label="Frequently asked questions">
        <FaqTeaser faqs={faqs} />
      </section>
    </main>
  );
}
