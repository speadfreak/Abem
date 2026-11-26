"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Quote } from "lucide-react";
import { EmptyState } from "@/components/admin/page-header";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminTestimonial } from "@/components/admin/types";
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
  name: string;
  role: string;
  quote: string;
  rating: string;
  order: string;
  active: boolean;
}

export default function TestimonialsTab({ rows, onChanged }: { rows: AdminTestimonial[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>({ name: "", role: "", quote: "", rating: "5", order: "0", active: true });
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ name: "", role: "", quote: "", rating: "5", order: String(rows.length), active: true });
    setOpen(true);
  }
  function openEdit(t: AdminTestimonial) {
    setEditing(t);
    setForm({ name: t.name, role: t.role ?? "", quote: t.quote, rating: String(t.rating), order: String(t.order), active: t.active });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      await apiFetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "testimonial",
          data: {
            id: editing?.id,
            name: form.name.trim(),
            role: form.role,
            quote: form.quote.trim(),
            rating: Number(form.rating) || 5,
            order: Number(form.order) || 0,
            active: form.active,
          },
        }),
      });
      toast.success("Testimonial saved");
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: AdminTestimonial) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/content?kind=testimonial&id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
      toast.success("Testimonial removed");
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
          Add testimonial
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Quote className="h-8 w-8" />} title="No testimonials yet" hint="Collect the quotes that sell the experience." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((t) => (
            <li key={t.id} className="card-elevated rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-cream">{t.name}</p>
                  {t.role ? <p className="truncate text-xs text-gold">{t.role}</p> : null}
                </div>
                <span className="flex items-center gap-0.5" aria-label={`${t.rating} of 5`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
                  ))}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-3 flex items-center gap-2">
                {!t.active ? (
                  <span className="rounded-full border border-ember/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-red-300">Hidden</span>
                ) : null}
                <span className="text-[10px] text-muted-foreground">#{t.order}</span>
                <span className="ml-auto flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" aria-label={`Edit testimonial by ${t.name}`} onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Remove testimonial by ${t.name}`} onClick={() => void remove(t)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-gold/20 bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit testimonial" : "New testimonial"}</DialogTitle>
            <DialogDescription>Guest voices on the home page wall.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Name</Label>
                <Input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-role">Role</Label>
                <Input id="t-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Food blogger, Addis" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-quote">Quote</Label>
              <Textarea id="t-quote" rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-rating">Rating (1–5)</Label>
                <Input id="t-rating" type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-order">Order</Label>
                <Input id="t-order" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-cream">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} aria-label="Active" />
              Visible
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={busy || form.name.trim().length < 2 || form.quote.trim().length < 5} onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
