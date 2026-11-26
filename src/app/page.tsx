import Hero from "@/components/sections/home/Hero";
import {
  SignatureBand,
  StorySection,
  FeaturedCarousel,
  ChefSpotlight,
  ExperienceBento,
  Testimonials,
  FlowTeaser,
  GalleryStrip,
  CtaBand,
} from "@/components/sections/home/Sections";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    db.menuItem.findMany({ where: { isFeatured: true, available: true }, orderBy: { order: "asc" }, take: 9 }),
    getSettings(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.site.name,
    image: settings.hero.posterUrl,
    servesCuisine: ["Ethiopian", "Horn of Africa"],
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.contact.address,
      addressLocality: "Addis Ababa",
      addressCountry: "ET",
    },
    telephone: settings.contact.phone,
    email: settings.contact.email,
    acceptsReservations: "True",
    openingHoursSpecification: Object.entries(settings.hours).map(([day, h]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
      opens: h.open,
      closes: h.close,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <SignatureBand names={featured.map((f) => f.name)} />
      <StorySection stats={settings.stats} />
      <FeaturedCarousel
        dishes={featured.map((f) => ({
          ...f,
          nameAm: f.nameAm ?? undefined,
          description: f.description ?? undefined,
          image: f.image ?? undefined,
        }))}
      />
      <ChefSpotlight />
      <ExperienceBento />
      <FlowTeaser />
      <Testimonials />
      <GalleryStrip />
      <CtaBand phone={settings.contact.phone} />
    </main>
  );
}
