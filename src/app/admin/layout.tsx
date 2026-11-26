"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ReceiptText,
  CalendarCheck,
  UtensilsCrossed,
  Newspaper,
  Images,
  Inbox,
  QrCode,
  Settings,
  ScrollText,
  Menu as MenuIcon,
  LogOut,
  Flame,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/components/admin/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/content", label: "Content", icon: Newspaper },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/tables", label: "Tables & QR", icon: QrCode },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/activity", label: "Activity", icon: ScrollText },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
            isActive(pathname, href)
              ? "bg-gold/12 text-gold shadow-[inset_2px_0_0_0_#e8a317]"
              : "text-muted-foreground hover:bg-elevated hover:text-cream"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function UserBlock({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  return (
    <div className="rounded-xl border border-gold/15 bg-elevated/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-cream">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Log out"
          title="Log out"
          onClick={onLogout}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-ember"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <Badge className="mt-2 border-gold/40 bg-gold/10 text-[10px] uppercase tracking-widest text-gold">
        {user.role}
      </Badge>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Checking session">
      <div className="flex flex-col items-center gap-4">
        <Flame className="h-10 w-10 animate-pulse-glow text-gold" aria-hidden="true" />
        <div className="skeleton-shimmer h-2 w-36 rounded-full" />
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Abem Control Room</p>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
      return;
    }
    let cancelled = false;
     
    setChecking(true);
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthorized");
        const data = (await res.json()) as { ok: boolean; user?: SessionUser };
        if (!data.ok || !data.user) throw new Error("unauthorized");
        return data.user;
      })
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [isLogin, pathname, router]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    toast.success("Logged out");
    router.push("/admin/login");
    router.refresh();
  }

  /* Login route renders bare — no shell chrome. */
  if (isLogin) {
    return (
      <>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  if (checking || !user) return <ShellSkeleton />;

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-center" richColors closeButton />

      {/* Fixed sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gold/10 bg-sidebar lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <LogoMark className="h-9 w-9" />
          <div className="leading-none">
            <p className="font-display text-lg font-semibold tracking-[0.18em] text-cream">ABEM</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.32em] text-gold/90">Control Room</p>
          </div>
        </div>
        <div className="hairline mx-4" aria-hidden="true" />
        <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
          <NavLinks pathname={pathname} />
        </div>
        <div className="px-3 pb-4">
          <UserBlock user={user} onLogout={() => void logout()} />
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Abem Admin · Designed by Joseph James
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gold/10 bg-sidebar/95 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <MenuIcon className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-gold/15 bg-sidebar p-0">
              <SheetHeader className="border-b border-gold/10 px-5 py-4 text-left">
                <SheetTitle className="flex items-center gap-3">
                  <LogoMark className="h-8 w-8" />
                  <span className="text-sm uppercase tracking-[0.25em] text-cream">Abem Admin</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex h-[calc(100%-5rem)] flex-col justify-between px-3 py-4">
                <NavLinks pathname={pathname} />
                <div className="px-1">
                  <UserBlock user={user} onLogout={() => void logout()} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cream">Abem Admin</span>
          </Link>
          <Badge className="border-gold/40 bg-gold/10 text-[10px] uppercase tracking-widest text-gold">
            {user.role}
          </Badge>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gold/10 py-4 text-center text-[10px] text-muted-foreground lg:hidden">
          Abem Admin · Designed by Joseph James
        </footer>
      </div>
    </div>
  );
}
