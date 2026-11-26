"use client";

import { useCallback, useSyncExternalStore } from "react";

/* ── Abem Flow cart ──────────────────────────────────────────────
   Module-level store (hydration-safe via useSyncExternalStore) with
   localStorage persistence ("abem_cart"). Prices are display-only
   here; the server recomputes on checkout. */

export interface CartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  image?: string;
}

const KEY = "abem_cart";
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function readStorage(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const out: CartLine[] = [];
    for (const p of parsed) {
      if (
        p && typeof p === "object" &&
        typeof (p as CartLine).id === "string" &&
        typeof (p as CartLine).name === "string" &&
        typeof (p as CartLine).price === "number" &&
        typeof (p as CartLine).qty === "number" &&
        (p as CartLine).qty > 0
      ) {
        out.push({
          id: (p as CartLine).id,
          name: (p as CartLine).name,
          price: (p as CartLine).price,
          qty: Math.min(99, Math.max(1, Math.floor((p as CartLine).qty))),
          notes: typeof (p as CartLine).notes === "string" ? (p as CartLine).notes : undefined,
          image: typeof (p as CartLine).image === "string" ? (p as CartLine).image : undefined,
        });
      }
    }
    return out;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CartLine[] {
  if (!loaded) {
    loaded = true;
    lines = readStorage();
  }
  return lines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function setLines(next: CartLine[]): void {
  lines = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / private mode */
  }
  emit();
}

export interface CartApi {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  qtyOf: (id: string) => number;
}

export function useCart(): CartApi {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((item: Omit<CartLine, "qty">, qty = 1) => {
    const prev = getSnapshot();
    const idx = prev.findIndex((l) => l.id === item.id);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: Math.min(99, next[idx].qty + Math.max(1, qty)) };
      setLines(next);
    } else {
      setLines([...prev, { ...item, qty: Math.max(1, qty) }]);
    }
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const prev = getSnapshot();
    if (qty <= 0) {
      setLines(prev.filter((l) => l.id !== id));
      return;
    }
    setLines(prev.map((l) => (l.id === id ? { ...l, qty: Math.min(99, qty) } : l)));
  }, []);

  const remove = useCallback((id: string) => {
    setLines(getSnapshot().filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const qtyOf = useCallback((id: string) => getSnapshot().find((l) => l.id === id)?.qty ?? 0, []);

  let count = 0;
  let subtotal = 0;
  for (const l of items) {
    count += l.qty;
    subtotal += l.qty * l.price;
  }

  return { items, count, subtotal, add, setQty, remove, clear, qtyOf };
}
