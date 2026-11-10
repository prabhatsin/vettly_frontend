"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationBell({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { unread } = useNotifications();
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";
  return (
    <Link
      href="/notifications"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-nav-active",
        className,
      )}
    >
      <Bell className="size-[18px]" strokeWidth={1.6} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-hero px-1 text-[0.7rem] font-semibold text-white tabular-nums">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

export function UnreadBadge() {
  const { unread } = useNotifications();
  if (unread === 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-hero px-1.5 text-[0.7rem] font-semibold text-white tabular-nums">
      {unread > 99 ? "99+" : unread}
    </span>
  );
}
