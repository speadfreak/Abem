"use client";

import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";

export type FaqDTO = { id: string; question: string; answer: string };

const FALLBACK_FAQS: FaqDTO[] = [
  {
    id: "f-buna",
    question: "Do you take reservations for the buna ceremony?",
    answer:
      "Yes — the ceremony runs tableside all day and every seated table can request it. For groups over 8 we recommend reserving 48 hours ahead so we roast enough beans.",
  },
  {
    id: "f-spice",
    question: "How spicy is Abem food, really?",
    answer:
      "Every dish shows a heat level (0–3). The Berbere Smash Burger and Fasting Firfir run hot; burgers, pizza and fried chicken are mild to medium. Our kitchen will happily adjust — just note it when ordering.",
  },
  {
    id: "f-events",
    question: "Do you host weddings and corporate events?",
    answer:
      "Our garden seats 300 under the lights and our VIP booths host private tastings. See the Events page — our team replies within one business day.",
  },
];

export default function FaqTeaser({ faqs }: { faqs: FaqDTO[] }) {
  const list = faqs.length > 0 ? faqs : FALLBACK_FAQS;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
      <Reveal>
        <span className="eyebrow">Quick answers · ጥያቄዎች</span>
        <h2 className="display-2 mt-4 text-foreground">Before you call.</h2>
        <p className="lead mt-4">The three questions the front desk hears most.</p>
        <Link
          href="/experience#faq"
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold underline-offset-4 transition-colors hover:text-cream hover:underline"
        >
          All questions on the Experience page
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
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </div>
  );
}
