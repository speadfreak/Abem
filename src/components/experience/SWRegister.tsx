"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

/* Registers the ops service worker only on staff/kitchen/rider. */
export default function SWRegister() {
  const pathname = usePathname();
  useEffect(() => {
    const isOps = ["/staff", "/kitchen", "/rider"].some((r) => pathname.startsWith(r));
    if (!isOps || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [pathname]);
  return null;
}
