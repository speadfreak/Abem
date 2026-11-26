"use client";

import Image from "next/image";
import { Reveal } from "@/components/shared/Primitives";

type Panel = {
  image: string;
  alt: string;
  title: string;
  titleAm: string;
  copy: string;
};

const PANELS: Panel[] = [
  {
    image: "/images/coffee-ceremony.jpg",
    alt: "Green coffee beans roasting over coals during a traditional Ethiopian buna ceremony",
    title: "The coffee ceremony",
    titleAm: "የቡና ሥርዓት",
    copy: "Buna is not a drink; it is an hour of grace. Green beans roasted at your table, frankincense on the coals, fresh-cut grass underfoot — and three cups that turn strangers into family. Abol, tona, baraka.",
  },
  {
    image: "/images/dishes/beyaynetu.jpg",
    alt: "Fresh injera with a rainbow of Ethiopian wots arranged on top",
    title: "Injera craft",
    titleAm: "የእንጀራ ጥበብ",
    copy: "Teff from the Gojjam highlands, fermented three days in clay, poured in one spiral onto a hot mitad. Plate, fork and napkin in one — the hardest-working bread on earth, baked fresh every morning.",
  },
  {
    image: "/images/spices.jpg",
    alt: "Mounds of berbere and other Ethiopian spices at a market stall",
    title: "The spice road",
    titleAm: "የቅመም መንገድ",
    copy: "Berbere, mitmita, korarima, besobela. Our berbere is toasted and ground in-house every Monday — sixteen spices deep — and by nine the smell reaches the street before our sign does.",
  },
];

export default function HeritagePanels() {
  return (
    <div className="mt-14 grid gap-6 lg:grid-cols-3">
      {PANELS.map((p, i) => (
        <Reveal key={p.title} delay={i * 0.12}>
          <figure className="card-elevated card-hover h-full overflow-hidden">
            <div className="img-frame relative aspect-[4/3] w-full rounded-b-none border-0 border-b border-gold/15">
              <Image
                src={p.image}
                alt={p.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="img-duotone object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <figcaption className="p-7">
              <p className="am-text text-sm text-gold" lang="am">
                {p.titleAm}
              </p>
              <h3 className="display-3 mt-2 text-cream">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.copy}</p>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
