import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "daily" },
    { path: "/menu", priority: 0.9, freq: "weekly" },
    { path: "/reservations", priority: 0.9, freq: "weekly" },
    { path: "/order", priority: 0.9, freq: "weekly" },
    { path: "/about", priority: 0.7, freq: "monthly" },
    { path: "/experience", priority: 0.7, freq: "weekly" },
    { path: "/gallery", priority: 0.6, freq: "weekly" },
    { path: "/events", priority: 0.7, freq: "monthly" },
    { path: "/contact", priority: 0.7, freq: "monthly" },
    { path: "/stories", priority: 0.6, freq: "weekly" },
    { path: "/rewards", priority: 0.6, freq: "monthly" },
    { path: "/track", priority: 0.4, freq: "monthly" },
    { path: "/careers", priority: 0.4, freq: "monthly" },
    { path: "/legal", priority: 0.2, freq: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
