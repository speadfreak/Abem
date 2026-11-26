"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  X,
  Armchair,
  RefreshCw,
  Search,
  StickyNote,
  CalendarDays,
  Phone,
} from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { StatusChip } from "@/components/admin/status-chip";
import { apiFetch, errorMessage, qs } from "@/components/admin/api";
import type { AdminReservation } from "@/components/admin/types";
import { formatDateShort, statusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", "PENDING", "CONFIRMED", "SEATED", "DECLINED", "CANCELLED"] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
        active
          ? "border-gold bg-gold/15 text-gold"
          : "border-gold/20 text-muted-foreground hover:border-gold/50 hover:text-cream"
      )}
    >
      {children}
    </button>
  );
}

interface EditForm {
  date: string;
  time: string;
  party: string;
  area: string;
  adminNote: string;
}

export default function AdminReservationsPage() {
  const [rows, setRows] = useState<AdminReservation[]>([]);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminReservation | null>(null);
  const [form, setForm] = useState<EditForm>({ date: "", time: "", party: "", area: "", adminNote: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiFetch<{ ok: true; reservations: AdminReservation[] }>(
        `/api/admin/reservations${qs({ date, status, q })}`
      );
      setRows(data.reservations);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date, status, q]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(r: AdminReservation) {
    setEditing(r);
    setForm({
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
      time: r.time,
      party: String(r.party),
      area: r.area,
      adminNote: r.adminNote ?? "",
    });
  }

  async function patch(id: string, body: Record<string, string | number>, okMsg: string) {
    setSaving(true);
    try {
      const data = await apiFetch<{ ok: true; reservation: AdminReservation }>("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      toast.success(okMsg);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.reservation } : r)));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function saveEdit() {
    if (!editing) return;
    void patch(
      editing.id,
      {
        date: form.date,
        time: form.time,
        party: Number(form.party) || 1,
        area: form.area,
        adminNote: form.adminNote,
      },
      `Reservation ${editing.code} updated`
    );
    setEditing(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Reservations"
        subtitle="Confirm, seat or decline the book — every touch is logged."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="card-elevated flex flex-wrap items-end gap-4 rounded-2xl p-4">
        <div className="space-y-1.5">
          <Label htmlFor="res-date" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Date
          </Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="res-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44 pl-9"
              aria-label="Filter by date"
            />
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="res-q" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="res-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, phone or code…"
              className="pl-9"
              aria-label="Search reservations"
            />
          </div>
        </div>
        {date ? (
          <Button variant="ghost" size="sm" onClick={() => setDate("")}>
            Clear date
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status filter">
        {STATUS_FILTERS.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {s === "ALL" ? "All" : statusLabel(s)}
          </Chip>
        ))}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" />}
          title="No reservations match"
          hint="Try clearing the date filter or widening the status chips."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card-elevated hidden overflow-x-auto rounded-2xl md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/10">
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Guest</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Date · Time</TableHead>
                  <TableHead className="text-xs">Party</TableHead>
                  <TableHead className="text-xs">Area</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-gold/5">
                    <TableCell className="font-mono text-xs text-gold">{r.code}</TableCell>
                    <TableCell className="max-w-40 truncate text-xs font-semibold text-cream">
                      {r.name}
                      {r.occasion ? <span className="ml-1 text-[10px] text-muted-foreground">· {r.occasion}</span> : null}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.phone}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateShort(r.date)} · {r.time}
                    </TableCell>
                    <TableCell className="text-xs">{r.party}</TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">{r.area}</TableCell>
                    <TableCell>
                      <StatusChip status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {r.status === "PENDING" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            className="h-7 border-emerald-400/40 px-2 text-emerald-300 hover:bg-emerald-400/10"
                            onClick={() => void patch(r.id, { status: "CONFIRMED" }, `${r.name} confirmed`)}
                            title="Confirm"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {r.status === "CONFIRMED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            className="h-7 border-sky-400/40 px-2 text-sky-300 hover:bg-sky-400/10"
                            onClick={() => void patch(r.id, { status: "SEATED" }, `${r.name} seated`)}
                            title="Seat guests"
                          >
                            <Armchair className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {r.status !== "DECLINED" && r.status !== "CANCELLED" && r.status !== "SEATED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            className="h-7 border-ember/40 px-2 text-red-300 hover:bg-ember/10"
                            onClick={() => void patch(r.id, { status: "DECLINED" }, `${r.name} declined`)}
                            title="Decline"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-muted-foreground hover:text-gold"
                          onClick={() => openEdit(r)}
                          title="Edit details / notes"
                        >
                          <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((r) => (
              <div key={r.id} className="card-elevated rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-cream">{r.name}</p>
                  <StatusChip status={r.status} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Phone className="h-3 w-3" aria-hidden="true" /> {r.phone}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {r.code} · {formatDateShort(r.date)} · {r.time} · {r.party} guests · {r.area}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "PENDING" ? (
                    <Button size="sm" variant="outline" className="h-8 border-emerald-400/40 text-emerald-300" onClick={() => void patch(r.id, { status: "CONFIRMED" }, `${r.name} confirmed`)}>
                      Confirm
                    </Button>
                  ) : null}
                  {r.status === "CONFIRMED" ? (
                    <Button size="sm" variant="outline" className="h-8 border-sky-400/40 text-sky-300" onClick={() => void patch(r.id, { status: "SEATED" }, `${r.name} seated`)}>
                      Seat
                    </Button>
                  ) : null}
                  {r.status !== "DECLINED" && r.status !== "CANCELLED" && r.status !== "SEATED" ? (
                    <Button size="sm" variant="outline" className="h-8 border-ember/40 text-red-300" onClick={() => void patch(r.id, { status: "DECLINED" }, `${r.name} declined`)}>
                      Decline
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => openEdit(r)}>
                    <StickyNote className="h-3.5 w-3.5" aria-hidden="true" /> Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent className="max-w-md border-gold/20 bg-card">
          {editing ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-gold">{editing.code}</DialogTitle>
                <DialogDescription>
                  {editing.name} · {editing.phone} · party of {editing.party}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-date" className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Date
                    </Label>
                    <Input id="edit-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-time" className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Time
                    </Label>
                    <Input id="edit-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-party" className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Party size
                    </Label>
                    <Input id="edit-party" type="number" min={1} max={40} value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-area" className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Area
                    </Label>
                    <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                      <SelectTrigger id="edit-area">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="garden">Garden</SelectItem>
                        <SelectItem value="vip">VIP mesob</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-note" className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Internal note
                  </Label>
                  <Textarea
                    id="edit-note"
                    rows={3}
                    value={form.adminNote}
                    onChange={(e) => setForm({ ...form, adminNote: e.target.value })}
                    placeholder="VIP treatment, allergies, high chair…"
                  />
                </div>
                {editing.notes ? (
                  <p className="rounded-lg border border-gold/15 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                    Guest note: {editing.notes}
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Close
                </Button>
                <Button className="btn-gold btn-sm !rounded-xl" disabled={saving} onClick={saveEdit}>
                  Save changes
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
