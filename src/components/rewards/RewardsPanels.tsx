"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Cake, CheckCircle2, Copy, Gift, Search, Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/components/providers/SettingsProvider";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Rewards client panels: check points + join ── */

interface Member {
  name: string;
  phone: string;
  points: number;
  lifetime: number;
  tier: string;
  perk: string;
  nextTier: { name: string; at: number } | null;
  referralCode: string;
  birthday?: string | null;
}

const inputCls = "border-gold/20 bg-surface text-foreground placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/50";

function MemberCard({ member }: { member: Member }) {
  const { settings } = useSettings();
  const tiers = settings.loyalty.tiers;
  const tierIdx = tiers.findIndex((t) => t.name === member.tier);
  const progress = member.nextTier
    ? Math.min(100, Math.round((member.lifetime / member.nextTier.at) * 100))
    : 100;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(member.referralCode);
      toast.success("Referral code copied — send it to a friend");
    } catch {
      toast.error("Copy failed — long-press the code instead");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="ticket p-5"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Abem member</p>
          <p className="display-3 mt-1 text-cream">{member.name}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{member.phone}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {member.tier}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gold/15 bg-card p-3.5 text-center">
          <p className="text-2xl font-bold tabular-nums text-gold">{member.points.toLocaleString("en-US")}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Points to spend</p>
        </div>
        <div className="rounded-xl border border-gold/15 bg-card p-3.5 text-center">
          <p className="text-2xl font-bold tabular-nums text-cream">{member.lifetime.toLocaleString("en-US")}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Lifetime</p>
        </div>
      </div>

      {member.perk ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-cream/85">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <span><strong className="text-gold">{member.tier} perk:</strong> {member.perk}</span>
        </p>
      ) : null}

      {member.nextTier ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{tiers[Math.max(0, tierIdx)].name}</span>
            <span>{member.nextTier.at - member.lifetime} pts to {member.nextTier.name}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-card" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress to ${member.nextTier.name}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-ember via-gold to-[#f5d47a]"
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-gold">Top tier reached — the chef&apos;s table is yours.</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-card px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Referral code — {settings.loyalty.referralPoints} pts each way</p>
          <p className="truncate font-mono text-sm font-bold tracking-[0.12em] text-gold">{member.referralCode}</p>
        </div>
        <button
          onClick={copyRef}
          aria-label="Copy referral code"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold transition-all hover:bg-gold/25 focus-visible:outline-2 focus-visible:outline-gold active:scale-90"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {member.birthday ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cake className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> Birthday on file: {member.birthday} — {settings.loyalty.birthdayBonus} bonus points land that week.
        </p>
      ) : null}
    </motion.div>
  );
}

export default function RewardsPanels() {
  const { settings } = useSettings();

  /* Check points */
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.trim();
    if (!p) return;
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch(`/api/rewards?phone=${encodeURIComponent(p)}`);
      const data = (await res.json()) as { ok: boolean; member?: Member; error?: string };
      if (data.ok && data.member) {
        setMember(data.member);
      } else {
        setMember(null);
        setCheckError("No membership on that number yet — join below, it takes 20 seconds.");
      }
    } catch {
      setCheckError("Network hiccup — try again");
    } finally {
      setChecking(false);
    }
  };

  /* Join */
  const [name, setName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [referral, setReferral] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState<{ bonusNote?: string; existing?: boolean } | null>(null);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !joinPhone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    if (birthday && !/^\d{2}-\d{2}$/.test(birthday.trim())) {
      toast.error("Birthday must be MM-DD, like 08-14");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: joinPhone.trim(), birthday: birthday.trim() || undefined, referral: referral.trim() || undefined }),
      });
      const data = (await res.json()) as { ok: boolean; existing?: boolean; bonusNote?: string; error?: string };
      if (data.ok) {
        setJoined({ bonusNote: data.bonusNote, existing: data.existing });
        toast.success(data.existing ? "You are already a member — check your points" : "Selam! Welcome to Abem Rewards");
      } else {
        toast.error(data.error ?? "Could not join right now");
      }
    } catch {
      toast.error("Network hiccup — try again");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Check points */}
      <div className="card-elevated p-6 sm:p-8">
        <p className="eyebrow">Check my points</p>
        <h2 className="display-2 mt-3 text-cream">Your points, live.</h2>
        <form onSubmit={check} className="mt-6">
          <Label htmlFor="rp-phone" className="text-xs text-cream/80">Loyalty phone number</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="rp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="+251 911 234 567"
              className={cn("h-12 flex-1", inputCls)}
              aria-invalid={!!checkError}
            />
            <button type="submit" disabled={checking || !phone.trim()} className="btn-ghost btn-sm shrink-0 px-6 disabled:opacity-40" aria-label="Check my points">
              <Search className="h-4 w-4" aria-hidden="true" /> {checking ? "…" : "Check"}
            </button>
          </div>
        </form>
        {checkError ? (
          <p className="mt-4 text-sm text-ember" role="status">{checkError}</p>
        ) : null}
        {member ? <div className="mt-6">{<MemberCard member={member} />}</div> : null}
      </div>

      {/* Join */}
      <div className="card-elevated p-6 sm:p-8">
        <p className="eyebrow">Join Abem Rewards</p>
        <h2 className="display-2 mt-3 text-cream">Every birr comes back.</h2>
        {joined ? (
          <div className="ticket mt-6 p-5" role="status">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#8fd0a0]">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              {joined.existing ? "You are already on the list." : "Membership created — welcome to the table."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Show this number at the counter or add it at checkout to earn {settings.loyalty.pointsPer100} points per 100 ETB.
            </p>
            {joined.bonusNote ? <p className="mt-3 flex items-start gap-2 text-sm text-gold"><Cake className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {joined.bonusNote}</p> : null}
          </div>
        ) : (
          <form onSubmit={join} className="mt-6 grid gap-4">
            <div>
              <Label htmlFor="rj-name" className="text-xs text-cream/80">Full name</Label>
              <Input id="rj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Selam Tadesse" className={cn("mt-1.5 h-11", inputCls)} />
            </div>
            <div>
              <Label htmlFor="rj-phone" className="text-xs text-cream/80">Phone number</Label>
              <Input id="rj-phone" value={joinPhone} onChange={(e) => setJoinPhone(e.target.value)} type="tel" placeholder="+251 911 234 567" className={cn("mt-1.5 h-11", inputCls)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rj-bday" className="text-xs text-cream/80">Birthday <span className="text-gold/70">MM-DD, optional</span></Label>
                <Input id="rj-bday" value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="08-14" inputMode="numeric" className={cn("mt-1.5 h-11", inputCls)} />
              </div>
              <div>
                <Label htmlFor="rj-ref" className="text-xs text-cream/80">Referral code</Label>
                <Input id="rj-ref" value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="Optional" className={cn("mt-1.5 h-11 font-mono uppercase", inputCls)} />
              </div>
            </div>
            <button type="submit" disabled={joining} className="btn-gold mt-1 w-full disabled:cursor-wait disabled:opacity-60">
              <Users className="h-4 w-4" aria-hidden="true" /> {joining ? "Saving your seat…" : "Join Abem Rewards"}
            </button>
            <p className="text-xs text-muted-foreground">
              Membership date: {formatDateShort(new Date())} · points never expire while your number stays active.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
