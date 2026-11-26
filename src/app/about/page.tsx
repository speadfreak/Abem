import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/shared/Primitives";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import StoryTimeline from "@/components/sections/about/StoryTimeline";
import ValuesRow from "@/components/sections/about/ValuesRow";
import TeamGrid, { type TeamMemberDTO } from "@/components/sections/about/TeamGrid";
import HeritagePanels from "@/components/sections/about/HeritagePanels";
import AwardsStrip from "@/components/sections/about/AwardsStrip";
import CultureCarousel from "@/components/sections/about/CultureCarousel";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const seo = s.seo?.about;
  return {
    title: "Our Story — Fifteen Years of Fire",
    description:
      seo?.description ||
      "From a four-table injera bet on a Bole side street to Addis Ababa's flagship Ethiopian dining house — the Abem story, told in fire and slow sauce.",
    openGraph: {
      title: "Our Story — Fifteen Years of Fire | Abem Restaurant",
      description: "Fifteen years of slow fire, real spices and gursha hospitality in Addis Ababa.",
      images: [{ url: seo?.ogImage || "/images/interior.jpg", width: 1440, height: 720, alt: "Inside the Abem dining hall" }],
    },
  };
}

async function getTeam(): Promise<TeamMemberDTO[]> {
  try {
    const rows = await db.teamMember.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, nameAm: true, role: true, bio: true, photo: true },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, nameAm: r.nameAm, role: r.role, bio: r.bio, photo: r.photo }));
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const team = await getTeam();

  return (
    <main>
      <PageHero
        eyebrow="Our Story · ታሪካችን"
        title="From four tables to the heart of Addis."
        titleAm="ከአራት ሰሌዳዎች እስከ አዲስ አበባ ልብ"
        description="Fifteen years ago, Abem opened on a quiet Bole side street — four tables, one clay mitad and a doro wot that took six hours. It still does."
        image="/images/interior.jpg"
      />

      <StoryTimeline />

      <section className="container-x py-24 md:py-32" aria-labelledby="philosophy-heading">
        <SectionHeading
          eyebrow="The Philosophy · ፍልስፍናችን"
          title="Three things we refuse to rush."
          titleAm="ሶስት ነገሮች አንቆጥስም"
          description="Everything at Abem moves at the speed of the fire — because flavor, like friendship, is not something you can hurry."
        />
        <ValuesRow />
      </section>

      <CultureCarousel />

      <section className="container-x py-24 md:py-32" aria-labelledby="team-heading">
        <SectionHeading
          eyebrow="Chef & Team · ሼፍና ቡድን"
          title="The hands behind the fire."
          titleAm="እሳቱን የሚያስተናግዱ እጆች"
          description="A kitchen run like a family compound: one executive chef who guards the recipes, a grill whisperer, a buna host with infinite patience, and a floor that runs on gursha."
        />
        <TeamGrid members={team} />
      </section>

      <section className="py-24 md:py-32 bg-surface/60 border-y border-gold/10" aria-labelledby="heritage-heading">
        <div className="container-x">
          <SectionHeading
            eyebrow="Heritage · ቅርስ"
            title="Kept alive, one ritual at a time."
            titleAm="በባህል የተጠበቀ ቅርስ"
            description="Ethiopian dining is a chain of rituals — bread, coffee, spice. At Abem, each one is performed the old way, in front of you."
          />
          <HeritagePanels />
        </div>
      </section>

      <AwardsStrip />
    </main>
  );
}
