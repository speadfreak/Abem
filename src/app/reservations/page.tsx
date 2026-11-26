import type { Metadata } from "next";
import ReservationWizard from "@/components/reservations/ReservationWizard";
import PageHero from "@/components/shared/PageHero";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const seo = s.seo?.reservations ?? { title: "Reserve a Table", description: "", ogImage: "" };
  return { title: seo.title, description: seo.description, openGraph: { images: seo.ogImage ? [{ url: seo.ogImage }] : undefined } };
}

export default async function ReservationsPage() {
  const s = await getSettings();
  return (
    <main>
      <PageHero
        eyebrow="Reservations · ቦታ ማስያዝ"
        title="Your table is warm."
        titleAm="ሰሌዳ ያስይዙ"
        description="Live availability across the dining hall, garden and VIP booths. Confirmation by SMS within the hour."
        image="/images/interior.jpg"
        hours={s.hours}
        holidays={s.holidays}
      />
      <section className="container-x pb-28">
        <ReservationWizard />
      </section>
    </main>
  );
}
