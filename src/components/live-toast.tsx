"use client";

import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { notificationHref, useNotifications } from "@/lib/notifications";

/** A short-lived toast for each live event. */
export function LiveToast() {
  const { user } = useAuth();
  const { latest, dismissLatest } = useNotifications();
  if (!latest || !user) return null;
  const href = notificationHref(latest, user.role);
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 left-4 z-50 flex items-start gap-3 rounded-2xl bg-hero p-4 text-white shadow-xl sm:left-auto sm:w-96"
    >
      <Bell className="mt-0.5 size-4 shrink-0 text-hero-check" strokeWidth={1.8} />
      <div className="min-w-0 flex-1 text-sm">
        <p>{latest.message}</p>
        {href && (
          <Link
            href={href}
            onClick={dismissLatest}
            className="mt-1 inline-block text-hero-muted underline underline-offset-4"
          >
            View
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={dismissLatest}
        aria-label="Dismiss"
        className="-m-1 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-hero-muted hover:bg-white/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
