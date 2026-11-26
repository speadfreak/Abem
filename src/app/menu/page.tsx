import type { Metadata } from "next";
import { Suspense } from "react";
import MenuExplorer from "@/components/menu/MenuExplorer";
import PageHero from "@/components/shared/PageHero";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const seo = s.seo?.menu ?? { title: "The Menu", description: "", ogImage: "" };
  return {
    title: seo.title,
    description: seo.description,
    openGraph: { images: seo.ogImage ? [{ url: seo.ogImage }] : undefined },
  };
}

export default async function MenuPage() {
  const settings = await getSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Abem Restaurant Menu",
    hasMenuSection: ["Burgers", "Wood-Fired Pizza", "Shawarma & Wraps", "Fried & Grilled Chicken", "Sandwiches", "Sides & Bites", "Ethiopian Heritage", "Drinks", "Desserts"].map((name) => ({
      "@type": "MenuSection",
      name,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="The Menu · ምናሌ"
        title="Fire-kissed, hand-built."
        titleAm="ምናሌው"
        description="Flame-grilled burgers, wood-fired pizza, shawarma carved to order and crispy golden chicken — with our Ethiopian heritage woven through. Prices in Ethiopian Birr."
        image="/images/dishes/burger.jpg"
        hours={settings.hours}
        holidays={settings.holidays}
      />
      <Suspense fallback={<div className="container-x py-20 text-center text-muted-foreground">Loading the menu…</div>}>
        <MenuExplorer />
      </Suspense>
    </main>
  );
}
