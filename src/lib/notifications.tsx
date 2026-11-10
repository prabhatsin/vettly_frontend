"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLiveEvent } from "@/lib/events";
import type { AppNotification, LiveEvent, UserRole } from "@/lib/types";
import { useApi, type ApiResource } from "@/lib/use-api";

interface NotificationsValue extends ApiResource<AppNotification[]> {
  unread: number;
  markRead: (id: string) => Promise<void>;
  /** The latest live event, for the toast. */
  latest: LiveEvent | null;
  dismissLatest: () => void;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const resource = useApi<AppNotification[]>("/notifications");
  const [latest, setLatest] = useState<LiveEvent | null>(null);
  const { reload } = resource;

  useLiveEvent((event) => {
    if (event) setLatest(event);
  });

  // Hide the toast after a few seconds.
  useEffect(() => {
    if (!latest) return;
    const t = setTimeout(() => setLatest(null), 6000);
    return () => clearTimeout(t);
  }, [latest]);

  const markRead = useCallback(
    async (id: string) => {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      reload();
    },
    [reload],
  );

  const unread = resource.data?.filter((n) => !n.read_at).length ?? 0;

  return (
    <NotificationsContext.Provider
      value={{ ...resource, unread, markRead, latest, dismissLatest: () => setLatest(null) }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
}

/** Where a notification should take the user, from its kind and data. */
export function notificationHref(
  n: { kind: string; data: Record<string, string> },
  role: UserRole,
): string | null {
  if (role === "candidate") {
    if (n.kind === "shortlisted" || n.kind === "rejected") return "/candidate/interviews";
    if (n.kind.startsWith("offer")) return "/candidate/offers";
    return null;
  }
  // Employer notifications carry application_id only for some kinds.
  if (n.data.application_id) return `/employer/applications/${n.data.application_id}`;
  return "/employer";
}
