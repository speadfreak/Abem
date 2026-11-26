"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PartyPopper, Users, Banknote } from "lucide-react";
import { EmptyState } from "@/components/admin/page-header";
import { ImagePicker } from "@/components/admin/image-picker";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminEventPackage } from "@/components/admin/types";
import { formatETB } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Form {
  title: string;
  titleAm: string;
  description: string;
  capacity: string;
  priceFrom: string;
  image: string;
  features: string;
  order: string;
  active: boolean;
}

export default function EventsTab({ rows, onChanged }: { rows: AdminEventPackage[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<AdminEventPackage | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>({
    title: "",
    titleAm: "",
    description: "",
    capacity: "",
    priceFrom: "",
    image: "",
    features: "",
    order: "0",
    active: true,
  });
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ title: "", titleAm: "", description: "", capacity: "", priceFrom: "", image: "", features: "", order: String(rows.length), active: true });
    setOpen(true);
  }
  function openEdit(e: AdminEventPackage) {
    setEditing(e);
    setForm({
      title: e.title,
      titleAm: e.titleAm ?? "",
      description: e.description,
      capacity: e.capacity,
      priceFrom: e.priceFrom != null ? String(e.priceFrom) : "",
      image: e.image ?? "",
      features: e.features.join("\n"),
      order: String(e.order),
      active: e.active,
    });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      await apiFetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "event",
          data: {
            id: editing?.id,
            title: form.title.trim(),
            titleAm: form.titleAm,
            description: form.description.trim(),
            capacity: form.capacity.trim(),
            priceFrom: form.priceFrom === "" ? null : Number(form.priceFrom) || 0,
            image: form.image,
            features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
            order: Number(form.order) || 0,
            active: form.active,
          },
        }),
      });
      toast.success("Event package saved");
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: AdminEventPackage) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/content?kind=event&id=${encodeURIComponent(e.id)}`, { method: "DELETE" });
      toast.success("Event package removed");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="btn-gold btn-sm !rounded-xl" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add package
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<PartyPopper className="h-8 w-8" />} title="No event packages yet" hint="Weddings, mesob feasts, corporate nights…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((e) => (
            <article key={e.id} className="card-elevated card-hover overflow-hidden rounded-2xl">
              <span className="relative block h-36 w-full bg-muted">
                {e.image ? (
                  <Image src={e.image} alt={e.title} fill sizes="(max-width:768px) 100vw, 320px" className="object-cover" unoptimized />
                ) : (
                  <PartyPopper className="absolute inset-0 m-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <div className="p-4">
                <p className="truncate text-sm font-semibold text-cream">{e.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" aria-hidden="true" /> {e.capacity}
                  </span>
                  {e.priceFrom != null ? (
                    <span className="inline-flex items-center gap-1 text-gold">
                      <Banknote className="h-3 w-3" aria-hidden="true" /> from {formatETB(e.priceFrom)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{e.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  {!e.active ? (
                    <span className="rounded-full border border-ember/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-red-300">Hidden</span>
                  ) : null}
                  <span className="text-[10px] text-muted-foreground">#{e.order}</span>
                  <span className="ml-auto flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" aria-label={`Edit ${e.title}`} onClick={() => openEdit(e)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Remove ${e.title}`} onClick={() => void remove(e)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-gold/20 bg-card no-scrollbar">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.title}` : "New event package"}</DialogTitle>
            <DialogDescription>Sellable catering & private dining packages.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="e-title">Title</Label>
                <Input id="e-title" value={form.title} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-title-am">Title (Amharic)</Label>
                <Input id="e-title-am" className="am-text" value={form.titleAm} onChange={(ev) => setForm({ ...form, titleAm: ev.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-desc">Description</Label>
              <Textarea id="e-desc" rows={3} value={form.description} onChange={(ev) => setForm({ ...form, description: ev.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="e-cap">Capacity</Label>
                <Input id="e-cap" value={form.capacity} onChange={(ev) => setForm({ ...form, capacity: ev.target.value })} placeholder="up to 300 guests" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-price">Price from (ETB)</Label>
                <Input id="e-price" type="number" min={0} value={form.priceFrom} onChange={(ev) => setForm({ ...form, priceFrom: ev.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-features">Features (one per line)</Label>
              <Textarea
                id="e-features"
                rows={4}
                value={form.features}
                onChange={(ev) => setForm({ ...form, features: ev.target.value })}
                placeholder={"Gursha welcome ceremony\nCoffee and tej pairing\nLive azmari music"}
              />
            </div>
            <ImagePicker id="e-image" label="Cover image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="e-order">Order</Label>
                <Input id="e-order" type="number" min={0} value={form.order} onChange={(ev) => setForm({ ...form, order: ev.target.value })} />
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-cream">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} aria-label="Active" />
                Visible
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={busy || form.title.trim().length < 2 || form.description.trim().length < 4 || form.capacity.trim().length < 1} onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
