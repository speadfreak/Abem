"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LoaderCircle, CircleCheck, PartyPopper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/shared/Primitives";
import { cn } from "@/lib/utils";

const EVENT_TYPES = ["wedding", "corporate", "birthday", "private"] as const;
type EventType = (typeof EVENT_TYPES)[number];

const TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding or melse",
  corporate: "Corporate / launch",
  birthday: "Birthday / private party",
  private: "Private dining (Ember Room)",
};

const eventSchema = z.object({
  name: z.string().min(2, "Please tell us your name").max(80),
  email: z.string().email("A valid email helps us reply"),
  phone: z.string().min(7, "A reachable phone number, please").max(20),
  type: z.enum(EVENT_TYPES),
  guests: z.number().int().min(5, "At least 5 guests").max(600, "Above 600 — call us directly"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a preferred date"),
  message: z.string().min(10, "Tell us a little about the occasion").max(2000),
});

type EventForm = z.infer<typeof eventSchema> & { company?: string };

const fieldClass = "h-11 w-full rounded-xl border-gold/15 bg-elevated/70 text-cream placeholder:text-muted-foreground/60 focus-visible:ring-ring/40";

export default function InquiryForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [minDate, setMinDate] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { name: "", email: "", phone: "", type: "wedding", guests: 80, date: "", message: "" },
  });

  useEffect(() => {
    setMinDate(new Date().toISOString().slice(0, 10));
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail;
      if (typeof detail === "string" && EVENT_TYPES.includes(detail as EventType)) {
        setValue("type", detail as EventType, { shouldValidate: false });
        toast(`"${TYPE_LABELS[detail as EventType]}" selected — tell us the details below.`);
      }
    };
    window.addEventListener("abem:event-type", onPrefill);
    return () => window.removeEventListener("abem:event-type", onPrefill);
  }, [setValue]);

  const onSubmit = async (v: EventForm) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          email: v.email,
          phone: v.phone,
          subject: `Event inquiry: ${v.type} (${v.guests} guests)`,
          message: `Event type: ${TYPE_LABELS[v.type]}\nGuests: ${v.guests}\nPreferred date: ${v.date}\n\n${v.message}`,
          company: v.company ?? "",
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      const rec = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
      if (!res.ok || !rec || rec.ok !== true) {
        const msg = rec && typeof rec.error === "string" ? rec.error : "Something went wrong — please try again.";
        throw new Error(msg);
      }
      setStatus("sent");
      reset({ name: "", email: "", phone: "", type: "wedding", guests: 80, date: "", message: "", company: "" });
      toast.success("Request sent — our events team replies within one business day.");
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Something went wrong — please try again.");
    }
  };

  return (
    <Reveal className="mx-auto mt-14 max-w-3xl">
      <div className="card-elevated p-7 md:p-10">
        <h3 className="display-3 text-cream">Event inquiry</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Fields marked * are required. We reply within one business day — tastings included.
        </p>

        {status === "sent" ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-highland/50 bg-highland/15 p-5" role="status">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8fd0a0]" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-cream">Request received — melkam, and congratulations.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Our events team replies within one business day. If it is urgent, call{" "}
                <a href="tel:+251911234567" className="text-gold underline-offset-4 hover:underline">
                  +251 911 234 567
                </a>
                .
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-gold underline-offset-4 hover:underline"
              >
                Send another inquiry
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5" noValidate>
          {/* Honeypot — hidden from humans, must stay empty */}
          <div aria-hidden="true" className="hidden">
            <label>
              Company
              <input type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-name">Full name *</Label>
              <Input id="ev-name" type="text" autoComplete="name" placeholder="Alem Tsehay" className={cn(fieldClass, errors.name && "border-ember/70")} aria-invalid={!!errors.name} {...register("name")} />
              {errors.name ? <p className="text-xs text-ember">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-email">Email *</Label>
              <Input id="ev-email" type="email" autoComplete="email" placeholder="you@example.com" className={cn(fieldClass, errors.email && "border-ember/70")} aria-invalid={!!errors.email} {...register("email")} />
              {errors.email ? <p className="text-xs text-ember">{errors.email.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-phone">Phone / WhatsApp *</Label>
              <Input id="ev-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+251 9… " className={cn(fieldClass, errors.phone && "border-ember/70")} aria-invalid={!!errors.phone} {...register("phone")} />
              {errors.phone ? <p className="text-xs text-ember">{errors.phone.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-type">Event type *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
                    <SelectTrigger id="ev-type" className={cn("min-h-11 w-full rounded-xl border-gold/15 bg-elevated/70 text-cream", errors.type && "border-ember/70")}>
                      <SelectValue placeholder="Choose an occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type ? <p className="text-xs text-ember">{errors.type.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-guests">Guests *</Label>
              <Input
                id="ev-guests"
                type="number"
                min={5}
                max={600}
                inputMode="numeric"
                placeholder="80"
                className={cn(fieldClass, errors.guests && "border-ember/70")}
                aria-invalid={!!errors.guests}
                {...register("guests", { valueAsNumber: true })}
              />
              {errors.guests ? <p className="text-xs text-ember">{errors.guests.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-date">Preferred date *</Label>
              <Input id="ev-date" type="date" min={minDate} className={cn(fieldClass, "[color-scheme:dark]", errors.date && "border-ember/70")} aria-invalid={!!errors.date} {...register("date")} />
              {errors.date ? <p className="text-xs text-ember">{errors.date.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-message">The occasion *</Label>
            <Textarea
              id="ev-message"
              rows={5}
              placeholder="Meskel weekend, 180 guests, garden ceremony at 5 PM, live azmari, fasting menu for 40…"
              className={cn("min-h-28 w-full rounded-xl border-gold/15 bg-elevated/70 text-cream placeholder:text-muted-foreground/60", errors.message && "border-ember/70")}
              aria-invalid={!!errors.message}
              {...register("message")}
            />
            {errors.message ? <p className="text-xs text-ember">{errors.message.message}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={status === "sending"} className="btn-ember disabled:opacity-70">
              {status === "sending" ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  <PartyPopper className="h-4 w-4" aria-hidden="true" />
                  Send the request
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              By sending you agree to be contacted about this inquiry. Nothing else — we hate spam too.
            </p>
          </div>
          {status === "error" ? (
            <p className="text-sm text-ember" role="alert">
              The message did not go through — please try again or WhatsApp us directly.
            </p>
          ) : null}
        </form>
      </div>
    </Reveal>
  );
}
