"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  UtensilsCrossed,
  FlameKindling,
  Star,
  Leaf,
  Layers,
} from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { ImagePicker } from "@/components/admin/image-picker";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminCategory, AdminMenuItem } from "@/components/admin/types";
import { formatETB } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATIONS = ["main", "grill", "wat", "cold", "drinks", "dessert"] as const;

interface CategoryForm {
  name: string;
  nameAm: string;
  description: string;
  descriptionAm: string;
  station: string;
  image: string;
  order: string;
  active: boolean;
}

interface ItemForm {
  name: string;
  nameAm: string;
  description: string;
  descriptionAm: string;
  price: string;
  image: string;
  tags: string;
  spicyLevel: string;
  isVegan: boolean;
  isFasting: boolean;
  isChefPick: boolean;
  isFeatured: boolean;
  available: boolean;
  order: string;
}

const emptyItem: ItemForm = {
  name: "",
  nameAm: "",
  description: "",
  descriptionAm: "",
  price: "",
  image: "",
  tags: "",
  spicyLevel: "0",
  isVegan: false,
  isFasting: false,
  isChefPick: false,
  isFeatured: false,
  available: true,
  order: "0",
};

const SPICY_LABEL = ["Mild", "Gentle", "Hot", "Berbere fire"];

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [catDialog, setCatDialog] = useState<null | { editing: AdminCategory | null }>(null);
  const [catForm, setCatForm] = useState<CategoryForm>({
    name: "",
    nameAm: "",
    description: "",
    descriptionAm: "",
    station: "main",
    image: "",
    order: "0",
    active: true,
  });

  const [itemDialog, setItemDialog] = useState<null | { editing: AdminMenuItem | null; categoryId: string }>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);

  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<null | { kind: "category" | "item"; id: string; name: string }>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ ok: true; categories: AdminCategory[] }>("/api/admin/menu");
      setCategories(data.categories);
      setSelectedId((prev) => (prev && data.categories.some((c) => c.id === prev) ? prev : data.categories[0]?.id ?? ""));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = categories.find((c) => c.id === selectedId) ?? null;

  const filteredItems = useMemo(() => {
    if (!selected) return [];
    const q = search.trim().toLowerCase();
    if (!q) return selected.items;
    return selected.items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.nameAm ?? "").includes(search.trim()) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [selected, search]);

  function openCategory(editing: AdminCategory | null) {
    setCatDialog({ editing });
    setCatForm({
      name: editing?.name ?? "",
      nameAm: editing?.nameAm ?? "",
      description: editing?.description ?? "",
      descriptionAm: editing?.descriptionAm ?? "",
      station: editing?.station ?? "main",
      image: editing?.image ?? "",
      order: String(editing?.order ?? 0),
      active: editing?.active ?? true,
    });
  }

  function openItem(editing: AdminMenuItem | null) {
    if (!selected) return;
    setItemDialog({ editing, categoryId: selected.id });
    setItemForm(
      editing
        ? {
            name: editing.name,
            nameAm: editing.nameAm ?? "",
            description: editing.description ?? "",
            descriptionAm: editing.descriptionAm ?? "",
            price: String(editing.price),
            image: editing.image ?? "",
            tags: editing.tags.join(", "),
            spicyLevel: String(editing.spicyLevel),
            isVegan: editing.isVegan,
            isFasting: editing.isFasting,
            isChefPick: editing.isChefPick,
            isFeatured: editing.isFeatured,
            available: editing.available,
            order: String(editing.order),
          }
        : { ...emptyItem, order: String(selected.items.length) }
    );
  }

  async function save(kind: "category" | "item", payload: Record<string, unknown>, editingId?: string) {
    setBusy(true);
    try {
      const data = await apiFetch<{ ok: true; id: string }>("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data: editingId ? { ...payload, id: editingId } : payload }),
      });
      toast.success(editingId ? "Saved" : "Created");
      void load();
      return data.id;
    } catch (err) {
      toast.error(errorMessage(err));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function remove(kind: "category" | "item", id: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/menu?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      toast.success(kind === "category" ? "Category archived" : "Dish removed");
      void load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  async function toggleField(item: AdminMenuItem, patch: Partial<AdminMenuItem>, msg: string) {
    setBusy(true);
    try {
      await apiFetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "item", data: { ...item, ...patch } }),
      });
      toast.success(msg);
      void load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Menu"
        subtitle="Categories, dishes, prices and the 86 switch — the heart of the house."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => openCategory(null)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Category
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]" aria-hidden="true">
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-8 w-8" />}
          title="No categories yet"
          hint="Create your first category — Wat, Grill, Fasting Table — then add dishes."
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr]">
          {/* Categories */}
          <aside className="card-elevated rounded-2xl p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto no-scrollbar">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Categories · {categories.length}
            </p>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id} className={cn(
                  "flex items-center gap-1 rounded-xl transition-colors",
                  selectedId === c.id ? "bg-gold/12" : "hover:bg-elevated"
                )}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    aria-current={selectedId === c.id ? "true" : undefined}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                      selectedId === c.id ? "text-gold" : "text-cream"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{c.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {c.items.length} dishes · {c.station}
                      </span>
                    </span>
                    {!c.active ? (
                      <Badge variant="outline" className="border-ember/40 text-[9px] text-red-300">
                        Off
                      </Badge>
                    ) : null}
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-gold"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => openCategory(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Items */}
          <section className="card-elevated rounded-2xl p-4">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <h2 className="display-3 text-cream">{selected.name}</h2>
                    {selected.nameAm ? <p className="text-xs text-muted-foreground am-text">{selected.nameAm}</p> : null}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter dishes…"
                        aria-label="Filter dishes"
                        className="h-9 w-48 pl-8 text-xs"
                      />
                    </div>
                    <Button size="sm" className="btn-gold btn-sm !rounded-xl" onClick={() => openItem(null)}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Add dish
                    </Button>
                  </div>
                </div>

                <div className="mt-4 max-h-[calc(100vh-16rem)] overflow-y-auto no-scrollbar">
                  {filteredItems.length === 0 ? (
                    <EmptyState
                      icon={<UtensilsCrossed className="h-7 w-7" />}
                      title={search ? "No dishes match the filter" : "No dishes in this category"}
                      hint={search ? undefined : "Use Add dish to build out the section."}
                    />
                  ) : (
                    <ul className="space-y-2">
                      {filteredItems.map((it) => (
                        <li
                          key={it.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                            it.available ? "border-gold/10 bg-elevated/40" : "border-ember/25 bg-ember/5"
                          )}
                        >
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gold/15 bg-muted">
                            {it.image ? (
                              <Image src={it.image} alt={it.name} fill sizes="48px" className="object-cover" unoptimized />
                            ) : (
                              <UtensilsCrossed className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-cream">
                              {it.name}
                              {it.isChefPick ? <Star className="ml-1.5 inline h-3.5 w-3.5 text-gold" aria-label="Chef pick" /> : null}
                              {it.isFeatured ? <FlameKindling className="ml-1 inline h-3.5 w-3.5 text-ember" aria-label="Featured" /> : null}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {it.nameAm ? <span className="am-text mr-2">{it.nameAm}</span> : null}
                              {it.isVegan ? "Vegan · " : ""}
                              {it.isFasting ? "Fasting · " : ""}
                              {it.spicyLevel > 0 ? `${SPICY_LABEL[it.spicyLevel]} · ` : ""}
                              {it.tags.join(", ")}
                            </p>
                          </div>
                          <span className="hidden shrink-0 text-xs font-semibold text-gold sm:block">{formatETB(it.price)}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            <div className="flex flex-col items-center gap-0.5" title={it.available ? "Available" : "86'd — off menu"}>
                              <Leaf className={cn("h-3 w-3", it.available ? "text-emerald-400" : "text-muted-foreground")} aria-hidden="true" />
                              <Switch
                                checked={it.available}
                                disabled={busy}
                                aria-label={`${it.name} availability`}
                                className={cn("scale-90", !it.available && "data-[state=unchecked]:bg-ember")}
                                onCheckedChange={(v) => void toggleField(it, { available: v }, v ? `${it.name} back on` : `${it.name} 86'd`)}
                              />
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold" aria-label={`Edit ${it.name}`} onClick={() => openItem(it)}>
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Delete ${it.name}`} onClick={() => setDeleteTarget({ kind: "item", id: it.id, name: it.name })}>
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <EmptyState title="Pick a category" hint="Choose a category on the left to manage its dishes." />
            )}
          </section>
        </div>
      )}

      {/* Category dialog */}
      <Dialog open={catDialog !== null} onOpenChange={(open) => (open ? null : setCatDialog(null))}>
        <DialogContent className="max-w-lg border-gold/20 bg-card">
          <DialogHeader>
            <DialogTitle>{catDialog?.editing ? `Edit ${catDialog.editing.name}` : "New category"}</DialogTitle>
            <DialogDescription>Sections appear on the public menu in this order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cat-name-am">Name (Amharic)</Label>
              <Input id="cat-name-am" value={catForm.nameAm} onChange={(e) => setCatForm({ ...catForm, nameAm: e.target.value })} className="am-text" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input id="cat-desc" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cat-desc-am">Description (Amharic)</Label>
              <Input id="cat-desc-am" value={catForm.descriptionAm} onChange={(e) => setCatForm({ ...catForm, descriptionAm: e.target.value })} className="am-text" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-station">Kitchen station</Label>
              <Select value={catForm.station} onValueChange={(v) => setCatForm({ ...catForm, station: v })}>
                <SelectTrigger id="cat-station">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-order">Sort order</Label>
              <Input id="cat-order" type="number" min={0} value={catForm.order} onChange={(e) => setCatForm({ ...catForm, order: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <ImagePicker id="cat-image" label="Category image" value={catForm.image} onChange={(url) => setCatForm({ ...catForm, image: url })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-cream sm:col-span-2">
              <Switch checked={catForm.active} onCheckedChange={(v) => setCatForm({ ...catForm, active: v })} aria-label="Category active" />
              Active on public menu
            </label>
          </div>
          <DialogFooter className="flex gap-2">
            {catDialog?.editing ? (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-ember"
                onClick={() => {
                  setDeleteTarget({ kind: "category", id: catDialog.editing!.id, name: catDialog.editing!.name });
                  setCatDialog(null);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Archive
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setCatDialog(null)}>
              Cancel
            </Button>
            <Button
              className="btn-gold btn-sm !rounded-xl"
              disabled={busy || catForm.name.trim().length < 2}
              onClick={() => {
                void save("category", {
                  name: catForm.name.trim(),
                  nameAm: catForm.nameAm,
                  description: catForm.description,
                  descriptionAm: catForm.descriptionAm,
                  station: catForm.station,
                  image: catForm.image,
                  order: Number(catForm.order) || 0,
                  active: catForm.active,
                }, catDialog?.editing?.id).then((ok) => {
                  if (ok) setCatDialog(null);
                });
              }}
            >
              Save category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={itemDialog !== null} onOpenChange={(open) => (open ? null : setItemDialog(null))}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-gold/20 bg-card no-scrollbar">
          <DialogHeader>
            <DialogTitle>{itemDialog?.editing ? `Edit ${itemDialog.editing.name}` : "New dish"}</DialogTitle>
            <DialogDescription>Prices are recomputed into every new order snapshot.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="it-name">Dish name</Label>
              <Input id="it-name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="it-name-am">Name (Amharic)</Label>
              <Input id="it-name-am" value={itemForm.nameAm} onChange={(e) => setItemForm({ ...itemForm, nameAm: e.target.value })} className="am-text" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="it-desc">Description</Label>
              <Input id="it-desc" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="it-desc-am">Description (Amharic)</Label>
              <Input id="it-desc-am" value={itemForm.descriptionAm} onChange={(e) => setItemForm({ ...itemForm, descriptionAm: e.target.value })} className="am-text" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="it-price">Price (ETB)</Label>
              <Input id="it-price" type="number" min={0} step="1" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="it-spicy">Spice level</Label>
              <Select value={itemForm.spicyLevel} onValueChange={(v) => setItemForm({ ...itemForm, spicyLevel: v })}>
                <SelectTrigger id="it-spicy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPICY_LABEL.map((l, i) => (
                    <SelectItem key={l} value={String(i)}>
                      {i} · {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="it-tags" className="flex items-center gap-1.5">
                <Layers className="h-3 w-3" aria-hidden="true" />
                Tags (comma separated)
              </Label>
              <Input id="it-tags" value={itemForm.tags} onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })} placeholder="signature, vegetarian, gluten-free" />
            </div>
            <div className="sm:col-span-2">
              <ImagePicker id="it-image" label="Dish photo" value={itemForm.image} onChange={(url) => setItemForm({ ...itemForm, image: url })} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
              <label className="flex items-center gap-2 text-xs text-cream">
                <Switch checked={itemForm.isVegan} onCheckedChange={(v) => setItemForm({ ...itemForm, isVegan: v })} aria-label="Vegan" />
                Vegan
              </label>
              <label className="flex items-center gap-2 text-xs text-cream">
                <Switch checked={itemForm.isFasting} onCheckedChange={(v) => setItemForm({ ...itemForm, isFasting: v })} aria-label="Fasting" />
                Fasting
              </label>
              <label className="flex items-center gap-2 text-xs text-cream">
                <Switch checked={itemForm.isChefPick} onCheckedChange={(v) => setItemForm({ ...itemForm, isChefPick: v })} aria-label="Chef pick" />
                Chef pick
              </label>
              <label className="flex items-center gap-2 text-xs text-cream">
                <Switch checked={itemForm.isFeatured} onCheckedChange={(v) => setItemForm({ ...itemForm, isFeatured: v })} aria-label="Featured" />
                Featured
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-cream sm:col-span-2">
              <Switch
                checked={itemForm.available}
                onCheckedChange={(v) => setItemForm({ ...itemForm, available: v })}
                aria-label="Available"
                className={cn(!itemForm.available && "data-[state=unchecked]:bg-ember")}
              />
              <span>
                Available on menu{" "}
                <span className="text-[11px] text-muted-foreground">(off = 86&apos;d — kitchen is out)</span>
              </span>
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="it-order">Sort order</Label>
              <Input id="it-order" type="number" min={0} value={itemForm.order} onChange={(e) => setItemForm({ ...itemForm, order: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setItemDialog(null)}>
              Cancel
            </Button>
            <Button
              className="btn-gold btn-sm !rounded-xl"
              disabled={busy || itemForm.name.trim().length < 2 || itemForm.price === ""}
              onClick={() => {
                void save("item", {
                  categoryId: itemDialog?.categoryId ?? "",
                  name: itemForm.name.trim(),
                  nameAm: itemForm.nameAm,
                  description: itemForm.description,
                  descriptionAm: itemForm.descriptionAm,
                  price: Number(itemForm.price) || 0,
                  image: itemForm.image,
                  tags: itemForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
                  spicyLevel: Number(itemForm.spicyLevel) || 0,
                  isVegan: itemForm.isVegan,
                  isFasting: itemForm.isFasting,
                  isChefPick: itemForm.isChefPick,
                  isFeatured: itemForm.isFeatured,
                  available: itemForm.available,
                  order: Number(itemForm.order) || 0,
                }, itemDialog?.editing?.id).then((ok) => {
                  if (ok) setItemDialog(null);
                });
              }}
            >
              Save dish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => (open ? null : setDeleteTarget(null))}>
        <AlertDialogContent className="border-gold/20 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.kind === "category" ? `Archive ${deleteTarget.name}?` : `Remove ${deleteTarget?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === "category"
                ? "Categories are archived (hidden from the public menu) — nothing is lost."
                : "Past orders keep their item snapshots, so removing a dish is safe for history."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-ember text-cream hover:bg-ember/85"
              onClick={() => {
                if (deleteTarget) void remove(deleteTarget.kind, deleteTarget.id);
              }}
            >
              {deleteTarget?.kind === "category" ? "Archive" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
