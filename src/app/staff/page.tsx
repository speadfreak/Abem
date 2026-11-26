import type { Metadata } from "next";
import StaffBoard from "@/components/ops/StaffBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Board — Abem Flow",
  description: "Live service requests, orders and tables.",
  robots: { index: false, follow: false },
};

export default function StaffPage() {
  return <StaffBoard />;
}
