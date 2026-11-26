"use client";

import React, { useSyncExternalStore } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";
import { cn } from "@/lib/utils";

type SpecialTag = "Music" | "Coffee" | "Family" | "Drinks" | "Festival";

type Special = {
  date: Date;
  title: string;
  tag: SpecialTag;
  blurb: string;
  festival: boolean;
};

/** 0=Sun … 6=Sat. Returns the nth `weekday` of the given month. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const shift = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + shift + (n - 1) * 7);
}

/** Last `weekday` of the given month. */
function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0);
  const shift = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - shift);
}

function buildSpecials(now: Date): Special[] {
  const out: Special[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let mi = 0; mi < 3; mi++) {
    const cursor = new Date(now.getFullYear(), now.getMonth() + mi, 1);
    const y = cursor.getFullYear();
    const m = cursor.getMonth();

    out.push({
      date: nthWeekdayOfMonth(y, m, 5, 1),
      title: "Azmari Night with the full band",
      tag: "Music",
      blurb: "Masinko, krar and improvised verse until the kitchen closes. Gursha platters all night.",
      festival: false,
    });
    out.push({
      date: nthWeekdayOfMonth(y, m, 6, 2),
      title: "Buna Ceremony Masterclass",
      tag: "Coffee",
      blurb: "Hanna guides the roast, the brew and the three cups — you leave with a bag of green beans.",
      festival: false,
    });
    out.push({
      date: nthWeekdayOfMonth(y, m, 0, 3),
      title: "Family Gursha Sunday",
      tag: "Family",
      blurb: "Long-table beyaynetu, gentle spice for small hands, and free buna refills until sunset.",
      festival: false,
    });
    out.push({
      date: lastWeekdayOfMonth(y, m, 4),
      title: "Tej Pairing Dinner",
      tag: "Drinks",
      blurb: "Five courses, three house tej styles, one long table in the garden.",
      festival: false,
    });

    if (m === 8) {
      out.push({
        date: new Date(y, 8, 11),
        title: "Enkutatash — New Year Feast",
        tag: "Festival",
        blurb: "Aster flowers on every mesob, doro wot at noon, and the kids' mesob singing for the new year.",
        festival: true,
      });
      out.push({
        date: new Date(y, 8, 27),
        title: "Meskel Feast Dinner",
        tag: "Festival",
        blurb: "The Demera bonfire recreated in candlelight — a feast of lamb tibs, gomen and house tej.",
        festival: true,
      });
    }
    if (m === 0) {
      out.push({
        date: new Date(y, 0, 7),
        title: "Gena — Christmas Feast",
        tag: "Festival",
        blurb: "Doro wot, tere sega and injera from the big mitad — genna hockey in the garden afterwards.",
        festival: true,
      });
      out.push({
        date: new Date(y, 0, 19),
        title: "Timket Celebration Dinner",
        tag: "Festival",
        blurb: "Epiphany evening feast: fasting beyaynetu, tej and a prayer of welcome for the new year's guests.",
        festival: true,
      });
    }
  }

  return out
    .filter((e) => e.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);
}

const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long" });
const fmtDay = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("en-GB", { month: "long" });

/* Client-only value exposed via useSyncExternalStore (no setState-in-effect). */
let specialsCache: Special[] | null = null;
function getSpecialsSnapshot(): Special[] {
  if (!specialsCache) specialsCache = buildSpecials(new Date());
  return specialsCache;
}
function subscribeSpecials(): () => void {
  return () => {}; /* static per session — no live updates needed */
}

export default function SpecialsCalendar() {
  const specials = useSyncExternalStore(
    subscribeSpecials,
    getSpecialsSnapshot,
    () => null
  );

  if (!specials) {
    return (
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-elevated h-36 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {specials.map((s, i) => (
        <Reveal key={`${s.title}-${s.date.toISOString()}`} delay={i * 0.08}>
          <div
            className={cn(
              "card-elevated card-hover flex h-full items-stretch overflow-hidden",
              s.festival && "border-ember/35"
            )}
          >
            <div className="flex w-24 shrink-0 flex-col items-center justify-center border-r border-gold/15 bg-gold/10 py-5">
              <span className="display-2 gold-text leading-none">{fmtDay.format(s.date)}</span>
              <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                {fmtMonth.format(s.date)}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {fmt.format(s.date).replace(fmtDay.format(s.date), "").replace(fmtMonth.format(s.date), "").trim()}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                    s.festival ? "bg-ember/20 text-ember" : "bg-highland/25 text-[#8fd0a0]"
                  )}
                >
                  {s.festival ? <Sparkles className="h-3 w-3" aria-hidden="true" /> : null}
                  {s.tag}
                </span>
              </div>
              <h3 className="display-3 mt-2 text-cream">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.blurb}</p>
            </div>
          </div>
        </Reveal>
      ))}

      <p className="col-span-full mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
        Dates follow the Gregorian calendar; Ethiopian festivals are listed on their civic dates. Ask the front desk about Genna hockey in the garden.
      </p>
    </div>
  );
}
