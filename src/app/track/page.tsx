import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import TrackForm from "@/components/order/TrackForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Your Order | Abem Flow",
  description: "Follow your Abem order live — from the fire to your door.",
};

export default function TrackPage() {
  return (
    <main>
      <PageHero
        eyebrow="Abem Flow · መከታተል"
        title="Where is my fire?"
        titleAm="ትዕዛዜ የት ነው?"
        description="Enter your order code and watch it move — received, in the fire, ready, on the way."
        compact
      />
      <section className="container-x pb-28 pt-6">
        <TrackForm />
      </section>
    </main>
  );
}
