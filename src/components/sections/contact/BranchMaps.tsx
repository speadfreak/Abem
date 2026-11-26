"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, Compass, LocateFixed, LoaderCircle, TriangleAlert } from "lucide-react";
import { SectionHeading } from "@/components/shared/Primitives";
import { mapsDirectionsLink } from "@/lib/format";
import { cn } from "@/lib/utils";

type BranchDTO = {
  id: string;
  name: string;
  address: string;
  addressAm: string | null;
  phone: string;
  mapEmbedUrl: string;
  directionsUrl: string;
  isPrimary: boolean;
};

type GeoState =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "ok"; km: number };

/** Fixed reference points — straight-line only (no external geocoding). */
const BRANCH_COORDS: { match: string; lat: number; lng: number }[] = [
  { match: "kazanchis", lat: 9.0122, lng: 38.7636 },
  { match: "bole", lat: 8.9936, lng: 38.7871 },
];

function coordsFor(branchName: string) {
  const n = branchName.toLowerCase();
  return BRANCH_COORDS.find((c) => n.includes(c.match)) ?? BRANCH_COORDS[0];
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function parseBranches(raw: unknown): BranchDTO[] {
  if (!Array.isArray(raw)) return [];
  const out: BranchDTO[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const b = item as Record<string, unknown>;
    if (typeof b.id !== "string" || typeof b.name !== "string" || typeof b.address !== "string") continue;
    out.push({
      id: b.id,
      name: b.name,
      address: b.address,
      addressAm: typeof b.addressAm === "string" ? b.addressAm : null,
      phone: typeof b.phone === "string" ? b.phone : "",
      mapEmbedUrl: typeof b.mapEmbedUrl === "string" ? b.mapEmbedUrl : "",
      directionsUrl: typeof b.directionsUrl === "string" ? b.directionsUrl : "",
      isPrimary: b.isPrimary === true,
    });
  }
  return out;
}

export default function BranchMaps() {
  const [branches, setBranches] = useState<BranchDTO[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });

  useEffect(() => {
    let alive = true;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (!alive) return;
        const parsed = parseBranches(typeof data === "object" && data !== null ? (data as Record<string, unknown>).branches : null);
        setBranches(parsed);
        if (parsed.length > 0) {
          const primary = parsed.find((b) => b.isPrimary) ?? parsed[0];
          setSelectedId(primary.id);
        }
      })
      .catch(() => {
        if (alive) setBranches([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const branch = useMemo(
    () => branches?.find((b) => b.id === selectedId) ?? branches?.[0] ?? null,
    [branches, selectedId]
  );

  const embedUrl = branch
    ? branch.mapEmbedUrl || `https://www.google.com/maps?q=${encodeURIComponent(branch.address)}&output=embed`
    : "";
  const googleUrl = branch ? branch.directionsUrl || mapsDirectionsLink(branch.address) : "";
  const appleUrl = branch ? `https://maps.apple.com/?q=${encodeURIComponent(branch.address)}` : "";

  const locateMe = () => {
    if (!branch) return;
    if (!("geolocation" in navigator)) {
      setGeo({ kind: "unavailable" });
      return;
    }
    setGeo({ kind: "locating" });
    const target = coordsFor(branch.name);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, target.lat, target.lng);
        setGeo({ kind: "ok", km });
      },
      (err) => {
        setGeo(err.code === err.PERMISSION_DENIED ? { kind: "denied" } : { kind: "unavailable" });
      },
      { timeout: 10000, maximumAge: 600000, enableHighAccuracy: false }
    );
  };

  return (
    <section className="container-x pb-24 md:pb-32" aria-labelledby="branches-heading">
      <SectionHeading
        eyebrow="Find Us · ቦታችን"
        title="Two fires, one city."
        titleAm="ሁለት ቅርንጫፎች"
        description="Pick a branch, get the map, and let Addis traffic do the rest."
      />

      {branches === null ? (
        <div className="mt-12 space-y-4" aria-hidden="true">
          <div className="skeleton-shimmer h-12 w-full max-w-xl rounded-full" />
          <div className="skeleton-shimmer aspect-video w-full rounded-2xl" />
        </div>
      ) : branches.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Branch maps are being updated — call the front desk and we will talk you in.
        </p>
      ) : branch ? (
        <div className="mt-12">
          <div className="flex flex-wrap gap-3" role="tablist" aria-label="Choose a branch">
            {branches.map((b) => {
              const active = b.id === branch.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedId(b.id);
                    setGeo({ kind: "idle" });
                  }}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-6 text-[12px] font-bold uppercase tracking-[0.16em] transition-all duration-300",
                    active
                      ? "border-gold bg-gold/15 text-gold shadow-[0_8px_28px_-12px_rgba(232,163,23,0.7)]"
                      : "border-gold/25 text-cream/75 hover:border-gold/70 hover:text-gold"
                  )}
                  aria-controls="branch-panel"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {b.name}
                  {b.isPrimary ? <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[9px]">Flagship</span> : null}
                </button>
              );
            })}
          </div>

          <div id="branch-panel" role="tabpanel" aria-label={branch.name} className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="relative">
              <span
                aria-hidden="true"
                className="animate-float-y absolute -top-7 right-8 z-10 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-elevated text-gold glow-gold"
              >
                <MapPin className="h-6 w-6" />
              </span>
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-gold/15 bg-surface">
                {embedUrl ? (
                  <iframe
                    key={branch.id}
                    src={embedUrl}
                    title={`Map — ${branch.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="h-full w-full"
                    style={{ filter: "grayscale(0.3) contrast(1.05)" }}
                  />
                ) : null}
              </div>
            </div>

            <div className="card-elevated flex flex-col justify-between gap-6 p-6 md:p-7">
              <div>
                <h3 className="display-3 text-cream">{branch.name}</h3>
                {branch.addressAm ? (
                  <p className="am-text mt-1 text-sm text-gold/80" lang="am">
                    {branch.addressAm}
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{branch.address}</p>
                {branch.phone ? (
                  <a href={`tel:${branch.phone.replace(/[^\d+]/g, "")}`} className="mt-2 inline-block text-sm font-semibold text-gold underline-offset-4 hover:underline">
                    {branch.phone}
                  </a>
                ) : null}
              </div>

              <div className="flex flex-col gap-3">
                <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-sm w-full">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Get directions — Google Maps
                </a>
                <a href={appleUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm w-full">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  Open in Apple Maps
                </a>

                <div className="mt-2 rounded-xl border border-gold/15 bg-elevated/60 p-4">
                  <button
                    type="button"
                    onClick={locateMe}
                    disabled={geo.kind === "locating"}
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold underline-offset-4 transition-colors hover:text-cream hover:underline disabled:opacity-70"
                  >
                    {geo.kind === "locating" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <LocateFixed className="h-4 w-4" aria-hidden="true" />
                    )}
                    How far am I?
                  </button>

                  {geo.kind === "ok" ? (
                    <p className="mt-2 text-sm text-cream" role="status">
                      ≈ <span className="font-display text-xl gold-text">{geo.km.toFixed(1)} km</span> from this branch.
                      <span className="block text-xs text-muted-foreground">Addis traffic may disagree.</span>
                    </p>
                  ) : null}
                  {geo.kind === "denied" ? (
                    <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground" role="alert">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" aria-hidden="true" />
                      Location permission denied — enable it in your browser, or just use the directions buttons.
                    </p>
                  ) : null}
                  {geo.kind === "unavailable" ? (
                    <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground" role="alert">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" aria-hidden="true" />
                      We couldn't get a location fix — the directions buttons above work just as well.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
