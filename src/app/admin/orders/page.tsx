"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Bike,
  Banknote,
  XCircle,
  ArrowRight,
  ReceiptText,
} from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { StatusChip } from "@/components/admin/status-chip";
import { apiFetch, asArray, errorMessage, qs } from "@/components/admin/api";
import type { AdminOrder, AdminRider, OrderItemRow, StatusLogEntry } from "@/components/admin/types";
import { formatETB, formatTime, nextStatus, minutesSince, statusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const STATUS_FILTERS = ["ALL", "NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"] as const;
const TYPE_FILTERS = ["ALL", "DINEIN", "TAKEAWAY", "DELIVERY"] as const;

/** Dine-in / takeaway skip the delivery leg of the status flow. */
function nextFor(type: string, status: string): string | null {
  if (type === "DELIVERY") return nextStatus(status);
  if (status === "NEW") return "PREPARING";
  if (status === "PREPARING") return "READY";
  if (status === "READY") return "COMPLETED";
  return null;
}

function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
        active
          ? "border-gold bg-gold/15 text-gold"
          : "border-gold/20 bg-transparent text-muted-foreground hover:border-gold/50 hover:text-cream"
      )}
    >
      {children}
    </button>
  );
}

function OrderDetail({
  order,
  riders,
  onAdvance,
  onPaid,
  onCancel,
  onRider,
  busy,
}: {
  order: AdminOrder;
  riders: AdminRider[];
  onAdvance: (o: AdminOrder, status: string) => void;
  onPaid: (o: AdminOrder) => void;
  onCancel: (o: AdminOrder) => void;
  onRider: (o: AdminOrder, riderId: string) => void;
  busy: boolean;
}) {
  const items = asArray<OrderItemRow>(order.items);
  const timeline = asArray<StatusLogEntry>(order.statusLog);
  const next = nextFor(order.type, order.status);
  const activeRiderId = order.riderId ?? "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={order.status} />
        <StatusChip status={order.paymentStatus} />
        <Badge variant="outline" className="border-gold/30 text-[10px] tracking-widest text-gold">
          {order.type}
        </Badge>
        {order.otp ? (
          <Badge variant="outline" className="border-sky-400/40 text-[10px] tracking-widest text-sky-300">
            OTP {order.otp}
          </Badge>
        ) : null}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {minutesSince(order.createdAt)} min ago
        </span>
      </div>

      {/* Items */}
      <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-gold/10 bg-elevated/40 p-3 no-scrollbar">
        {items.map((it, idx) => (
          <div key={`${it.id}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate text-cream">
                <span className="font-semibold text-gold">{it.qty}×</span> {it.name}
              </p>
              {it.notes ? <p className="text-[11px] text-muted-foreground">Note: {it.notes}</p> : null}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatETB(it.price * it.qty)}</span>
          </div>
        ))}
      </div>

      {/* Customer + totals */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gold/10 bg-elevated/40 p-3 text-sm">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Guest</p>
          <p className="font-semibold text-cream">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.phone}</p>
          {order.tableLabel ? <p className="text-xs text-muted-foreground">Table {order.tableLabel}</p> : null}
          {order.address ? <p className="mt-1 text-xs text-muted-foreground">{order.address}</p> : null}
          {order.landmark ? <p className="text-xs text-muted-foreground">Near {order.landmark}</p> : null}
          {order.zoneName ? <p className="text-xs text-muted-foreground">Zone: {order.zoneName}</p> : null}
          {order.notes ? <p className="mt-1 text-xs text-gold">Note: {order.notes}</p> : null}
        </div>
        <div className="rounded-xl border border-gold/10 bg-elevated/40 p-3 text-sm">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatETB(order.subtotal)}</span>
          </div>
          {order.discount > 0 ? (
            <div className="mt-1 flex justify-between text-xs text-emerald-300">
              <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span>-{formatETB(order.discount)}</span>
            </div>
          ) : null}
          {order.deliveryFee > 0 ? (
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>Delivery</span>
              <span>{formatETB(order.deliveryFee)}</span>
            </div>
          ) : null}
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-cream">
            <span>Total</span>
            <span className="text-gold">{formatETB(order.total)}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Paid via {order.paymentMethod}</p>
        </div>
      </div>

      {/* Rider */}
      {order.type === "DELIVERY" ? (
        <div className="flex items-center gap-3 rounded-xl border border-gold/10 bg-elevated/40 p-3">
          <Bike className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rider</p>
            <p className="truncate text-sm text-cream">{order.riderName ?? "Unassigned"}</p>
          </div>
          <Select value={activeRiderId || undefined} onValueChange={(v) => onRider(order, v)}>
            <SelectTrigger className="w-44" aria-label="Assign rider">
              <SelectValue placeholder="Assign rider" />
            </SelectTrigger>
            <SelectContent>
              {riders.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} · {r.status.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Timeline */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Timeline</p>
        <ol className="space-y-2">
          {timeline.map((t, idx) => (
            <li key={idx} className="flex items-center gap-3 text-xs">
              <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              <span className="font-semibold text-cream">{statusLabel(t.status)}</span>
              <span className="text-muted-foreground">{t.at ? formatTime(t.at) : ""}</span>
              {t.by ? <span className="truncate text-muted-foreground">· {t.by}</span> : null}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {next ? (
          <Button
            disabled={busy}
            onClick={() => onAdvance(order, next)}
            className="btn-gold btn-sm !min-w-0 flex-1 !rounded-xl"
          >
            Advance to {statusLabel(next)}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        ) : null}
        {order.paymentStatus !== "PAID" ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onPaid(order)}>
            <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
            Mark paid
          </Button>
        ) : null}
        {order.status !== "CANCELLED" && order.status !== "COMPLETED" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            className="border-ember/40 text-red-300 hover:bg-ember/10 hover:text-red-200"
            onClick={() => onCancel(order)}
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const data = await apiFetch<{ ok: true; orders: AdminOrder[] }>(
        `/api/admin/orders${qs({ status, type, q })}`
      );
      setOrders(data.orders);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, type, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    apiFetch<{ ok: true; riders: AdminRider[] }>("/api/admin/riders")
      .then((d) => setRiders(d.riders))
      .catch(() => {});
  }, []);

  /* Live refresh every 8s */
  useEffect(() => {
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  async function patchOrder(id: string, body: Record<string, string>, okMsg: string) {
    setBusy(true);
    try {
      const data = await apiFetch<{ ok: true; order: AdminOrder }>("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      toast.success(okMsg);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data.order } : o)));
      if (selected?.id === id) setSelected({ ...selected, ...data.order });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function advance(o: AdminOrder, next: string) {
    void patchOrder(o.id, { status: next }, `Order ${o.code} → ${statusLabel(next)}`);
  }
  function markPaid(o: AdminOrder) {
    void patchOrder(o.id, { paymentStatus: "PAID" }, `Order ${o.code} marked paid`);
  }
  function assignRider(o: AdminOrder, riderId: string) {
    const rider = riders.find((r) => r.id === riderId);
    void patchOrder(o.id, { riderId }, `Rider ${rider?.name ?? ""} assigned`);
  }
  function cancelOrder(o: AdminOrder) {
    void patchOrder(o.id, { status: "CANCELLED" }, `Order ${o.code} cancelled`);
  }

  const liveCount = useMemo(() => orders.filter((o) => o.status === "NEW").length, [orders]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Orders"
        subtitle={
          refreshing
            ? "Syncing live tickets…"
            : `${orders.length} ticket${orders.length === 1 ? "" : "s"} in view${liveCount ? ` · ${liveCount} new` : ""}`
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="card-elevated space-y-3 rounded-2xl p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code, guest name or phone…"
            aria-label="Search orders"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status filter">
          {STATUS_FILTERS.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s === "ALL" ? "All" : statusLabel(s)}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Order type filter">
          {TYPE_FILTERS.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>
              {t === "ALL" ? "All types" : t.replace("_", " ")}
            </Chip>
          ))}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <AdminSkeleton rows={6} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-8 w-8" />}
          title="No orders match"
          hint="Adjust the filters, or wait — new tickets land here every 8 seconds."
        />
      ) : (
        <div className="card-elevated overflow-x-auto rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="border-gold/10">
                <TableHead className="text-xs">Ticket</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Guest</TableHead>
                <TableHead className="hidden text-xs md:table-cell">Items</TableHead>
                <TableHead className="text-right text-xs">Total</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="hidden text-right text-xs md:table-cell">Placed</TableHead>
                <TableHead className="w-10" aria-label="Expand" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const items = asArray<OrderItemRow>(o.items);
                const next = nextFor(o.type, o.status);
                return (
                  <TableRow
                    key={o.id}
                    className={cn(
                      "cursor-pointer border-gold/5 hover:bg-elevated/60",
                      selected?.id === o.id && "bg-gold/5"
                    )}
                    onClick={() => setSelected(o)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-gold">{o.code}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.type.replace("_", " ")}</TableCell>
                    <TableCell className="max-w-36 truncate text-xs">
                      {o.customerName}
                      {o.tableLabel ? <span className="ml-1 text-[10px] text-gold/70">· {o.tableLabel}</span> : null}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {items.reduce((sum, it) => sum + (it.qty ?? 0), 0)} plates
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold">{formatETB(o.total)}</TableCell>
                    <TableCell>
                      <StatusChip status={o.status} />
                    </TableCell>
                    <TableCell className="hidden text-right text-[11px] text-muted-foreground md:table-cell">
                      {formatTime(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      {selected?.id === o.id ? (
                        <ChevronUp className="h-4 w-4 text-gold" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={selected !== null} onOpenChange={(open) => (open ? null : setSelected(null))}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-gold/20 bg-card no-scrollbar">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-lg text-gold">
                  {selected.code}
                </DialogTitle>
                <DialogDescription>
                  {selected.type.replace("_", " ")} ticket · placed {formatTime(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <OrderDetail
                order={selected}
                riders={riders}
                busy={busy}
                onAdvance={advance}
                onPaid={markPaid}
                onCancel={(o) => setCancelTarget(o)}
                onRider={assignRider}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={cancelTarget !== null} onOpenChange={(open) => (open ? null : setCancelTarget(null))}>
        <AlertDialogContent className="border-gold/20 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel ticket {cancelTarget?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              The guest keeps the OTP-free record, the kitchen drops the ticket, and payment stays marked{" "}
              {cancelTarget?.paymentStatus === "PAID" ? "paid (refund offline)" : "unpaid"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep ticket</AlertDialogCancel>
            <AlertDialogAction
              className="bg-ember text-cream hover:bg-ember/85"
              onClick={() => {
                if (cancelTarget) cancelOrder(cancelTarget);
                setCancelTarget(null);
              }}
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
