"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, CheckCircle2, Clock3 } from "lucide-react";
import { EmptyState } from "@/components/admin/page-header";
import { ImagePicker } from "@/components/admin/image-picker";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminStory } from "@/components/admin/types";
import { formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  category: string;
  tags: string;
  readMinutes: string;
  published: boolean;
}

export default function StoriesTab({ rows, onChanged }: { rows: AdminStory[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<AdminStory | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover: "",
    category: "culture",
    tags: "",
    readMinutes: "4",
    published: false,
  });
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ title: "", slug: "", excerpt: "", content: "", cover: "", category: "culture", tags: "", readMinutes: "4", published: false });
    setOpen(true);
  }
  function openEdit(s: AdminStory) {
    setEditing(s);
    setForm({
      title: s.title,
      slug: s.slug,
      excerpt: s.excerpt,
      content: s.content,
      cover: s.cover ?? "",
      category: s.category,
      tags: s.tags.join(", "),
      readMinutes: String(s.readMinutes),
      published: s.published,
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
          kind: "story",
          data: {
            id: editing?.id,
            title: form.title.trim(),
            slug: form.slug.trim(),
            excerpt: form.excerpt.trim(),
            content: form.content.trim(),
            cover: form.cover,
            category: form.category.trim(),
            tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            readMinutes: Number(form.readMinutes) || 4,
            published: form.published,
          },
        }),
      });
      toast.success("Story saved");
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: AdminStory) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/content?kind=story&id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
      toast.success("Story deleted");
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
          New story
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-8 w-8" />} title="No stories yet" hint="Culture, spice routes, coffee ceremony — the journal of the house." />
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => (
            <li key={s.id} className="card-elevated flex items-center gap-4 rounded-2xl p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-cream">{s.title}</p>
                  {s.published ? (
                    <Badge variant="outline" className="border-emerald-400/40 text-[9px] uppercase tracking-widest text-emerald-300">
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gold/30 text-[9px] uppercase tracking-widest text-muted-foreground">
                      Draft
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  /{s.slug} · {s.category} · {s.author}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{s.excerpt}</p>
                <p className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" aria-hidden="true" /> {s.readMinutes} min
                  </span>
                  {s.publishedAt ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {formatDateShort(s.publishedAt)}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" aria-label={`Edit ${s.title}`} onClick={() => openEdit(s)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Delete ${s.title}`} onClick={() => void remove(s)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-gold/20 bg-card no-scrollbar">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.title}` : "New story"}</DialogTitle>
            <DialogDescription>Long-form entries for the journal. Plain text is fine.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-title">Title</Label>
              <Input id="s-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-slug">Slug</Label>
              <Input id="s-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title if empty" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-excerpt">Excerpt</Label>
              <Textarea id="s-excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-content">Content</Label>
              <Textarea id="s-content" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <ImagePicker id="s-cover" label="Cover image" value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-cat">Category</Label>
              <Input id="s-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="culture, spices, people" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-tags">Tags (comma separated)</Label>
              <Input id="s-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-read">Read minutes</Label>
              <Input id="s-read" type="number" min={1} max={90} value={form.readMinutes} onChange={(e) => setForm({ ...form, readMinutes: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm text-cream">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} aria-label="Published" />
              <span>
                Published <span className="text-[11px] text-muted-foreground">(sets the publish date)</span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={busy || form.title.trim().length < 2 || form.excerpt.trim().length < 10 || form.content.trim().length < 10} onClick={() => void save()}>
              Save story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
