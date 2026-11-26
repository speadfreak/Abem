/* ABEM i18n — lightweight EN/AM dictionary.
   Content (menu, CMS pages) carries its own en/am fields; this
   dictionary covers shared UI chrome. Missing keys fall back to EN. */

export const dictionary = {
  nav: {
    home: { en: "Home", am: "መነሻ" },
    menu: { en: "Menu", am: "ምግቦች" },
    about: { en: "About", am: "ስለ እኛ" },
    reservations: { en: "Reservations", am: "ቦታ ማስያዝ" },
    experience: { en: "Experience", am: "ልምድ" },
    gallery: { en: "Gallery", am: "ማዕከለ-ስዕላት" },
    events: { en: "Events", am: "ስነ-ሥርዓቶች" },
    contact: { en: "Contact", am: "አግኙን" },
    order: { en: "Order", am: "አዘዙ" },
    rewards: { en: "Rewards", am: "ሽልማቶች" },
    stories: { en: "Stories", am: "ታሪኮች" },
    track: { en: "Track order", am: "ትዕዛዝ ይከታተሉ" },
    careers: { en: "Careers", am: "ሥራ መደቦች" },
  },
  common: {
    reserve: { en: "Reserve a Table", am: "ሰሌዳ ያስይዙ" },
    exploreMenu: { en: "Explore the Menu", am: "ምናሌውን ይመልከቱ" },
    orderNow: { en: "Order Now", am: "አሁን ያዘዙ" },
    callUs: { en: "Call Us", am: "ይደውሉልን" },
    whatsapp: { en: "WhatsApp", am: "ዋትስአፕ" },
    openNow: { en: "Open now", am: "ክፍት ነው" },
    closedNow: { en: "Closed now", am: "ተዘግቷል" },
    viewAll: { en: "View all", am: "ሁሉንም ይመልከቱ" },
    loading: { en: "Loading", am: "በመጫን ላይ" },
    send: { en: "Send", am: "ላኩ" },
    submitted: { en: "Submitted", am: "ተልኳል" },
    etb: { en: "ETB", am: "ብር" },
    spicy: { en: "Spicy", am: "ተመጣጣኝ" },
    chefsPick: { en: "Chef's pick", am: "የሼፍ ምርጫ" },
    vegan: { en: "Vegan", am: "ተክልያዊ" },
    fasting: { en: "Fasting (Tsom)", am: "ጾም" },
    soldOut: { en: "86'd — sold out", am: "አልቋል" },
    scroll: { en: "Scroll", am: "ወደ ታች" },
  },
  footer: {
    quickLinks: { en: "Quick links", am: "ፈጣን አገናኞች" },
    hours: { en: "Opening hours", am: "የክፍት ሰዓታት" },
    newsletter: { en: "Join the table", am: "ወደ ሰሌዳው ይቀላቀሉ" },
    newsletterSub: { en: "Seasonal menus, ceremony nights and member tables. One email a month.", am: "ወቅታዊ ምናሌዎች፣ የቡና ምሽቶች። በወር አንድ ኢሜይል።" },
    subscribe: { en: "Subscribe", am: "ይመዝገቡ" },
    emailPlaceholder: { en: "you@example.com", am: "ኢሜይልዎ" },
    rights: { en: "All rights reserved.", am: "መብቱ በህግ የተጠበቀ ነው።" },
    credit: { en: "Designed & Developed by Joseph James", am: "በጆሴፍ ጀምስ የቀረጠና የተሰራ" },
  },
} as const;

export type DictionaryKey = string;

export function translate(key: DictionaryKey, lang: "en" | "am"): string {
  const parts = key.split(".");
   
  let node: any = dictionary;
  for (const p of parts) {
    if (node === undefined || node === null) break;
    node = node[p];
  }
  if (!node) return key;
  if (typeof node === "string") return node;
  return (node?.[lang] as string) ?? (node?.en as string) ?? key;
}

export type Lang = "en" | "am";
