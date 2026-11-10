"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  FileText,
  LayoutGrid,
  LogOut,
  Mic,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationBell, UnreadBadge } from "@/components/notification-bell";
import { useAuth } from "@/lib/auth";
import type { UserResponse, UserRole } from "@/lib/types";
import { displayName, initials, roleHome } from "@/lib/user";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Active only on an exact match (used for role home pages). */
  exact?: boolean;
}

const NAV: Record<UserRole, NavItem[]> = {
  candidate: [
    { href: "/candidate", label: "Dashboard", icon: LayoutGrid, exact: true },
    { href: "/candidate/interviews", label: "Interviews", icon: Mic },
    { href: "/jobs", label: "Open roles", icon: Search },
    { href: "/candidate/offers", label: "Offers", icon: FileText },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
  employer: [
    { href: "/employer", label: "Jobs", icon: BriefcaseBusiness },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function UserChip({ user }: { user: UserResponse }) {
  const { logout } = useAuth();
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-hero text-sm font-semibold text-white"
      >
        {initials(user.email)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-medium" title={user.email}>
          {displayName(user.email)}
        </p>
        <p className="text-[0.8rem] capitalize text-muted-foreground">{user.role}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-nav-active hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function SidebarContent({ user, onNavigate }: { user: UserResponse; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col px-4 pt-7 pb-6 lg:px-6">
      <div className="flex items-center justify-between gap-2 pr-12 pl-3 lg:pr-0">
        <Logo href={roleHome(user.role)} />
        <NotificationBell onClick={onNavigate} className="hidden lg:inline-flex" />
      </div>
      <nav aria-label="Main" className="mt-8 flex flex-col gap-1.5">
        {NAV[user.role].map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-3.5 rounded-2xl px-4 text-[0.95rem] transition-colors",
                active
                  ? "bg-nav-active font-medium text-foreground"
                  : "text-foreground/75 hover:bg-nav-active/60 hover:text-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={1.6} />
              {item.label}
              {item.href === "/notifications" && <UnreadBadge />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 pt-6">
        <UserChip user={user} />
      </div>
    </div>
  );
}
