import type { Metadata } from "next";
import KitchenBoard from "@/components/ops/KitchenBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kitchen Line — Abem Flow",
  description: "Live kitchen tickets: new, in the fire, ready.",
  robots: { index: false, follow: false },
};

export default function KitchenPage() {
  return <KitchenBoard />;
}
