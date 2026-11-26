"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Loader2, Users, MapPin, Sparkles, PartyPopper, Phone } from "lucide-react";
import { reservationSchema } from "@/lib/validation";
import { Reveal } from "@/components/shared/Primitives";
import { useLang } from "@/lib/i18n/lang-context";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;
interface Slot { time: string; remaining: number; available: boolean }

const AREAS = [
  { id: "indoor", label: "Dining Hall", am: "የውስጥ ክፍል", desc: "Warm woods, brass lamps, the open kitchen's theatre.", seats: "2–10 guests" },
  { id: "garden", label: "The Garden", am: "ጓና", desc: "Under the string lights — Addis's best evening air.", seats: "2–12 guests" },
  { id: "vip", label: "Ember Room (VIP)", am: "የአብቲ ክፍል", desc: "Private mesobs for eight. Chef's tasting available.", seats: "up to 8 guests" },
] as const;

const OCCASIONS = ["Just dinner", "Birthday", "Anniversary", "Business", "Date night", "Family gursha"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return {
      iso: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString("en-GB", { weekday: "short" }),
      num: d.getDate(),
      month: d.toLocaleDateString("en-GB", { month: "short" }),
    };
  });
}

export default function ReservationWizard() {
  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("");
  const [party, setParty] = useState(2);
  const [area, setArea] = useState<string>("indoor");
  const [occasion, setOccasion] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [closedDay, setClosedDay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code: string } | null>(null);
  const [error, setError] = useState<string>("");
  const { lang } = useLang();

  const days = useMemo(() => nextDays(14), []);

  const wizardSchema = reservationSchema.pick({ name: true, email: true, phone: true, notes: true });
  type WizardValues = {
    name: string;
    email?: string;
    phone: string;
    notes?: string;
  };

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: { name: "", email: "", phone: "", notes: "" },
  });

  useEffect(() => {
    setSlotLoading(true);
    setTime("");
    fetch(`/api/availability?date=${date}&area=${area}`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots ?? []);
        setClosedDay(!!d.closed);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotLoading(false));
  }, [date, area]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, date, time, party, area, occasion }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not submit — please try again.");
      } else {
        setResult({ code: data.code });
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  if (result) {
    return (
      <Reveal className="card-elevated mx-auto max-w-xl p-10 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 14 }}>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-highland/20 text-[#8fd0a0]">
            <Check className="h-7 w-7" aria-hidden="true" />
          </span>
        </motion.div>
        <h2 className="display-2 mt-6 text-foreground">Table requested</h2>
        <p className="lead mt-3">
          {party} guests · {area} · {date} at {time}
        </p>
        <p className="mt-5 rounded-xl border border-gold/25 bg-elevated px-5 py-4 text-sm text-cream/80">
          Your reference is{" "}
          <strong className="font-mono text-gold">{result.code}</strong>. We confirm every request by
          phone — usually within the hour. Mesob awaits.
        </p>
        <button onClick={() => { setResult(null); setStep(1); setTime(""); }} className="btn-ghost btn-sm mt-8">
          Book another table
        </button>
      </Reveal>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div>
        {/* Progress */}
        <ol className="mb-10 flex items-center gap-3" aria-label="Booking steps">
          {["When", "Where & who", "You"].map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex items-center gap-3">
                <button
                  onClick={() => n < step && setStep(n)}
                  disabled={n >= step}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition-all",
                    active && "border-gold bg-gold text-[#1a0e05]",
                    done && "border-highland bg-highland/20 text-[#8fd0a0] cursor-pointer",
                    !active && !done && "border-cream/20 text-cream/50"
                  )}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Step ${n}: ${label}`}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </button>
                <span className={cn("text-[11px] font-bold uppercase tracking-[0.18em]", active ? "text-cream" : "text-muted-foreground")}>{label}</span>
                {n < 3 && <span className="mx-1 h-px w-8 bg-cream/15" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4 }}>
              <h2 className="display-2 text-foreground">Pick your evening</h2>
              <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2" role="group" aria-label="Choose date">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => setDate(d.iso)}
                    className={cn(
                      "flex w-[76px] shrink-0 flex-col items-center rounded-2xl border py-3 transition-all",
                      date === d.iso ? "border-gold bg-gold/12 text-gold" : "border-cream/12 text-cream/70 hover:border-gold/40"
                    )}
                    aria-pressed={date === d.iso}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{d.day}</span>
                    <span className="font-display text-2xl">{d.num}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">{d.month}</span>
                  </button>
                ))}
              </div>

              <h3 className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                <Clock className="h-4 w-4" aria-hidden="true" /> {lang === "am" ? "ሰዓት" : "Available times"}
              </h3>
              {slotLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking the room…</div>
              ) : closedDay || !slots.length ? (
                <p className="mt-4 rounded-xl border border-cream/15 bg-elevated px-4 py-3 text-sm text-cream/70">We are closed on this date — please pick another evening.</p>
              ) : (
                <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      onClick={() => s.available && setTime(s.time)}
                      disabled={!s.available}
                      className={cn(
                        "rounded-xl border px-1 py-2.5 text-center transition-all",
                        time === s.time ? "border-gold bg-gold text-[#1a0e05]" : s.available ? "border-cream/12 text-cream/80 hover:border-gold/50" : "cursor-not-allowed border-cream/5 text-cream/25 line-through"
                      )}
                      aria-pressed={time === s.time}
                      aria-label={`${s.time}, ${s.available ? `${s.remaining} seats left` : "full"}`}
                    >
                      <span className="block font-mono text-[13px]">{s.time}</span>
                      {s.available && <span className="block text-[9px] uppercase tracking-wide opacity-70">{s.remaining} left</span>}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => time && setStep(2)}
                disabled={!time}
                className="btn-gold mt-10 disabled:pointer-events-none disabled:opacity-40"
              >
                Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4 }}>
              <h2 className="display-2 text-foreground">Where shall we seat you?</h2>
              <div className="mt-6 space-y-3.5">
                {AREAS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setArea(a.id)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all",
                      area === a.id ? "border-gold bg-gold/10" : "border-cream/12 hover:border-gold/40"
                    )}
                    aria-pressed={area === a.id}
                  >
                    <MapPin className={cn("mt-1 h-5 w-5", area === a.id ? "text-gold" : "text-cream/40")} aria-hidden="true" />
                    <div className="flex-1">
                      <p className="flex items-baseline gap-2 font-display text-lg text-foreground">
                        {lang === "am" ? a.am : a.label}
                        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold/70">{a.seats}</span>
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">{a.desc}</p>
                    </div>
                    <span className={cn("h-4 w-4 rounded-full border-2", area === a.id ? "border-gold bg-gold" : "border-cream/25")} aria-hidden="true" />
                  </button>
                ))}
              </div>

              <h3 className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                <Users className="h-4 w-4" aria-hidden="true" /> Party size
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                  <button
                    key={n}
                    onClick={() => setParty(n)}
                    className={cn(
                      "h-12 w-12 rounded-full border font-display text-lg transition-all",
                      party === n ? "border-gold bg-gold text-[#1a0e05]" : "border-cream/12 text-cream/75 hover:border-gold/50"
                    )}
                    aria-pressed={party === n}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <h3 className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                <PartyPopper className="h-4 w-4" aria-hidden="true" /> Occasion (optional)
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {OCCASIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setOccasion(occasion === o ? "" : o)}
                    className={cn(
                      "rounded-full border px-4 py-2.5 text-[12px] font-semibold transition-all",
                      occasion === o ? "border-gold bg-gold/12 text-gold" : "border-cream/12 text-cream/70 hover:border-gold/40"
                    )}
                    aria-pressed={occasion === o}
                  >
                    {o}
                  </button>
                ))}
              </div>

              <div className="mt-10 flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost btn-sm">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-gold btn-sm">
                  Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.form key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4 }} onSubmit={onSubmit} className="space-y-5">
              <h2 className="display-2 text-foreground">Almost there</h2>
              {[
                { field: "name" as const, label: "Full name", type: "text", required: true, icon: Sparkles, placeholder: "Abebe Kebede" },
                { field: "phone" as const, label: "Phone (we confirm by call/SMS)", type: "tel", required: true, icon: Phone, placeholder: "+251 9… " },
                { field: "email" as const, label: "Email (optional)", type: "email", required: false, icon: CalendarDays, placeholder: "you@example.com" },
              ].map((f) => (
                <label key={f.field} className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-cream/70">{f.label}</span>
                  <span className="relative block">
                    <f.icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                      {...form.register(f.field)}
                      type={f.type}
                      placeholder={f.placeholder}
                      className="h-13 w-full rounded-xl border border-gold/20 bg-elevated py-3.5 pl-11 pr-4 text-sm text-cream outline-none transition focus:border-gold/60 placeholder:text-muted-foreground"
                    />
                  </span>
                  {form.formState.errors[f.field] && (
                    <span className="mt-1.5 block text-xs text-[#e05a4e]">{form.formState.errors[f.field]?.message}</span>
                  )}
                </label>
              ))}
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-cream/70">Anything we should know? (allergies, high chair, spice level…)</span>
                <textarea
                  {...form.register("notes")}
                  rows={3}
                  className="w-full rounded-xl border border-gold/20 bg-elevated p-4 text-sm text-cream outline-none transition focus:border-gold/60 placeholder:text-muted-foreground"
                  placeholder="One guest avoids berbere heat, one is fasting…"
                />
              </label>
              {/* honeypot */}
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...form.register("company" as never)} />

              {error && <p className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-[#ff9d8f]" role="alert">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="btn-ghost btn-sm">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
                <button type="submit" disabled={submitting} className="btn-gold btn-sm disabled:opacity-60">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Request this table
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Summary card */}
      <Reveal delay={0.1} className="lg:sticky lg:top-28 lg:self-start">
        <div className="card-elevated p-7">
          <p className="eyebrow">Your booking</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-semibold text-cream">{date}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Time</dt>
              <dd className="font-semibold text-cream">{time || "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Guests</dt>
              <dd className="font-semibold text-cream">{party}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Seating</dt>
              <dd className="font-semibold capitalize text-cream">{area}</dd>
            </div>
            {occasion && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Occasion</dt>
                <dd className="font-semibold text-cream">{occasion}</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 rounded-xl bg-gradient-to-br from-gold/12 to-transparent p-4 text-[13px] leading-relaxed text-cream/75">
            Every reservation is reviewed by our host team and confirmed personally. Large parties (10+) are
            seated with a set mesob menu — we&apos;ll call to design it with you.
          </div>
        </div>
      </Reveal>
    </div>
  );
}
