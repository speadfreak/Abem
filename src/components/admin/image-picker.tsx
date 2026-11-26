"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/components/admin/api";

/**
 * URL input + upload button + preview thumb.
 * Upload posts multipart/form-data to /api/admin/upload and returns /uploads/<name>.
 */
export function ImagePicker({
  id,
  label,
  value,
  onChange,
  placeholder = "/images/… or https://…",
  accept = "image/*",
  compact = false,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data !== "object" || !("ok" in data) || data.ok !== true) {
        const msg =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : `Upload failed (${res.status})`;
        throw new Error(msg);
      }
      const url = (data as unknown as { url: string }).url;
      onChange(url);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-8 text-sm"
            autoComplete="off"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          title="Upload a file"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>
      {!compact && value ? (
        <div className="flex items-center gap-3">
          {value.toLowerCase().endsWith(".mp4") ? (
            <video src={value} className="h-16 w-24 rounded-lg border border-gold/20 object-cover" muted aria-label="Video preview" />
          ) : (
            <span className="relative block h-16 w-24 overflow-hidden rounded-lg border border-gold/20">
              <Image src={value} alt="Preview" fill sizes="96px" className="object-cover" unoptimized />
            </span>
          )}
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-gold hover:underline"
            onClick={() => onChange("")}
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}
