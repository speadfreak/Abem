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
  const adminPw = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin_password", 11);
  await db.adminUser.upsert({
    where: { email: "admin@gmail.com" },
    update: { passwordHash: adminPw, role: "OWNER", name: "Abem Admin", active: true },
    create: { email: "admin@gmail.com", passwordHash: adminPw, name: "Abem Admin", role: "OWNER" },
  });
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
    tagline: "Luxurious flavor, fired daily — Addis Ababa's flame kitchen.",
    taglineAm: "በእሳት የሚቀጣይ ጥሩ ጣዕም — የአዲስ አበባ የእሳት ኩሽን።",
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
      { name: "Silver", min: 500, perk: "Free macchiato with every visit" },
      { name: "Gold", min: 1500, perk: "Priority reservations + free fries upgrade" },
      { name: "Ember", min: 4000, perk: "Chef's table tasting, twice a year" },
    ],
  });

  /* ── Menu — luxe flame kitchen: burgers, pizza, shawarma, chicken + heritage corner ── */
  const catDefs = [
    { slug: "burgers", name: "Flame-Grilled Burgers", nameAm: "በርገር", description: "Ground fresh every morning, seared over real flame, stacked tall on toasted brioche.", station: "grill", image: "/images/dishes/burger.jpg" },
    { slug: "pizza", name: "Wood-Fired Pizza", nameAm: "ፒዛ", description: "Two-day cold-fermented dough, leopard-spotted crust from the wood oven.", station: "oven", image: "/images/dishes/pizza.jpg" },
    { slug: "shawarma-wraps", name: "Shawarma & Wraps", nameAm: "ሻዋርማና ሪፖ", description: "Marinated overnight, carved off the spit to order, wrapped hot.", station: "grill", image: "/images/dishes/shawarma.jpg" },
    { slug: "chicken", name: "Fried & Grilled Chicken", nameAm: "ዶሮ ስጋ", description: "Buttermilk-brined, double-dredged and fried to a golden shatter.", station: "fry", image: "/images/dishes/fried-chicken.jpg" },
    { slug: "sandwiches", name: "Sandwiches & Melts", nameAm: "ሳንድዊች", description: "Toasted, stacked and pressed — from the club classic to our injera fusion roll.", station: "grill", image: "/images/dishes/club-sandwich.jpg" },
    { slug: "sides", name: "Sides & Bites", nameAm: "ጎን ምግቦች", description: "Golden fries, loaded baskets and everything that makes the meal.", station: "fry", image: "/images/dishes/loaded-fries.jpg" },
    { slug: "heritage", name: "Ethiopian Heritage Corner", nameAm: "የባህል ምግቦች", description: "Where the fire started — chechebsa mornings, firfir, fasting classics and buna. Never leaving the menu.", station: "wat", image: "/images/dishes/chechebsa.jpg" },
    { slug: "drinks", name: "Shakes, Buna & Drinks", nameAm: "መጠጦች", description: "Thick shakes, the buna ceremony, tej and cold spris after.", station: "drinks", image: "/images/dishes/milkshake.jpg" },
    { slug: "desserts", name: "Desserts", nameAm: "ምግብ በኋላ", description: "A gentle, decadent finish to a fast lunch.", station: "dessert", image: "/images/spices.jpg" },
  ];

  /* Categories retired by the repositioning — hidden from the public menu. */
  const retiredSlugs = ["breakfast", "fasting-vegan", "wat-alicha", "grill-tibs", "kitfo-raw", "platters", "sides-breads"];

  const items: Array<{
    cat: string; name: string; nameAm: string; price: number; desc: string; descAm: string;
    img?: string; tags?: string[]; spicy?: number; fasting?: boolean; vegan?: boolean; pick?: boolean; featured?: boolean;
  }> = [
    /* Burgers */
    { cat: "burgers", name: "The Abem Flame Burger", nameAm: "የአበም ፍሌም በርገር", price: 550, desc: "Double flame-grilled beef patties, aged cheddar, ember mayo, pickles and charred onion on toasted brioche. Our signature.", descAm: "በእሳት የተጠበሰ ድርብ የበሬ ስጋ ከቺዳር አይብ ጋር።", img: "/images/dishes/burger.jpg", pick: true, featured: true, spicy: 1 },
    { cat: "burgers", name: "Crispy Chicken Burger", nameAm: "የዶሮ በርገር", price: 480, desc: "Buttermilk-brined chicken fillet, double-dredged and fried shatter-crisp, spicy honey mayo, pickles.", descAm: "ገርጅ ያለ የዶሮ ስጋ በርገር ከቃኚ ማዮ ጋር።", img: "/images/dishes/chicken-burger.jpg", featured: true, spicy: 1 },
    { cat: "burgers", name: "Smoky BBQ Bacon Burger", nameAm: "የቤን በርገር", price: 590, desc: "Flame-grilled beef, crispy beef bacon, smoked BBQ glaze, melted cheddar and onion rings inside the stack.", descAm: "በባርቤኪው ሶስ የተቀመጠ የበሬ ስጋ በርገር።", spicy: 0 },
    { cat: "burgers", name: "Mushroom Swiss Burger", nameAm: "የእርጎጡ እርጎጡ", price: 520, desc: "Grilled beef, garlicky roasted mushrooms, melted Swiss cheese and truffle mayo on brioche.", descAm: "ከእንጉዳይ እና ከስዊስ አይብ ጋር የተሠራ በርገር።" },
    { cat: "burgers", name: "Berbere Smash Burger", nameAm: "የበርበሬ በርገር", price: 540, desc: "Where heritage meets the grill: double smash patties glazed in berbere honey butter, ayib slaw, hot on a potato bun.", descAm: "የባህልና የግሪል ግጠፍ — በበርበሬ ቅቤ የተቀመጠ በርገር።", pick: true, spicy: 2 },

    /* Pizza */
    { cat: "pizza", name: "Ember Pepperoni", nameAm: "የፔፐሮኒ ፒዛ", price: 650, desc: "Cup-and-char pepperoni, molten mozzarella, hot honey drizzle and basil over two-day dough.", descAm: "በእሳት የተሠራ ፔፐሮኒ ፒዛ ከሞቃላ አይብ ጋር።", img: "/images/dishes/pizza.jpg", pick: true, featured: true },
    { cat: "pizza", name: "Margherita Classica", nameAm: "ማርጋሪታ", price: 550, desc: "San Marzano tomato, fior di latte, torn basil and a whisper of olive oil. Simple, perfect.", descAm: "በቲማቲም፣ በአይብ እና በባሲል የተሠራ ክላሲክ ፒዛ።", featured: true },
    { cat: "pizza", name: "Berbere Chicken Pizza", nameAm: "የበርበሬ ዶሮ ፒዛ", price: 720, desc: "Flame-grilled chicken tossed in berbere honey glaze, red onion, green chili and mozzarella — Addis meets Naples.", descAm: "በበርበሬ የተጠበሰ የዶሮ ስጋ ከአይብ ጋር።", pick: true, spicy: 2 },
    { cat: "pizza", name: "Four Cheese Ember", nameAm: "የአራት አይብ ፒዛ", price: 690, desc: "Mozzarella, cheddar, gouda and blue cheese with a honey finish and cracked pepper.", descAm: "የአራት ዓይነት አይብ ፒዛ።" },
    { cat: "pizza", name: "Garden Veggie Pizza", nameAm: "የአትክልት ፒዛ", price: 580, desc: "Roasted peppers, mushrooms, olives, red onion and cherry tomatoes — vegan cheese on request.", descAm: "በአትክልት የተሠራ ፒዛ።", vegan: true, fasting: true },

    /* Shawarma & Wraps */
    { cat: "shawarma-wraps", name: "Abem Chicken Shawarma", nameAm: "የዶሮ ሻዋርማ", price: 420, desc: "Overnight-marinated chicken carved off the spit, garlic toum, pickles and fries wrapped in grilled flatbread.", descAm: "ከላም ላይ የተከረደ የዶሮ ሻዋርማ ከነፍጠር።", img: "/images/dishes/shawarma.jpg", pick: true, featured: true },
    { cat: "shawarma-wraps", name: "Beef Shawarma Plate", nameAm: "የበሬ ሻዋርማ ሰሌዳ", price: 560, desc: "Spiced beef shawarma over fries and garlic sauce, served open with pickles and warm bread — no wrap needed.", descAm: "የበሬ ሻዋርማ በፍሬንዝ ፋይትስ።", spicy: 1 },
    { cat: "shawarma-wraps", name: "Ember Lamb Wrap", nameAm: "የበግ ሪፖ", price: 540, desc: "Charcoal-grilled lamb, tahini-yogurt, charred peppers and sumac onion in a warm roll.", descAm: "የበግ ስጋ በታሂኒ ሶስ።", spicy: 1 },
    { cat: "shawarma-wraps", name: "Fasting Veggie Wrap", nameAm: "የጾም ሪፖ", price: 350, desc: "Spiced chickpea and roasted-vegetable wrap with tahini, greens and pickles — fully vegan.", descAm: "በአትክልት የተሠራ ሪፖ።", vegan: true, fasting: true },

    /* Chicken */
    { cat: "chicken", name: "Crispy Fried Chicken (3 pc)", nameAm: "ገርጅ ዶሮ (3)", price: 490, desc: "Buttermilk-brined, double-dredged, fried golden with honey-mustard and house dips.", descAm: "በብትርሚልክ የተቀመጠ ገርጅ የዶሮ ስጋ።", img: "/images/dishes/fried-chicken.jpg", pick: true, featured: true },
    { cat: "chicken", name: "Ember Buffalo Wings (6 pc)", nameAm: "ቡፋሎ ኪንግስ (6)", price: 450, desc: "Double-fried wings glazed in smoky ember buffalo sauce, blue-cheese or ranch dip.", descAm: "በቡፋሎ ሶስ የተቀመጡ ኪንግስ።", img: "/images/dishes/wings.jpg", featured: true, spicy: 2 },
    { cat: "chicken", name: "Grilled Half Chicken", nameAm: "የግሪል ዶሮ", price: 620, desc: "Half chicken over charcoal, basted in berbere butter, with fries and salad.", descAm: "በእሳት የተጠበሰ የዶሮ ስጋ በቅቤ።", spicy: 1 },
    { cat: "chicken", name: "Chicken Tenders & Fries", nameAm: "ቼክን ቴንደርስ", price: 420, desc: "Crispy buttermilk tenders, seasoned fries, honey mustard — the family favorite.", descAm: "ገርጅ የዶሮ ስጋ ከፍሬንዝ ፋይትስ ጋር።" },

    /* Sandwiches */
    { cat: "sandwiches", name: "The Club Sandwich", nameAm: "ክላብ ሳንድዊች", price: 450, desc: "Triple-decker toasted sourdough: grilled chicken, crispy beef bacon, fried egg, cheese and tomato with fries.", descAm: "በሶርዶ ዳቦ የተሠራ ክላብ ሳንድዊች።", img: "/images/dishes/club-sandwich.jpg", featured: true },
    { cat: "sandwiches", name: "Firfir Injera Roll", nameAm: "የፍርፍር ሮል", price: 380, desc: "Heritage fusion: soft injera rolled around spiced firfir beef, berbere butter glaze, ayib dip. Old flavor, new shape.", descAm: "ፍርፍር በኢንጀራ ተጠቅሎ የቀረበ — የባህል ጣዕም በአዲስ ቅርጽ።", img: "/images/dishes/injera-sandwich.jpg", pick: true, spicy: 2 },
    { cat: "sandwiches", name: "Grilled Cheese Melt", nameAm: "ግሪልድ ቺዝ", price: 320, desc: "Three cheeses pressed between butter-toasted sourdough until molten. Tomato soup dip on the side.", descAm: "በሶስት ዓይነት አይብ የተሠራ ሳንድዊች።", vegan: false, fasting: false },
    { cat: "sandwiches", name: "Philly Cheesesteak", nameAm: "ፊሊ ቺዝስቴክ", price: 520, desc: "Thin-sliced seared beef, peppers, onions and molten cheese in a toasted roll.", descAm: "የበሬ ስጋ ከአይብ በተጠበሰ ዳቦ።", spicy: 1 },

    /* Sides & Bites */
    { cat: "sides", name: "Abem Loaded Fries", nameAm: "የተጭነ ፍሬንዝ ፋይትስ", price: 380, desc: "Golden fries smothered in cheese sauce, beef crumbles, jalapeño and spring onion — a meal disguised as a side.", descAm: "በአይብ ሶስ የተጭነ ፍሬንዝ ፋይትስ።", img: "/images/dishes/loaded-fries.jpg", featured: true, pick: true },
    { cat: "sides", name: "Seasoned Fries", nameAm: "ፍሬንዝ ፋይትስ", price: 180, desc: "Twice-cooked, paprika-dusted, sea-salted. Crisp outside, cloud inside.", descAm: "በቃኚ የተቀመጡ ፍሬንዝ ፋይትስ።", img: "/images/dishes/fries.jpg", vegan: true },
    { cat: "sides", name: "Onion Rings", nameAm: "የሽንኩርት ቀለበቶች", price: 220, desc: "Thick-cut rings in crackling batter with ember mayo dip.", descAm: "ገርጅ የሽንኩርት ቀለበቶች።", vegan: true },
    { cat: "sides", name: "Garden Salad", nameAm: "የአትክልት ሰላጣ", price: 260, desc: "Crisp romaine, cherry tomato, cucumber ribbons, avocado and toasted seeds with lemon-olive dressing.", descAm: "በአትክልት የተሠራ ሰላጣ።", img: "/images/dishes/fresh-salad.jpg", vegan: true, fasting: true },
    { cat: "sides", name: "Timatim Salata", nameAm: "ቲማቲም ሰላጣ", price: 160, desc: "The heritage side: tomato, onion, jalapeño and olive oil — cool and bright.", descAm: "ቲማቲም ሰላጣ።", vegan: true, fasting: true },

    /* Heritage corner */
    { cat: "heritage", name: "Chechebsa with Honey & Ayib", nameAm: "ጨጨብሳ", price: 260, desc: "Torn flatbread pan-tossed in berbere kibbeh, served with creamed honey and fresh ayib. Where mornings began.", descAm: "በበርበሬ ቅቤ የተቀመጠ ጨጨብሳ ከማርና አይብ ጋር።", img: "/images/dishes/chechebsa.jpg", pick: true, featured: true },
    { cat: "heritage", name: "Fasting Firfir", nameAm: "የጾም ፍርፍር", price: 300, desc: "Injera tossed in berbere-tomato sauce with roasted vegetables — fully vegan heritage.", descAm: "ኢንጀራ በበርበሬ ሶስ ከአትክልት ጋር።", img: "/images/dishes/firfir.jpg", vegan: true, fasting: true, spicy: 2 },
    { cat: "heritage", name: "Beyaynetu (Fasting Platter)", nameAm: "በያይነቱ", price: 450, desc: "The vegan rainbow: misir, shiro, gomen, atkilt and timatim salata on fresh teff injera.", descAm: "የጾም ምግብ ሰሌዳ፣ ምስር፣ ሽሮ፣ ጎመን፣ አትክልት በኢንጀራ።", img: "/images/dishes/beyaynetu.jpg", vegan: true, fasting: true, pick: true },
    { cat: "heritage", name: "Shekla Lamb Tibs", nameAm: "የበግ ጥብስ", price: 720, desc: "Charcoal-grilled lamb, rosemary, jalapeño and onion, served still singing in a clay shekla.", descAm: "የበግ ጥብስ በሸክላ ከሮዝማሪ ጋር።", img: "/images/dishes/tibs.jpg", pick: true, spicy: 1 },
    { cat: "heritage", name: "Abem Special Kitfo", nameAm: "ልዩ ክትፎ", price: 890, desc: "Hand-minced prime beef warmed in mitmita kibbeh, ayib and gomen beside. Our most photographed plate.", descAm: "በሚጥሚጣ ቅቤ የተቀመጠ ክትፎ ከአይብ ጋር።", img: "/images/dishes/kitfo.jpg", pick: true, spicy: 2 },
    { cat: "heritage", name: "Fresh Teff Injera", nameAm: "የጤፍ ኢንጀራ", price: 60, desc: "Baked every morning on teff from Gojjam. The plate, the fork, the ritual.", descAm: "በጤፍ የተሠራ ኢንጀራ በየጠዋቱ።", vegan: true },

    /* Drinks */
    { cat: "drinks", name: "Vanilla-Caramel Buna Shake", nameAm: "ቫኒላ ሺክ", price: 260, desc: "Thick vanilla shake swirled with caramel and toasted buna beans. Dessert you can drink.", descAm: "ቫኒላ ከካራሜል ጋር የተቀናበረ ሺክ።", img: "/images/dishes/milkshake.jpg", featured: true, pick: true },
    { cat: "drinks", name: "Chocolate Ember Shake", nameAm: "ቺኮላታ ሺክ", price: 260, desc: "Double chocolate, whipped cream and a whisper of chili warmth — the ember afterglow.", descAm: "ቺኮላታ ሺክ በትንሽ ቃኚ።", spicy: 1 },
    { cat: "drinks", name: "Abem Buna Ceremony (3 cups)", nameAm: "የቡና ሥርዓት", price: 250, desc: "Green beans roasted at your table, frankincense smoke, three sini pours. Thirty unhurried minutes.", descAm: "በግቢያ ላይ የሚቀረጥ ቡና ሥርዓት ከእጣን ጋር።", img: "/images/coffee-ceremony.jpg", featured: true, pick: true },
    { cat: "drinks", name: "House Tej", nameAm: "የቤት ጠጅ", price: 180, desc: "Honey wine fermented in-house, served in the berele. Gentle strength.", descAm: "በቤት ውስጥ የተሠራ ጠጅ።", img: "/images/tej.jpg" },
    { cat: "drinks", name: "Spris (Layered Juice)", nameAm: "ስፕሪስ", price: 190, desc: "Avocado, mango and papaya layered like an Ethiopian sunset.", descAm: "አቮካዶ፣ ማንጎ እና ፓፓያ የተቀናበረ።", vegan: true },
    { cat: "drinks", name: "Ethiopian Macchiato", nameAm: "ማኪያቶ", price: 120, desc: "Double shot from Yirgacheffe beans, milk-first like Addis does it.", descAm: "ከይርጋጨፌ ቡና የተሠራ ማኪያቶ።" },
    { cat: "drinks", name: "Soft Drinks & Sparkling Water", nameAm: "ሶፍት መጠጦች", price: 60, desc: "Coke, Fanta, Sprite, tonic and sparkling water — ice cold.", descAm: "ሶፍት መጠጦች።", vegan: true },

    /* Desserts */
    { cat: "desserts", name: "Ember Chocolate Fondant", nameAm: "የቺኮላታ ፎንዳንት", price: 280, desc: "Dark fondant with a whisper of berbere warmth, vanilla cream.", descAm: "ቺኮላታ ፎንዳንት በበርበሬ ጮታ።", pick: true },
    { cat: "desserts", name: "Honey Yogurt & Roasted Buna Crumble", nameAm: "እርብ ከማር ጋር", price: 240, desc: "Set yogurt, local honey, crushed roasted coffee beans.", descAm: "እርብ ከማር እና ከሮስት ቡና ጋር።" },
    { cat: "desserts", name: "Fresh Fruit Mesob", nameAm: "የፍሬ ሜሶብ", price: 200, desc: "Seasonal fruit carved and arranged on a mini mesob.", descAm: "የወቅቱ ፍሬዎች።", vegan: true, fasting: true },
  ];

  for (const [i, c] of catDefs.entries()) {
    await db.menuCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameAm: c.nameAm, description: c.description, station: c.station, image: c.image, order: i, active: true },
      create: { ...c, order: i },
    });
  }
  /* Retire categories that no longer belong to the luxe flame kitchen. */
  for (const s of retiredSlugs) {
    await db.menuCategory.updateMany({ where: { slug: s }, data: { active: false } });
  }
  const cats = await db.menuCategory.findMany();
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));
  const activeCatIds = new Set(catDefs.map((c) => catMap.get(c.slug)!));

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

  /* Items that no longer belong to any active category are marked unavailable ("86'd"). */
  await db.menuItem.updateMany({
    where: { categoryId: { notIn: [...activeCatIds] } },
    data: { available: false },
  });

  /* ── Gallery ── */
  const gallery = [
    { title: "The full flame spread", category: "food", url: "/images/hero-poster.jpg", order: 0 },
    { title: "The Abem Flame Burger", category: "food", url: "/images/dishes/burger.jpg", order: 1 },
    { title: "Wood-fired pepperoni", category: "food", url: "/images/dishes/pizza.jpg", order: 2 },
    { title: "Shawarma, carved to order", category: "food", url: "/images/dishes/shawarma.jpg", order: 3 },
    { title: "Crispy fried chicken", category: "food", url: "/images/dishes/fried-chicken.jpg", order: 4 },
    { title: "Ember buffalo wings", category: "food", url: "/images/dishes/wings.jpg", order: 5 },
    { title: "Loaded fries", category: "food", url: "/images/dishes/loaded-fries.jpg", order: 6 },
    { title: "The club sandwich", category: "food", url: "/images/dishes/club-sandwich.jpg", order: 7 },
    { title: "Vanilla-caramel buna shake", category: "food", url: "/images/dishes/milkshake.jpg", order: 8 },
    { title: "The dining hall at night", category: "interior", url: "/images/interior.jpg", order: 9 },
    { title: "Chechebsa mornings", category: "food", url: "/images/dishes/chechebsa.jpg", order: 10 },
    { title: "Buna ceremony", category: "coffee", url: "/images/coffee-ceremony.jpg", order: 11 },
    { title: "Tej in the berele", category: "coffee", url: "/images/tej.jpg", order: 12 },
    { title: "The fasting rainbow", category: "food", url: "/images/dishes/beyaynetu.jpg", order: 13 },
    { title: "Special kitfo", category: "food", url: "/images/dishes/kitfo.jpg", order: 14 },
    { title: "Azmari night", category: "events", url: "/images/music.jpg", order: 15 },
    { title: "Garden weddings", category: "events", url: "/images/events.jpg", order: 16 },
    { title: "Chef Almaz", category: "team", url: "/images/chef.jpg", order: 17 },
  ];
  for (const g of gallery) {
    const exists = await db.galleryItem.findFirst({ where: { title: g.title } });
    if (!exists) await db.galleryItem.create({ data: { ...g } });
  }

  /* ── Team ── */
  const team = [
    { name: "Chef Almaz Bekele", role: "Executive Chef", bio: "Fifteen years at the flame. Trained in her mother's kitchen in Gondar, sharpened on the line. Guards the patty grind and the pizza dough like a national secret.", photo: "/images/chef.jpg", order: 0 },
    { name: "Dawit Tesfaye", role: "Head of the Grill", bio: "Charcoal whisperer. If the patties aren't singing when they leave the grill, they don't leave.", order: 1 },
    { name: "Hanna Girma", role: "Shawarma & Buna Host", bio: "Carves the spit with surgical patience and roasts buna tableside. Ask her about the third cup.", order: 2 },
    { name: "Yonas Abebe", role: "General Manager", bio: "Runs the floor like an orchestra — burgers, buna and conversation in perfect time.", order: 3 },
  ];
  for (const t of team) {
    const exists = await db.teamMember.findFirst({ where: { name: t.name } });
    if (!exists) await db.teamMember.create({ data: { ...t } });
  }

  /* ── Testimonials ── */
  const quotes = [
    { name: "Selamawit T.", role: "Addis Ababa", quote: "The flame burger tastes like a five-star kitchen hiding inside a late-night run. I cried a little, then ordered more.", order: 0 },
    { name: "Marcus Bell", role: "Travel writer, London", quote: "Abem is the burger I measure all others against — and the pizza out-pizzas half of Italy. I keep coming back.", order: 1 },
    { name: "Hirut M.", role: "Gourmet Club chair", quote: "We came for the shawarma and stayed until the milkshakes ran out. Service feels like family, not staff.", order: 2 },
    { name: "Daniel Kim", role: "Chef, Seoul", quote: "That wood-fired crust — leopard spots, molten edge — is one of the best plates I ate this year, anywhere.", order: 3 },
  ];
  for (const q of quotes) {
    const exists = await db.testimonial.findFirst({ where: { name: q.name } });
    if (!exists) await db.testimonial.create({ data: { ...q } });
  }

  /* ── FAQs ── */
  const faqs = [
    { question: "What is Abem known for?", answer: "Our flame kitchen: the Abem Flame Burger, wood-fired pizza, chicken shawarma carved off the spit and crispy fried chicken — all done with restaurant craft at street speed. Our Ethiopian heritage corner (chechebsa, firfir, kitfo, buna) never leaves the menu.", order: 0 },
    { question: "How spicy is Abem food, really?", answer: "Every dish shows a heat level (0-3). The Berbere Smash Burger and Fasting Firfir run hot; everything else is mild to medium and our kitchen will happily adjust — just note it when ordering.", order: 1 },
    { question: "Do you have vegan and fasting (Tsom) options?", answer: "Yes — the Garden Veggie Pizza, Fasting Veggie Wrap, Garden Salad, Beyaynetu and Fasting Firfir are all fully vegan, cooked on separate surfaces.", order: 2 },
    { question: "Do you host birthdays and corporate events?", answer: "Our garden seats 300 under the lights and our VIP booths host private tastings. See the Events page — our team replies within one business day.", order: 3 },
    { question: "Where do you deliver?", answer: "Across Addis Ababa — Bole, Kazanchis, Piassa, CMC and Haya Hulet zones, with landmark-based addresses and live tracking.", order: 4 },
    { question: "Is the restaurant family friendly?", answer: "Very. Kids are welcome; high chairs, chicken tenders and a gentler-spice kids' menu are always available.", order: 5 },
  ];
  for (const f of faqs) {
    const exists = await db.faq.findFirst({ where: { question: f.question } });
    if (!exists) await db.faq.create({ data: { ...f } });
  }

  /* ── Event packages ── */
  const packs = [
    { slug: "garden-wedding", title: "The Garden Wedding", description: "A candlelit garden feast for up to 300 guests: flame-grill stations, pizza oven, live azmari band, tej bar and a private buna pavilion. Our events team choreographs every plate.", capacity: "Up to 300 guests", priceFrom: 95000, image: "/images/events.jpg", features: ["Full garden takeover", "Live azmari + krar band", "Flame-grill & pizza stations", "Dedicated host team", "Photography corners"] },
    { slug: "corporate-mesob", title: "Corporate Flame Night", description: "Boardroom dinners, launch nights and team feasts. Screen, projector, halal and fasting menus, and an invoice your finance team will love.", capacity: "Up to 80 guests", priceFrom: 35000, image: "/images/interior.jpg", features: ["Private hall + AV", "Set flame menus from ETB 950", "Fasting & international options", "Company branding on menus", "Receipt & invoice ready"] },
    { slug: "birthday-habesha", title: "Birthday Flame Night", description: "A birthday the Abem way: your booth decorated in teff grass, a cake reveal with ember sparklers, and a gift from our kitchen.", capacity: "Up to 30 guests", priceFrom: 12000, image: "/images/music.jpg", features: ["Grass-decorated booths", "Azmari serenade", "Custom cake menu", "Birthday gift from the chef"] },
    { slug: "private-vip", title: "The Ember Room (VIP Dining)", description: "One table, one chef, one night. A seven-course tasting of the flame kitchen — dry-aged burger flight, wood-fired tasting pizza, shawarma carving — for eight seats.", capacity: "8 seats", priceFrom: 28000, image: "/images/chef.jpg", features: ["7-course chef's tasting", "Tej & single-origin buna pairing", "Kitchen tour with the chef", "One booking per night"] },
  ];
  for (const p of packs) {
    await db.eventPackage.upsert({ where: { slug: p.slug }, update: { ...p, features: p.features as never }, create: { ...p, features: p.features as never } });
  }

  /* ── Stories ── */
  const stories = [
    {
      slug: "the-flame-behind-our-burgers",
      title: "The Flame Behind Our Burgers",
      excerpt: "Ground every morning, seared over real fire, stacked with intent. Why our burger line runs like a steakhouse — at street speed.",
      content: "Every morning at 7 AM the grinder comes out.\n\nChuck and brisket, 80/20, nothing hidden. We grind once — twice and the fat smears, the patty goes dense. Straight into the fridge, straight onto the fire at 11.\n\nThe grill itself runs on real charcoal and wood — the same fire our kitfo kitchen has used for fifteen years. When a patty hits the grates it flares, chars, and takes on the smell that now drifts down Bole Road every lunch hour.\n\nFast food gets away with shortcuts. We don't. The mayo is ember-kissed, the pickles are house-fermented, the brioche arrives warm from our oven. Speed is only impressive when the fire underneath it is real.",
      cover: "/images/dishes/burger.jpg", category: "kitchen", tags: ["burgers", "grill", "kitchen"], readMinutes: 4, published: true,
    },
    {
      slug: "wood-fired-pizza-addis-style",
      title: "Wood-Fired Pizza, Addis-Style",
      excerpt: "Two days of cold fermentation, a 450-degree oven floor, and a berbere-honey chicken pizza that could only happen here.",
      content: "Our pizza dough ferments for two days in the cold room.\n\nThat is the entire secret. Time does what machines can't: the gluten relaxes, the flavor deepens, the crust blisters into leopard spots at 450 degrees on the oven floor.\n\nMost of our pizzas are classical — the Margherita is sacred territory. But one pizza could only exist in Addis: grilled chicken glazed in berbere honey, red onion, green chili, mozzarella. It is our heritage and our obsession sharing one crust.\n\nAbol, tona, baraka — the same patience our buna ceremony teaches lives in every pizza we fire.",
      cover: "/images/dishes/pizza.jpg", category: "kitchen", tags: ["pizza", "oven", "kitchen"], readMinutes: 4, published: true,
    },
    {
      slug: "the-coffee-ceremony-guide",
      title: "The Buna Ceremony: A Field Guide to Three Cups",
      excerpt: "Abol, tona, baraka. Why the third cup matters, why the grass on the floor smells like every Ethiopian childhood, and how we roast at your table.",
      content: "There is a moment, about twenty minutes into the ceremony, when the jebena begins to sing.\n\nThe green beans have already been washed and roasted in front of you — the pan pulled off the coals exactly when the first crack quiets. The smoke is folded across the table so you can breathe it. Frankincense has been lit on the coals beside you. The grass scattered on the floor was cut this morning.\n\nAbol arrives first: small, dark, unfiltered. You do not rush it. Tona follows, softer. Baraka, the third cup, is said to confer a blessing — and by then the conversation has stopped being polite and started being true.\n\nAt Abem we run the ceremony tableside because coffee here was never a product. It is choreography, hospitality and time. Thirty unhurried minutes. Come hungry for patience — it pairs beautifully with a flame burger.",
      cover: "/images/coffee-ceremony.jpg", category: "culture", tags: ["coffee", "ceremony", "culture"], readMinutes: 5, published: true,
    },
  ];
  for (const s of stories) {
    await db.story.upsert({ where: { slug: s.slug }, update: { ...s, tags: s.tags as never, publishedAt: new Date() }, create: { ...s, tags: s.tags as never, publishedAt: new Date() } });
  }

  /* ── Careers ── */
  const openings = [
    { title: "Waiter / Waitress", type: "FULL_TIME", description: "Run the floor with warmth and precision. Service etiquette training provided. Prior experience loved, attitude required.", order: 0 },
    { title: "Line Cook — Flame Grill", type: "FULL_TIME", description: "Burgers, chicken and shawarma on a live fire line under Dawit. Knife skills and heat tolerance essential.", order: 1 },
    { title: "Pizza Station Cook", type: "FULL_TIME", description: "Wood oven work: stretching two-day dough, firing pies at 450 degrees. Pizza craft training provided.", order: 2 },
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
