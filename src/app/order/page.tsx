import type { Metadata } from "next";
import { Suspense } from "react";
import OrderHub from "@/components/order/OrderHub";
import PageHero from "@/components/shared/PageHero";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Order Online — Delivery, Takeaway & Table QR | Abem Flow",
    description:
      "Order Abem's flame-grilled burgers, wood-fired pizza, shawarma and crispy chicken online. Delivery across Addis Ababa, takeaway pickup and scan-to-order table service — powered by Abem Flow.",
    openGraph: { images: [{ url: "/images/dishes/burger.jpg" }] },
  };
}

export default function OrderPage() {
  return (
    <main>
      <PageHero
        eyebrow="Abem Flow · ትዕዛዝ"
        title="Order the fire."
        titleAm="ትዕዛዝዎን ያድርጉ"
        description="Delivery across Addis, pickup at the host desk, or scan-to-order from your table. Same flame, same kitchen — now one tap away."
        image="/images/dishes/burger.jpg"
        compact
      />
      <Suspense
        fallback={
          <div className="container-x py-20 text-center text-muted-foreground" role="status">
            <div className="skeleton-shimmer mx-auto h-11 w-72 rounded-full" />
            <p className="mt-6 text-sm">Warming up Abem Flow…</p>
          </div>
        }
      >
        <OrderHub />
      </Suspense>
    </main>
  );
}
