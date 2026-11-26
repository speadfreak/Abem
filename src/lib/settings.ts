import { db } from "@/lib/db";

/* ─────────────────────────────────────────────────────────────
   ABEM SETTINGS — single typed source of truth for the whole CMS.
   Every value is editable from /admin/settings (Setting table).
   ───────────────────────────────────────────────────────────── */

export type DayHours = { open: string; close: string; closed: boolean };
export type WeekHours = Record<string, DayHours>;
export type LoyaltyTier = { name: string; min: number; perk: string };

export interface SiteSettings {
  site: {
    name: string;
    shortName: string;
    tagline: string;
    taglineAm: string;
    logoUrl: string;
    founded: string;
    city: string;
  };
  hero: {
    videoUrl: string;
    posterUrl: string;
    eyebrow: string;
    eyebrowAm: string;
    title: string;
    titleAm: string;
    subtitle: string;
    subtitleAm: string;
    cta1: { label: string; href: string };
    cta2: { label: string; href: string };
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    addressAm: string;
  };
  hours: WeekHours;
  holidays: string[];
  socials: {
    instagram: string;
    facebook: string;
    tiktok: string;
    telegram: string;
  };
  features: {
    ordering: boolean;
    delivery: boolean;
    tableQr: boolean;
    rewards: boolean;
    preOrders: boolean;
  };
  loyalty: {
    pointsPer100: number;
    birthdayBonus: number;
    referralPoints: number;
    tiers: LoyaltyTier[];
  };
  theme: { gold: string; ember: string };
  banner: { enabled: boolean; text: string; textAm: string; href: string };
  seo: Record<
    string,
    { title: string; description: string; ogImage: string }
  >;
  stats: { years: number; dishes: number; guests: number; awards: number };
  kitchen: { amberMinutes: number; redMinutes: number };
  stations: Record<string, string>;
}

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export const DEFAULT_SETTINGS: SiteSettings = {
  site: {
    name: "Abem Restaurant",
    shortName: "Abem",
    tagline: "Where fire meets heritage — Ethiopia on one table.",
    taglineAm: "እሳትና ባህል ሲገናኙ፣ ኢትዮጵያ በአንድ ሰሌዳ ላይ።",
    logoUrl: "/brand/logo.png",
    founded: "2011",
    city: "Addis Ababa",
  },
  hero: {
    videoUrl: "",
    posterUrl: "/images/hero-poster.jpg",
    eyebrow: "Ethiopian Kitchen · Addis Ababa",
    eyebrowAm: "የኢትዮጵያ እግር ምግብ · አዲስ አበባ",
    title: "Where Fire Meets Heritage",
    titleAm: "እሳትና ባህል ሲገናኙ",
    subtitle:
      "Slow berbere, smoky tibs and the ritual of buna — a flagship Ethiopian dining house in the heart of Addis Ababa. Family recipes, ember fire, zero shortcuts.",
    subtitleAm:
      "ቀስ ብሎ የተዘጋጀ በርበሬ፣ ጭስ ያለው ጥብስና የቡና ሥርዓት — በአዲስ አበባ ልብ የሚገኝ የቀደመት የኢትዮጵያ የምግብ ቤት።",
    cta1: { label: "Reserve a Table", href: "/reservations" },
    cta2: { label: "Explore the Menu", href: "/menu" },
  },
  contact: {
    phone: "+251911234567",
    whatsapp: "+251911234567",
    email: "hello@abemrestaurant.et",
    address: "Bole Road, behind Getu Commercial Center, Addis Ababa",
    addressAm: "ቦሌ መንገድ፣ ከጌቱ ንግድ ማዕከል ጀርባ፣ አዲስ አበባ",
  },
  hours: {
    monday: { open: "11:00", close: "23:00", closed: false },
    tuesday: { open: "11:00", close: "23:00", closed: false },
    wednesday: { open: "11:00", close: "23:00", closed: false },
    thursday: { open: "11:00", close: "23:00", closed: false },
    friday: { open: "11:00", close: "00:30", closed: false },
    saturday: { open: "10:00", close: "00:30", closed: false },
    sunday: { open: "10:00", close: "22:00", closed: false },
  },
  holidays: [],
  socials: {
    instagram: "https://instagram.com/abemrestaurant",
    facebook: "https://facebook.com/abemrestaurant",
    tiktok: "https://tiktok.com/@abemrestaurant",
    telegram: "https://t.me/abemrestaurant",
  },
  features: {
    ordering: true,
    delivery: true,
    tableQr: true,
    rewards: true,
    preOrders: false,
  },
  loyalty: {
    pointsPer100: 10,
    birthdayBonus: 200,
    referralPoints: 150,
    tiers: [
      { name: "Bronze", min: 0, perk: "5% off your birthday week" },
      { name: "Silver", min: 500, perk: "Free buna ceremony every visit" },
      { name: "Gold", min: 1500, perk: "Priority reservations + free tibs upgrade" },
      { name: "Ember", min: 4000, perk: "Chef's table tasting, twice a year" },
    ],
  },
  theme: { gold: "#e8a317", ember: "#b3261e" },
  banner: { enabled: false, text: "", textAm: "", href: "" },
  seo: {
    home: {
      title: "Abem Restaurant — Ethiopian Fire, Heritage & Flavor | Addis Ababa",
      description:
        "Abem is Addis Ababa's flagship Ethiopian dining house. Doro wat, kitfo, tibs and a full buna ceremony — reserve a table or order online.",
      ogImage: "/images/hero-poster.jpg",
    },
    menu: {
      title: "The Menu — Doro Wat, Kitfo, Tibs & the Fasting Table | Abem",
      description:
        "Explore Abem's full Ethiopian menu in English and Amharic. Fasting (Tsom) dishes, chef's picks and prices in ETB.",
      ogImage: "/images/dishes/doro-wat.jpg",
    },
    reservations: {
      title: "Reserve a Table | Abem Restaurant",
      description: "Book indoor, garden or VIP mesob seating at Abem Restaurant, Addis Ababa.",
      ogImage: "/images/interior.jpg",
    },
    about: {
      title: "Our Story — Fifteen Years of Fire | Abem Restaurant",
      description: "From a four-table injera bet to Addis Ababa's flagship Ethiopian dining house.",
      ogImage: "/images/interior.jpg",
    },
  },
  stats: { years: 15, dishes: 120, guests: 250000, awards: 18 },
  kitchen: { amberMinutes: 12, redMinutes: 22 },
  stations: {
    "fasting-vegan": "wat",
    "wat-alicha": "wat",
    "grill-tibs": "grill",
    "kitfo-raw": "cold",
    platters: "grill",
    "sides-breads": "grill",
    drinks: "drinks",
    desserts: "dessert",
    breakfast: "grill",
  },
};

type Json = Record<string, unknown>;

function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(base) || Array.isArray(patch)) return (patch as T) ?? base;
  if (typeof base === "object" && typeof patch === "object" && base !== null && patch !== null) {
    const out: Json = { ...(base as Json) };
    for (const [k, v] of Object.entries(patch as Json)) {
      const b = (base as Json)[k];
      out[k] = b !== undefined && typeof b === "object" && b !== null && !Array.isArray(b)
        ? deepMerge(b, v)
        : v;
    }
    return out as T;
  }
  return (patch as T) ?? base;
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.setting.findMany();
    let merged: SiteSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.key in merged) {
        merged = {
          ...merged,
          [row.key]: deepMerge((merged as unknown as Json)[row.key], row.value),
        };
      }
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettingsSection(key: keyof SiteSettings, value: unknown): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });
}

/** Settings that are safe to expose on the public API. */
export function publicSettings(s: SiteSettings) {
  return {
    site: s.site,
    hero: s.hero,
    contact: s.contact,
    hours: s.hours,
    holidays: s.holidays,
    socials: s.socials,
    features: s.features,
    loyalty: { tiers: s.loyalty.tiers, pointsPer100: s.loyalty.pointsPer100, birthdayBonus: s.loyalty.birthdayBonus, referralPoints: s.loyalty.referralPoints },
    banner: s.banner.enabled ? { enabled: true, text: s.banner.text, textAm: s.banner.textAm, href: s.banner.href } : { enabled: false, text: "", textAm: "", href: "" },
  };
}

export type PublicSettings = ReturnType<typeof publicSettings>;

/** Open / Closed right now, based on weekly hours + holidays. */
export function computeOpenNow(s: SiteSettings, now: Date = new Date()): { open: boolean; label: string } {
  const dayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
  const todayISO = now.toISOString().slice(0, 10);
  if (s.holidays?.includes(todayISO)) return { open: false, label: "Closed for holiday" };
  const h = s.hours?.[dayKey];
  if (!h || h.closed) return { open: false, label: "Closed today" };
  const mins = now.getHours() * 60 + now.getMinutes();
  const parse = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };
  let open = parse(h.open);
  let close = parse(h.close);
  if (close <= open) close += 24 * 60; // past midnight
  const isOpen = mins >= open && mins <= close;
  return { open: isOpen, label: isOpen ? "Open now" : "Closed now" };
}
