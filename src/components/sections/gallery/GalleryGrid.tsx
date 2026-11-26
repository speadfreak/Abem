"use client";

import React from "react";
import Image from "next/image";
import Lightbox from "@/components/sections/gallery/Lightbox";

export type GalleryItemDTO = {
  id: string;
  title: string;
  titleAm: string | null;
  category: string;
  type: string; // "IMAGE" | "VIDEO"
  url: string;
  thumb: string | null;
};

const FALLBACK_ITEMS: GalleryItemDTO[] = [
  { id: "f1", title: "The grand mesob", titleAm: null, category: "food", type: "IMAGE", url: "/images/hero-poster.jpg", thumb: null },
  { id: "f2", title: "Doro wot, six hours deep", titleAm: null, category: "food", type: "IMAGE", url: "/images/dishes/doro-wat.jpg", thumb: null },
  { id: "f3", title: "Shekla lamb tibs", titleAm: null, category: "food", type: "IMAGE", url: "/images/dishes/tibs.jpg", thumb: null },
  { id: "f4", title: "Special kitfo", titleAm: null, category: "food", type: "IMAGE", url: "/images/dishes/kitfo.jpg", thumb: null },
  { id: "f5", title: "Buna ceremony", titleAm: null, category: "coffee", type: "IMAGE", url: "/images/coffee-ceremony.jpg", thumb: null },
  { id: "f6", title: "Tej in the berele", titleAm: null, category: "coffee", type: "IMAGE", url: "/images/tej.jpg", thumb: null },
  { id: "f7", title: "The dining hall at night", titleAm: null, category: "interior", type: "IMAGE", url: "/images/interior.jpg", thumb: null },
  { id: "f8", title: "Azmari night", titleAm: null, category: "events", type: "IMAGE", url: "/images/music.jpg", thumb: null },
  { id: "f9", title: "Gursha", titleAm: null, category: "food", type: "IMAGE", url: "/images/gursha.jpg", thumb: null },
  { id: "f10", title: "Chef Almaz", titleAm: null, category: "team", type: "IMAGE", url: "/images/chef.jpg", thumb: null },
];

/* Varied aspect ratios give the CSS-columns masonry its rhythm (crops, never stretches). */
const ASPECTS = ["aspect-[3/4]", "aspect-[4/3]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[4/3]"] as const;

function labelFor(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function GalleryGrid({ items }: { items: GalleryItemDTO[] }) {
  const [filter, setFilter] = React.useState<string>("all");
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const list = items.length > 0 ? items : FALLBACK_ITEMS;

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const it of list) if (it.category) set.add(it.category);
    return ["all", ...Array.from(set).sort()];
  }, [list]);

  const filtered = React.useMemo(
    () => (filter === "all" ? list : list.filter((it) => it.category === filter)),
    [filter, list]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery by category">
        {categories.map((cat) => {
          const active = filter === cat;
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFilter(cat);
                setOpenIndex(null);
              }}
              className={`inline-flex min-h-11 items-center rounded-full border px-5 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ${
                active
                  ? "border-gold bg-gold text-[#1a0e05] shadow-[0_8px_28px_-10px_rgba(232,163,23,0.7)]"
                  : "border-gold/25 bg-transparent text-cream/75 hover:border-gold/70 hover:text-gold"
              }`}
            >
              {cat === "all" ? "All" : labelFor(cat)}
            </button>
          );
        })}
        <span className="ml-auto hidden items-center text-xs text-muted-foreground sm:inline-flex">
          {filtered.length} {filtered.length === 1 ? "frame" : "frames"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">No frames in this category yet — check back after the next feast.</p>
      ) : (
        <div className="mt-8 columns-2 gap-4 md:columns-3">
          {filtered.map((it, i) => {
            const isVideo = it.type === "VIDEO";
            const src = isVideo ? it.thumb || it.url : it.url;
            const alt = it.titleAm ? `${it.title} · ${it.titleAm}` : it.title;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={isVideo ? `Play video: ${it.title}` : `Open image: ${it.title}`}
                className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-gold/15 focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <span className={`relative block w-full ${ASPECTS[i % ASPECTS.length]}`}>
                  {src ? (
                    <Image
                      src={src}
                      alt=""
                      fill
                      loading="lazy"
                      unoptimized={!src.startsWith("/")}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="img-duotone object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b0705]/80 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-left">
                    <span className="text-xs font-semibold text-cream drop-shadow">{it.title}</span>
                    <span className="rounded-full border border-gold/40 bg-[#0b0705]/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold backdrop-blur-sm">
                      {isVideo ? "Film" : labelFor(it.category)}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Lightbox
        items={filtered}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNav={(delta) =>
          setOpenIndex((cur) =>
            cur === null ? null : (cur + delta + filtered.length) % filtered.length
          )
        }
      />
    </div>
  );
}
