"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { EmptyState } from "@/components/admin/page-header";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminOpening } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "SEASONAL"] as const;

interface Form {
  title: string;
  type: string;
  location: string;
  description: string;
  order: string;
  active: boolean;
}

export default function OpeningsTab({ rows, onChanged }: { rows: AdminOpening[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<AdminOpening | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>({ title: "", type: "FULL_TIME", location: "Addis Ababa", description: "", order: "0", active: true });
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ title: "", type: "FULL_TIME", location: "Addis Ababa", description: "", order: String(rows.length), active: true });
    setOpen(true);
  }
  function openEdit(o: AdminOpening) {
    setEditing(o);
    setForm({ title: o.title, type: o.type, location: o.location, description: o.description, order: String(o.order), active: o.active });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      await apiFetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "opening",
          data: {
            id: editing?.id,
            title: form.title.trim(),
            type: form.type,
            location: form.location.trim(),
            description: form.description.trim(),
            order: Number(form.order) || 0,
            active: form.active,
          },
        }),
      });
      toast.success("Opening saved");
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(o: AdminOpening) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/content?kind=opening&id=${encodeURIComponent(o.id)}`, { method: "DELETE" });
      toast.success("Opening removed");
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
          Add opening
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-8 w-8" />} title="No openings yet" hint="Chefs, riders, hosts — post the roles you need." />
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id} className="card-elevated flex items-center gap-4 rounded-2xl p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                <Briefcase className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-cream">{o.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {o.type.replace("_", " ").toLowerCase()} · {o.location}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{o.description}</p>
              </div>
              {!o.active ? (
                <span className="rounded-full border border-ember/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-red-300">Closed</span>
              ) : null}
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" aria-label={`Edit ${o.title}`} onClick={() => openEdit(o)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Remove ${o.title}`} onClick={() => void remove(o)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-gold/20 bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.title}` : "New opening"}</DialogTitle>
            <DialogDescription>Listed on the careers page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="o-title">Job title</Label>
              <Input id="o-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="o-type" className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="o-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-loc">Location</Label>
                <Input id="o-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-desc">Description</Label>
              <Textarea id="o-desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-cream">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} aria-label="Active" />
                Accepting applications
              </label>
              <div className="w-28 space-y-1.5">
                <Label htmlFor="o-order">Order</Label>
                <Input id="o-order" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={busy || form.title.trim().length < 2 || form.description.trim().length < 4} onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
