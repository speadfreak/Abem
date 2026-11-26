"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, ScrollText } from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminLog } from "@/components/admin/types";
import { formatDateShort, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function metaPreview(meta: unknown): string {
  if (meta === null || meta === undefined) return "—";
  const s = JSON.stringify(meta);
  return s.length > 60 ? `${s.slice(0, 57)}…` : s;
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminLog | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ ok: true; logs: AdminLog[] }>("/api/admin/activity");
      setLogs(data.logs);
    } catch (err) {
       
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Activity"
        subtitle="Every admin write, straight from the house log."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-8 w-8" />}
          title="No activity yet"
          hint="Reservations confirmed, dishes saved, settings changed — all of it appears here."
        />
      ) : (
        <div className="card-elevated overflow-x-auto rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="border-gold/10">
                <TableHead className="text-xs">When</TableHead>
                <TableHead className="text-xs">Actor</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs">Entity</TableHead>
                <TableHead className="hidden text-xs md:table-cell">Entity ID</TableHead>
                <TableHead className="hidden text-xs md:table-cell">Meta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer border-gold/5 hover:bg-elevated/60"
                  onClick={() => setSelected(l)}
                >
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateShort(l.createdAt)} {formatTime(l.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-xs text-cream">{l.actor}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gold/30 text-[10px] uppercase tracking-widest text-gold">
                      {l.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.entity}</TableCell>
                  <TableCell className="hidden max-w-32 truncate font-mono text-[11px] text-muted-foreground md:table-cell">
                    {l.entityId ?? "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate font-mono text-[11px] text-muted-foreground md:table-cell">
                    {metaPreview(l.meta)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(o) => (o ? null : setSelected(null))}>
        <DialogContent className="max-w-md border-gold/20 bg-card">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">
                  {selected.actor} · {selected.action}
                </DialogTitle>
                <DialogDescription>
                  {selected.entity} · {selected.entityId ?? "no id"} · {formatDateShort(selected.createdAt)}{" "}
                  {formatTime(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <pre className="max-h-56 overflow-auto rounded-xl border border-gold/10 bg-elevated/40 p-3 font-mono text-[11px] leading-relaxed text-cream no-scrollbar">
                {selected.meta ? JSON.stringify(selected.meta, null, 2) : "No metadata"}
              </pre>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
