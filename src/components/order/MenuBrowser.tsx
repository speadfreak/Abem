"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Flame, Leaf, Minus, Plus, Search, Star, UtensilsCrossed, WheatOff } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useLang } from "@/lib/i18n/lang-context";
import { formatPriceShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiCategory, ApiDish } from "./types";

/* ── Menu browser: category chips, search, fasting/vegan filters, dish cards ── */

function Spicy({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Spicy level ${level} of 3`} title={`Spicy ${level}/3`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Flame key={i} className={cn("h-3 w-3", i < (level ?? 0) ? "fill-ember text-ember" : "text-cream/20")} aria-hidden="true" />
      ))}
    </span>
  );
}

function Stepper({ qty, onInc, onDec, onAdd }: { qty: number; onInc: () => void; onDec: () => void; onAdd: () => void }) {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        aria-label="Add to order"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_18px_-6px_rgba(232,163,23,0.6)] focus-visible:outline-2 focus-visible:outline-gold active:scale-95"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
      </button>
    );
  }
  return (
    <div className="inline-flex h-9 items-center rounded-full border border-gold/50 bg-elevated" role="group" aria-label="Quantity">
      <button onClick={onDec} aria-label="Decrease quantity" className="flex h-full w-9 items-center justify-center rounded-l-full text-cream transition-colors hover:bg-ember/20 hover:text-ember focus-visible:outline-2 focus-visible:outline-gold active:scale-90">
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="w-7 text-center text-sm font-bold tabular-nums text-cream" aria-live="polite">{qty}</span>
      <button onClick={onInc} aria-label="Increase quantity" className="flex h-full w-9 items-center justify-center rounded-r-full text-gold transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-gold active:scale-90">
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function DishCard({ dish, cart, index }: { dish: ApiDish; cart: ReturnType<typeof useCart>; index: number }) {
  const { pick, lang } = useLang();
  const loc = (o: object, base: string) => pick(o as { [k: string]: unknown }, base);
  const qty = cart.qtyOf(dish.id);
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.3) }}
      className="card-elevated card-hover flex gap-4 p-3.5 sm:p-4"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gold/15 sm:h-28 sm:w-28">
        {dish.image ? (
          <Image src={dish.image} alt={dish.name} fill sizes="(max-width:640px) 96px, 112px" className="img-duotone object-cover transition-transform duration-500 hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-elevated"><UtensilsCrossed className="h-6 w-6 text-gold/25" aria-hidden="true" /></div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-foreground">{loc(dish, "name")}</h3>
            {lang === "en" && dish.nameAm ? <p className="am-text truncate text-xs text-gold/75">{dish.nameAm}</p> : null}
          </div>
          <span className="shrink-0 rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 font-mono text-xs font-semibold text-gold tabular-nums">
            {formatPriceShort(dish.price)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{loc(dish, "description")}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {dish.isFasting ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-highland/50 bg-highland/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8fd0a0]">
                <WheatOff className="h-2.5 w-2.5" aria-hidden="true" /> Fasting
              </span>
            ) : null}
            {dish.isVegan ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-highland/40 bg-highland/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8fd0a0]">
                <Leaf className="h-2.5 w-2.5" aria-hidden="true" /> Vegan
              </span>
            ) : null}
            {dish.isChefPick ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                <Star className="h-2.5 w-2.5" aria-hidden="true" /> Chef
              </span>
            ) : null}
            <Spicy level={dish.spicyLevel} />
          </div>
          <Stepper
            qty={qty}
            onAdd={() => cart.add({ id: dish.id, name: dish.name, price: dish.price, image: dish.image ?? undefined })}
            onInc={() => cart.setQty(dish.id, qty + 1)}
            onDec={() => cart.setQty(dish.id, qty - 1)}
          />
        </div>
      </div>
    </motion.article>
  );
}

export default function MenuBrowser({ categories, cart }: { categories: ApiCategory[]; cart: ReturnType<typeof useCart> }) {
  const { pick } = useLang();
  const loc = (o: object, base: string) => pick(o as { [k: string]: unknown }, base);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [fasting, setFasting] = useState(false);
  const [vegan, setVegan] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => activeCat === "all" || c.id === activeCat)
      .map((c) => ({
        ...c,
        items: c.items.filter((d) => {
          if (fasting && !d.isFasting) return false;
          if (vegan && !d.isVegan && !(d.tags ?? []).includes("vegan")) return false;
          if (!q) return true;
          const hay = `${d.name} ${d.nameAm ?? ""} ${d.description ?? ""} ${(d.tags ?? []).join(" ")}`.toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, activeCat, query, fasting, vegan]);

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-[12px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-gold active:scale-95",
      active ? "border-gold bg-gold/15 text-gold shadow-[0_0_16px_-6px_rgba(232,163,23,0.7)]" : "border-gold/20 bg-card text-cream/70 hover:border-gold/45 hover:text-cream"
    );

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/60" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doro, tibs, shiro…"
            aria-label="Search the menu"
            className="h-11 w-full rounded-full border border-gold/20 bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Dietary filters">
          <button onClick={() => setFasting((v) => !v)} aria-pressed={fasting} className={chip(fasting)}>
            <WheatOff className="h-3.5 w-3.5" aria-hidden="true" /> Fasting
          </button>
          <button onClick={() => setVegan((v) => !v)} aria-pressed={vegan} className={chip(vegan)}>
            <Leaf className="h-3.5 w-3.5" aria-hidden="true" /> Vegan
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Menu categories">
        <button role="tab" aria-selected={activeCat === "all"} onClick={() => setActiveCat("all")} className={chip(activeCat === "all")}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.id} role="tab" aria-selected={activeCat === c.id} onClick={() => setActiveCat(c.id)} className={chip(activeCat === c.id)}>
            {loc(c, "name")}
          </button>
        ))}
      </div>

      {/* Dishes */}
      {filtered.length === 0 ? (
        <div className="card-elevated mt-8 flex flex-col items-center gap-3 py-16 text-center" role="status">
          <UtensilsCrossed className="h-10 w-10 text-gold/30" aria-hidden="true" />
          <p className="text-cream/80">No dishes match that search.</p>
          <button onClick={() => { setQuery(""); setFasting(false); setVegan(false); setActiveCat("all"); }} className="btn-ghost btn-sm">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {filtered.map((c) => (
            <section key={c.id} aria-label={c.name}>
              <div className="flex items-baseline gap-3">
                <h2 className="display-3 text-foreground">{loc(c, "name")}</h2>
                {c.nameAm ? <span className="am-text text-sm text-gold/70">{c.nameAm}</span> : null}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {c.items.map((d, i) => (
                  <DishCard key={d.id} dish={d} cart={cart} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
