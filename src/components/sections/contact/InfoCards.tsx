"use client";

import React from "react";
import { Phone, MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import { OpenBadge } from "@/components/shared/Primitives";
import { useSettings } from "@/components/providers/SettingsProvider";
import { DAYS } from "@/lib/settings";
import { telLink, whatsappLink } from "@/lib/format";
import { Reveal } from "@/components/shared/Primitives";
import { cn } from "@/lib/utils";

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/* useSyncExternalStore plumbing — client-only "today" value without setState-in-effect. */
function subscribeDayChange(onChange: () => void): () => void {
  const id = setInterval(onChange, 60_000); // keep "today" fresh across midnight
  return () => clearInterval(id);
}

export default function InfoCards() {
  const { settings } = useSettings();
  const c = settings.contact;
  const hours = settings.hours ?? {};
  const todayKey = React.useSyncExternalStore(
    subscribeDayChange,
    () => WEEKDAY_KEYS[new Date().getDay()],
    () => ""
  );

  const cards = [
    {
      icon: Phone,
      label: "Call the front desk",
      value: c.phone,
      href: telLink(c.phone),
      hint: "Daily during opening hours — Amharic & English",
      external: false,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: c.whatsapp,
      href: whatsappLink(c.whatsapp, "Hello Abem! I have a question about…"),
      hint: "Fastest reply — usually within minutes",
      external: true,
    },
    {
      icon: Mail,
      label: "Email",
      value: c.email,
      href: `mailto:${c.email}`,
      hint: "Events, press & partnerships",
      external: false,
    },
    {
      icon: MapPin,
      label: "Find us",
      value: c.address,
      href: undefined,
      hint: c.addressAm ?? "አዲስ አበባ",
      external: false,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cards.map((card, i) => {
        const inner = (
          <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{card.label}</span>
              <span className="mt-1 block line-clamp-2 break-words text-sm font-semibold text-cream">{card.value}</span>
              {card.hint ? (
                <span className={cn("mt-1 block text-xs text-muted-foreground", card.label === "Find us" && "am-text")} lang={card.label === "Find us" ? "am" : undefined}>
                  {card.hint}
                </span>
              ) : null}
            </span>
          </>
        );
        const cls =
          "card-elevated card-hover flex min-h-11 items-start gap-4 rounded-2xl p-5 text-left transition-colors";
        return (
          <Reveal key={card.label} delay={i * 0.08}>
            {card.href ? (
              <a
                href={card.href}
                className={cls}
                {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={`${card.label}: ${card.value}`}
              >
                {inner}
              </a>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </Reveal>
        );
      })}

      <Reveal delay={0.2} className="sm:col-span-2">
        <div className="card-elevated rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Opening hours
            </span>
            <OpenBadge hours={hours} holidays={settings.holidays ?? []} />
          </div>
          <table className="mt-4 w-full text-sm">
            <caption className="sr-only">Weekly opening hours for Abem Restaurant</caption>
            <tbody>
              {DAYS.map((day) => {
                const h = hours[day];
                const isToday = day === todayKey;
                return (
                  <tr key={day} className={cn("border-b border-gold/10 last:border-0", isToday && "text-gold")}>
                    <th scope="row" className="py-2.5 text-left font-medium capitalize text-cream">
                      {day}
                      {isToday ? <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-gold">today</span> : null}
                    </th>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                      {h && !h.closed ? `${h.open} – ${h.close}` : "Closed"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Kitchen closes 45 minutes before the doors. Buna ceremony runs all day; azmari band from 8 PM on weekends.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
