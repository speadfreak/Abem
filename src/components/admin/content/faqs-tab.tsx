"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { EmptyState } from "@/components/admin/page-header";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminFaq } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Form {
  question: string;
  answer: string;
  order: string;
  active: boolean;
}

export default function FaqsTab({ rows, onChanged }: { rows: AdminFaq[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<AdminFaq | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>({ question: "", answer: "", order: "0", active: true });
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ question: "", answer: "", order: String(rows.length), active: true });
    setOpen(true);
  }
  function openEdit(f: AdminFaq) {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, order: String(f.order), active: f.active });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      await apiFetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "faq",
          data: {
            id: editing?.id,
            question: form.question.trim(),
            answer: form.answer.trim(),
            order: Number(form.order) || 0,
            active: form.active,
          },
        }),
      });
      toast.success("FAQ saved");
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(f: AdminFaq) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/content?kind=faq&id=${encodeURIComponent(f.id)}`, { method: "DELETE" });
      toast.success("FAQ removed");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="btn-gold btn-sm !rounded-xl" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add FAQ
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<HelpCircle className="h-8 w-8" />} title="No FAQs yet" hint="Parking, fasting menu, group bookings — answer them once." />
      ) : (
        <div className="card-elevated rounded-2xl p-4">
          <Accordion type="single" collapsible className="w-full">
            {rows.map((f, i) => (
              <AccordionItem key={f.id} value={f.id} className="border-gold/10">
                <AccordionTrigger className="text-left text-sm text-cream hover:text-gold hover:no-underline">
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gold">{String(i + 1).padStart(2, "0")}</span>
                    {f.question}
                    {!f.active ? (
                      <span className="rounded-full border border-ember/40 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-red-300">Hidden</span>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <p className="whitespace-pre-line">{f.answer}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="h-7" onClick={() => openEdit(f)}>
                      <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 border-ember/40 text-red-300 hover:bg-ember/10" onClick={() => void remove(f)}>
                      <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-gold/20 bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "New FAQ"}</DialogTitle>
            <DialogDescription>Guests see these on the FAQ section.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="f-q">Question</Label>
              <Input id="f-q" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-a">Answer</Label>
              <Textarea id="f-a" rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="f-order">Order</Label>
                <Input id="f-order" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-cream">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} aria-label="Active" />
                Visible
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={busy || form.question.trim().length < 4 || form.answer.trim().length < 4} onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
