"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { careerSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

/* ── Careers application dialog ── */

type ApplyValues = z.infer<typeof careerSchema>;

export default function CareersForm({
  openings,
  defaultOpeningId,
  label = "Apply now",
  className,
}: {
  openings: { id: string; title: string; type: string; location: string }[];
  defaultOpeningId?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplyValues>({
    resolver: zodResolver(careerSchema),
    defaultValues: { openingId: defaultOpeningId ?? "", opening: "", name: "", email: "", phone: "", cover: "" },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setDone(true);
        toast.success("Application received — the kitchen team will call you");
        reset();
      } else {
        toast.error(data.error ?? "Could not send the application");
      }
    } catch {
      toast.error("Network hiccup — please try again");
    }
  });

  const inputCls = "border-gold/20 bg-surface text-foreground placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/50";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setDone(false);
      }}
    >
      <DialogTrigger asChild>
        <button className={cn("btn-gold btn-sm", className)} aria-haspopup="dialog">
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-gold/20 bg-background sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="display-3 text-cream">Join the fire.</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tell us who you are — the floor manager reads every application within two days.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
            <CheckCircle2 className="h-12 w-12 text-[#8fd0a0]" aria-hidden="true" />
            <p className="display-3 text-cream">Application received</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              We keep every application on file. If there is a match, we call — no ghosting, this is a family kitchen.
            </p>
            <button onClick={() => setOpen(false)} className="btn-ghost btn-sm mt-2">Close</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 pb-2" noValidate>
            <div>
              <Label htmlFor="cf-opening" className="text-xs text-cream/80">Opening</Label>
              <select
                id="cf-opening"
                {...register("openingId")}
                className="mt-1.5 h-11 w-full rounded-md border border-gold/20 bg-surface px-3 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="">General application — any role</option>
                {openings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title} · {o.type.replace(/_/g, " ").toLowerCase()} · {o.location}
                  </option>
                ))}
              </select>
              <input type="hidden" {...register("opening")} />
            </div>
            <div>
              <Label htmlFor="cf-name" className="text-xs text-cream/80">Full name</Label>
              <Input id="cf-name" {...register("name")} placeholder="Genet Alemu" className={cn("mt-1.5 h-11", inputCls)} aria-invalid={!!errors.name} />
              {errors.name ? <p className="mt-1 text-xs text-ember">{errors.name.message}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cf-email" className="text-xs text-cream/80">
                  <Mail className="mr-1 inline h-3 w-3 text-gold" aria-hidden="true" /> Email
                </Label>
                <Input id="cf-email" {...register("email")} type="email" placeholder="you@example.com" className={cn("mt-1.5 h-11", inputCls)} aria-invalid={!!errors.email} />
                {errors.email ? <p className="mt-1 text-xs text-ember">{errors.email.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="cf-phone" className="text-xs text-cream/80">
                  <Phone className="mr-1 inline h-3 w-3 text-gold" aria-hidden="true" /> Phone
                </Label>
                <Input id="cf-phone" {...register("phone")} type="tel" placeholder="+251 911 234 567" className={cn("mt-1.5 h-11", inputCls)} aria-invalid={!!errors.phone} />
                {errors.phone ? <p className="mt-1 text-xs text-ember">{errors.phone.message}</p> : null}
              </div>
            </div>
            <div>
              <Label htmlFor="cf-cover" className="text-xs text-cream/80">
                A few words about you <span className="text-gold/70">(optional)</span>
              </Label>
              <Textarea
                id="cf-cover"
                {...register("cover")}
                rows={4}
                placeholder="Where you have cooked or served, what you want to learn, when you can start…"
                className={cn("mt-1.5", inputCls)}
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-gold w-full disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? "Sending…" : "Send application"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
