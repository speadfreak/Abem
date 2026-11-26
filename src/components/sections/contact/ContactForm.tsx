"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircle, CircleCheck, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/shared/Primitives";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

type FormValues = ContactInput & { company?: string };

const SUBJECTS = [
  "General question",
  "Private events",
  "Feedback",
  "Careers",
  "Press & media",
  "Other",
] as const;

const fieldClass =
  "h-11 w-full rounded-xl border-gold/15 bg-elevated/70 text-cream placeholder:text-muted-foreground/60 focus-visible:ring-ring/40";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "General question", message: "", company: "" },
  });

  const onSubmit = async (v: FormValues) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          email: v.email,
          phone: v.phone || "",
          subject: v.subject,
          message: v.message,
          company: v.company ?? "", // honeypot — must stay empty
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      const rec = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
      if (!res.ok || !rec || rec.ok !== true) {
        const msg = rec && typeof rec.error === "string" ? rec.error : "Something went wrong — please try again.";
        throw new Error(msg);
      }
      setStatus("sent");
      reset({ name: "", email: "", phone: "", subject: "General question", message: "", company: "" });
      toast.success("Message sent — we reply within one business day. Betam ameseginanelhu!");
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Something went wrong — please try again.");
    }
  };

  return (
    <Reveal>
      <div className="card-elevated p-7 md:p-10">
        <span className="eyebrow">Write to us · ይጻፉልን</span>
        <h2 className="display-2 mt-3 text-cream">A direct line to the kitchen.</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Questions about spice levels, ceremonies, events or careers — this reaches the front desk, not a ticketing queue.
        </p>

        {status === "sent" ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-highland/50 bg-highland/15 p-5" role="status">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8fd0a0]" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-cream">Received — melkam! We reply within one business day.</p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-gold underline-offset-4 hover:underline"
              >
                Write another message
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
              <Label htmlFor="ct-name">Name *</Label>
              <Input
                id="ct-name"
                type="text"
                autoComplete="name"
                placeholder="Hanna Girma"
                className={cn(fieldClass, errors.name && "border-ember/70")}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name ? <p className="text-xs text-ember">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-email">Email *</Label>
              <Input
                id="ct-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(fieldClass, errors.email && "border-ember/70")}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email ? <p className="text-xs text-ember">{errors.email.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ct-phone">Phone (optional)</Label>
              <Input
                id="ct-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+251 9…"
                className={cn(fieldClass, errors.phone && "border-ember/70")}
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              {errors.phone ? <p className="text-xs text-ember">{errors.phone.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-subject">Subject *</Label>
              <Controller
                control={control}
                name="subject"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
                    <SelectTrigger
                      id="ct-subject"
                      className={cn("min-h-11 w-full rounded-xl border-gold/15 bg-elevated/70 text-cream", errors.subject && "border-ember/70")}
                    >
                      <SelectValue placeholder="Pick a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subject ? <p className="text-xs text-ember">{errors.subject.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ct-message">Message *</Label>
            <Textarea
              id="ct-message"
              rows={6}
              placeholder="Selam! I'd like to ask about…"
              className={cn(
                "min-h-32 w-full rounded-xl border-gold/15 bg-elevated/70 text-cream placeholder:text-muted-foreground/60",
                errors.message && "border-ember/70"
              )}
              aria-invalid={!!errors.message}
              {...register("message")}
            />
            {errors.message ? <p className="text-xs text-ember">{errors.message.message}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={status === "sending"} className="btn-gold disabled:opacity-70">
              {status === "sending" ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send message
                </>
              )}
            </button>
            {status === "error" ? (
              <p className="text-sm text-ember" role="alert">
                The message did not go through — please try again or WhatsApp us.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </Reveal>
  );
}
