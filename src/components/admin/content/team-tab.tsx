"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { EmptyState } from "@/components/admin/page-header";
import { ImagePicker } from "@/components/admin/image-picker";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminTeamMember } from "@/components/admin/types";
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
  nameAm: string;
  role: string;
  bio: string;
  photo: string;
  order: string;
  active: boolean;
}

export default function TeamTab({ rows, onChanged }: { rows: AdminTeamMember[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<AdminTeamMember | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>({ name: "", nameAm: "", role: "", bio: "", photo: "", order: "0", active: true });
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ name: "", nameAm: "", role: "", bio: "", photo: "", order: String(rows.length), active: true });
    setOpen(true);
  }
  function openEdit(m: AdminTeamMember) {
    setEditing(m);
    setForm({ name: m.name, nameAm: m.nameAm ?? "", role: m.role, bio: m.bio ?? "", photo: m.photo ?? "", order: String(m.order), active: m.active });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      await apiFetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "team",
          data: {
            id: editing?.id,
            name: form.name.trim(),
            nameAm: form.nameAm,
            role: form.role.trim(),
            bio: form.bio,
            photo: form.photo,
            order: Number(form.order) || 0,
            active: form.active,
          },
        }),
      });
      toast.success("Team member saved");
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: AdminTeamMember) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/content?kind=team&id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
      toast.success(`${m.name} removed`);
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
          Add member
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No team members yet" hint="Introduce the chef, the buna master, the floor captain…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((m) => (
            <article key={m.id} className="card-elevated card-hover flex gap-4 rounded-2xl p-4">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gold/20 bg-muted">
                {m.photo ? (
                  <Image src={m.photo} alt={m.name} fill sizes="64px" className="object-cover" unoptimized />
                ) : (
                  <Users className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-cream">{m.name}</p>
                <p className="truncate text-xs text-gold">{m.role}</p>
                {m.bio ? <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{m.bio}</p> : null}
                <div className="mt-2 flex items-center gap-2">
                  {!m.active ? (
                    <span className="rounded-full border border-ember/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-red-300">Hidden</span>
                  ) : null}
                  <span className="text-[10px] text-muted-foreground">#{m.order}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" aria-label={`Edit ${m.name}`} onClick={() => openEdit(m)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Remove ${m.name}`} onClick={() => void remove(m)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-gold/20 bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "New team member"}</DialogTitle>
            <DialogDescription>Shown on the About page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name">Name</Label>
              <Input id="tm-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-name-am">Name (Amharic)</Label>
              <Input id="tm-name-am" className="am-text" value={form.nameAm} onChange={(e) => setForm({ ...form, nameAm: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-role">Role</Label>
              <Input id="tm-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Head Chef" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-bio">Bio</Label>
              <Textarea id="tm-bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <ImagePicker id="tm-photo" label="Photo" value={form.photo} onChange={(v) => setForm({ ...form, photo: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tm-order">Order</Label>
                <Input id="tm-order" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-cream">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} aria-label="Active" />
                Visible
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={busy || form.name.trim().length < 2 || form.role.trim().length < 2} onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
