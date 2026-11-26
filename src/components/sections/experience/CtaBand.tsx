"use client";

import Link from "next/link";
import { Reveal } from "@/components/shared/Primitives";
import Magnetic from "@/components/shared/Magnetic";

export default function CtaBand() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32" aria-labelledby="cta-heading">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(179,38,30,0.18),transparent),radial-gradient(40%_40%_at_80%_20%,rgba(232,163,23,0.1),transparent)]"
      />
      <div className="container-x relative text-center">
        <Reveal>
          <span className="eyebrow eyebrow-center justify-center">Your Seat · ቦታዎ</span>
          <h2 id="cta-heading" className="display-hero mx-auto mt-5 max-w-[16ch] text-cream">
            The fire is lit. Your table is warm.
          </h2>
          <p className="lead mx-auto mt-6 max-w-xl">
            Reserve the dining hall, the garden or the Ember Room — or just come hungry and let the azmari find you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Magnetic>
              <Link href="/reservations" className="btn-gold">
                Reserve a table
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/menu" className="btn-ghost">
                See the menu
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
