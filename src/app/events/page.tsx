import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/shared/Primitives";
import { db } from "@/lib/db";
import PackageList, { type EventPackageDTO } from "@/components/sections/events/PackageList";
import InquiryForm from "@/components/sections/events/InquiryForm";
import CapacityTable from "@/components/sections/events/CapacityTable";
import PastEvents from "@/components/sections/events/PastEvents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events & Catering — Weddings, Feasts, Full Houses",
  description:
    "Garden weddings for 300, corporate mesobs with AV, habesha birthday nights and the eight-seat Ember Room tasting — event packages and catering from Abem, Addis Ababa.",
  openGraph: {
    title: "Events & Catering | Abem Restaurant",
    description: "Weddings, corporate feasts and private tastings — choreographed by the Abem events team.",
    images: [{ url: "/images/events.jpg", width: 1440, height: 720, alt: "A garden wedding feast at Abem" }],
  },
};

function featuresOf(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((f): f is string => typeof f === "string") : [];
}

async function getPackages(): Promise<EventPackageDTO[]> {
  try {
    const rows = await db.eventPackage.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      titleAm: r.titleAm,
      description: r.description,
      capacity: r.capacity,
      priceFrom: r.priceFrom,
      image: r.image,
      features: featuresOf(r.features as unknown),
    }));
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const packages = await getPackages();

  return (
    <main>
      <PageHero
        eyebrow="Events & Catering · ስነ-ሥርዓቶች"
        title="Weddings, feasts, and full-house nights."
        titleAm="የሠርና ሥነ-ሥርዓት አገልግሎት"
        description="Garden weddings for 300, boardroom mesobs with AV, birthday nights under the grass garlands — one events team, one standard of gursha."
        image="/images/events.jpg"
      />

      <section className="container-x py-24 md:py-32" aria-labelledby="packages-heading">
        <SectionHeading
          eyebrow="The Packages · ጥቅሎች"
          title="Pick the fire that fits."
          titleAm="ብርሃንዎ የሚስማማውን ይምረጡ"
          description="Every package is a starting point — menus, music and mesob décor are shaped around your occasion, not the other way round."
        />
        <PackageList packages={packages} />
      </section>

      <section id="inquiry" className="scroll-mt-24 border-y border-gold/10 bg-surface/60 py-24 md:py-32" aria-labelledby="inquiry-heading">
        <div className="container-x">
          <SectionHeading
            eyebrow="Request · ጥያቄ"
            title="Tell us about the occasion."
            titleAm="ስለ ሥነ-ሥርዓትዎ ይንገሩን"
            description="Share the date, the crowd and the mood — our events team replies within one business day with a proposal and a tasting invite."
          />
          <InquiryForm />
        </div>
      </section>

      <section className="container-x py-24 md:py-32" aria-labelledby="capacity-heading">
        <SectionHeading
          eyebrow="The Rooms · ክፍሎች"
          title="Capacity, honestly stated."
          titleAm="አቅም"
          description="Seated counts assume full mesob service; standing counts apply to cocktail-style receptions."
        />
        <CapacityTable />
      </section>

      <PastEvents />
    </main>
  );
}
