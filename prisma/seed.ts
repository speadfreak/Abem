/* ABEM RESTAURANT — seed script (idempotent).
   Run: bun prisma/seed.ts  */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";

/* Force-load project .env (shell may carry a stale DATABASE_URL). */
try {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
    if (m && m[1] && m[2] !== undefined) process.env[m[1]] = m[2];
  }
} catch {
  /* ignore */
}

const db = new PrismaClient();

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim();
}

async function upsertSetting(key: string, value: unknown) {
  await db.setting.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
}

async function main() {
  console.log("Seeding Abem Restaurant ...");

  /* ── Admin users ── */
  const ownerPw = await bcrypt.hash(process.env.SEED_OWNER_PASSWORD || "Abem@2024!", 11);
  await db.adminUser.upsert({
    where: { email: "owner@abemrestaurant.et" },
    update: { passwordHash: ownerPw, role: "OWNER", name: "Wubet Aberra", active: true },
    create: { email: "owner@abemrestaurant.et", passwordHash: ownerPw, name: "Wubet Aberra", role: "OWNER" },
  });
  const staffPw = await bcrypt.hash(process.env.SEED_STAFF_PASSWORD || "Staff@2024!", 11);
  await db.adminUser.upsert({
    where: { email: "staff@abemrestaurant.et" },
    update: { passwordHash: staffPw, role: "STAFF", name: "Front Desk", active: true },
    create: { email: "staff@abemrestaurant.et", passwordHash: staffPw, name: "Front Desk", role: "STAFF" },
  });

  /* ── Settings ── */
  await upsertSetting("site", {
    name: "Abem Restaurant",
    shortName: "Abem",
    tagline: "Where fire meets heritage — Ethiopia on one table.",
    taglineAm: "እሳትና ባህል ሲገናኙ፣ ኢትዮጵያ በአንድ ሰሌዳ ላይ።",
    logoUrl: "/brand/logo.png",
    founded: "2011",
    city: "Addis Ababa",
  });
  await upsertSetting("stats", { years: 15, dishes: 120, guests: 250000, awards: 18 });
  await upsertSetting("features", { ordering: true, delivery: true, tableQr: true, rewards: true, preOrders: false });
  await upsertSetting("loyalty", {
    pointsPer100: 10,
    birthdayBonus: 200,
    referralPoints: 150,
    tiers: [
      { name: "Bronze", min: 0, perk: "5% off your birthday week" },
      { name: "Silver", min: 500, perk: "Free buna ceremony with every visit" },
      { name: "Gold", min: 1500, perk: "Priority reservations + tibs upgrade" },
      { name: "Ember", min: 4000, perk: "Chef's table tasting, twice a year" },
    ],
  });

  /* ── Menu ── */
  const catDefs = [
    { slug: "breakfast", name: "Breakfast & Fasting Mornings", nameAm: "የጠዋት ምግብ", description: "Chechebsa, fuul and fasting classics from 10 AM.", station: "grill", image: "/images/dishes/chechebsa.jpg" },
    { slug: "fasting-vegan", name: "Fasting & Vegan (Tsom)", nameAm: "ጾም ምግቦች", description: "The vegan soul of the Ethiopian table — no animal products, full flavor.", station: "wat", image: "/images/dishes/beyaynetu.jpg" },
    { slug: "wat-alicha", name: "Wat & Alicha", nameAm: "ወጥና አልጫ", description: "Slow-simmered stews — the heart of every mesob.", station: "wat", image: "/images/dishes/doro-wat.jpg" },
    { slug: "grill-tibs", name: "Grill & Tibs", nameAm: "ጥብስና ግሪል", description: "From the charcoal grill, served still sizzling in shekla.", station: "grill", image: "/images/dishes/tibs.jpg" },
    { slug: "kitfo-raw", name: "Kitfo & Raw", nameAm: "ክትፎ", description: "Hand-minced prime beef, mitmita heat, kibbeh richness.", station: "cold", image: "/images/dishes/kitfo.jpg" },
    { slug: "platters", name: "Signature Platters", nameAm: "ልዩ ሰሌዳዎች", description: "Abem's family mesobs — built for gursha and conversation.", station: "grill", image: "/images/hero-poster.jpg" },
    { slug: "sides-breads", name: "Sides & Breads", nameAm: "ጎን ምግቦች", description: "Injera baked daily on teff from Gojjam, and everything beside it.", station: "grill", image: "/images/dishes/gomen.jpg" },
    { slug: "drinks", name: "Buna, Tej & Drinks", nameAm: "ቡና፣ ጠጅና መጠጦች", description: "The ceremony, the honey wine, and cold spris after.", station: "drinks", image: "/images/tej.jpg" },
    { slug: "desserts", name: "Desserts", nameAm: "ምግብ በኋላ", description: "A gentle, modern finish to a long lunch.", station: "dessert", image: "/images/spices.jpg" },
  ];

  const items: Array<{
    cat: string; name: string; nameAm: string; price: number; desc: string; descAm: string;
    img?: string; tags?: string[]; spicy?: number; fasting?: boolean; vegan?: boolean; pick?: boolean; featured?: boolean;
  }> = [
    { cat: "breakfast", name: "Chechebsa with Honey & Ayib", nameAm: "ጨጨብሳ", price: 260, desc: "Torn flatbread pan-tossed in berbere kibbeh, served with creamed honey and fresh ayib.", descAm: "በበርበሬ ቅቤ የተቀመጠ ጨጨብሳ ከማርና አይብ ጋር።", img: "/images/dishes/chechebsa.jpg", pick: true, featured: true },
    { cat: "breakfast", name: "Fuul with Fried Egg", nameAm: "ፉል", price: 220, desc: "Slow fava beans, tomato, green chili, cumin and a fried egg on top.", descAm: "ባቄላ ከቲማቲም፣ ከጤና ማርያም እና ከካሜን ጋር።" },
    { cat: "fasting-vegan", name: "Beyaynetu (Fasting Platter)", nameAm: "በያይነቱ", price: 450, desc: "The full vegan rainbow: misir, shiro, gomen, atkilt, timatim salata on injera.", descAm: "የጾም ምግብ ሰሌዳ፣ ምስር፣ ሽሮ፣ ጎመን፣ አትክልት በኢንጀራ።", img: "/images/dishes/beyaynetu.jpg", vegan: true, fasting: true, pick: true, featured: true },
    { cat: "fasting-vegan", name: "Shiro Fitfit", nameAm: "ሽሮ ፍርፍር", price: 320, desc: "Silky chickpea shiro folded through torn injera, finished with spiced oil.", descAm: "ሽሮ በተቀነሰ ኢንጀራ።", img: "/images/dishes/shiro.jpg", vegan: true, fasting: true, spicy: 1 },
    { cat: "fasting-vegan", name: "Gomen & Atkilt Sides", nameAm: "ጎመንና አትክልት", price: 210, desc: "Collard greens braised with garlic; cabbage and carrot simmered with turmeric.", descAm: "ጎመን ከነፍጠር እና ከዝንጅብል፣ አትክልት ከኢርብ ጋር።", img: "/images/dishes/gomen.jpg", vegan: true, fasting: true },
    { cat: "fasting-vegan", name: "Fasting Firfir", nameAm: "የጾም ፍርፍር", price: 300, desc: "Injera tossed in berbere-tomato sauce with roasted vegetables.", descAm: "ኢንጀራ በበርበሬ ሶስ ከአትክልት ጋር።", img: "/images/dishes/firfir.jpg", vegan: true, fasting: true, spicy: 2 },
    { cat: "fasting-vegan", name: "Misir Wot", nameAm: "ምስር ወጥ", price: 240, desc: "Red split lentils simmered deep in berbere and garlic.", descAm: "የምስር ወጥ በበርበሬ።", vegan: true, fasting: true, spicy: 2 },
    { cat: "wat-alicha", name: "Doro Wot", nameAm: "ዶሮ ወጥ", price: 680, desc: "Abem's crown: chicken slowly simmered 6 hours in berbere, crowned with a marinated egg. Sunday's smell, any day.", descAm: "ስድስት ሰዓት በበርበሬ የተበሰለ ዶሮ ወጥ ከእንቁላል ጋር።", img: "/images/dishes/doro-wat.jpg", spicy: 2, pick: true, featured: true },
    { cat: "wat-alicha", name: "Siga Wot (Beef)", nameAm: "ስጋ ወጥ", price: 590, desc: "Beef chunks folded into the same deep berbere base, richer and darker.", descAm: "የስጋ ወጥ በበርበሬ።", spicy: 2 },
    { cat: "wat-alicha", name: "Begie Alicha", nameAm: "በግ አልጫ", price: 560, desc: "Mild and golden — lamb with turmeric, ginger and green beans.", descAm: "በኢርብ የተዘጋጀ የበግ ስጋ።" },
    { cat: "wat-alicha", name: "Bozena Shiro", nameAm: "ቦዜና ሽሮ", price: 380, desc: "Shiro enriched with tender beef cubes — the best of both tables.", descAm: "ሽሮ ከስጋ ጋር።", spicy: 1 },
    { cat: "grill-tibs", name: "Shekla Lamb Tibs", nameAm: "የበግ ጥብስ", price: 720, desc: "Charcoal-grilled lamb, rosemary, jalapeno and onion, served screaming in a clay shekla.", descAm: "የበግ ጥብስ በሸክላ ከሮዝማሪ ጋር።", img: "/images/dishes/tibs.jpg", pick: true, featured: true, spicy: 1 },
    { cat: "grill-tibs", name: "Special Tibs Firfir", nameAm: "ልዩ ጥብስ ፍርፍር", price: 640, desc: "Grilled beef tossed with injera and berbere — the hangover king of Addis.", descAm: "ጥብስ ከኢንጀራ በበርበሬ።", spicy: 3 },
    { cat: "grill-tibs", name: "Derq Tibs (Dry)", nameAm: "ድርቅ ጥብስ", price: 580, desc: "Dry-fried beef cubes, crisp edges, awaze on the side.", descAm: "ድርቅ ጥብስ ከአዋዜ ጋር።" },
    { cat: "grill-tibs", name: "Chicken Zilzil Tibs", nameAm: "የዶሮ ጥብስ", price: 520, desc: "Stripped chicken seared hot with peppers and house berbere butter.", descAm: "የዶሮ ጥብስ በቅቤ እና በቃኚ።" },
    { cat: "kitfo-raw", name: "Abem Special Kitfo", nameAm: "ልዩ ክትፎ", price: 890, desc: "Hand-minced prime beef warmed in mitmita kibbeh, ayib and gomen beside. Our most photographed plate.", descAm: "በሚጥሚጣ ቅቤ የተቀመጠ ክትፎ ከአይብ ጋር።", img: "/images/dishes/kitfo.jpg", pick: true, featured: true, spicy: 2 },
    { cat: "kitfo-raw", name: "Kitfo Leb Leb", nameAm: "ክትፎ ለብ ለብ", price: 820, desc: "Half-warmed kitfo — the gentle middle road.", descAm: "አግማሚ የተሞቀ ክትፎ።", spicy: 1 },
    { cat: "kitfo-raw", name: "Gored Gored", nameAm: "ጎረድ ጎረድ", price: 780, desc: "Cubed raw beef tossed in kibbeh and awaze — no heat, no apology.", descAm: "ጎረድ ጎረድ በቅቤ።", spicy: 2 },
    { cat: "platters", name: "Abem Royal Mesob (for 4)", nameAm: "የአበም ሜሶብ (ለ4)", price: 2400, desc: "Doro wot, lamb tibs, special kitfo, begie alicha, misir, gomen, salad — the whole house on one injera. Built for gursha.", descAm: "ሁሉንም የቤታችን ምግብ በአንድ ኢንጀራ ላይ የሚያካትት ሰሌዳ።", img: "/images/hero-poster.jpg", featured: true, pick: true },
    { cat: "platters", name: "Habesha Night Platter (for 2)", nameAm: "የሐበሻ ምሽት (ለ2)", price: 1350, desc: "Tibs, doro wot, kitfo leb leb and the fasting garden — for sharing and slowing down.", descAm: "ጥብስ፣ ዶሮ ወጥ፣ ክትፎና የጾም ምግብ ለሁለት።", featured: true },
    { cat: "platters", name: "Mixed Grill Mesob", nameAm: "የድብልቅ ግሪል ሜሶብ", price: 1180, desc: "Lamb, chicken and beef from the charcoal grill with all sides.", descAm: "የተለያዩ የግሪል ስጋቶች በኢንጀራ።" },
    { cat: "sides-breads", name: "Fresh Teff Injera", nameAm: "የጤፍ ኢንጀራ", price: 60, desc: "Baked every morning on teff from Gojjam. The plate, the fork, the ritual.", descAm: "በጤፍ የተሰራ ኢንጀራ በየጠዋቱ።" },
    { cat: "sides-breads", name: "Ayib & Berbere Plate", nameAm: "አይብና በርበሬ", price: 140, desc: "Fresh cottage cheese with crushed berbere and oil.", descAm: "አይብ ከበርበሬ ጋር።", vegan: true },
    { cat: "sides-breads", name: "Timatim Salata", nameAm: "ቲማቲም ሰላጣ", price: 160, desc: "Tomato, onion, jalapeno, olive oil — cool and bright.", descAm: "ቲማቲም ሰላጣ።", vegan: true, fasting: true },
    { cat: "drinks", name: "Abem Buna Ceremony (3 cups)", nameAm: "የቡና ሥርዓት", price: 250, desc: "Green beans roasted at your table, frankincense smoke, three sini pours. Thirty unhurried minutes.", descAm: "በግቢያ ላይ የሚቀረጥ ቡና ሥርዓት ከእጣን ጋር።", img: "/images/coffee-ceremony.jpg", featured: true, pick: true },
    { cat: "drinks", name: "House Tej", nameAm: "የቤት ጠጅ", price: 180, desc: "Honey wine fermented in-house, served in the berele. Gentle strength.", descAm: "በቤት ውስጥ የተሠራ ጠጅ።", img: "/images/tej.jpg" },
    { cat: "drinks", name: "Spris (Layered Juice)", nameAm: "ስፕሪስ", price: 190, desc: "Avocado, mango and papaya layered like an Ethiopian sunset.", descAm: "አቮካዶ፣ ማንጎ እና ፓፓያ የተቀናበረ።", vegan: true },
    { cat: "drinks", name: "Spiced Shai", nameAm: "ሻይ", price: 90, desc: "Black tea with cinnamon, clove and cardamom.", descAm: "በከረሜላ የተፈላ ሻይ።", vegan: true },
    { cat: "drinks", name: "Ethiopian Macchiato", nameAm: "ማኪያቶ", price: 120, desc: "Double shot from Yirgacheffe beans, milk-first like Addis does it.", descAm: "ከይርጋጨፌ ቡና የተሠራ ማኪያቶ።" },
    { cat: "desserts", name: "Honey Yogurt & Roasted Buna Crumble", nameAm: "እርብ ከማር ጋር", price: 240, desc: "Set yogurt, local honey, crushed roasted coffee beans.", descAm: "እርብ ከማር እና ከሮስት ቡና ጋር።" },
    { cat: "desserts", name: "Ember Chocolate Fondant", nameAm: "የቺኮላታ ፎንዳንት", price: 280, desc: "Dark fondant with a whisper of berbere warmth, vanilla cream.", descAm: "ቺኮላታ ፎንዳንት በበርበሬ ጮታ።", pick: true },
    { cat: "desserts", name: "Fresh Fruit Mesob", nameAm: "የፍሬ ሜሶብ", price: 200, desc: "Seasonal fruit carved and arranged on a mini mesob.", descAm: "የወቅቱ ፍሬዎች።", vegan: true, fasting: true },
  ];

  for (const [i, c] of catDefs.entries()) {
    await db.menuCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameAm: c.nameAm, description: c.description, station: c.station, image: c.image, order: i, active: true },
      create: { ...c, order: i },
    });
  }
  const cats = await db.menuCategory.findMany();
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));

  for (const [i, it] of items.entries()) {
    const s = slug(it.name);
    await db.menuItem.upsert({
      where: { slug: s },
      update: {
        name: it.name, nameAm: it.nameAm, description: it.desc, descriptionAm: it.descAm,
        price: it.price, image: it.img, tags: (it.tags ?? []) as never,
        spicyLevel: it.spicy ?? 0, isVegan: !!it.vegan, isFasting: !!it.fasting,
        isChefPick: !!it.pick, isFeatured: !!it.featured, categoryId: catMap.get(it.cat)!,
        order: i, available: true,
      },
      create: {
        slug: s, name: it.name, nameAm: it.nameAm, description: it.desc, descriptionAm: it.descAm,
        price: it.price, image: it.img, tags: (it.tags ?? []) as never,
        spicyLevel: it.spicy ?? 0, isVegan: !!it.vegan, isFasting: !!it.fasting,
        isChefPick: !!it.pick, isFeatured: !!it.featured, categoryId: catMap.get(it.cat)!,
        order: i,
      },
    });
  }

  /* ── Gallery ── */
  const gallery = [
    { title: "The grand mesob", category: "food", url: "/images/hero-poster.jpg", order: 0 },
    { title: "Doro wot, six hours deep", category: "food", url: "/images/dishes/doro-wat.jpg", order: 1 },
    { title: "Shekla lamb tibs", category: "food", url: "/images/dishes/tibs.jpg", order: 2 },
    { title: "Special kitfo", category: "food", url: "/images/dishes/kitfo.jpg", order: 3 },
    { title: "The fasting rainbow", category: "food", url: "/images/dishes/beyaynetu.jpg", order: 4 },
    { title: "Shiro, swirled", category: "food", url: "/images/dishes/shiro.jpg", order: 5 },
    { title: "Buna ceremony", category: "coffee", url: "/images/coffee-ceremony.jpg", order: 6 },
    { title: "Tej in the berele", category: "coffee", url: "/images/tej.jpg", order: 7 },
    { title: "The dining hall at night", category: "interior", url: "/images/interior.jpg", order: 8 },
    { title: "Spice market mornings", category: "coffee", url: "/images/spices.jpg", order: 9 },
    { title: "Azmari night", category: "events", url: "/images/music.jpg", order: 10 },
    { title: "Garden weddings", category: "events", url: "/images/events.jpg", order: 11 },
    { title: "Gursha", category: "food", url: "/images/gursha.jpg", order: 12 },
    { title: "Chef Almaz", category: "team", url: "/images/chef.jpg", order: 13 },
  ];
  for (const g of gallery) {
    const exists = await db.galleryItem.findFirst({ where: { title: g.title } });
    if (!exists) await db.galleryItem.create({ data: { ...g } });
  }

  /* ── Team ── */
  const team = [
    { name: "Chef Almaz Bekele", role: "Executive Chef", bio: "Fifteen years at the berbere pot. Trained in her mother's kitchen in Gondar, sharpened in Addis. Guards the doro wot recipe like a national secret.", photo: "/images/chef.jpg", order: 0 },
    { name: "Dawit Tesfaye", role: "Head of the Grill", bio: "Charcoal whisperer. If the tibs aren't singing when they leave the shekla, they don't leave.", order: 1 },
    { name: "Hanna Girma", role: "Buna Ceremony Host", bio: "Roasts green beans tableside with the patience of the highlands. Ask her about the third cup.", order: 2 },
    { name: "Yonas Abebe", role: "General Manager", bio: "Runs the floor like an orchestra — gursha, tej and conversation in perfect time.", order: 3 },
  ];
  for (const t of team) {
    const exists = await db.teamMember.findFirst({ where: { name: t.name } });
    if (!exists) await db.teamMember.create({ data: { ...t } });
  }

  /* ── Testimonials ── */
  const quotes = [
    { name: "Selamawit T.", role: "Addis Ababa", quote: "The doro wot tastes like my grandmother's Sunday — but plated like Paris. I cried a little, then ordered more.", order: 0 },
    { name: "Marcus Bell", role: "Travel writer, London", quote: "Abem is the Ethiopian meal I measure all others against. The buna ceremony alone is worth the flight.", order: 1 },
    { name: "Hirut M.", role: "Gourmet Club chair", quote: "We came for the kitfo and stayed until the tej ran out. Service feels like family, not staff.", order: 2 },
    { name: "Daniel Kim", role: "Chef, Seoul", quote: "That shekla tibs — smoke, rosemary, fire — is one of the best plates I ate this year, anywhere.", order: 3 },
  ];
  for (const q of quotes) {
    const exists = await db.testimonial.findFirst({ where: { name: q.name } });
    if (!exists) await db.testimonial.create({ data: { ...q } });
  }

  /* ── FAQs ── */
  const faqs = [
    { question: "Do you take reservations for the buna ceremony?", answer: "Yes — the ceremony runs tableside all day and every seated table can request it. For groups over 8 we recommend reserving 48 hours ahead so we roast enough beans.", order: 0 },
    { question: "How spicy is Abem food, really?", answer: "Every dish shows a berbere heat level (0-3). Kitfo and tibs firfir run hot; alicha dishes are mild. Our kitchen will happily adjust — just note it when ordering.", order: 1 },
    { question: "Is there a full fasting (Tsom) menu?", answer: "Around a third of our menu is fasting: beyaynetu, shiro, misir, gomen, fasting firfir and more. It is a first-class menu, not an afterthought.", order: 2 },
    { question: "Do you host weddings and corporate events?", answer: "Our garden seats 300 under the lights and our VIP mesobs host private tastings. See the Events page — our team replies within one business day.", order: 3 },
    { question: "Where do you deliver?", answer: "Across Addis Ababa — Bole, Kazanchis, Piassa, CMC and Haya Hulet zones, with landmark-based addresses and live tracking.", order: 4 },
    { question: "Is the restaurant family friendly?", answer: "Very. Gursha is a family tradition and children are welcome; high chairs and a gentler-spice kids' mesob are always available.", order: 5 },
  ];
  for (const f of faqs) {
    const exists = await db.faq.findFirst({ where: { question: f.question } });
    if (!exists) await db.faq.create({ data: { ...f } });
  }

  /* ── Event packages ── */
  const packs = [
    { slug: "garden-wedding", title: "The Garden Wedding", description: "A candlelit garden feast for up to 300 guests: grand mesobs, live azmari band, tej bar and a private buna pavilion. Our events team choreographs every gursha.", capacity: "Up to 300 guests", priceFrom: 95000, image: "/images/events.jpg", features: ["Full garden takeover", "Live azmari + krar band", "Custom mesob centerpieces", "Dedicated host team", "Photography corners"] },
    { slug: "corporate-mesob", title: "Corporate Mesob", description: "Boardroom dinners, launch nights and team feasts. Screen, projector, halal and fasting menus, and an invoice your finance team will love.", capacity: "Up to 80 guests", priceFrom: 35000, image: "/images/interior.jpg", features: ["Private hall + AV", "Set mesob menus from ETB 950", "Fasting & international options", "Company branding on menus", "Receipt & invoice ready"] },
    { slug: "birthday-habesha", title: "Habesha Birthday Night", description: "A birthday the old way: your table decorated in teff grass, a cake reveal with ember sparklers, and a gift from our kitchen.", capacity: "Up to 30 guests", priceFrom: 12000, image: "/images/music.jpg", features: ["Grass-decorated tables", "Azmari serenade", "Custom spice-level cake menu", "Birthday gift from the chef"] },
    { slug: "private-vip", title: "The Ember Room (VIP Dining)", description: "One table, one chef, one night. A seven-course tasting of Ethiopia — doro wot consomme, kitfo tartare, tej pairing — for eight seats.", capacity: "8 seats", priceFrom: 28000, image: "/images/chef.jpg", features: ["7-course chef's tasting", "Tej & single-origin buna pairing", "Kitchen tour with the chef", "One booking per night"] },
  ];
  for (const p of packs) {
    await db.eventPackage.upsert({ where: { slug: p.slug }, update: { ...p, features: p.features as never }, create: { ...p, features: p.features as never } });
  }

  /* ── Stories ── */
  const stories = [
    {
      slug: "the-coffee-ceremony-guide",
      title: "The Buna Ceremony: A Field Guide to Three Cups",
      excerpt: "Abol, tona, baraka. Why the third cup matters, why the grass on the floor smells like every Ethiopian childhood, and how we roast at your table.",
      content: "There is a moment, about twenty minutes into the ceremony, when the jebena begins to sing.\n\nThe green beans have already been washed and roasted in front of you — the pan pulled off the coals exactly when the first crack quiets. The smoke is folded across the table so you can breathe it. Frankincense has been lit on the coals beside you. The grass scattered on the floor was cut this morning.\n\nAbol arrives first: small, dark, unfiltered. You do not rush it. Tona follows, softer. Baraka, the third cup, is said to confer a blessing — and by then the conversation has stopped being polite and started being true.\n\nAt Abem we run the ceremony tableside because coffee here was never a product. It is choreography, hospitality and time. Thirty unhurried minutes. Come hungry for patience.",
      cover: "/images/coffee-ceremony.jpg", category: "culture", tags: ["coffee", "ceremony", "culture"], readMinutes: 5, published: true,
    },
    {
      slug: "injera-soul-of-the-table",
      title: "Injera: The Soul of the Table",
      excerpt: "Teff from Gojjam, three days of fermentation, and the plate that is also the cutlery. A love letter to the hardest working flatbread on earth.",
      content: "Ask any Ethiopian what they miss most when abroad. Injera. Always injera.\n\nOurs starts with teff from the Gojjam highlands — the smallest grain on earth, iron-rich and gluten-free. The batter ferments for three days in clay; the slurry bubbles like a small weather system. When the mitad is right, one pour, one swirl, one hundred and eighty seconds, and the bread lifts with a thousand eyes staring back.\n\nInjera is plate, fork and napkin in one. You eat from the same platter as your family — and gursha, the act of feeding another by hand, turns a meal into an embrace.\n\nWe bake every morning. By noon the smell reaches the street. That smell is the front door of this house.",
      cover: "/images/dishes/beyaynetu.jpg", category: "craft", tags: ["injera", "teff", "craft"], readMinutes: 4, published: true,
    },
    {
      slug: "behind-abems-berbere",
      title: "Behind Abem's Berbere: Sixteen Spices, One Flame",
      excerpt: "We toast and grind our berbere weekly. Meet the sixteen spices, the market women who supply them, and the stew pot that never truly goes cold.",
      content: "The base of everything we cook is berbere — and ours is not bought.\n\nEvery Monday, before service, we toast and grind sixteen spices: chili from the south, garlic and ginger dried on the roof, fenugreek, cardamom, korarima, rue, ajwain, sacred basil. The kitchen smells like a spice market having a good dream.\n\nDoro wot begins with four kilograms of onions sweating in niter kibbeh — clarified butter simmered with besobela and koseret until it smells like a highland meadow. Six hours later, the sauce has gone from gold to rust to deep red-brown. The egg is marinated in lime and berbere overnight.\n\nChef Almaz tasted it this morning and said: 'Close. Tomorrow, perfect.' That is the standard. It never ends.",
      cover: "/images/spices.jpg", category: "kitchen", tags: ["berbere", "spices", "kitchen"], readMinutes: 6, published: true,
    },
  ];
  for (const s of stories) {
    await db.story.upsert({ where: { slug: s.slug }, update: { ...s, tags: s.tags as never, publishedAt: new Date() }, create: { ...s, tags: s.tags as never, publishedAt: new Date() } });
  }

  /* ── Careers ── */
  const openings = [
    { title: "Waiter / Waitress", type: "FULL_TIME", description: "Run the floor with warmth and precision. Gursah etiquette training provided. Prior experience loved, attitude required.", order: 0 },
    { title: "Line Cook — Grill Station", type: "FULL_TIME", description: "Charcoal grill and shekla work under Dawit. Knife skills and heat tolerance essential.", order: 1 },
    { title: "Buna Ceremony Host", type: "FULL_TIME", description: "Roast, pour and tell the story of Ethiopian coffee at guest tables. English and Amharic.", order: 2 },
    { title: "Delivery Rider", type: "PART_TIME", description: "Motorbike courier for Abem Flow delivery zones. Know Addis shortcuts? We need you.", order: 3 },
  ];
  for (const o of openings) {
    const exists = await db.careerOpening.findFirst({ where: { title: o.title } });
    if (!exists) await db.careerOpening.create({ data: { ...o } });
  }

  /* ── Branches ── */
  await db.branch.upsert({
    where: { id: "branch-bole" },
    update: {},
    create: {
      id: "branch-bole",
      name: "Abem Bole (Flagship)",
      address: "Bole Road, behind Getu Commercial Center, Addis Ababa",
      addressAm: "ቦሌ መንገድ፣ ከጌቱ ንግድ ማዕከል ጀርባ",
      phone: "+251911234567",
      mapEmbedUrl: "https://www.google.com/maps?q=Bole+Addis+Ababa&output=embed",
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=Bole+Addis+Ababa",
      isPrimary: true, order: 0,
    },
  });
  await db.branch.upsert({
    where: { id: "branch-kazanchis" },
    update: {},
    create: {
      id: "branch-kazanchis",
      name: "Abem Kazanchis",
      address: "Congo Street, near Radisson Blu, Kazanchis, Addis Ababa",
      addressAm: "ኮንጎ መንገድ፣ ከራዲሰን ብሉ አጠገብ",
      phone: "+251911987654",
      mapEmbedUrl: "https://www.google.com/maps?q=Kazanchis+Addis+Ababa&output=embed",
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=Kazanchis+Addis+Ababa",
      isPrimary: false, order: 1,
    },
  });

  /* ── Delivery zones ── */
  const zones = [
    { name: "Bole", fee: 60, minOrder: 300, etaMin: 25, etaMax: 45, order: 0 },
    { name: "Kazanchis", fee: 70, minOrder: 300, etaMin: 30, etaMax: 50, order: 1 },
    { name: "Haya Hulet", fee: 80, minOrder: 400, etaMin: 35, etaMax: 60, order: 2 },
    { name: "Piassa", fee: 90, minOrder: 400, etaMin: 40, etaMax: 65, order: 3 },
    { name: "CMC / Summit", fee: 110, minOrder: 500, etaMin: 45, etaMax: 75, order: 4 },
  ];
  const existingZones = await db.deliveryZone.findMany();
  if (!existingZones.length) for (const z of zones) await db.deliveryZone.create({ data: z });

  /* ── Tables ── */
  const existingTables = await db.diningTable.count();
  if (!existingTables) {
    for (let i = 1; i <= 12; i++) {
      await db.diningTable.create({
        data: {
          label: `T${String(i).padStart(2, "0")}`,
          seats: i <= 8 ? 4 : 8,
          zone: i <= 6 ? "indoor" : i <= 10 ? "garden" : "vip",
          qrToken: `abem-t${String(i).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8)}`,
        },
      });
    }
  }

  /* ── Riders ── */
  const riderCount = await db.rider.count();
  if (!riderCount) {
    await db.rider.createMany({
      data: [
        { name: "Abel Mekonnen", phone: "+251911000101", status: "AVAILABLE" },
        { name: "Samuel Fikadu", phone: "+251911000102", status: "AVAILABLE" },
        { name: "Kalkidan Bekele", phone: "+251911000103", status: "AVAILABLE" },
      ],
    });
  }

  /* ── Coupons ── */
  await db.coupon.upsert({
    where: { code: "ABEM10" },
    update: {},
    create: { code: "ABEM10", type: "PERCENT", value: 10, minOrder: 500, active: true },
  });
  await db.coupon.upsert({
    where: { code: "FIRSTFEAST" },
    update: {},
    create: { code: "FIRSTFEAST", type: "FIXED", value: 100, minOrder: 500, active: true },
  });

  /* ── Demo reservations ── */
  const resCount = await db.reservation.count();
  if (!resCount) {
    const tomorrow = new Date(Date.now() + 86400000);
    await db.reservation.createMany({
      data: [
        { code: "RES-DEMO01", name: "Aster Tesfaye", email: "aster@example.com", phone: "+251911111111", date: tomorrow, time: "19:00", party: 4, area: "garden", occasion: "Anniversary", status: "CONFIRMED" },
        { code: "RES-DEMO02", name: "John Fletcher", email: "john@example.com", phone: "+251922222222", date: tomorrow, time: "20:30", party: 2, area: "indoor", occasion: "", status: "PENDING" },
        { code: "RES-DEMO03", name: "Meron Haile", phone: "+251933333333", date: tomorrow, time: "13:00", party: 8, area: "vip", occasion: "Business lunch", status: "CONFIRMED" },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
