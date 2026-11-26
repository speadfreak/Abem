"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Instagram, Facebook, Music2, Send, Phone, Mail, MapPin, Loader2, Check } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";
import { OpenBadge } from "@/components/shared/Primitives";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLang } from "@/lib/i18n/lang-context";
import { telLink, whatsappLink } from "@/lib/format";

const QUICK_LINKS = [
  { key: "nav.menu", href: "/menu" },
  { key: "nav.reservations", href: "/reservations" },
  { key: "nav.order", href: "/order" },
  { key: "nav.experience", href: "/experience" },
  { key: "nav.events", href: "/events" },
  { key: "nav.stories", href: "/stories" },
  { key: "nav.careers", href: "/careers" },
  { key: "nav.contact", href: "/contact" },
];

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" } as const;

export default function Footer() {
  const { settings } = useSettings();
  const { t, pick, lang } = useLang();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  };

  return (
    <footer className="relative mt-auto border-t border-gold/10 bg-[#0a0604]" role="contentinfo">
      <div className="absolute inset-x-0 top-0 hairline" aria-hidden="true" />
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:py-20">
        {/* Brand */}
        <div>
          <LogoWordmark />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {pick(settings.site, "tagline")}
          </p>
          <div className="mt-6 flex items-center gap-2.5">
            {settings.socials?.instagram && (
              <a href={settings.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-cream/80 transition hover:border-gold/60 hover:text-gold">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings.socials?.facebook && (
              <a href={settings.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-cream/80 transition hover:border-gold/60 hover:text-gold">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {settings.socials?.tiktok && (
              <a href={settings.socials.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-cream/80 transition hover:border-gold/60 hover:text-gold">
                <Music2 className="h-4 w-4" />
              </a>
            )}
            {settings.socials?.telegram && (
              <a href={settings.socials.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-cream/80 transition hover:border-gold/60 hover:text-gold">
                <Send className="h-4 w-4" />
              </a>
            )}
            <a href={whatsappLink(settings.contact.whatsapp, "Hello Abem!")} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-cream/80 transition hover:border-gold/60 hover:text-gold">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a11 11 0 0 1-5.7-5c-.4-.7-.7-1.5-.7-2.2 0-.8.4-1.4.8-1.8.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2 0 .4-.1.5l-.5.6c-.2.2-.3.3-.1.6a8 8 0 0 0 3.5 3.1c.3.1.5.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l2 1c.3.1.5.3.5.4v.6Z"/></svg>
            </a>
          </div>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer quick links">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{t("footer.quickLinks")}</h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 lg:grid-cols-1">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-cream/70 transition-colors hover:text-gold">
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hours + contact */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{t("footer.hours")}</h3>
          <div className="mt-4">
            <OpenBadge hours={settings.hours ?? {}} holidays={settings.holidays ?? []} />
          </div>
          <ul className="mt-5 space-y-1.5 text-sm text-cream/70">
            {DAY_KEYS.map((d) => {
              const h = settings.hours?.[d];
              if (!h) return null;
              return (
                <li key={d} className="flex items-center justify-between gap-6">
                  <span className="text-cream/60">{DAY_LABELS[d]}</span>
                  <span className="font-mono text-[12px] text-cream/80">
                    {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Newsletter + contact */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{t("footer.newsletter")}</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("footer.newsletterSub")}</p>
          <form onSubmit={subscribe} className="mt-4 flex overflow-hidden rounded-full border border-gold/25 bg-elevated focus-within:border-gold/60" aria-label="Newsletter signup">
            <label htmlFor="footer-email" className="sr-only">Email</label>
            <input
              id="footer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("footer.emailPlaceholder")}
              className="h-11 w-full bg-transparent px-4 text-sm text-cream outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="flex h-11 min-w-11 items-center justify-center bg-gradient-to-br from-gold-soft to-gold px-4 text-[#1a0e05] transition hover:brightness-110 disabled:opacity-60"
              aria-label="Subscribe to newsletter"
            >
              {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
          </form>
          {state === "done" && <p className="mt-2 text-xs text-[#8fd0a0]">Welcome to the table. Check your inbox.</p>}
          {state === "error" && <p className="mt-2 text-xs text-[#e05a4e]">Something went wrong — try again.</p>}

          <ul className="mt-6 space-y-2.5 text-sm text-cream/70">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" />
              <span>{pick(settings.contact, "address")}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-gold/80" />
              <a href={telLink(settings.contact.phone)} className="hover:text-gold">{settings.contact.phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-gold/80" />
              <a href={`mailto:${settings.contact.email}`} className="hover:text-gold">{settings.contact.email}</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.site.name}. {t("footer.rights")}</p>
          <div className="flex items-center gap-5">
            <Link href="/legal" className="transition hover:text-gold">Privacy</Link>
            <Link href="/legal" className="transition hover:text-gold">Terms</Link>
            <span className="text-cream/50" lang={lang}>
              {t("footer.credit")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
