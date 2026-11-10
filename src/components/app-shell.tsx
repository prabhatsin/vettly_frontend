"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, RefreshCw, WifiOff, X } from "lucide-react";
import { SidebarContent } from "@/components/app-sidebar";
import { LiveToast } from "@/components/live-toast";
import { NotificationBell } from "@/components/notification-bell";
import { EventsProvider } from "@/lib/events";
import { NotificationsProvider } from "@/lib/notifications";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import { roleHome } from "@/lib/user";

/** Which role a path belongs to, or null when any signed-in user may see it. */
function roleForPath(pathname: string): UserRole | null {
  if (pathname === "/candidate" || pathname.startsWith("/candidate/")) return "candidate";
  if (pathname === "/employer" || pathname.startsWith("/employer/")) return "employer";
  if (pathname.startsWith("/pay/")) return "employer";
  return null;
}

export function ShellSkeleton() {
  return (
    <div className="min-h-dvh lg:pl-[300px]" aria-busy="true" aria-label="Loading">
      <aside className="fixed inset-y-0 left-0 hidden w-[300px] border-r border-border lg:block">
        <div className="flex flex-col gap-3 px-6 pt-7">
          <div className="h-9 w-32 animate-pulse rounded-xl bg-nav-active" />
          <div className="mt-6 h-12 animate-pulse rounded-2xl bg-nav-active" />
          <div className="h-12 animate-pulse rounded-2xl bg-nav-active/60" />
          <div className="h-12 animate-pulse rounded-2xl bg-nav-active/60" />
        </div>
      </aside>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
        <div className="h-14 w-72 max-w-full animate-pulse rounded-2xl bg-nav-active" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded-lg bg-nav-active/70" />
        <div className="mt-10 h-56 animate-pulse rounded-4xl bg-nav-active" />
      </div>
    </div>
  );
}

function SessionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <WifiOff className="mx-auto size-8 text-muted-foreground" strokeWidth={1.6} />
        <h1 className="mt-4 text-lg font-semibold">We couldn&apos;t load your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-6" onClick={onRetry}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, error, retry } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const requiredRole = roleForPath(pathname);
  const wrongRole = !!user && requiredRole !== null && requiredRole !== user.role;

  useEffect(() => {
    if (status === "anon") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (user && wrongRole) {
      router.replace(roleHome(user.role));
    }
  }, [status, user, wrongRole, pathname, router]);

  // Close the drawer with Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  if (error) return <SessionError message={error} onRetry={retry} />;
  if (status !== "authed" || !user || wrongRole) return <ShellSkeleton />;

  return (
    <EventsProvider>
      <NotificationsProvider>
        <div className="min-h-dvh lg:pl-[300px]">
          {/* Desktop sidebar */}
          <aside className="fixed inset-y-0 left-0 hidden w-[300px] border-r border-border bg-background lg:block">
            <SidebarContent user={user} />
          </aside>

          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
            <Logo href={roleHome(user.role)} />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card"
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav"
              >
                <Menu className="size-5" strokeWidth={1.6} />
              </button>
            </div>
          </header>

          {/* Mobile drawer */}
          {drawerOpen && (
            <div className="fixed inset-0 z-40 lg:hidden" id="mobile-nav">
              <div className="absolute inset-0 bg-hero/30" onClick={() => setDrawerOpen(false)} aria-hidden />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="absolute inset-y-0 left-0 w-[min(300px,85vw)] bg-background shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="absolute top-6 right-4 inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-nav-active"
                  aria-label="Close menu"
                >
                  <X className="size-5" strokeWidth={1.6} />
                </button>
                <SidebarContent user={user} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          )}

          <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-8 lg:px-12 lg:py-14">{children}</main>
          <LiveToast />
        </div>
      </NotificationsProvider>
    </EventsProvider>
  );
}
