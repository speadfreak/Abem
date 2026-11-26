"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate, type Lang } from "@/lib/i18n/dictionary";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
  /** Pick a localized field pair like {name, nameAm}. */
  pick: (obj: object, base: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("abem_lang")) as Lang | null;
    if (saved === "am" || saved === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("abem_lang", l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l === "am" ? "am" : "en";
  }, []);

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "en" ? "am" : "en"),
      t: (key: string) => translate(key, lang),
      pick: (obj, base) => {
        const rec = obj as Record<string, unknown>;
        if (lang === "am") {
          const am = rec[`${base}Am`];
          if (typeof am === "string" && am.trim()) return am;
        }
        return typeof rec[base] === "string" ? (rec[base] as string) : "";
      },
    }),
    [lang, setLang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => {},
      toggle: () => {},
      t: (key: string) => translate(key, "en"),
      pick: (obj, base) => {
        const rec = obj as Record<string, unknown>;
        return typeof rec[base] === "string" ? (rec[base] as string) : "";
      },
    };
  }
  return ctx;
}
