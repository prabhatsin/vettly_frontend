"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  BadgeCheck,
  CircleDollarSign,
  CircleX,
  Clock,
  FileText,
  Star,
  type LucideIcon,
} from "lucide-react";
import { FilterPills } from "@/components/filter-pills";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/spinner";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { formatDateTime, timeAgo } from "@/lib/format";
import { notificationHref, useNotifications } from "@/lib/notifications";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  shortlisted: Star,
  rejected: CircleX,
  offer: FileText,
  offer_funded: CircleDollarSign,
  offer_expired: Clock,
  offer_accepted: BadgeCheck,
  offer_declined: CircleX,
  payment_succeeded: CircleDollarSign,
  payment_failed: CircleX,
};

type Filter = "all" | "unread";

export function NotificationsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload, unread, markRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = (data ?? []).filter((n) => filter === "all" || !n.read_at);

  async function read(n: AppNotification) {
    if (n.read_at) return;
    setActionError(null);
    try {
      await markRead(n.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't mark it as read.");
    }
  }

  async function readAll() {
    setBusy(true);
    setActionError(null);
    try {
      for (const n of data ?? []) {
        if (!n.read_at) await markRead(n.id);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't mark everything as read.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up."}
        action={
          unread > 0 ? (
            <Button variant="secondary" size="lg" onClick={readAll} disabled={busy}>
              {busy && <Spinner />}
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <h2 className="text-[1.2rem] font-semibold">Updates</h2>
          <FilterPills<Filter>
            label="Filter notifications"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: data?.length },
              { value: "unread", label: "Unread", count: unread },
            ]}
          />
        </div>
        {actionError && (
          <div className="px-6 pb-4 sm:px-8">
            <FormError message={actionError} />
          </div>
        )}
        {loading ? (
          <LoadingRows rows={4} className="px-6 pb-6 sm:px-8" />
        ) : error && !data ? (
          <ErrorState message={error.message} onRetry={reload} className="mx-6 mb-6 sm:mx-8" />
        ) : rows.length === 0 ? (
          <div className="border-t border-border">
            <EmptyState
              icon={Bell}
              title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
              description={
                user?.role === "employer"
                  ? "You'll hear here when candidates respond to offers and payments are confirmed."
                  : "You'll hear here when an employer shortlists you or sends an offer."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {rows.map((n) => {
              const Icon = ICONS[n.kind] ?? Bell;
              const href = user ? notificationHref(n, user.role) : null;
              return (
                <li
                  key={n.id}
                  className={cn("flex items-start gap-4 px-6 py-5 sm:px-8", !n.read_at && "bg-table-head")}
                >
                  <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                    <Icon className="size-[18px]" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link href={href} onClick={() => read(n)} className="font-medium hover:underline">
                        {n.message}
                      </Link>
                    ) : (
                      <p className="font-medium">{n.message}</p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground" title={formatDateTime(n.created_at)}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read_at && (
                    <button
                      type="button"
                      onClick={() => read(n)}
                      className="shrink-0 cursor-pointer text-sm underline underline-offset-4 hover:text-muted-foreground"
                    >
                      Mark read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
