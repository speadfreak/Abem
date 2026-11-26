"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  MapPin,
  RefreshCw,
  Download,
  ShieldAlert,
  Star,
  Clock3,
} from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { ImagePicker } from "@/components/admin/image-picker";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminBranch, AdminCoupon, AdminZone, SettingsPayload } from "@/components/admin/types";
import type { SiteSettings } from "@/lib/settings";
import { DAYS } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function NumField({
  id,
  label,
  value,
  onChange,
  min = 0,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <Input id={id} type="number" min={min} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

function TextField({
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
        <Textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(am && "am-text")} />
      )}
    </div>
  );
}

function SaveButton({ saving, onClick, label = "Save" }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <Button className="btn-gold btn-sm !rounded-xl" disabled={saving} onClick={onClick}>
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
      {label}
    </Button>
  );
}

export default function AdminSettingsPage() {
  const [payload, setPayload] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  /* local editable copies (initialized when payload arrives) */
  const [contact, setContact] = useState<SiteSettings["contact"] | null>(null);
  const [hours, setHours] = useState<SiteSettings["hours"] | null>(null);
  const [holidaysText, setHolidaysText] = useState("");
  const [features, setFeatures] = useState<SiteSettings["features"] | null>(null);
  const [loyalty, setLoyalty] = useState<SiteSettings["loyalty"] | null>(null);
  const [theme, setTheme] = useState<SiteSettings["theme"] | null>(null);
  const [site, setSite] = useState<SiteSettings["site"] | null>(null);

  /* branch dialog */
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchEditing, setBranchEditing] = useState<AdminBranch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    address: "",
    addressAm: "",
    phone: "",
    mapEmbedUrl: "",
    directionsUrl: "",
    isPrimary: false,
    active: true,
    order: "0",
  });

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<SettingsPayload>("/api/admin/settings");
      setPayload(d);
      setContact(d.settings.contact);
      setHours(d.settings.hours);
      setHolidaysText((d.settings.holidays ?? []).join("\n"));
      setFeatures(d.settings.features);
      setLoyalty(d.settings.loyalty);
      setTheme(d.settings.theme);
      setSite(d.settings.site);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function put(body: Record<string, unknown>, label: string, quiet = false) {
    setSaving(label);
    try {
      const d = await apiFetch<SettingsPayload>("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setPayload(d);
      setContact(d.settings.contact);
      setHours(d.settings.hours);
      setHolidaysText((d.settings.holidays ?? []).join("\n"));
      setFeatures(d.settings.features);
      setLoyalty(d.settings.loyalty);
      setTheme(d.settings.theme);
      setSite(d.settings.site);
      if (!quiet) toast.success(`${label} saved`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving("");
    }
  }

  function openBranch(b: AdminBranch | null) {
    setBranchEditing(b);
    setBranchForm({
      name: b?.name ?? "",
      address: b?.address ?? "",
      addressAm: b?.addressAm ?? "",
      phone: b?.phone ?? "",
      mapEmbedUrl: b?.mapEmbedUrl ?? "",
      directionsUrl: b?.directionsUrl ?? "",
      isPrimary: b?.isPrimary ?? false,
      active: b?.active ?? true,
      order: String(b?.order ?? 0),
    });
    setBranchOpen(true);
  }

  if (loading) return <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6"><AdminSkeleton rows={6} /></div>;
  if (!payload || !contact || !hours || !features || !loyalty || !theme || !site) {
    return <div className="p-6 text-sm text-muted-foreground">Settings unavailable.</div>;
  }

  const zones = payload.zones;
  const coupons = payload.coupons;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Settings"
        subtitle="Contact, hours, branches, features, loyalty and theme — the soul of the site."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-elevated/60 p-1">
          <TabsTrigger value="contact">Contact &amp; Hours</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="site">Site</TabsTrigger>
        </TabsList>

        {/* CONTACT & HOURS */}
        <TabsContent value="contact" className="space-y-4">
          <section className="card-elevated rounded-2xl p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="display-3 text-cream">Contact</h2>
              <SaveButton saving={saving === "contact"} onClick={() => void put({ section: "contact", value: contact }, "Contact")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="c-phone" label="Phone" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
              <TextField id="c-wa" label="WhatsApp" value={contact.whatsapp} onChange={(v) => setContact({ ...contact, whatsapp: v })} />
              <TextField id="c-email" label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} />
              <TextField id="c-address" label="Address" value={contact.address} onChange={(v) => setContact({ ...contact, address: v })} />
              <div className="sm:col-span-2">
                <TextField id="c-address-am" label="Address (Amharic)" am value={contact.addressAm} onChange={(v) => setContact({ ...contact, addressAm: v })} />
              </div>
            </div>
          </section>

          <section className="card-elevated rounded-2xl p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="display-3 flex items-center gap-2 text-cream">
                  <Clock3 className="h-5 w-5 text-gold" aria-hidden="true" /> Opening hours
                </h2>
                <p className="text-xs text-muted-foreground">Public site opens/closes automatically from these rows.</p>
              </div>
              <SaveButton saving={saving === "hours"} onClick={() => void put({ section: "hours", value: hours }, "Hours")} />
            </div>
            <div className="space-y-2">
              {DAYS.map((day) => {
                const h = hours[day] ?? { open: "11:00", close: "23:00", closed: false };
                return (
                  <div key={day} className="flex items-center gap-3 rounded-xl border border-gold/10 bg-elevated/40 p-3">
                    <span className="w-24 shrink-0 text-sm font-medium capitalize text-cream">{day}</span>
                    <Input
                      type="time"
                      aria-label={`${day} opens`}
                      value={h.open}
                      disabled={h.closed}
                      onChange={(e) => setHours({ ...hours, [day]: { ...h, open: e.target.value } })}
                      className="w-28"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="time"
                      aria-label={`${day} closes`}
                      value={h.close}
                      disabled={h.closed}
                      onChange={(e) => setHours({ ...hours, [day]: { ...h, close: e.target.value } })}
                      className="w-28"
                    />
                    <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={!h.closed}
                        onCheckedChange={(v) => setHours({ ...hours, [day]: { ...h, closed: !v } })}
                        aria-label={`${day} open`}
                      />
                      {h.closed ? "Closed" : "Open"}
                    </label>
                  </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="holidays" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Holidays (one ISO date per line, e.g. 2024-09-11)
                </Label>
                <Textarea
                  id="holidays"
                  rows={3}
                  value={holidaysText}
                  onChange={(e) => setHolidaysText(e.target.value)}
                  placeholder={"2024-09-11\n2025-01-07"}
                />
              </div>
              <SaveButton
                saving={saving === "holidays"}
                label="Save holidays"
                onClick={() =>
                  void put(
                    { section: "holidays", value: holidaysText.split("\n").map((s) => s.trim()).filter(Boolean) },
                    "Holidays"
                  )
                }
              />
            </div>
          </section>
        </TabsContent>

        {/* BRANCHES */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Button className="btn-gold btn-sm !rounded-xl" onClick={() => openBranch(null)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add branch
            </Button>
          </div>
          {payload.branches.length === 0 ? (
            <EmptyState icon={<MapPin className="h-8 w-8" />} title="No branches yet" hint="Add your locations so guests can find the fire." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {payload.branches.map((b) => (
                <article key={b.id} className="card-elevated rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-cream">
                        <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                        {b.name}
                        {b.isPrimary ? (
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label="Primary branch" />
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{b.address}</p>
                      <p className="text-xs text-muted-foreground">{b.phone}</p>
                    </div>
                    {!b.active ? (
                      <Badge variant="outline" className="border-ember/40 text-[9px] uppercase tracking-widest text-red-300">
                        Closed
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => openBranch(b)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-ember/40 text-red-300 hover:bg-ember/10"
                      onClick={() => void put({ kind: "branch-delete", id: b.id }, "Branch deleted")}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FEATURES */}
        <TabsContent value="features" className="space-y-4">
          <section className="card-elevated rounded-2xl p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="display-3 text-cream">Feature switches</h2>
                <p className="text-xs text-muted-foreground">Off = public site is a pure showcase (no ordering, no delivery).</p>
              </div>
              <SaveButton saving={saving === "features"} onClick={() => void put({ section: "features", value: features }, "Features")} />
            </div>
            <div className="space-y-3">
              {(
                [
                  { key: "ordering", label: "Online ordering", hint: "TAKEAWAY & DINEIN QR ordering" },
                  { key: "delivery", label: "Delivery", hint: "Zones, riders and ETA windows" },
                  { key: "tableQr", label: "Table QR ordering", hint: "Scan-to-order per table" },
                  { key: "rewards", label: "Abem Rewards", hint: "Points, tiers, referrals" },
                  { key: "preOrders", label: "Pre-orders", hint: "Schedule orders ahead" },
                ] as const
              ).map(({ key, label, hint }) => (
                <label key={key} className="flex items-center justify-between gap-4 rounded-xl border border-gold/10 bg-elevated/40 p-3">
                  <span>
                    <span className="block text-sm font-medium text-cream">{label}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                  <Switch
                    checked={features[key]}
                    onCheckedChange={(v) => setFeatures({ ...features, [key]: v })}
                    aria-label={label}
                  />
                </label>
              ))}
            </div>
          </section>
        </TabsContent>

        {/* LOYALTY */}
        <TabsContent value="loyalty" className="space-y-4">
          <section className="card-elevated rounded-2xl p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="display-3 text-cream">Abem Rewards</h2>
              <SaveButton saving={saving === "loyalty"} onClick={() => void put({ section: "loyalty", value: loyalty }, "Loyalty")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumField id="l-pts" label="Points per 100 ETB" value={loyalty.pointsPer100} onChange={(v) => setLoyalty({ ...loyalty, pointsPer100: v })} />
              <NumField id="l-bday" label="Birthday bonus" value={loyalty.birthdayBonus} onChange={(v) => setLoyalty({ ...loyalty, birthdayBonus: v })} />
              <NumField id="l-ref" label="Referral points" value={loyalty.referralPoints} onChange={(v) => setLoyalty({ ...loyalty, referralPoints: v })} />
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tiers</p>
              {loyalty.tiers.map((t, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 rounded-xl border border-gold/10 bg-elevated/40 p-3">
                  <div className="w-28 space-y-1">
                    <Label htmlFor={`tier-name-${i}`} className="text-[9px] uppercase tracking-widest text-muted-foreground">Name</Label>
                    <Input
                      id={`tier-name-${i}`}
                      value={t.name}
                      onChange={(e) => {
                        const tiers = [...loyalty.tiers];
                        tiers[i] = { ...t, name: e.target.value };
                        setLoyalty({ ...loyalty, tiers });
                      }}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label htmlFor={`tier-min-${i}`} className="text-[9px] uppercase tracking-widest text-muted-foreground">Min pts</Label>
                    <Input
                      id={`tier-min-${i}`}
                      type="number"
                      min={0}
                      value={t.min}
                      onChange={(e) => {
                        const tiers = [...loyalty.tiers];
                        tiers[i] = { ...t, min: Number(e.target.value) || 0 };
                        setLoyalty({ ...loyalty, tiers });
                      }}
                    />
                  </div>
                  <div className="min-w-40 flex-1 space-y-1">
                    <Label htmlFor={`tier-perk-${i}`} className="text-[9px] uppercase tracking-widest text-muted-foreground">Perk</Label>
                    <Input
                      id={`tier-perk-${i}`}
                      value={t.perk}
                      onChange={(e) => {
                        const tiers = [...loyalty.tiers];
                        tiers[i] = { ...t, perk: e.target.value };
                        setLoyalty({ ...loyalty, tiers });
                      }}
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-ember"
                    aria-label={`Remove tier ${t.name}`}
                    onClick={() => setLoyalty({ ...loyalty, tiers: loyalty.tiers.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoyalty({ ...loyalty, tiers: [...loyalty.tiers, { name: "", min: 0, perk: "" }] })}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add tier
              </Button>
            </div>
          </section>
        </TabsContent>

        {/* THEME */}
        <TabsContent value="theme" className="space-y-4">
          <section className="card-elevated rounded-2xl p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="display-3 text-cream">Theme</h2>
              <SaveButton saving={saving === "theme"} onClick={() => void put({ section: "theme", value: theme }, "Theme")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="th-gold" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Gold
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="th-gold"
                    type="color"
                    value={theme.gold}
                    onChange={(e) => setTheme({ ...theme, gold: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gold/25 bg-transparent"
                  />
                  <Input value={theme.gold} onChange={(e) => setTheme({ ...theme, gold: e.target.value })} className="w-32 font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="th-ember" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Ember
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="th-ember"
                    type="color"
                    value={theme.ember}
                    onChange={(e) => setTheme({ ...theme, ember: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gold/25 bg-transparent"
                  />
                  <Input value={theme.ember} onChange={(e) => setTheme({ ...theme, ember: e.target.value })} className="w-32 font-mono text-xs" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <ImagePicker
                  id="th-logo"
                  label="Logo"
                  value={site.logoUrl}
                  onChange={(v) => setSite({ ...site, logoUrl: v })}
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Logo is saved together with the site identity — press Save on the Site tab below, or it reverts on refresh.
                </p>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* SITE + DANGER */}
        <TabsContent value="site" className="space-y-4">
          <section className="card-elevated rounded-2xl p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="display-3 text-cream">Site identity</h2>
              <SaveButton saving={saving === "site"} onClick={() => void put({ section: "site", value: site }, "Site")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="s-name" label="Name" value={site.name} onChange={(v) => setSite({ ...site, name: v })} />
              <TextField id="s-short" label="Short name" value={site.shortName} onChange={(v) => setSite({ ...site, shortName: v })} />
              <TextField id="s-tagline" label="Tagline" value={site.tagline} onChange={(v) => setSite({ ...site, tagline: v })} />
              <TextField id="s-tagline-am" label="Tagline (Amharic)" am value={site.taglineAm} onChange={(v) => setSite({ ...site, taglineAm: v })} />
              <TextField id="s-founded" label="Founded" value={site.founded} onChange={(v) => setSite({ ...site, founded: v })} />
              <TextField id="s-city" label="City" value={site.city} onChange={(v) => setSite({ ...site, city: v })} />
            </div>
          </section>

          <section className="rounded-2xl border border-ember/30 bg-ember/5 p-4 md:p-6">
            <h2 className="display-3 flex items-center gap-2 text-red-300">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" /> Danger zone
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Full JSON backup of every table (admin password hashes stripped). Keep it somewhere cold.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.open("/api/admin/export", "_blank")}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download full backup (JSON)
            </Button>
          </section>
        </TabsContent>
      </Tabs>

      {/* Branch dialog */}
      <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-gold/20 bg-card no-scrollbar">
          <DialogHeader>
            <DialogTitle>{branchEditing ? `Edit ${branchEditing.name}` : "New branch"}</DialogTitle>
            <DialogDescription>Locations shown on the public site and used for directions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField id="b-name" label="Name" value={branchForm.name} onChange={(v) => setBranchForm({ ...branchForm, name: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextField id="b-address" label="Address" value={branchForm.address} onChange={(v) => setBranchForm({ ...branchForm, address: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextField id="b-address-am" label="Address (Amharic)" am value={branchForm.addressAm} onChange={(v) => setBranchForm({ ...branchForm, addressAm: v })} />
            </div>
            <TextField id="b-phone" label="Phone" value={branchForm.phone} onChange={(v) => setBranchForm({ ...branchForm, phone: v })} />
            <div className="space-y-1.5">
              <Label htmlFor="b-order" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Order
              </Label>
              <Input id="b-order" type="number" min={0} value={branchForm.order} onChange={(e) => setBranchForm({ ...branchForm, order: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <TextField id="b-map" label="Map embed URL" multiline value={branchForm.mapEmbedUrl} onChange={(v) => setBranchForm({ ...branchForm, mapEmbedUrl: v })} placeholder="https://www.google.com/maps/embed?…" />
            </div>
            <div className="sm:col-span-2">
              <TextField id="b-dir" label="Directions URL" value={branchForm.directionsUrl} onChange={(v) => setBranchForm({ ...branchForm, directionsUrl: v })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-cream">
              <Switch
                checked={branchForm.isPrimary}
                onCheckedChange={(v) => setBranchForm({ ...branchForm, isPrimary: v })}
                aria-label="Primary branch"
              />
              Primary branch
            </label>
            <label className="flex items-center gap-2 text-sm text-cream">
              <Switch checked={branchForm.active} onCheckedChange={(v) => setBranchForm({ ...branchForm, active: v })} aria-label="Active" />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBranchOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-gold btn-sm !rounded-xl"
              disabled={saving !== "" || branchForm.name.trim().length < 2 || branchForm.address.trim().length < 4 || branchForm.phone.trim().length < 5}
              onClick={() => {
                void put(
                  {
                    kind: "branch",
                    data: {
                      id: branchEditing?.id,
                      name: branchForm.name.trim(),
                      address: branchForm.address.trim(),
                      addressAm: branchForm.addressAm,
                      phone: branchForm.phone.trim(),
                      mapEmbedUrl: branchForm.mapEmbedUrl,
                      directionsUrl: branchForm.directionsUrl,
                      isPrimary: branchForm.isPrimary,
                      active: branchForm.active,
                      order: Number(branchForm.order) || 0,
                    },
                  },
                  branchEditing ? "Branch" : "Branch added"
                ).then(() => setBranchOpen(false));
              }}
            >
              Save branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zones & coupons summary (visible at the bottom of Branches tab context) */}
      <section className="card-elevated rounded-2xl p-4 md:p-6">
        <h2 className="display-3 text-cream">Delivery zones &amp; coupons</h2>
        <p className="mb-4 text-xs text-muted-foreground">Read-only ops snapshot — zones and coupons are managed with the DB seed for now.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Zones · {zones.length}</p>
            <ul className="space-y-1.5">
              {zones.map((z: AdminZone) => (
                <li key={z.id} className="flex items-center justify-between rounded-lg border border-gold/10 bg-elevated/40 px-3 py-2 text-xs">
                  <span className="text-cream">{z.name}</span>
                  <span className="text-muted-foreground">
                    ETB {Math.round(z.fee)} · {z.etaMin}–{z.etaMax} min · min {Math.round(z.minOrder)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Coupons · {coupons.length}</p>
            <ul className="space-y-1.5">
              {coupons.map((c: AdminCoupon) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border border-gold/10 bg-elevated/40 px-3 py-2 text-xs">
                  <span className="font-mono text-gold">{c.code}</span>
                  <span className="text-muted-foreground">
                    {c.type === "PERCENT" ? `${c.value}% off` : `ETB ${Math.round(c.value)} off`} · used {c.usedCount}
                    {c.maxUses ? `/${c.maxUses}` : ""} · {c.active ? "active" : "off"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
