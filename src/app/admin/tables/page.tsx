"use client";

import React, { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Armchair, QrCode, Printer, RefreshCw, Copy, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { AdminTable, SettingsPayload } from "@/components/admin/types";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface QrTarget {
  table: AdminTable;
  dataUrl: string;
  url: string;
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);
  const [printSheet, setPrintSheet] = useState<QrTarget[] | null>(null);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<SettingsPayload>("/api/admin/settings");
      setTables(data.tables);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function tableUrl(token: string): string {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return `${origin}/menu?table=${token}`;
  }

  async function openQr(t: AdminTable) {
    try {
      const url = tableUrl(t.qrToken);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: "#1a0e05", light: "#ffffff" },
      });
      setQrTarget({ table: t, dataUrl, url });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function printAll() {
    setPrinting(true);
    try {
      const targets: QrTarget[] = [];
      for (const t of tables) {
        const url = tableUrl(t.qrToken);
        const dataUrl = await QRCode.toDataURL(url, { width: 360, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
        targets.push({ table: t, dataUrl, url });
      }
      setPrintSheet(targets);
      toast.info("Preparing print sheet…");
      setTimeout(() => {
        window.print();
        setPrinting(false);
      }, 250);
    } catch (err) {
      toast.error(errorMessage(err));
      setPrinting(false);
    }
  }

  function copyUrl(t: AdminTable) {
    const url = tableUrl(t.qrToken);
    void navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <PageHeader
        title="Tables & QR"
        subtitle="One QR per mesob — guests scan, order, and the ticket lands with the table label."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
            <Button className="btn-gold btn-sm !rounded-xl" disabled={printing || tables.length === 0} onClick={() => void printAll()}>
              {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Printer className="h-3.5 w-3.5" aria-hidden="true" />}
              Print all QR sheets
            </Button>
          </>
        }
      />

      {loading ? (
        <AdminSkeleton rows={6} />
      ) : tables.length === 0 ? (
        <EmptyState
          icon={<Armchair className="h-8 w-8" />}
          title="No dining tables yet"
          hint="Tables are created with the seed data or directly in the database."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => (
            <article
              key={t.id}
              className={cn(
                "card-elevated card-hover flex items-center gap-4 rounded-2xl p-4",
                !t.active && "opacity-55"
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                <Armchair className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-cream">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.seats} seats</p>
                <Badge variant="outline" className="mt-1 border-gold/30 text-[9px] uppercase tracking-widest text-gold">
                  {t.zone}
                </Badge>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button size="sm" variant="outline" className="h-8" onClick={() => void openQr(t)}>
                  <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                  QR
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => copyUrl(t)} title="Copy order link">
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Link
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* QR dialog */}
      <Dialog open={qrTarget !== null} onOpenChange={(o) => (o ? null : setQrTarget(null))}>
        <DialogContent className="max-w-sm border-gold/20 bg-card text-center">
          {qrTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Table {qrTarget.table.label}</DialogTitle>
                <DialogDescription>{qrTarget.table.zone} · {qrTarget.table.seats} seats</DialogDescription>
              </DialogHeader>
              { }
              <img src={qrTarget.dataUrl} alt={`QR code for table ${qrTarget.table.label}`} className="mx-auto h-64 w-64 rounded-xl bg-white p-2" />
              <p className="break-all text-[11px] text-muted-foreground">{qrTarget.url}</p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(qrTarget.url).then(() => toast.success("Link copied"));
                  }}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copy link
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={qrTarget.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Open
                  </a>
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Hidden print sheet */}
      {printSheet ? (
        <div className="print-area fixed left-[10000px] top-0 w-[760px] bg-white print:static print:left-0" aria-hidden="true">
          <div className="grid grid-cols-3 gap-4 p-4">
            {printSheet.map((t) => (
              <div key={t.table.id} className="print-card flex flex-col items-center gap-2 rounded-lg p-4 text-center">
                <LogoMark className="h-10 w-10" />
                <p className="text-lg font-bold text-black">Table {t.table.label}</p>
                { }
                <img src={t.dataUrl} alt={`QR code for table ${t.table.label}`} className="h-40 w-40" />
                <p className="text-xs font-semibold text-black">Scan to order</p>
                <p className="text-[10px] text-gray-600">Abem Restaurant · Addis Ababa</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
