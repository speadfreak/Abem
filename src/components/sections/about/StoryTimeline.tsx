"use client";

import { Reveal } from "@/components/shared/Primitives";
import { cn } from "@/lib/utils";

type Milestone = {
  year: string;
  tag: string;
  title: string;
  copy: string;
  current?: boolean;
};

const MILESTONES: Milestone[] = [
  {
    year: "2011",
    tag: "The beginning",
    title: "Four tables & one mitad",
    copy: "Almaz Bekele fires her first clay mitad on a Bole side street — four tables, one pot of berbere, and a doro wot that takes six hours. The neighborhood starts arriving by smell alone.",
  },
  {
    year: "2014",
    tag: "Under the lights",
    title: "The garden opens",
    copy: "We knock a hole in the back wall and plant a courtyard garden — thirty mesob seats under string lights, tej on ice, and the first azmari Friday. Addis discovers it can dine under eucalyptus.",
  },
  {
    year: "2017",
    tag: "A second flame",
    title: "Kazanchis lights up",
    copy: "The second house opens near Congo Street: same recipes, new stove, and a bar built entirely around the berele. Two branches, one standard — nothing leaves the kitchen in a hurry.",
  },
  {
    year: "2021",
    tag: "Recognition",
    title: "The guides come calling",
    copy: "National culinary awards, travel-writer pilgrimages and a waiting list for the Ember Room. We celebrate the only way we know: a long-table feast for the whole street.",
  },
  {
    year: "Today",
    tag: "Two houses, one fire",
    title: "The flagship era",
    copy: "One kitchen school, two branches, 120 dishes, a quarter of a million guests served — and the mitad still lit at six every morning, exactly where it all began.",
    current: true,
  },
];

export default function StoryTimeline() {
  return (
    <section className="container-x py-24 md:py-32" aria-labelledby="story-heading">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow eyebrow-center justify-center">The Timeline · መንገዳችን</span>
        <h2 id="story-heading" className="display-1 mt-4 text-foreground">
          Fifteen years of fire.
          <span className="mt-2 block font-display-ethiopic text-[0.55em] text-gold/80">የእሳት ዓመታት</span>
        </h2>
        <p className="lead mt-5">
          No investors, no franchise playbook — just one family, one recipe book and a fire that never fully went out.
        </p>
      </Reveal>

      <div className="relative mx-auto mt-16 max-w-5xl md:mt-24">
        <div
          aria-hidden="true"
          className="absolute left-6 top-1 bottom-1 w-px -translate-x-1/2 bg-gradient-to-b from-gold/15 via-gold/50 to-ember/50 md:left-1/2"
        />
        <ol className="space-y-12 md:space-y-16">
          {MILESTONES.map((m, i) => (
            <li key={m.year} className="relative md:grid md:grid-cols-2 md:gap-20">
              <span
                className={cn(
                  "absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border text-[11px] font-bold tracking-widest",
                  m.current
                    ? "border-ember/70 bg-ember/20 text-ember shadow-[0_0_28px_-6px_rgba(179,38,30,0.6)]"
                    : "border-gold/40 bg-elevated text-gold"
                )}
              >
                {m.year}
              </span>
              <Reveal
                className={cn(
                  "pl-20 md:pl-0",
                  i % 2 === 0 ? "md:col-start-1" : "md:col-start-2"
                )}
              >
                <article
                  className={cn(
                    "glass rounded-2xl p-6 md:p-7",
                    m.current && "border-ember/40"
                  )}
                >
                  <span className="eyebrow">{m.tag}</span>
                  <h3 className="display-3 mt-3 text-cream">{m.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{m.copy}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
