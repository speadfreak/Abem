import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";

export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024; // 12MB
const ALLOWED_PREFIX = "image/";
const ALLOWED_VIDEO = "video/mp4";

export async function POST(req: Request) {
  const user = await requireAdmin(["OWNER", "MANAGER"]);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "File exceeds the 12MB limit" }, { status: 413 });
    }
    const mime = file.type;
    if (!mime.startsWith(ALLOWED_PREFIX) && mime !== ALLOWED_VIDEO) {
      return NextResponse.json(
        { ok: false, error: "Only images and MP4 video are allowed" },
        { status: 415 }
      );
    }

    const safeName =
      file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_")
        .slice(-80) || "file";
    const ext = path.extname(safeName) || (mime === ALLOWED_VIDEO ? ".mp4" : ".jpg");
    const base = safeName.slice(0, safeName.length - ext.length).slice(0, 60) || "upload";
    const fileName = `up-${Date.now()}-${base}${ext}`;

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, fileName), buffer);

    const url = `/uploads/${fileName}`;
    await logActivity(user.email, "uploaded", "Media", url, { type: mime, bytes: file.size });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[admin/upload]", err);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
