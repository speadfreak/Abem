"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { GalleryItemDTO } from "@/components/sections/gallery/GalleryGrid";

export default function Lightbox({
  items,
  index,
  onClose,
  onNav,
}: {
  items: GalleryItemDTO[];
  index: number | null;
  onClose: () => void;
  onNav: (delta: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null && index >= 0 && index < items.length;
  const item = open && index !== null ? items[index] : null;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (index === null) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNav(1);
      else if (e.key === "ArrowLeft") onNav(-1);
    },
    [index, onClose, onNav]
  );

  useEffect(() => {
    if (index === null) return;
    window.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, handleKey]);

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x < -80) onNav(1);
    else if (info.offset.x > 80) onNav(-1);
  };

  const isVideo = item?.type === "VIDEO";
  const src = item ? (isVideo ? item.url : item.url) : "";
  const poster = item?.thumb || undefined;

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          key="abem-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[90] flex flex-col bg-[#0b0705]/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} — media viewer`}
          onClick={onClose}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <p className="text-sm text-muted-foreground">
              <span className="mr-2 font-semibold text-gold">
                {(index ?? 0) + 1} / {items.length}
              </span>
              {item.title}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close viewer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-cream transition-colors hover:border-gold hover:bg-gold/10 hover:text-gold"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Stage */}
          <div
            className="relative flex flex-1 items-center justify-center px-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onNav(-1)}
              aria-label="Previous item"
              className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-[#150d09]/80 text-cream transition-colors hover:border-gold hover:bg-gold/15 hover:text-gold sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
              className="relative flex h-full max-h-[78vh] w-full max-w-5xl items-center justify-center"
            >
              {isVideo ? (
                <video
                  src={src}
                  poster={poster}
                  controls
                  playsInline
                  className="max-h-full max-w-full rounded-xl border border-gold/20 shadow-2xl"
                  aria-label={item.title}
                />
              ) : (
                <div className="relative h-full w-full">
                  <Image
                    src={src}
                    alt={item.titleAm ? `${item.title} · ${item.titleAm}` : item.title}
                    fill
                    unoptimized={!src.startsWith("/")}
                    sizes="(max-width: 1024px) 100vw, 80vw"
                    className="rounded-xl border border-gold/20 object-contain shadow-2xl"
                    priority
                  />
                </div>
              )}
              {isVideo && !poster ? (
                <span className="pointer-events-none absolute flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-[#0b0705]/70 text-gold">
                  <Play className="h-6 w-6" aria-hidden="true" />
                </span>
              ) : null}
            </motion.div>

            <button
              type="button"
              onClick={() => onNav(1)}
              aria-label="Next item"
              className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-[#150d09]/80 text-cream transition-colors hover:border-gold hover:bg-gold/15 hover:text-gold sm:right-6"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <p className="pb-6 text-center text-xs text-muted-foreground">
            {item.titleAm ? <span className="am-text mr-2 text-gold/80" lang="am">{item.titleAm}</span> : null}
            Swipe, tap the arrows or use ← → keys — Escape closes.
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
