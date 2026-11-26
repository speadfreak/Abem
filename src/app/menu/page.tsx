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
    hasMenuSection: ["Fasting & Vegan", "Wat & Alicha", "Grill & Tibs", "Kitfo", "Drinks"].map((name) => ({
      "@type": "MenuSection",
      name,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="The Menu · ምናሌ"
        title="Fire, slow-cooked."
        titleAm="ምናሌው"
        description="Every dish on one injera. Prices in Ethiopian Birr. Fasting (Tsom) dishes are a first-class menu, not an afterthought."
        image="/images/dishes/doro-wat.jpg"
        hours={settings.hours}
        holidays={settings.holidays}
      />
      <Suspense fallback={<div className="container-x py-20 text-center text-muted-foreground">Loading the menu…</div>}>
        <MenuExplorer />
      </Suspense>
    </main>
  );
}
