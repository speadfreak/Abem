"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveOrder, LiveOrderItem, LiveRequest } from "@/lib/live";

export type { LiveOrder, LiveOrderItem, LiveRequest };

export interface LiveSnapshot {
  orders: LiveOrder[];
  requests: LiveRequest[];
  ts: string;
}

/* ── useLive ─────────────────────────────────────────────────────
   Subscribes to /api/live/stream (SSE). On stream failure it
   retries up to 10 times (3s apart), then falls back to polling
   /api/live/snapshot every 3s. Returns { data, connected, lastTs }. */

const MAX_RETRIES = 10;
const RETRY_MS = 3000;
const POLL_MS = 3000;

export function useLive(): { data: LiveSnapshot | null; connected: boolean; lastTs: string | null } {
  const [data, setData] = useState<LiveSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastTs, setLastTs] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triesRef = useRef(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    const apply = (snap: LiveSnapshot | null) => {
      if (!aliveRef.current || !snap) return;
      setData(snap);
      setLastTs(snap.ts);
    };

    const pollOnce = () => {
      fetch("/api/live/snapshot", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<LiveSnapshot>) : null))
        .then((j) => {
          if (j) {
            apply(j);
            setConnected(true);
          }
        })
        .catch(() => setConnected(false));
    };

    const startPolling = () => {
      if (pollRef.current || !aliveRef.current) return;
      pollOnce();
      pollRef.current = setInterval(pollOnce, POLL_MS);
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const connect = () => {
      if (!aliveRef.current) return;
      try {
        const es = new EventSource("/api/live/stream");
        esRef.current = es;

        es.addEventListener("snapshot", (ev) => {
          if (!aliveRef.current) return;
          triesRef.current = 0;
          stopPolling();
          setConnected(true);
          try {
            apply(JSON.parse((ev as MessageEvent).data as string) as LiveSnapshot);
          } catch {
            /* malformed frame — next tick will correct */
          }
        });

        es.onerror = () => {
          es.close();
          esRef.current = null;
          setConnected(false);
          if (!aliveRef.current) return;
          triesRef.current += 1;
          if (triesRef.current >= MAX_RETRIES) {
            startPolling(); // permanent fallback
          } else {
            retryRef.current = setTimeout(connect, RETRY_MS);
            startPolling(); // bridge the gap while retrying
          }
        };
      } catch {
        startPolling();
      }
    };

    connect();

    return () => {
      aliveRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      stopPolling();
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };
  }, []);

  return { data, connected, lastTs };
}
