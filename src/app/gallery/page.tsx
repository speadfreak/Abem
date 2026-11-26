import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import { db } from "@/lib/db";
import GalleryGrid, { type GalleryItemDTO } from "@/components/sections/gallery/GalleryGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery — Inside the Fire",
  description:
    "Doro wot six hours deep, azmari nights, garden weddings and the buna ceremony — photos and films from inside Abem Restaurant, Addis Ababa.",
  openGraph: {
    title: "Gallery — Inside the Fire | Abem Restaurant",
    description: "Photos and films from inside Abem — the dishes, the rooms, the rituals.",
    images: [{ url: "/images/hero-poster.jpg", width: 1440, height: 720, alt: "The grand mesob at Abem" }],
  },
};

async function getGallery(): Promise<GalleryItemDTO[]> {
  try {
    const rows = await db.galleryItem.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true, titleAm: true, category: true, type: true, url: true, thumb: true },
    });
    return rows;
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <main>
      <PageHero
        eyebrow="Gallery · ማዕከለ-ስዕላት"
        title="Inside the fire."
        titleAm="በእሳት ውስጥ"
        description="Doro wot six hours deep, azmari nights, garden weddings and the buna ceremony — the house as it actually looks on an ordinary Tuesday."
      />
      <section className="container-x py-16 md:py-24" aria-label="Photo and video gallery">
        <GalleryGrid items={items} />
      </section>
    </main>
  );
}
