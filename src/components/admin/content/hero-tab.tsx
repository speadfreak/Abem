"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { ImagePicker } from "@/components/admin/image-picker";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { SettingsPayload } from "@/components/admin/types";
import type { SiteSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SEO_KEYS = ["home", "menu", "reservations", "about"] as const;
type SeoKey = (typeof SEO_KEYS)[number];

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  am = false,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  am?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="flex w-full rounded-xl border border-gold/15 bg-elevated/60 px-3 py-2 text-sm text-cream outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-gold/50"
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(am && "am-text")}
        />
      )}
    </div>
  );
}

function SectionCard({
  title,
  hint,
  saving,
  onSave,
  children,
  extra,
}: {
  title: string;
  hint?: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section className="card-elevated rounded-2xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="display-3 text-cream">{title}</h2>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <Button className="btn-gold btn-sm !rounded-xl" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
            Save
          </Button>
        </div>
      </div>
      {children}
    </section>
  );
}

function HeroEditor({ initial }: { initial: SiteSettings }) {
  const [hero, setHero] = useState<SiteSettings["hero"]>(initial.hero);
  const [stats, setStats] = useState<SiteSettings["stats"]>(initial.stats);
  const [banner, setBanner] = useState<SiteSettings["banner"]>(initial.banner);
  const [seo, setSeo] = useState<SiteSettings["seo"]>(initial.seo);
  const [seoKey, setSeoKey] = useState<SeoKey>("home");
  const [saving, setSaving] = useState("");

  async function put(section: string, value: unknown, label: string) {
    setSaving(section);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, value }),
      });
      toast.success(`${label} saved`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving("");
    }
  }

  const entry = seo[seoKey] ?? { title: "", description: "", ogImage: "" };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Hero section"
        hint="The first thing every guest reads."
        saving={saving === "hero"}
        onSave={() => void put("hero", hero, "Hero")}
        extra={
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
            <ExternalLink className="h-3 w-3" aria-hidden="true" /> Open site
          </a>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="hero-eyebrow" label="Eyebrow" value={hero.eyebrow} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
          <Field id="hero-eyebrow-am" label="Eyebrow (Amharic)" am value={hero.eyebrowAm} onChange={(v) => setHero({ ...hero, eyebrowAm: v })} />
          <Field id="hero-title" label="Title" value={hero.title} onChange={(v) => setHero({ ...hero, title: v })} />
          <Field id="hero-title-am" label="Title (Amharic)" am value={hero.titleAm} onChange={(v) => setHero({ ...hero, titleAm: v })} />
          <Field id="hero-sub" label="Subtitle" multiline value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
          <Field id="hero-sub-am" label="Subtitle (Amharic)" am multiline value={hero.subtitleAm} onChange={(v) => setHero({ ...hero, subtitleAm: v })} />
          <Field id="hero-cta1-label" label="CTA 1 · label" value={hero.cta1.label} onChange={(v) => setHero({ ...hero, cta1: { ...hero.cta1, label: v } })} />
          <Field id="hero-cta1-href" label="CTA 1 · link" value={hero.cta1.href} onChange={(v) => setHero({ ...hero, cta1: { ...hero.cta1, href: v } })} />
          <Field id="hero-cta2-label" label="CTA 2 · label" value={hero.cta2.label} onChange={(v) => setHero({ ...hero, cta2: { ...hero.cta2, label: v } })} />
          <Field id="hero-cta2-href" label="CTA 2 · link" value={hero.cta2.href} onChange={(v) => setHero({ ...hero, cta2: { ...hero.cta2, href: v } })} />
          <Field id="hero-video" label="Video URL (mp4)" value={hero.videoUrl} onChange={(v) => setHero({ ...hero, videoUrl: v })} />
          <div className="sm:col-span-2">
            <ImagePicker id="hero-poster" label="Poster image" value={hero.posterUrl} onChange={(v) => setHero({ ...hero, posterUrl: v })} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Numbers band"
        hint="The stats strip the site shows under the hero."
        saving={saving === "stats"}
        onSave={() => void put("stats", stats, "Stats")}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Field id="stat-years" label="Years" value={String(stats.years)} onChange={(v) => setStats({ ...stats, years: Number(v) || 0 })} />
          <Field id="stat-dishes" label="Dishes" value={String(stats.dishes)} onChange={(v) => setStats({ ...stats, dishes: Number(v) || 0 })} />
          <Field id="stat-guests" label="Guests" value={String(stats.guests)} onChange={(v) => setStats({ ...stats, guests: Number(v) || 0 })} />
          <Field id="stat-awards" label="Awards" value={String(stats.awards)} onChange={(v) => setStats({ ...stats, awards: Number(v) || 0 })} />
        </div>
      </SectionCard>

      <SectionCard
        title="Announcement banner"
        hint="Thin strip above the navbar. Leave off for a clean showcase."
        saving={saving === "banner"}
        onSave={() => void put("banner", banner, "Banner")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-cream">
            <Switch checked={banner.enabled} onCheckedChange={(v) => setBanner({ ...banner, enabled: v })} aria-label="Banner enabled" />
            Enabled
          </label>
          <Field id="banner-href" label="Link" value={banner.href} onChange={(v) => setBanner({ ...banner, href: v })} placeholder="/events" />
          <Field id="banner-text" label="Text" value={banner.text} onChange={(v) => setBanner({ ...banner, text: v })} />
          <Field id="banner-text-am" label="Text (Amharic)" am value={banner.textAm} onChange={(v) => setBanner({ ...banner, textAm: v })} />
        </div>
      </SectionCard>

      <SectionCard
        title="SEO per page"
        hint="Meta title, description and the social share image."
        saving={saving === "seo"}
        onSave={() => void put("seo", seo, "SEO")}
      >
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="SEO page key">
          {SEO_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={seoKey === k}
              onClick={() => setSeoKey(k)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                seoKey === k
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/20 text-muted-foreground hover:border-gold/50 hover:text-cream"
              )}
            >
              /{k === "home" ? "" : k}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id={`seo-${seoKey}-title`} label="Meta title" value={entry.title} onChange={(v) => setSeo({ ...seo, [seoKey]: { ...entry, title: v } })} />
          </div>
          <div className="sm:col-span-2">
            <Field
              id={`seo-${seoKey}-desc`}
              label="Meta description"
              multiline
              value={entry.description}
              onChange={(v) => setSeo({ ...seo, [seoKey]: { ...entry, description: v } })}
            />
          </div>
          <div className="sm:col-span-2">
            <ImagePicker
              id={`seo-${seoKey}-og`}
              label="OG image"
              value={entry.ogImage}
              onChange={(v) => setSeo({ ...seo, [seoKey]: { ...entry, ogImage: v } })}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default function HeroTab() {
  const [initial, setInitial] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<SettingsPayload>("/api/admin/settings")
      .then((d) => setInitial(d.settings))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }
  return initial ? <HeroEditor initial={initial} /> : null;
}
