"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, Flame, Leaf, Star, WheatOff, ShoppingBag, BellRing, ReceiptText, UtensilsCrossed } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";
import { useLang } from "@/lib/i18n/lang-context";
import { formatPriceShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ApiDish {
  id: string; slug: string; name: string; nameAm?: string; description?: string; descriptionAm?: string;
  price: number; image?: string; tags?: string[]; spicyLevel?: number; isVegan?: boolean;
  isFasting?: boolean; isChefPick?: boolean; isFeatured?: boolean; categoryId?: string;
}
export interface ApiCategory {
  id: string; slug: string; name: string; nameAm?: string; description?: string; descriptionAm?: string; station?: string; items: ApiDish[];
}

type Filters = { fasting: boolean; vegan: boolean; spicy: boolean; pick: boolean };

const TAG_STYLE: Record<string, string> = {
  signature: "border-gold/40 text-gold",
  vegetarian: "border-highland/50 text-[#8fd0a0]",
  vegan: "border-highland/50 text-[#8fd0a0]",
  "gluten-free": "border-cream/25 text-cream/80",
};

function Spicy({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Spicy level ${level} of 3`} title={`Spicy level ${level}/3`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Flame key={i} className={cn("h-3.5 w-3.5", i < (level ?? 0) ? "text-ember fill-ember" : "text-cream/20")} aria-hidden="true" />
      ))}
    </span>
  );
}

function Tag({ label }: { label: string }) {
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]", TAG_STYLE[label] ?? "border-cream/20 text-cream/70")}>{label}</span>;
}

/* ── Dish detail modal ── */
export function DishModal({ dish, onClose, tableToken }: { dish: ApiDish | null; onClose: () => void; tableToken?: string }) {
  const { pick, lang } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = dish ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [dish, onClose]);

  return (
    <AnimatePresence>
      {dish && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[92] flex items-end justify-center bg-[#0b0705]/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={dish.name}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="card-elevated relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full glass text-cream hover:text-gold">
              <X className="h-4 w-4" />
            </button>
            <div className="relative aspect-[16/9] w-full overflow-hidden sm:rounded-t-3xl">
              {dish.image ? (
                <Image src={dish.image} alt={dish.name} fill sizes="(max-width:640px) 100vw, 672px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-elevated"><UtensilsCrossed className="h-12 w-12 text-gold/25" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#150d09] to-transparent" aria-hidden="true" />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="display-2 text-foreground">{pick(dish, "name")}</h3>
                  {lang === "en" && dish.nameAm ? <p className="am-text mt-1 text-gold/85">{dish.nameAm}</p> : null}
                </div>
                <span className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 font-mono text-sm text-gold">
                  {formatPriceShort(dish.price)}
                </span>
              </div>
              {pick(dish, "description") && <p className="lead mt-4">{pick(dish, "description")}</p>}

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                {(dish.tags ?? []).map((t) => <Tag key={t} label={t} />)}
                {dish.isVegan && <Tag label="vegan" />}
                {dish.isFasting && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-highland/50 bg-highland/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8fd0a0]">
                    <WheatOff className="h-3 w-3" /> Fasting · ጾም
                  </span>
                )}
                {dish.isChefPick && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                    <Star className="h-3 w-3" /> Chef&apos;s pick
                  </span>
                )}
                <Spicy level={dish.spicyLevel} />
              </div>

              {tableToken && (
                <p className="mt-6 rounded-xl border border-gold/20 bg-elevated px-4 py-3 text-sm text-cream/80">
                  <strong className="text-gold">Table service:</strong> your dish will be sent to the kitchen and a waiter will bring it to your table. You can also{" "}
                  <span className="inline-flex items-center gap-1 text-gold"><BellRing className="inline h-3.5 w-3.5" /> call a waiter</span> any time.
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/order" className="btn-gold btn-sm">
                  <ShoppingBag className="h-4 w-4" /> Order for delivery
                </Link>
                <Link href="/reservations" className="btn-ghost btn-sm">
                  <ReceiptText className="h-4 w-4" /> Reserve for later
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Menu page body ── */
export default function MenuExplorer() {
  const params = useSearchParams();
  const tableToken = params.get("table") ?? undefined;
  const openSlug = params.get("dish");
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [featured, setFeatured] = useState<ApiDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ fasting: false, vegan: false, spicy: false, pick: false });
  const [openDish, setOpenDish] = useState<ApiDish | null>(null);
  const { pick, lang, t } = useLang();

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => {
        setCats(d.categories ?? []);
        setFeatured(d.featured ?? []);
        setLoading(false);
        if (openSlug) {
          for (const c of d.categories ?? []) {
            const found = (c.items ?? []).find((i: ApiDish) => i.slug === openSlug);
            if (found) setOpenDish(found);
          }
        }
      })
      .catch(() => setLoading(false));
     
  }, []);

  const visible = useMemo(() => {
    let list = activeCat === "all" ? cats : cats.filter((c) => c.slug === activeCat);
    const q = query.trim().toLowerCase();
    const applyFilters = (d: ApiDish) =>
      (!filters.fasting || d.isFasting) &&
      (!filters.vegan || d.isVegan) &&
      (!filters.spicy || (d.spicyLevel ?? 0) >= 2) &&
      (!filters.pick || d.isChefPick) &&
      (!q || d.name.toLowerCase().includes(q) || (d.nameAm ?? "").includes(query.trim()) || (d.description ?? "").toLowerCase().includes(q));

    return list
      .map((c) => ({ ...c, items: c.items.filter(applyFilters) }))
      .filter((c) => c.items.length > 0);
  }, [cats, activeCat, query, filters]);

  const filterDefs: { key: keyof Filters; label: string; am: string }[] = [
    { key: "fasting", label: "Fasting (Tsom)", am: "ጾም" },
    { key: "vegan", label: "Vegan", am: "ተክልያዊ" },
    { key: "spicy", label: "Bold heat", am: "ፈጣኝ" },
    { key: "pick", label: "Chef's picks", am: "የሼፍ ምርጫ" },
  ];

  return (
    <>
      {/* Sticky category rail */}
      <div className="sticky top-[72px] z-40 border-b border-gold/10 bg-[#0b0705]/88 backdrop-blur-xl">
        <div className="container-x no-scrollbar flex items-center gap-1 overflow-x-auto py-3">
          {[{ slug: "all", name: "All", nameAm: "ሁሉም" }, ...cats].map((c) => {
            const active = activeCat === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setActiveCat(c.slug)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors",
                  active ? "text-[#1a0e05]" : "text-cream/70 hover:text-cream"
                )}
              >
                {active && (
                  <motion.span layoutId="menu-tab" className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-soft to-gold" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
                )}
                <span className="relative">{lang === "am" && c.nameAm ? c.nameAm : c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="container-x pb-28 pt-8">
        {/* Search + filters */}
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <label className="relative w-full max-w-md">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doro, kitfo, shiro, tej…"
              className="h-12 w-full rounded-full border border-gold/20 bg-elevated pl-11 pr-4 text-sm text-cream outline-none transition focus:border-gold/60 placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Menu filters">
            {filterDefs.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilters((s) => ({ ...s, [f.key]: !s[f.key] }))}
                aria-pressed={filters[f.key]}
                className={cn(
                  "h-10 rounded-full border px-4 text-[11px] font-bold uppercase tracking-[0.14em] transition-all",
                  filters[f.key]
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-cream/15 text-cream/70 hover:border-gold/40 hover:text-cream"
                )}
              >
                {lang === "am" ? f.am : f.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading menu">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer rounded-2xl border border-gold/10">
                <div className="aspect-[4/3] w-full rounded-t-2xl" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-cream/10" />
                  <div className="h-3 w-full rounded bg-cream/5" />
                  <div className="h-3 w-1/2 rounded bg-cream/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured strip */}
        {!loading && activeCat === "all" && !query && !filters.fasting && !filters.vegan && !filters.spicy && !filters.pick && featured.length > 0 && (
          <section className="mt-10" aria-label="Featured dishes">
            <Reveal>
              <p className="eyebrow">{t("common.chefsPick")}</p>
              <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
                {featured.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setOpenDish(d)}
                    className="card-elevated card-hover group w-[240px] shrink-0 overflow-hidden text-left"
                  >
                    <div className="relative aspect-[4/3]">
                      {d.image && <Image src={d.image} alt={d.name} fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                      <span className="absolute inset-0 bg-gradient-to-t from-[#0b0705]/70 to-transparent" aria-hidden="true" />
                      <span className="absolute bottom-3 left-3 font-display text-base text-cream">{d.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* Category sections */}
        {!loading && (
          <div className="mt-12 space-y-16">
            {visible.map((c) => (
              <section key={c.slug} id={`cat-${c.slug}`} aria-label={c.name}>
                <Reveal className="mb-7 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="display-2 text-foreground">{pick(c, "name")}</h2>
                    {pick(c, "description") && <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{pick(c, "description")}</p>}
                  </div>
                  <span className="hidden font-mono text-xs text-gold/60 sm:block">{c.items.length} dishes</span>
                </Reveal>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {c.items.map((d, i) => (
                    <Reveal key={d.id} delay={Math.min(i * 0.04, 0.3)}>
                      <button
                        onClick={() => setOpenDish(d)}
                        className="card-elevated card-hover group flex h-full w-full flex-col overflow-hidden text-left"
                        aria-haspopup="dialog"
                        aria-label={`${pick(d, "name")} — ${formatPriceShort(d.price)}`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {d.image ? (
                            <Image src={d.image} alt={pick(d, "name")} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-elevated">
                              <UtensilsCrossed className="h-8 w-8 text-gold/25" aria-hidden="true" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0705]/75 via-transparent to-transparent" aria-hidden="true" />
                          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                            {d.isFasting && <span className="rounded-full bg-highland/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cream">Tsom · ጾም</span>}
                            {d.isVegan && !d.isFasting && <span className="rounded-full bg-highland/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cream">Vegan</span>}
                          </div>
                          <span className="absolute bottom-3 right-3 rounded-full glass px-3 py-1 font-mono text-[12px] text-gold">
                            {formatPriceShort(d.price)}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-display text-lg text-foreground">{pick(d, "name")}</h3>
                            <Spicy level={d.spicyLevel} />
                          </div>
                          {pick(d, "description") && (
                            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{pick(d, "description")}</p>
                          )}
                          <div className="mt-auto flex items-center gap-2 pt-4">
                            {d.isChefPick && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
                                <Star className="h-3 w-3 fill-gold" aria-hidden="true" /> Chef&apos;s pick
                              </span>
                            )}
                            {d.isVegan && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8fd0a0]">
                                <Leaf className="h-3 w-3" aria-hidden="true" /> Vegan
                              </span>
                            )}
                            <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.16em] text-cream/40 transition group-hover:text-gold">
                              Details
                            </span>
                          </div>
                        </div>
                      </button>
                    </Reveal>
                  ))}
                </div>
              </section>
            ))}
            {!visible.length && (
              <div className="py-20 text-center">
                <p className="font-display text-2xl text-cream/80">Nothing matches that search.</p>
                <p className="mt-2 text-sm text-muted-foreground">Try &ldquo;shiro&rdquo;, clear a filter, or ask us — the kitchen improvises.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <DishModal dish={openDish} onClose={() => setOpenDish(null)} tableToken={tableToken} />
    </>
  );
}
