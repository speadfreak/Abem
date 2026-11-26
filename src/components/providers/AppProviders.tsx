"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { LanguageProvider } from "@/lib/i18n/lang-context";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import Preloader from "@/components/brand/Preloader";
import SmoothScroll from "@/components/experience/SmoothScroll";
import Cursor from "@/components/experience/Cursor";
import ScrollProgress from "@/components/experience/ScrollProgress";
import BackToTop from "@/components/experience/BackToTop";
import Navbar from "@/components/experience/Navbar";
import Footer from "@/components/experience/Footer";
import MobileActionBar from "@/components/experience/MobileActionBar";
import AnnouncementBanner from "@/components/experience/AnnouncementBanner";
import SWRegister from "@/components/experience/SWRegister";
import type { PublicSettings } from "@/lib/settings";

const OPS_ROUTES = ["/admin", "/staff", "/kitchen", "/rider"];

export default function AppProviders({ children, settings }: { children: React.ReactNode; settings?: PublicSettings }) {
  const pathname = usePathname();
  const isOps = OPS_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <SettingsProvider initial={settings}>
      <LanguageProvider>
        <Preloader />
        {!isOps && <SmoothScroll />}
        <Cursor />
        <ScrollProgress />
        <BackToTop />
        <div className="grain-overlay" aria-hidden="true" />
        {!isOps && (
          <>
            <AnnouncementBanner />
            <Navbar />
          </>
        )}
        {isOps ? (
          children
        ) : (
          <div className="flex min-h-screen flex-col pb-[56px] md:pb-0">
            {children}
            <Footer />
          </div>
        )}
        <MobileActionBar />
        <SWRegister />
      </LanguageProvider>
    </SettingsProvider>
  );
}
