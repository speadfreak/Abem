"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell, Bike, HandPlatter, Phone, QrCode, RefreshCcw, ShoppingBag,
  Store, UtensilsCrossed, WheatOff,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/components/providers/SettingsProvider";
import { formatETB, formatPriceShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import MenuBrowser from "./MenuBrowser";
import CartSheet from "./CartSheet";
import SuccessScreen from "./SuccessScreen";
import type { ApiCategory, ApiDish, OrderMode, OrderSuccessData } from "./types";

/* ── ABEM FLOW · the ordering hub ───────────────────────────────── */

const MODES: { id: OrderMode; label: string; icon: React.ElementType }[] = [
  { id: "DELIVERY", label: "Delivery", icon: Bike },
  { id: "TAKEAWAY", label: "Takeaway", icon: Store },
  { id: "DINEIN", label: "Dine-in QR", icon: QrCode },
];

/* Shown when settings.features.ordering is off. */
function OrderingClosed({ featured }: { featured: ApiDish[] }) {
  const { settings } = useSettings();
  return (
    <section className="container-x py-14" aria-live="polite">
      <div className="card-elevated relative mx-auto max-w-3xl overflow-hidden p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(232,163,23,0.14),transparent)]" aria-hidden="true" />
        <p className="eyebrow justify-center">Abem Flow · በቅርቡ</p>
        <h2 className="display-1 mt-4 text-cream">Ordering opens soon.</h2>
        <p className="lead mx-auto mt-4 max-w-lg">
          Our kitchen is putting the final ember on online ordering. Meanwhile, the menu below is live — call us and we will have it ready, or reserve a table and dine with us.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a href={`tel:${settings.contact.phone.replace(/[^\d+]/g, "")}`} className="btn-gold btn-sm">
            <Phone className="h-4 w-4" aria-hidden="true" /> {settings.contact.phone}
          </a>
          <Link href="/menu" className="btn-ghost btn-sm">Browse the full menu</Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-10 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">A taste of what awaits</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {featured.slice(0, 4).map((d) => (
                <div key={d.id} className="group overflow-hidden rounded-xl border border-gold/15 bg-card">
                  <div className="relative aspect-[4/3]">
                    {d.image ? (
                      <Image src={d.image} alt={d.name} fill sizes="(max-width:640px) 50vw, 200px" className="img-duotone object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><UtensilsCrossed className="h-6 w-6 text-gold/25" aria-hidden="true" /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-cream">{d.name}</p>
                    <p className="text-xs text-gold tabular-nums">{formatPriceShort(d.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function OrderHub() {
  const search = useSearchParams();
  const { settings } = useSettings();
  const cart = useCart();

  const [menu, setMenu] = useState<{ categories: ApiCategory[]; featured: ApiDish[] } | null>(null);
  const [menuError, setMenuError] = useState(false);
  const [mode, setMode] = useState<OrderMode>("TAKEAWAY");
  const [tableToken, setTableToken] = useState("");
  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [success, setSuccess] = useState<OrderSuccessData | null>(null);
  const [serviceBusy, setServiceBusy] = useState(false);

  /* Table QR: ?table=TOKEN locks Dine-in mode */
  useEffect(() => {
    const token = search.get("table") ?? "";
    if (!token) return;
    setTableToken(token);
    setMode("DINEIN");
    fetch("/api/tables")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { tables?: { qrToken: string; label: string }[] } | null) => {
        const t = j?.tables?.find((x) => x.qrToken === token);
        setTableLabel(t?.label ?? "your table");
      })
      .catch(() => setTableLabel("your table"));
  }, [search]);

  /* Menu */
  useEffect(() => {
    let alive = true;
    fetch("/api/menu")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { categories?: ApiCategory[]; featured?: ApiDish[] } | null) => {
        if (!alive) return;
        if (j?.categories) setMenu({ categories: j.categories, featured: j.featured ?? [] });
        else setMenuError(true);
      })
      .catch(() => alive && setMenuError(true));
    return () => {
      alive = false;
    };
  }, []);

  const lockedDinein = Boolean(tableToken) && mode === "DINEIN";

  const sendRequest = async (type: "WAITER" | "BILL") => {
    if (!tableToken || serviceBusy) return;
    setServiceBusy(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableToken, type }),
      });
      const data = (await res.json()) as { ok: boolean; label?: string; error?: string };
      if (data.ok) {
        toast.success(
          type === "WAITER"
            ? `A waiter is on the way to Table ${data.label ?? tableLabel ?? ""}`.trim()
            : `The bill is on its way to Table ${data.label ?? tableLabel ?? ""}`.trim()
        );
      } else {
        toast.error(data.error ?? "Could not reach the floor team — please wave at a server");
      }
    } catch {
      toast.error("Network hiccup — please wave at a server");
    } finally {
      setServiceBusy(false);
    }
  };

  const featured = useMemo(() => menu?.featured ?? [], [menu]);

  if (success) {
    return <SuccessScreen data={success} onDone={() => setSuccess(null)} />;
  }

  if (!settings.features.ordering) {
    return <OrderingClosed featured={featured} />;
  }

  return (
    <>
      <section className="container-x pb-44 pt-2 md:pb-28" aria-label="Order online">
        {/* Mode tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Order mode">
          {MODES.filter((m) => !lockedDinein || m.id === "DINEIN").map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={active}
                onClick={() => setMode(m.id)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[12px] font-bold uppercase tracking-[0.14em] transition-all focus-visible:outline-2 focus-visible:outline-gold active:scale-95",
                  active
                    ? "border-gold bg-gold/15 text-gold shadow-[0_0_22px_-6px_rgba(232,163,23,0.7)]"
                    : "border-gold/20 bg-card text-cream/65 hover:border-gold/45 hover:text-cream"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" /> {m.label}
              </button>
            );
          })}
        </div>

        {/* Table banner (QR mode) */}
        {tableToken ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ticket mx-auto mt-5 flex max-w-2xl flex-col items-center gap-3 p-4 sm:flex-row sm:justify-between"
            role="status"
          >
            <p className="flex items-center gap-2.5 text-sm text-cream">
              <HandPlatter className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <span>
                Ordering for <strong className="text-gold">Table {tableLabel ?? "…"}</strong>
                <span className="block text-xs text-muted-foreground">Food lands at your mesob — no queue, no counter.</span>
              </span>
            </p>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => sendRequest("WAITER")} disabled={serviceBusy} className="btn-ghost btn-sm disabled:opacity-50">
                <Bell className="h-3.5 w-3.5" aria-hidden="true" /> Call waiter
              </button>
              <button onClick={() => sendRequest("BILL")} disabled={serviceBusy} className="btn-ghost btn-sm disabled:opacity-50">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> Request bill
              </button>
            </div>
          </motion.div>
        ) : mode === "DINEIN" ? (
          <p className="mx-auto mt-4 max-w-2xl rounded-xl border border-gold/20 bg-card px-4 py-3 text-center text-xs text-muted-foreground" role="status">
            No table detected — scan the QR code on your table so the kitchen knows where to bring the food. You can still order and we will find you.
          </p>
        ) : null}

        {/* Menu browser */}
        <div className="mt-8">
          {menuError ? (
            <div className="card-elevated flex flex-col items-center gap-4 py-16 text-center" role="alert">
              <UtensilsCrossed className="h-10 w-10 text-gold/30" aria-hidden="true" />
              <p className="text-cream/85">The menu did not load — check your connection.</p>
              <button onClick={() => window.location.reload()} className="btn-ghost btn-sm">
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
              </button>
            </div>
          ) : menu ? (
            <MenuBrowser categories={menu.categories} cart={cart} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading menu" role="status">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-elevated flex gap-4 p-4">
                  <div className="skeleton-shimmer h-24 w-24 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                    <div className="skeleton-shimmer h-3 w-full rounded" />
                    <div className="skeleton-shimmer h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kitchen note */}
        <p className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <WheatOff className="h-3.5 w-3.5 shrink-0 text-[#8fd0a0]" aria-hidden="true" />
          Fasting (Tsom) heritage dishes are still cooked on separate clay mitad surfaces — fully vegan, fully delicious.
        </p>
      </section>

      {/* Floating cart bar — lifted above the mobile action cluster, native padding on desktop */}
      {cart.count > 0 ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="abem-floating fixed inset-x-0 bottom-[4.75rem] z-[60] flex justify-center px-4 md:bottom-4"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            onClick={() => setCartOpen(true)}
            className="btn-gold relative w-full max-w-md justify-between px-6"
            aria-label={`Open cart, ${cart.count} items, ${formatETB(cart.subtotal)}`}
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums">{cart.count} item{cart.count === 1 ? "" : "s"}</span>
            </span>
            <span className="tabular-nums">{formatETB(cart.subtotal)}</span>
            <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-ember/60 bg-ember text-[11px] font-bold text-cream tabular-nums" aria-hidden="true">
              {cart.count}
            </span>
          </button>
        </motion.div>
      ) : null}

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        mode={mode}
        tableToken={tableToken}
        onOrdered={(d) => {
          setCartOpen(false);
          setSuccess(d);
        }}
      />
    </>
  );
}
