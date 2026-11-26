import type { Metadata } from "next";
import RiderBoard from "@/components/ops/RiderBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rider Board — Abem Flow",
  description: "Assigned deliveries and proof-of-delivery verification.",
  robots: { index: false, follow: false },
};

export default function RiderPage() {
  return <RiderBoard />;
}
