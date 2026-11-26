"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Inbox as InboxIcon,
  Mail,
  Download,
  Trash2,
  RefreshCw,
  Users,
  Briefcase,
  Dot,
} from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminApplication, AdminMessage, AdminSubscriber, MessagesPayload } from "@/components/admin/types";
import { formatTime, formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function AdminMessagesPage() {
  const [data, setData] = useState<MessagesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<AdminMessage | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<MessagesPayload>("/api/admin/messages");
      setData(d);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(m: AdminMessage, read: boolean) {
    try {
      await apiFetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, read }),
      });
      setData((prev) =>
        prev ? { ...prev, messages: prev.messages.map((x) => (x.id === m.id ? { ...x, read } : x)) } : prev
      );
      toast.success(read ? "Marked read" : "Marked unread");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove(kind: "message" | "subscriber", id: string) {
    try {
      await apiFetch(`/api/admin/messages?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      toast.success("Deleted");
      setSelected(null);
      void load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const messages = data?.messages.filter((m) => (unreadOnly ? !m.read : true)) ?? [];
  const unreadCount = data?.messages.filter((m) => !m.read).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Messages"
        subtitle="Inbox, newsletter list and job applications — the voice of the house."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={6} />
      ) : data ? (
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-elevated/60 p-1">
            <TabsTrigger value="inbox">
              Inbox
              {unreadCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-ember px-1.5 py-0.5 text-[9px] font-bold text-cream">{unreadCount}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter · {data.subscribers.length}</TabsTrigger>
            <TabsTrigger value="applications">Applications · {data.applications.length}</TabsTrigger>
          </TabsList>

          {/* Inbox */}
          <TabsContent value="inbox" className="space-y-3">
            <label className="flex w-fit items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} aria-label="Show unread only" />
              Unread only
            </label>

            {messages.length === 0 ? (
              <EmptyState icon={<InboxIcon className="h-8 w-8" />} title="Inbox zero" hint="Contact form messages land here." />
            ) : (
              <ul className="space-y-2">
                {messages.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(m)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                        m.read
                          ? "border-gold/10 bg-elevated/40 hover:border-gold/30"
                          : "border-gold/30 bg-gold/5 hover:border-gold/60"
                      )}
                    >
                      {!m.read ? <Dot className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" /> : <span className="w-5 shrink-0" />}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-sm", m.read ? "text-cream/80" : "font-semibold text-cream")}>
                            {m.subject}
                          </span>
                          {!m.read ? (
                            <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gold">New</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {m.name} · {m.email}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(m.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* Newsletter */}
          <TabsContent value="newsletter" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-cream">{data.subscribers.length}</span> subscribers on the buna list.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/admin/newsletter-csv", "_blank")}
                disabled={data.subscribers.length === 0}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
            {data.subscribers.length === 0 ? (
              <EmptyState icon={<Users className="h-8 w-8" />} title="No subscribers yet" hint="The newsletter signup feeds this list." />
            ) : (
              <div className="card-elevated overflow-x-auto rounded-2xl">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/10">
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Joined</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.subscribers.map((s: AdminSubscriber) => (
                      <TableRow key={s.id} className="border-gold/5">
                        <TableCell className="text-xs text-cream">{s.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateShort(s.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-ember" aria-label={`Remove ${s.email}`} onClick={() => void remove("subscriber", s.id)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications" className="space-y-3">
            {data.applications.length === 0 ? (
              <EmptyState icon={<Briefcase className="h-8 w-8" />} title="No applications yet" hint="Candidates from the careers page appear here." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.applications.map((a: AdminApplication) => (
                  <article key={a.id} className="card-elevated rounded-2xl p-4">
                    <p className="text-sm font-semibold text-cream">{a.name}</p>
                    <p className="text-xs text-gold">{a.opening ?? "General application"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.email} · {a.phone}</p>
                    {a.cover ? <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{a.cover}</p> : null}
                    <p className="mt-2 text-[10px] text-muted-foreground">{formatDateShort(a.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      {/* Message detail */}
      <Dialog open={selected !== null} onOpenChange={(o) => (o ? null : setSelected(null))}>
        <DialogContent className="max-w-lg border-gold/20 bg-card">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{selected.subject}</DialogTitle>
                <DialogDescription>
                  {selected.name} · {selected.email}
                  {selected.phone ? ` · ${selected.phone}` : ""}
                </DialogDescription>
              </DialogHeader>
              <p className="max-h-64 overflow-y-auto whitespace-pre-line rounded-xl border border-gold/10 bg-elevated/40 p-3 text-sm text-cream no-scrollbar">
                {selected.message}
              </p>
              <p className="text-[10px] text-muted-foreground">{formatDateShort(selected.createdAt)} {formatTime(selected.createdAt)}</p>
              <DialogFooter className="flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void markRead(selected, !selected.read)}
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {selected.read ? "Mark unread" : "Mark read"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}>
                    Reply by email
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-ember/40 text-red-300 hover:bg-ember/10"
                  onClick={() => void remove("message", selected.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
