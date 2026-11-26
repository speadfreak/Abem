"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, ShoppingBag, CalendarCheck } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLang } from "@/lib/i18n/lang-context";
import { telLink, whatsappLink } from "@/lib/format";

/* Floating action cluster (mobile): Call · WhatsApp · Reserve · Order */
export default function MobileActionBar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { t } = useLang();

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/kitchen") || pathname.startsWith("/rider")) {
    return null;
  }

  return (
    <div className="abem-floating fixed inset-x-0 bottom-0 z-[78] border-t border-gold/15 bg-[#0b0705]/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" role="navigation" aria-label="Quick actions">
      <div className="grid grid-cols-4">
        <a href={telLink(settings.contact.phone)} className="flex h-14 min-h-[44px] flex-col items-center justify-center gap-0.5 text-cream/85 active:bg-gold/10" aria-label={t("common.callUs")}>
          <Phone className="h-4.5 w-4.5 h-[18px] w-[18px] text-gold" />
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">{t("common.callUs")}</span>
        </a>
        <a href={whatsappLink(settings.contact.whatsapp, "Hello Abem!")} target="_blank" rel="noopener noreferrer" className="flex h-14 min-h-[44px] flex-col items-center justify-center gap-0.5 text-cream/85 active:bg-gold/10" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-gold" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a11 11 0 0 1-5.7-5c-.4-.7-.7-1.5-.7-2.2 0-.8.4-1.4.8-1.8.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2 0 .4-.1.5l-.5.6c-.2.2-.3.3-.1.6a8 8 0 0 0 3.5 3.1c.3.1.5.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l2 1c.3.1.5.3.5.4v.6Z"/></svg>
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">{t("common.whatsapp")}</span>
        </a>
        <Link href="/reservations" className={`flex h-14 min-h-[44px] flex-col items-center justify-center gap-0.5 active:bg-gold/10 ${pathname === "/reservations" ? "text-gold" : "text-cream/85"}`} aria-label={t("common.reserve")}>
          <CalendarCheck className="h-[18px] w-[18px] text-gold" />
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">{t("common.reserve")}</span>
        </Link>
        {settings.features.ordering ? (
          <Link href="/order" className="flex h-14 min-h-[44px] flex-col items-center justify-center gap-0.5 bg-gradient-to-t from-gold/25 to-transparent text-gold active:bg-gold/20" aria-label={t("nav.order")}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">{t("nav.order")}</span>
          </Link>
        ) : (
          <a href={telLink(settings.contact.phone)} className="flex h-14 min-h-[44px] flex-col items-center justify-center gap-0.5 text-cream/85 active:bg-gold/10" aria-label={t("common.callUs")}>
            <Phone className="h-[18px] w-[18px] text-gold" />
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">Call to order</span>
          </a>
        )}
      </div>
    </div>
  );
}
