"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu as MenuIcon, X, ShoppingBag, Phone } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";
import Magnetic from "@/components/shared/Magnetic";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLang } from "@/lib/i18n/lang-context";
import { telLink } from "@/lib/format";
import { cn } from "@/lib/utils";

const LINKS: { key: string; href: string }[] = [
  { key: "nav.menu", href: "/menu" },
  { key: "nav.about", href: "/about" },
  { key: "nav.reservations", href: "/reservations" },
  { key: "nav.experience", href: "/experience" },
  { key: "nav.gallery", href: "/gallery" },
  { key: "nav.stories", href: "/stories" },
  { key: "nav.contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { t, lang, toggle } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 42);
      if (y > 220 && y > lastY.current + 8) setHidden(true);
      else if (y < lastY.current - 8 || y < 120) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const ordering = settings.features.ordering;

  return (
    <>
      <header
        style={{ top: settings.banner?.enabled ? "36px" : "0px" }}
        className={cn(
          "fixed inset-x-0 z-[85] transition-all duration-500",
          hidden && !open ? "-translate-y-[130px]" : "translate-y-0"
        )}
        aria-label="Main navigation"
      >
        <div
          className={cn(
            "transition-all duration-500",
            scrolled ? "glass shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]" : "bg-transparent border-b border-transparent"
          )}
        >
          <nav className="container-x flex h-[72px] items-center justify-between gap-4">
            <Link href="/" aria-label="Abem Restaurant home" className="shrink-0">
              <LogoWordmark />
            </Link>

            <ul className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "group relative rounded-full px-4 py-2 text-[12.5px] font-semibold uppercase tracking-[0.14em] transition-colors",
                        active ? "text-gold" : "text-cream/80 hover:text-cream"
                      )}
                    >
                      {t(l.key)}
                      <span
                        className={cn(
                          "absolute inset-x-4 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-300",
                          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2.5">
              <button
                onClick={toggle}
                className="hidden h-10 rounded-full border border-gold/30 px-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cream/90 transition hover:border-gold/70 hover:text-gold sm:inline-flex"
                aria-label={lang === "en" ? "አማርኛ በምርጫዎ" : "Switch to English"}
              >
                {lang === "en" ? "አማ" : "EN"}
              </button>

              <a
                href={telLink(settings.contact.phone)}
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10 md:inline-flex"
                aria-label="Call Abem Restaurant"
              >
                <Phone className="h-4 w-4" />
              </a>

              {ordering && (
                <Link href="/order" className="btn-gold btn-sm hidden md:inline-flex" data-magnetic>
                  <ShoppingBag className="h-4 w-4" />
                  <span>{t("nav.order")}</span>
                </Link>
              )}

              <Magnetic className="hidden md:inline-block">
                <Link href="/reservations" className="btn-ghost btn-sm" data-magnetic>
                  {t("common.reserve")}
                </Link>
              </Magnetic>

              <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-cream transition hover:bg-gold/10 lg:hidden"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[84] flex flex-col bg-[#0b0705]/97 pt-24 pb-10 backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(179,38,30,0.14),transparent),radial-gradient(50%_40%_at_80%_100%,rgba(232,163,23,0.08),transparent)]" />
            <ul className="container-x flex flex-1 flex-col justify-center gap-1">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={l.href}
                    className="group flex items-baseline gap-4 py-2.5"
                    onClick={() => setOpen(false)}
                  >
                    <span className="font-mono text-xs text-gold/60">0{i + 1}</span>
                    <span className="display-2 text-cream transition-colors group-hover:text-gold">
                      {t(l.key)}
                    </span>
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.44, duration: 0.5 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {ordering && (
                  <Link href="/order" className="btn-gold" onClick={() => setOpen(false)}>
                    <ShoppingBag className="h-4 w-4" />
                    {t("nav.order")}
                  </Link>
                )}
                <Link href="/reservations" className="btn-ghost" onClick={() => setOpen(false)}>
                  {t("common.reserve")}
                </Link>
                <button onClick={toggle} className="btn-ghost">
                  {lang === "en" ? "አማርኛ" : "English"}
                </button>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
