import type { Metadata } from "next";
import OrderTracker from "@/components/order/OrderTracker";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Tracking ${decodeURIComponent(code).toUpperCase()} | Abem Flow`,
    description: "Live status for your Abem Restaurant order.",
  };
}

export default async function TrackCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main>
      <OrderTracker code={decodeURIComponent(code).toUpperCase()} />
    </main>
  );
}
