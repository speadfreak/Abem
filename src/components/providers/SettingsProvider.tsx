"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { PublicSettings } from "@/lib/settings";

const FALLBACK: PublicSettings = {
  site: { name: "Abem Restaurant", shortName: "Abem", tagline: "Where fire meets heritage — Ethiopia on one table.", taglineAm: "እሳትና ባህል ሲገናኙ፣ ኢትዮጵያ በአንድ ሰሌዳ ላይ።", logoUrl: "/brand/logo.png", founded: "2011", city: "Addis Ababa" },
  hero: { videoUrl: "", posterUrl: "/images/hero-poster.jpg", eyebrow: "Ethiopian Kitchen · Addis Ababa", eyebrowAm: "የኢትዮጵያ እግር ምግብ · አዲስ አበባ", title: "Where Fire Meets Heritage", titleAm: "እሳትና ባህል ሲገናኙ", subtitle: "Slow berbere, smoky tibs and the ritual of buna.", subtitleAm: "ቀስ ብሎ የተዘጋጀ በርበሬ፣ ጭስ ያለው ጥብስና የቡና ሥርዓት።", cta1: { label: "Reserve a Table", href: "/reservations" }, cta2: { label: "Explore the Menu", href: "/menu" } },
  contact: { phone: "+251911234567", whatsapp: "+251911234567", email: "hello@abemrestaurant.et", address: "Bole Road, Addis Ababa", addressAm: "ቦሌ መንገድ፣ አዲስ አበባ" },
  hours: {},
  holidays: [],
  socials: { instagram: "", facebook: "", tiktok: "", telegram: "" },
  features: { ordering: true, delivery: true, tableQr: true, rewards: true, preOrders: false },
  loyalty: { tiers: [], pointsPer100: 10, birthdayBonus: 200, referralPoints: 150 },
  banner: { enabled: false, text: "", textAm: "", href: "" },
};

interface Ctx {
  settings: PublicSettings;
  loading: boolean;
}

const SettingsCtx = createContext<Ctx>({ settings: FALLBACK, loading: true });

export function SettingsProvider({ children, initial }: { children: React.ReactNode; initial?: PublicSettings }) {
  const [settings, setSettings] = useState<PublicSettings>(initial ?? FALLBACK);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    let alive = true;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setSettings(data);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [initial]);

  return <SettingsCtx.Provider value={{ settings, loading }}>{children}</SettingsCtx.Provider>;
}

export function useSettings(): Ctx {
  return useContext(SettingsCtx);
}
