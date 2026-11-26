"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Users, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";
import { formatETB } from "@/lib/format";
import { cn } from "@/lib/utils";

export type EventPackageDTO = {
  id: string;
  slug: string;
  title: string;
  titleAm: string | null;
  description: string;
  capacity: string;
  priceFrom: number | null;
  image: string | null;
  features: string[];
};

const FALLBACK_PACKAGES: EventPackageDTO[] = [
  {
    id: "f-garden-wedding",
    slug: "garden-wedding",
    title: "The Garden Wedding",
    titleAm: null,
    description:
      "A candlelit garden feast for up to 300 guests: flame-grill and pizza stations, live azmari band, tej bar and a private buna pavilion. Our events team choreographs every plate.",
    capacity: "Up to 300 guests",
    priceFrom: 95000,
    image: "/images/events.jpg",
    features: ["Full garden takeover", "Live azmari + krar band", "Flame-grill & pizza stations", "Dedicated host team", "Photography corners"],
  },
  {
    id: "f-corporate-mesob",
    slug: "corporate-mesob",
    title: "Corporate Flame Night",
    titleAm: null,
    description:
      "Boardroom dinners, launch nights and team feasts. Screen, projector, halal and fasting menus, and an invoice your finance team will love.",
    capacity: "Up to 80 guests",
    priceFrom: 35000,
    image: "/images/interior.jpg",
    features: ["Private hall + AV", "Set flame menus from ETB 950", "Fasting & international options", "Company branding on menus", "Receipt & invoice ready"],
  },
  {
    id: "f-birthday-habesha",
    slug: "birthday-habesha",
    title: "Habesha Birthday Night",
    titleAm: null,
    description:
      "A birthday the old way: your table decorated in teff grass, a cake reveal with ember sparklers, and a gift from our kitchen.",
    capacity: "Up to 30 guests",
    priceFrom: 12000,
    image: "/images/music.jpg",
    features: ["Grass-decorated tables", "Azmari serenade", "Custom spice-level cake menu", "Birthday gift from the chef"],
  },
  {
    id: "f-private-vip",
    slug: "private-vip",
    title: "The Ember Room (VIP Dining)",
    titleAm: null,
    description:
      "One table, one chef, one night. A seven-course tasting of Ethiopia — doro wot consomme, kitfo tartare, tej pairing — for eight seats.",
    capacity: "8 seats",
    priceFrom: 28000,
    image: "/images/chef.jpg",
    features: ["7-course chef's tasting", "Tej & single-origin buna pairing", "Kitchen tour with the chef", "One booking per night"],
  },
];

function eventTypeFor(slug: string): string {
  if (slug.includes("wedding")) return "wedding";
  if (slug.includes("corporate")) return "corporate";
  if (slug.includes("birthday")) return "birthday";
  return "private";
}

export default function PackageList({ packages }: { packages: EventPackageDTO[] }) {
  const list = packages.length > 0 ? packages : FALLBACK_PACKAGES;

  const requestPackage = (slug: string) => {
    const type = eventTypeFor(slug);
    window.dispatchEvent(new CustomEvent("abem:event-type", { detail: type }));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("inquiry")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="mt-14 space-y-16 md:space-y-24">
      {list.map((p, i) => {
        const flip = i % 2 === 1;
        return (
          <Reveal key={p.id}>
            <div className={cn("grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12", flip && "lg:[&>*:first-child]:order-2")}>
              <div className="img-frame card-hover relative aspect-[4/3] overflow-hidden">
                <Image
                  src={p.image || "/images/events.jpg"}
                  alt={`${p.title} at Abem Restaurant`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="img-duotone object-cover"
                />
                <span className="glass absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.capacity}
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <span className="eyebrow">{`Package ${String(i + 1).padStart(2, "0")}`}</span>
                <h3 className="display-2 mt-3 text-cream">
                  {p.title}
                  {p.titleAm ? (
                    <span className="am-text mt-1 block text-[0.5em] text-gold/80" lang="am">
                      {p.titleAm}
                    </span>
                  ) : null}
                </h3>
                <p className="lead mt-4">{p.description}</p>

                {p.features.length > 0 ? (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                  {p.priceFrom !== null ? (
                    <p className="text-sm text-muted-foreground">
                      From{" "}
                      <span className="font-display text-2xl gold-text">{formatETB(p.priceFrom)}</span>
                      <span className="block text-[11px] uppercase tracking-[0.16em]">per package · menu tailored</span>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => requestPackage(p.slug)} className="btn-gold btn-sm">
                      Request this package
                    </button>
                    <Link href="/reservations" className="btn-ghost btn-sm">
                      Book a tasting
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
