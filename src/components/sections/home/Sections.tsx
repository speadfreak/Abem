"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Flame, Quote, Star, Timer, Bike, ChefHat, UtensilsCrossed, Coffee, Music, Sparkles, Landmark } from "lucide-react";
import { Reveal, Counter, Marquee, SectionHeading } from "@/components/shared/Primitives";
import Magnetic from "@/components/shared/Magnetic";
import EmberCanvas from "@/components/brand/EmberCanvas";
import { useLang } from "@/lib/i18n/lang-context";
import { formatPriceShort } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ─────────────── Signature marquee band ─────────────── */

export function SignatureBand({ names }: { names: string[] }) {
  return (
    <div className="relative border-y border-gold/15 bg-[#0d0805] py-5">
      <Marquee
        className="marquee-fast"
        items={names.map((n) => (
          <span key={n} className="font-display text-lg tracking-wide text-cream/85">
            {n}
          </span>
        ))}
        itemClassName="whitespace-nowrap"
      />
    </div>
  );
}

/* ─────────────── Story parallax + stats ─────────────── */

export function StorySection({ stats }: { stats: { years: number; dishes: number; guests: number; awards: number } }) {
  const { lang } = useLang();
  const imgWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | null = null;
    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.to(".story-img-a", {
          yPercent: -14,
          ease: "none",
          scrollTrigger: { trigger: imgWrap.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
        gsap.to(".story-img-b", {
          yPercent: 10,
          ease: "none",
          scrollTrigger: { trigger: imgWrap.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
      }, imgWrap);
    })();
    return () => ctx?.revert();
  }, []);

  return (
    <section className="relative overflow-hidden py-24 md:py-32" aria-label="Our story">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <div ref={imgWrap} className="relative">
          <div className="story-img-a img-frame relative aspect-[4/5] w-[82%]">
            <Image src="/images/coffee-ceremony.jpg" alt="Traditional Ethiopian coffee ceremony at Abem" fill sizes="(max-width:1024px) 90vw, 40vw" className="object-cover" />
          </div>
          <div className="story-img-b img-frame absolute -bottom-10 right-0 aspect-[4/3] w-[55%]">
            <Image src="/images/interior.jpg" alt="Abem dining hall at night" fill sizes="(max-width:1024px) 55vw, 24vw" className="object-cover" />
          </div>
          <div className="absolute -left-4 top-8 rounded-2xl glass px-5 py-4" aria-hidden="true">
            <p className="font-display text-3xl text-gold">15</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-cream/70">years of fire</p>
          </div>
        </div>

        <div>
          <SectionHeading
            align="left"
            eyebrow={lang === "am" ? "ታሪካችን" : "Our Story"}
            title={lang === "am" ? "ከአራት ሰሌዳ ወደ አገር ልብ" : "From four tables to the heart of Addis"}
            titleAm={undefined}
            className="max-w-xl"
          />
          <Reveal delay={0.1}>
            <p className="lead mt-6">
              In 2011, Abem opened with four mesobs, a mitad that never cooled, and a promise: cook the Ethiopia we grew
              up tasting — slowly, honestly, without shortcuts. Today the room hums with three languages of laughter and
              the pot of doro wot still gets six unhurried hours.
            </p>
            <p className="lead mt-4">
              Everything is anchored in heritage: teff from the Gojjam highlands, berbere toasted and ground every
              Monday, coffee roasted at your table. The fire is old. The welcome is older.
            </p>
          </Reveal>

          <Reveal delay={0.2} className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { to: stats.years, suffix: "", label: "Years of fire" },
              { to: stats.dishes, suffix: "+", label: "Dishes served" },
              { to: Math.round(stats.guests / 1000), suffix: "k", label: "Happy guests" },
              { to: stats.awards, suffix: "", label: "Awards" },
            ].map((s) => (
              <div key={s.label} className="border-l border-gold/25 pl-4">
                <p className="font-display text-3xl md:text-4xl text-gold">
                  <Counter to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.28} className="mt-10">
            <Link href="/about" className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-gold">
              Read the full story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Featured menu carousel ─────────────── */

interface Dish {
  id: string; slug: string; name: string; nameAm?: string; description?: string;
  price: number; image?: string; isChefPick?: boolean; spicyLevel?: number;
}

export function FeaturedCarousel({ dishes }: { dishes: Dish[] }) {
  const { lang, pick } = useLang();
  if (!dishes.length) return null;

  return (
    <section className="py-24 md:py-32" aria-label="Featured dishes">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow={lang === "am" ? "የሼፍ ምርጫ" : "From the fire"}
            title={lang === "am" ? "ልዩ ምግቦቻችን" : "Signature plates"}
            description="The dishes our regulars dream about — served on injera we bake every morning."
            className="max-w-2xl"
          />
          <Reveal delay={0.1}>
            <Link href="/menu" className="btn-ghost btn-sm">
              Full menu
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-12">
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0">
            {dishes.map((d, i) => (
              <Link
                key={d.id}
                href={`/menu?dish=${d.slug}`}
                className="card-elevated card-hover group relative w-[78vw] shrink-0 snap-start overflow-hidden sm:w-[340px]"
                aria-label={`${d.name}, ${formatPriceShort(d.price)}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {d.image ? (
                    <Image src={d.image} alt={d.name} fill sizes="(max-width:640px) 78vw, 340px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-elevated">
                      <UtensilsCrossed className="h-10 w-10 text-gold/30" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0705]/85 via-transparent to-transparent" aria-hidden="true" />
                  {d.isChefPick && (
                    <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-gold-soft to-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1a0e05]">
                      Chef&apos;s pick
                    </span>
                  )}
                  <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="font-display text-xl text-cream">{pick(d, "name")}</span>
                    <span className="rounded-full border border-gold/40 bg-[#0b0705]/60 px-3 py-1 font-mono text-[12px] text-gold backdrop-blur">
                      {formatPriceShort(d.price)}
                    </span>
                  </span>
                </div>
                <div className="p-5">
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{pick(d, "description")}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-gold/90">
                    View dish <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
                <span className="pointer-events-none absolute right-4 top-4 font-display text-5xl text-cream/10">{String(i + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────── Chef spotlight ─────────────── */

export function ChefSpotlight() {
  const { lang } = useLang();
  return (
    <section className="relative overflow-hidden border-y border-gold/10 bg-[#0d0805] py-24 md:py-32" aria-label="Chef spotlight">
      <div className="absolute -right-24 top-0 h-full w-1/3 opacity-[0.06]" aria-hidden="true">
        <Flame className="h-full w-full text-gold" strokeWidth={0.6} />
      </div>
      <div className="container-x grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="relative mx-auto w-full max-w-md">
          <div className="img-frame relative aspect-[3/4]">
            <Image src="/images/chef.jpg" alt="Chef Almaz Bekele, Executive Chef of Abem" fill sizes="(max-width:1024px) 90vw, 34vw" className="object-cover img-duotone" priority={false} />
          </div>
          <div className="glass absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl px-6 py-4 text-center">
            <p className="font-display text-lg text-cream">Chef Almaz Bekele</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Executive Chef</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading
            align="left"
            eyebrow={lang === "am" ? "የሼፍ ማዕዘን" : "The kitchen voice"}
            title={lang === "am" ? "«ተውሌ. ነገ ፍጹም ይሆናል።»" : "Close. Tomorrow, perfect."}
            className="max-w-xl"
          />
          <Reveal delay={0.12}>
            <blockquote className="mt-6 border-l-2 border-gold/50 pl-5 text-lg leading-relaxed text-cream/85">
              “My mother taught me that berbere is not a spice — it is a season of work: planting, drying, toasting,
              grinding. When you taste our doro wot you taste all of it. I don&apos;t rush the onions, and I never,
              ever serve a sauce that hasn&apos;t had its six hours.”
            </blockquote>
            <p className="mt-5 text-sm text-muted-foreground">
              Fifteen years at the pot. Trained in her mother&apos;s kitchen in Gondar. Guarding one recipe like a
              national secret — and sharing every other one.
            </p>
            <Link href="/about" className="btn-ghost btn-sm mt-8">
              Meet the team
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Experience bento grid ─────────────── */

const BENTO = [
  { icon: Coffee, title: "Buna Ceremony", am: "የቡና ሥርዓት", desc: "Green beans roasted at your table, frankincense, three unhurried cups.", href: "/experience", span: "md:col-span-2", img: "/images/coffee-ceremony.jpg" },
  { icon: Flame, title: "Charcoal Grill", am: "ጥብስ", desc: "Shekla tibs that arrive still singing.", href: "/menu", span: "", img: "/images/dishes/tibs.jpg" },
  { icon: Music, title: "Azmari Nights", am: "አዝማሪ ምሽት", desc: "Masinko, laughter and improvised verse every Friday & Saturday.", href: "/experience", span: "", img: "/images/music.jpg" },
  { icon: Sparkles, title: "Gursha Culture", am: "ጉርሻ", desc: "The bite you feed a friend — the most Ethiopian thing we serve.", href: "/experience", span: "md:col-span-2", img: "/images/gursha.jpg" },
];

export function ExperienceBento() {
  const { lang } = useLang();
  return (
    <section className="py-24 md:py-32" aria-label="The Abem experience">
      <div className="container-x">
        <SectionHeading
          eyebrow={lang === "am" ? "ልምዱ" : "The experience"}
          title={lang === "am" ? "ከምግብ በላይ" : "More than a meal"}
          description="Ceremony, music, fire and the rituals that make an Ethiopian table feel like home."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {BENTO.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.08} className={cn(b.span)}>
              <Link href={b.href} className="group card-elevated card-hover relative block h-56 overflow-hidden md:h-full md:min-h-[220px]" aria-label={b.title}>
                <Image src={b.img} alt={b.title} fill sizes="(max-width:768px) 100vw, 30vw" className="object-cover opacity-55 transition-all duration-700 group-hover:scale-105 group-hover:opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0705] via-[#0b0705]/40 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <b.icon className="mb-2 h-5 w-5 text-gold" aria-hidden="true" />
                  <p className="font-display text-xl text-cream">{b.title}</p>
                  <p className="am-text mt-0.5 text-xs text-gold/80">{b.am}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-cream/60">{b.desc}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Testimonials slider ─────────────── */

const TESTIMONIALS = [
  { name: "Selamawit T.", role: "Addis Ababa", quote: "The doro wot tastes like my grandmother's Sunday — but plated like Paris. I cried a little, then ordered more." },
  { name: "Marcus Bell", role: "Travel writer, London", quote: "Abem is the Ethiopian meal I measure all others against. The buna ceremony alone is worth the flight." },
  { name: "Hirut M.", role: "Gourmet Club chair", quote: "We came for the kitfo and stayed until the tej ran out. Service feels like family, not staff." },
  { name: "Daniel Kim", role: "Chef, Seoul", quote: "That shekla tibs — smoke, rosemary, fire — is one of the best plates I ate this year, anywhere." },
];

export function Testimonials() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const iv = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(iv);
  }, []);
  const t = TESTIMONIALS[idx];

  return (
    <section className="border-y border-gold/10 bg-[#0d0805] py-24" aria-label="Guest testimonials">
      <div className="container-tight text-center">
        <Quote className="mx-auto mb-6 h-8 w-8 text-gold/60" aria-hidden="true" />
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55 }}
          >
            <p className="font-display text-xl leading-relaxed text-cream/90 md:text-2xl">“{t.quote}”</p>
            <footer className="mt-6">
              <p className="text-sm font-semibold text-cream">{t.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t.role}</p>
              <div className="mt-2 flex justify-center gap-1" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
                ))}
              </div>
            </footer>
          </motion.blockquote>
        </AnimatePresence>
        <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Testimonial selector">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Testimonial ${i + 1}`}
              onClick={() => setIdx(i)}
              className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-8 bg-gold" : "w-1.5 bg-gold/30 hover:bg-gold/60")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Abem Flow teaser ─────────────── */

export function FlowTeaser() {
  const { lang } = useLang();
  const enabled = true;
  return (
    <section className="relative overflow-hidden py-24 md:py-32" aria-label="Abem Flow ordering">
      <EmberCanvas className="absolute inset-0 h-full w-full opacity-40" density={0.4} />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Abem Flow"
            title={lang === "am" ? "ትዕዛዝ በጠቅላላ ወደ እሳቱ" : "From your phone to the fire"}
            description="Scan, tap, done — Abem Flow is our in-house ordering engine. Table QR ordering, live tracking, kitchen display and rider dispatch all run on the same flame."
            className="max-w-xl"
          />
          <Reveal delay={0.12} className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: UtensilsCrossed, t: "Table QR ordering", d: "Scan. Order. No app." },
              { icon: Timer, t: "Live tracking", d: "Watch it reach the fire." },
              { icon: ChefHat, t: "Kitchen display", d: "Tickets color by age." },
              { icon: Bike, t: "Rider dispatch", d: "Nearest rider, instantly." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3.5 rounded-xl border border-gold/10 bg-elevated/60 p-4">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-cream">{f.t}</p>
                  <p className="text-xs text-muted-foreground">{f.d}</p>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-4">
            <Link href="/order" className="btn-gold" data-magnetic>Order now</Link>
            <Link href="/track" className="btn-ghost">Track an order</Link>
          </Reveal>
        </div>

        {/* Mock ticket stack */}
        <Reveal delay={0.15} className="relative mx-auto hidden w-full max-w-md sm:block" aria-hidden="true">
          <motion.div
            animate={enabled ? { y: [0, -8, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="ticket absolute left-0 top-0 w-[88%] rotate-[-3deg] p-5"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Abem Flow · ABM-K7D2QM</p>
            <p className="mt-1 font-display text-lg text-cream">2× Doro Wot · 1× Beyaynetu</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-highland/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8fd0a0]">In the fire · 6 min</p>
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="ticket absolute right-0 top-28 w-[86%] rotate-[2deg] p-5"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Delivery · Zone Bole</p>
            <p className="mt-1 font-display text-lg text-cream">1× Special Kitfo · 1× House Tej</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold">On the way · ETA 12 min</p>
          </motion.div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
            className="ticket relative left-8 top-56 w-[88%] rotate-[-1deg] p-5"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Table T07 · QR order</p>
            <p className="mt-1 font-display text-lg text-cream">1× Buna Ceremony · 2× Macchiato</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ember/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#ff9d8f]">New ticket</p>
          </motion.div>
          <div className="h-[420px]" />
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────── Gallery strip ─────────────── */

const STRIP = [
  "/images/hero-poster.jpg", "/images/dishes/doro-wat.jpg", "/images/coffee-ceremony.jpg",
  "/images/dishes/tibs.jpg", "/images/interior.jpg", "/images/dishes/kitfo.jpg",
  "/images/dishes/beyaynetu.jpg", "/images/events.jpg",
];

export function GalleryStrip() {
  const doubled = [...STRIP, ...STRIP];
  return (
    <section className="py-16" aria-label="Gallery preview">
      <div className="container-x mb-8 flex items-end justify-between">
        <SectionHeading align="left" eyebrow="Gallery" title="Inside the fire" className="max-w-md" />
        <Reveal delay={0.1}>
          <Link href="/gallery" className="btn-ghost btn-sm">
            All photos
          </Link>
        </Reveal>
      </div>
      <Marquee
        items={doubled.map((src, i) => (
          <Image
            key={`${src}-${i}`}
            src={src}
            alt="Abem Restaurant gallery"
            width={280}
            height={190}
            className="h-[150px] w-[220px] rounded-xl border border-gold/15 object-cover transition hover:border-gold/50 md:h-[190px] md:w-[280px]"
          />
        ))}
        itemClassName="whitespace-nowrap"
      />
    </section>
  );
}

/* ─────────────── Reservation CTA band ─────────────── */

export function CtaBand({ phone }: { phone: string }) {
  const { lang } = useLang();
  return (
    <section className="relative overflow-hidden border-t border-gold/15 py-24 md:py-32" aria-label="Reserve your table">
      <div className="absolute inset-0 -z-10">
        <Image src="/images/hero-poster.jpg" alt="" fill sizes="100vw" className="object-cover opacity-25 img-duotone" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0705]/85 to-[#0b0705]" />
      </div>
      <EmberCanvas className="absolute inset-0 -z-10 h-full w-full opacity-60" density={0.7} />
      <div className="container-tight text-center">
        <Reveal>
          <span className="eyebrow eyebrow-center justify-center">Your table is warm</span>
          <h2 className="display-1 mt-4 text-cream">
            {lang === "am" ? "እንግዳዎቻችን ይጠብቋሉ" : <>The mesob is set. <span className="gold-text">Gursha awaits.</span></>}
          </h2>
          <p className="lead mx-auto mt-5 max-w-xl">
            Garden seating under the lights, VIP mesobs for eight, or the front-row of the buna ceremony.
            Reserve in under a minute — confirmation arrives by SMS.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Magnetic>
              <Link href="/reservations" className="btn-gold" data-magnetic>Reserve a Table</Link>
            </Magnetic>
            <a href={`tel:${phone}`} className="btn-ghost">{phone}</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
