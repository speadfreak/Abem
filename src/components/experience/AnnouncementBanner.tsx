"use client";

import React from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLang } from "@/lib/i18n/lang-context";

export default function AnnouncementBanner() {
  const { settings } = useSettings();
  const { lang } = useLang();
  const [closed, setClosed] = React.useState(false);

  const b = settings.banner;
  if (!b?.enabled || closed) return null;
  const text = lang === "am" && b.textAm ? b.textAm : b.text;
  if (!text) return null;

  const inner = (
    <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-wide text-[#1a0e05]">
      <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
      {text}
    </span>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-[90] bg-gradient-to-r from-gold-soft via-gold to-gold-soft shadow-[0_8px_30px_-12px_rgba(232,163,23,0.7)] no-print" role="region" aria-label="Announcement">
      <div className="container-x flex h-9 items-center justify-center gap-3">
        {b.href ? (
          <Link href={b.href} className="hover:underline">{inner}</Link>
        ) : (
          inner
        )}
        <button onClick={() => setClosed(true)} aria-label="Dismiss announcement" className="text-[#1a0e05]/70 hover:text-[#1a0e05]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
