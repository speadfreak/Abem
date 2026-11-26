import { NextRequest, NextResponse } from "next/server";
import { verifyEdgeToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const PROTECTED = ["/admin", "/staff", "/kitchen", "/rider"];
const PUBLIC_ADMIN = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isLogin = pathname.startsWith(PUBLIC_ADMIN);
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isProtected && !isAdminApi) return NextResponse.next();
  if (isLogin || pathname === "/api/auth/login") return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifyEdgeToken(token) : null;

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = PUBLIC_ADMIN;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // API role gate: writing settings/content is OWNER/MANAGER territory.
  if (isAdminApi && ["PUT", "PATCH", "DELETE", "POST"].includes(req.method)) {
    const writeRestricted = ["/api/admin/settings", "/api/admin/export", "/api/admin/upload"];
    const restricted = writeRestricted.some((p) => pathname.startsWith(p));
    if (restricted && user.role === "STAFF") {
      return NextResponse.json({ ok: false, error: "Forbidden — insufficient role" }, { status: 403 });
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-abem-role", user.role);
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/kitchen/:path*", "/rider/:path*", "/api/admin/:path*"],
};
