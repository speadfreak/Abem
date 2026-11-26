"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Images, Video, Upload, Loader2 } from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { ImagePicker } from "@/components/admin/image-picker";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminGalleryItem, ContentPayload } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const CATEGORIES = ["general", "food", "interior", "events", "coffee", "team"] as const;

interface Form {
  title: string;
  titleAm: string;
  category: string;
  type: string;
  url: string;
  thumb: string;
  order: string;
  active: boolean;
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<AdminGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGalleryItem | null>(null);
  const [form, setForm] = useState<Form>({ title: "", titleAm: "", category: "general", type: "IMAGE", url: "", thumb: "", order: "0", active: true });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminGalleryItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<ContentPayload>("/api/admin/content");
      setItems(data.gallery);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ title: "", titleAm: "", category: "general", type: "IMAGE", url: "", thumb: "", order: String(items.length), active: true });
    setOpen(true);
  }

  function openEdit(g: AdminGalleryItem) {
    setEditing(g);
    setForm({
      title: g.title,
      titleAm: g.titleAm ?? "",
      category: g.category,
      type: g.type,
      url: g.url,
      thumb: g.thumb ?? "",
      order: String(g.order),
      active: g.active,
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
          kind: "gallery",
          data: {
            id: editing?.id,
            title: form.title.trim(),
            titleAm: form.titleAm,
            category: form.category,
            type: form.type,
            url: form.url.trim(),
            thumb: form.thumb,
            order: Number(form.order) || 0,
            active: form.active,
          },
        }),
      });
      toast.success("Gallery item saved");
      setOpen(false);
      void load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(g: AdminGalleryItem) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/content?kind=gallery&id=${encodeURIComponent(g.id)}`, { method: "DELETE" });
      toast.success("Removed from gallery");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadMany(files: FileList) {
    setUploading(true);
    let created = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const up = await apiFetch<{ ok: true; url: string }>("/api/admin/upload", { method: "POST", body: fd });
        const title = file.name
          .replace(/\.[a-z0-9]+$/i, "")
          .replace(/[-_]+/g, " ")
          .trim() || "Untitled";
        await apiFetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "gallery",
            data: {
              title,
              type: file.type === "video/mp4" ? "VIDEO" : "IMAGE",
              url: up.url,
              category: "general",
              order: items.length + created,
            },
          }),
        });
        created += 1;
      }
      toast.success(`${created} item${created === 1 ? "" : "s"} added to the gallery`);
      void load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Gallery"
        subtitle="Images and videos shown across the public site."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4"
              multiple
              className="hidden"
              aria-hidden="true"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length) void uploadMany(files);
              }}
            />
            <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
              Upload files
            </Button>
            <Button className="btn-gold btn-sm !rounded-xl" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add item
            </Button>
          </>
        }
      />

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Images className="h-8 w-8" />}
          title="Gallery is empty"
          hint="Upload photos of dishes, the mesob room, coffee ceremonies — or add a video by URL."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((g) => (
            <article
              key={g.id}
              className={cn(
                "card-elevated card-hover group overflow-hidden rounded-2xl",
                !g.active && "opacity-55"
              )}
            >
              <span className="relative block h-40 w-full bg-muted">
                {g.type === "VIDEO" ? (
                  <>
                    {g.thumb ? (
                      <Image src={g.thumb} alt={g.title} fill sizes="(max-width:768px) 100vw, 300px" className="object-cover" unoptimized />
                    ) : (
                      <Video className="absolute inset-0 m-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-cream">
                      Video
                    </span>
                  </>
                ) : g.url ? (
                  <Image src={g.url} alt={g.title} fill sizes="(max-width:768px) 100vw, 300px" className="object-cover" unoptimized />
                ) : (
                  <Images className="absolute inset-0 m-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-cream">{g.title}</p>
                  <Badge variant="outline" className="shrink-0 border-gold/30 text-[9px] uppercase tracking-widest text-gold">
                    {g.category}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">{g.url}</p>
                <div className="mt-2 flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" aria-label={`Edit ${g.title}`} onClick={() => openEdit(g)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Remove ${g.title}`} onClick={() => setDeleteTarget(g)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  {!g.active ? (
                    <span className="ml-auto rounded-full border border-ember/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-red-300">Hidden</span>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-gold/20 bg-card no-scrollbar">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.title}` : "New gallery item"}</DialogTitle>
            <DialogDescription>Images and MP4 videos hosted under /uploads or any URL.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="g-title">Title</Label>
                <Input id="g-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-title-am">Title (Amharic)</Label>
                <Input id="g-title-am" className="am-text" value={form.titleAm} onChange={(e) => setForm({ ...form, titleAm: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-cat" className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="g-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-type" className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="g-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video (MP4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ImagePicker id="g-url" label={form.type === "VIDEO" ? "Video URL (mp4)" : "Image URL"} value={form.url} onChange={(v) => setForm({ ...form, url: v })} accept={form.type === "VIDEO" ? "video/mp4" : "image/*"} />
            {form.type === "VIDEO" ? (
              <ImagePicker id="g-thumb" label="Poster thumb (optional)" value={form.thumb} onChange={(v) => setForm({ ...form, thumb: v })} />
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="g-order">Order</Label>
                <Input id="g-order" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-cream">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} aria-label="Active" />
                Visible
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={busy || form.title.trim().length < 1 || form.url.trim().length < 1} onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => (o ? null : setDeleteTarget(null))}>
        <AlertDialogContent className="border-gold/20 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>The file stays in /uploads — only the gallery entry is deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-ember text-cream hover:bg-ember/85"
              onClick={() => {
                if (deleteTarget) void remove(deleteTarget);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
