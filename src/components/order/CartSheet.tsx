"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  BadgePercent, Banknote, Bike, ChevronLeft, Minus, Plus,
  ScrollText, ShoppingBag, TicketCheck, Timer, Trash2, UtensilsCrossed,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/components/providers/SettingsProvider";
import { formatETB } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiZone, OrderMode, OrderSuccessData } from "./types";

/* ── Cart drawer + checkout ─────────────────────────────────────── */

type Step = "cart" | "checkout";

interface CheckoutValues {
  customerName: string;
  phone: string;
  loyaltyPhone?: string | undefined;
  zoneId?: string | undefined;
  address?: string | undefined;
  landmark?: string | undefined;
  paymentMethod: "COD" | "TELEBIRR" | "CBE_BIRR" | "CHAPA";
  scheduledFor?: string | undefined;
  notes?: string | undefined;
}

export default function CartSheet({
  open,
  onOpenChange,
  cart,
  mode,
  tableToken,
  onOrdered,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cart: ReturnType<typeof useCart>;
  mode: OrderMode;
  tableToken: string;
  onOrdered: (data: OrderSuccessData) => void;
}) {
  const { settings } = useSettings();
  const [step, setStep] = useState<Step>("cart");
  const [zones, setZones] = useState<ApiZone[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDelivery = mode === "DELIVERY";
  const preOrders = settings.features.preOrders;

  const schema = useMemo(
    () =>
      z
        .object({
          customerName: z.string().min(2, "Please tell us your name").max(80),
          phone: z.string().min(7, "A reachable phone is required").max(20),
          loyaltyPhone: z.string().max(20).optional().or(z.literal("")),
          zoneId: z.string().optional().or(z.literal("")),
          address: z.string().optional().or(z.literal("")),
          landmark: z.string().max(120).optional().or(z.literal("")),
          paymentMethod: z.enum(["COD", "TELEBIRR", "CBE_BIRR", "CHAPA"]),
          scheduledFor: z.string().optional().or(z.literal("")),
          notes: z.string().max(500).optional().or(z.literal("")),
        })
        .superRefine((val, ctx) => {
          if (isDelivery) {
            if (!val.zoneId) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["zoneId"], message: "Choose a delivery zone" });
            }
            const zone = zones.find((zo) => zo.id === val.zoneId);
            if (zone && cart.subtotal < zone.minOrder) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["zoneId"], message: `Minimum order for ${zone.name} is ${formatETB(zone.minOrder)}` });
            }
            if (!val.address || val.address.trim().length < 8) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Where should the rider find you?" });
            }
          }
          if (val.scheduledFor) {
            const when = new Date(val.scheduledFor);
            if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledFor"], message: "Pick a future time" });
            }
          }
        }),
    [isDelivery, zones, cart.subtotal]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", phone: "", loyaltyPhone: "", zoneId: "", address: "", landmark: "", paymentMethod: "COD", scheduledFor: "", notes: "" },
  });

  const zoneId = watch("zoneId");
  const payment = watch("paymentMethod");

  useEffect(() => {
    if (!open || zones.length > 0) return;
    fetch("/api/zones")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { zones?: ApiZone[] } | null) => setZones(j?.zones ?? []))
      .catch(() => {});
  }, [open, zones.length]);

  useEffect(() => {
    if (!open) setStep("cart");
  }, [open]);

  const zone = zones.find((zo) => zo.id === zoneId) ?? null;
  const deliveryFee = isDelivery && zone ? zone.fee : 0;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, cart.subtotal - discount) + deliveryFee;

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: cart.subtotal }),
      });
      const data = (await res.json()) as { ok: boolean; code?: string; discount?: number; error?: string };
      if (data.ok && data.code && typeof data.discount === "number") {
        setCoupon({ code: data.code, discount: data.discount });
        toast.success(`Coupon ${data.code} applied — ${formatETB(data.discount)} off`);
      } else {
        setCoupon(null);
        toast.error(data.error ?? "This code is not valid");
      }
    } catch {
      toast.error("Could not validate the code right now");
    } finally {
      setCouponBusy(false);
    }
  };

  const onSubmit = handleSubmit(async (v) => {
    if (cart.items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          tableToken: mode === "DINEIN" && tableToken ? tableToken : undefined,
          customerName: v.customerName,
          phone: v.phone,
          address: isDelivery ? v.address : undefined,
          landmark: v.landmark || undefined,
          zoneId: isDelivery ? v.zoneId : undefined,
          couponCode: coupon?.code,
          paymentMethod: v.paymentMethod,
          scheduledFor: preOrders && v.scheduledFor ? new Date(v.scheduledFor).toISOString() : undefined,
          notes: v.notes || undefined,
          loyaltyPhone: v.loyaltyPhone || undefined,
          items: cart.items.map((l) => ({ id: l.id, qty: l.qty, notes: l.notes })),
        }),
      });
      const data = (await res.json()) as Partial<OrderSuccessData> & { ok: boolean; error?: string; eta?: string };
      if (data.ok && data.code) {
        cart.clear();
        setCoupon(null);
        setCouponCode("");
        reset();
        onOrdered({
          code: data.code,
          total: data.total ?? total,
          eta: data.eta ?? (isDelivery ? "35-60 min" : "15-25 min"),
          otp: data.otp ?? null,
          pointsEarned: data.pointsEarned ?? 0,
          type: mode,
          riderName: data.riderName ?? null,
        });
      } else {
        toast.error(data.error ?? "We could not place that order — please try again");
      }
    } catch {
      toast.error("Network hiccup — please try again");
    } finally {
      setSubmitting(false);
    }
  });

  const inputCls = "border-gold/20 bg-surface text-foreground placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/50";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-gold/20 bg-background sm:max-w-md" aria-describedby={undefined}>
        <SheetHeader className="border-b border-gold/15 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-cream">
            {step === "cart" ? <ShoppingBag className="h-4 w-4 text-gold" aria-hidden="true" /> : <ScrollText className="h-4 w-4 text-gold" aria-hidden="true" />}
            {step === "cart" ? "Your order" : "Checkout"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {step === "cart"
              ? mode === "DINEIN" ? "Ordering to your table — the kitchen fires on submit." : isDelivery ? "Delivered hot across Addis Ababa." : "Ready for pickup at the host desk."
              : "Cash on delivery / at the counter. Powered by Abem Flow."}
          </SheetDescription>
        </SheetHeader>

        {cart.items.length === 0 && step === "cart" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-ember/40 bg-ember/10">
              <UtensilsCrossed className="h-8 w-8 text-ember" aria-hidden="true" />
            </span>
            <p className="display-3 text-cream">Your tray is empty</p>
            <p className="text-sm text-muted-foreground">Add a flame burger, a wood-fired pizza or crispy wings — the fire is waiting.</p>
            <button onClick={() => onOpenChange(false)} className="btn-gold btn-sm mt-2">Browse the menu</button>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="min-h-0 flex-1 touch-auto overscroll-contain overflow-y-auto px-5 py-4" role="region" aria-label="Cart items">
              <ul className="space-y-3">
                {cart.items.map((l) => (
                  <li key={l.id} className="ticket flex items-center gap-3 p-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gold/15">
                      {l.image ? (
                        <Image src={l.image} alt={l.name} fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-card"><UtensilsCrossed className="h-4 w-4 text-gold/30" aria-hidden="true" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-cream">{l.name}</p>
                      <p className="text-xs text-gold tabular-nums">{formatETB(l.price)}</p>
                      <div className="mt-1.5 inline-flex h-7 items-center rounded-full border border-gold/30 bg-card" role="group" aria-label={`Quantity for ${l.name}`}>
                        <button onClick={() => cart.setQty(l.id, l.qty - 1)} aria-label={`Decrease ${l.name}`} className="flex h-full w-7 items-center justify-center text-cream hover:text-ember active:scale-90">
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold tabular-nums text-cream">{l.qty}</span>
                        <button onClick={() => cart.setQty(l.id, l.qty + 1)} aria-label={`Increase ${l.name}`} className="flex h-full w-7 items-center justify-center text-gold hover:bg-gold/15 active:scale-90">
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => cart.remove(l.id)} aria-label={`Remove ${l.name}`} className="text-muted-foreground transition-colors hover:text-ember">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-bold tabular-nums text-cream">{formatETB(l.price * l.qty)}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Coupon */}
              <div className="mt-5 rounded-xl border border-gold/15 bg-card p-3.5">
                <Label htmlFor="coupon" className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-gold">
                  <BadgePercent className="h-3.5 w-3.5" aria-hidden="true" /> Coupon code
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ABEM10"
                    className={cn("h-10 font-mono uppercase", inputCls)}
                    aria-describedby={coupon ? "coupon-applied" : undefined}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponBusy || !couponCode.trim()}
                    className="btn-ghost btn-sm shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {couponBusy ? "…" : "Apply"}
                  </button>
                </div>
                {coupon ? (
                  <p id="coupon-applied" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#8fd0a0]" role="status">
                    <TicketCheck className="h-3.5 w-3.5" aria-hidden="true" /> {coupon.code} — {formatETB(coupon.discount)} off applied
                  </p>
                ) : null}
              </div>
            </div>

            <div className="border-t border-gold/15 bg-elevated px-5 py-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums text-cream">{formatETB(cart.subtotal)}</span></div>
                {discount > 0 ? (
                  <div className="flex justify-between text-[#8fd0a0]"><span>Coupon {coupon?.code}</span><span className="tabular-nums">−{formatETB(discount)}</span></div>
                ) : null}
              </div>
              <button onClick={() => setStep("checkout")} className="btn-gold mt-4 w-full">
                Continue to checkout <ChevronLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            <form id="abem-checkout-form" onSubmit={onSubmit} className="min-h-0 flex-1 touch-auto overscroll-contain overflow-y-auto px-5 py-4" noValidate>
              {/* Contact */}
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="co-name" className="text-xs text-cream/80">Your name</Label>
                  <Input id="co-name" {...register("customerName")} placeholder="Abebe Bekele" className={cn("mt-1.5 h-11", inputCls)} aria-invalid={!!errors.customerName} />
                  {errors.customerName ? <p className="mt-1 text-xs text-ember">{errors.customerName.message}</p> : null}
                </div>
                <div>
                  <Label htmlFor="co-phone" className="text-xs text-cream/80">Phone</Label>
                  <Input id="co-phone" {...register("phone")} type="tel" placeholder="+251 911 234 567" className={cn("mt-1.5 h-11", inputCls)} aria-invalid={!!errors.phone} />
                  {errors.phone ? <p className="mt-1 text-xs text-ember">{errors.phone.message}</p> : null}
                </div>
                <div>
                  <Label htmlFor="co-loyalty" className="text-xs text-cream/80">
                    Loyalty phone <span className="text-gold/70">— earn Abem Rewards points</span>
                  </Label>
                  <Input id="co-loyalty" {...register("loyaltyPhone")} type="tel" placeholder="Optional" className={cn("mt-1.5 h-11", inputCls)} />
                </div>
              </div>

              {/* Delivery fields */}
              {isDelivery ? (
                <div className="mt-5 grid gap-3 rounded-xl border border-gold/15 bg-card p-3.5">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                    <Bike className="h-3.5 w-3.5" aria-hidden="true" /> Delivery details
                  </p>
                  <div>
                    <Label htmlFor="co-zone" className="text-xs text-cream/80">Zone</Label>
                    <select
                      id="co-zone"
                      {...register("zoneId")}
                      className="mt-1.5 h-11 w-full rounded-md border border-gold/20 bg-surface px-3 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/30"
                      aria-invalid={!!errors.zoneId}
                    >
                      <option value="">Choose your zone…</option>
                      {zones.map((zo) => {
                        const below = cart.subtotal < zo.minOrder;
                        return (
                          <option key={zo.id} value={zo.id} disabled={below}>
                            {zo.name} — {formatETB(zo.fee)} fee · {zo.etaMin}–{zo.etaMax} min{below ? ` · min ${formatETB(zo.minOrder)}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {errors.zoneId ? <p className="mt-1 text-xs text-ember">{errors.zoneId.message}</p> : null}
                    {zone ? (
                      <p className="mt-1.5 text-xs text-muted-foreground" role="status">
                        {formatETB(zone.fee)} fee · arrives in {zone.etaMin}–{zone.etaMax} min
                        {cart.subtotal < zone.minOrder ? <span className="text-ember"> · add {formatETB(zone.minOrder - cart.subtotal)} more for this zone</span> : null}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="co-address" className="text-xs text-cream/80">Street address</Label>
                    <Textarea id="co-address" {...register("address")} rows={2} placeholder="Sub-city, woreda, street, house / building" className={cn("mt-1.5", inputCls)} aria-invalid={!!errors.address} />
                    {errors.address ? <p className="mt-1 text-xs text-ember">{errors.address.message}</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="co-landmark" className="text-xs text-cream/80">Near which landmark? e.g. “behind Getu Commercial”</Label>
                    <Input id="co-landmark" {...register("landmark")} placeholder="Landmark" className={cn("mt-1.5 h-11", inputCls)} />
                  </div>
                </div>
              ) : null}

              {/* Payment */}
              <fieldset className="mt-5">
                <legend className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Payment</legend>
                <RadioGroup value={payment} onValueChange={(val) => setValue("paymentMethod", val as CheckoutValues["paymentMethod"], { shouldValidate: true })} className="mt-2 grid grid-cols-2 gap-2">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gold/50 bg-gold/10 px-3.5 py-3 transition-colors has-[button[data-state=checked]]:border-gold">
                    <RadioGroupItem value="COD" id="pay-cod" className="border-gold text-gold" />
                    <Banknote className="h-4 w-4 text-gold" aria-hidden="true" />
                    <span className="text-sm font-semibold text-cream">Cash</span>
                    <span className="ml-auto text-[10px] font-bold uppercase text-[#8fd0a0]">Ready</span>
                  </label>
                  {(["TELEBIRR", "CBE_BIRR", "CHAPA"] as const).map((pm) => (
                    <label key={pm} className="flex items-center gap-2.5 rounded-xl border border-gold/15 bg-card px-3.5 py-3 opacity-50" aria-disabled="true">
                      <RadioGroupItem value={pm} id={`pay-${pm}`} disabled className="border-gold/30" />
                      <span className="text-sm font-semibold text-cream/80">{pm === "CBE_BIRR" ? "CBE Birr" : pm === "TELEBIRR" ? "telebirr" : "Chapa"}</span>
                      <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">Soon</span>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>

              {/* Scheduled + notes */}
              {preOrders ? (
                <div className="mt-5">
                  <Label htmlFor="co-sched" className="flex items-center gap-1.5 text-xs text-cream/80">
                    <Timer className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> Schedule for later <span className="text-gold/70">(optional)</span>
                  </Label>
                  <Input id="co-sched" {...register("scheduledFor")} type="datetime-local" className={cn("mt-1.5 h-11 [color-scheme:dark]", inputCls)} />
                </div>
              ) : null}
              <div className="mt-4">
                <Label htmlFor="co-notes" className="text-xs text-cream/80">Kitchen notes <span className="text-gold/70">(allergies, spice level…)</span></Label>
                <Textarea id="co-notes" {...register("notes")} rows={2} placeholder="e.g. extra awaze on the side, no berbere" className={cn("mt-1.5", inputCls)} />
              </div>

              {/* Totals */}
              <div className="ticket mt-5 p-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums text-cream">{formatETB(cart.subtotal)}</span></div>
                  {discount > 0 ? <div className="flex justify-between text-[#8fd0a0]"><span>Coupon</span><span className="tabular-nums">−{formatETB(discount)}</span></div> : null}
                  {deliveryFee > 0 ? <div className="flex justify-between text-muted-foreground"><span>Delivery — {zone?.name}</span><span className="tabular-nums text-cream">{formatETB(deliveryFee)}</span></div> : null}
                  <div className="hairline my-2" aria-hidden="true" />
                  <div className="flex justify-between text-base font-bold text-cream"><span>Total</span><span className="tabular-nums text-gold">{formatETB(total)}</span></div>
                </div>
              </div>
            </form>

            <div className="border-t border-gold/15 bg-elevated px-5 py-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep("cart")} className="btn-ghost btn-sm shrink-0" aria-label="Back to cart">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="submit" form="abem-checkout-form" disabled={submitting} className="btn-gold flex-1 disabled:cursor-wait disabled:opacity-60">
                  {submitting ? "Firing the kitchen…" : `Place order · ${formatETB(total)}`}
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}


