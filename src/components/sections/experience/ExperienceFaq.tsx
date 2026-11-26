"use client";

import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";

export type FaqDTO = { id: string; question: string; answer: string };

const FALLBACK_FAQS: FaqDTO[] = [
  {
    id: "buna-reserve",
    question: "Do you take reservations for the buna ceremony?",
    answer:
      "Yes — the ceremony runs tableside all day and every seated table can request it. For groups over 8 we recommend reserving 48 hours ahead so we roast enough beans.",
  },
  {
    id: "spice-level",
    question: "How spicy is Abem food, really?",
    answer:
      "Every dish shows a berbere heat level (0–3). Kitfo and tibs firfir run hot; alicha dishes are mild. Our kitchen will happily adjust — just note it when ordering.",
  },
  {
    id: "fasting",
    question: "Is there a full fasting (Tsom) menu?",
    answer:
      "Around a third of our menu is fasting: beyaynetu, shiro, misir, gomen, fasting firfir and more. It is a first-class menu, not an afterthought.",
  },
  {
    id: "events",
    question: "Do you host weddings and corporate events?",
    answer:
      "Our garden seats 300 under the lights and our VIP mesobs host private tastings. See the Events page — our team replies within one business day.",
  },
  {
    id: "delivery",
    question: "Where do you deliver?",
    answer:
      "Across Addis Ababa — Bole, Kazanchis, Piassa, CMC and Haya Hulet zones, with landmark-based addresses and live tracking.",
  },
  {
    id: "family",
    question: "Is the restaurant family friendly?",
    answer:
      "Very. Gursha is a family tradition and children are welcome; high chairs and a gentler-spice kids' mesob are always available.",
  },
];

export default function ExperienceFaq({ faqs }: { faqs: FaqDTO[] }) {
  const list = faqs.length > 0 ? faqs : FALLBACK_FAQS;

  return (
    <section id="faq" className="container-x scroll-mt-24 py-24 md:py-32" aria-labelledby="faq-heading">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal>
          <span className="eyebrow">Good to know · ጥያቄዎች</span>
          <h2 id="faq-heading" className="display-1 mt-4 text-foreground">
            Questions, answered.
            <span className="mt-2 block font-display-ethiopic text-[0.55em] text-gold/80">ጥያቄዎችና መልሶች</span>
          </h2>
          <p className="lead mt-5">
            The practical things — spice, fasting, ceremonies and little legs at the table.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold underline-offset-4 transition-colors hover:text-cream hover:underline"
          >
            Ask us anything else
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="rounded-2xl border border-gold/10 bg-card px-6">
            {list.map((f) => (
              <AccordionItem key={f.id} value={f.id} className="border-gold/10">
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-cream hover:text-gold hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
