"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CalendarDays, Inbox, Mic, Search } from "lucide-react";
import { ApplicationsTable } from "@/components/candidate/applications-table";
import { ReadinessList } from "@/components/candidate/readiness-list";
import { FilterPills } from "@/components/filter-pills";
import { HomeGreeting } from "@/components/home-greeting";
import { EmptyState, ErrorState, LoadingRows, Skeleton } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { type ApplicationWithJob, useMyApplications } from "@/lib/candidate-data";
import { EMPLOYMENT_LABEL, formatDate, interviewStage, timeAgo, type InterviewStage } from "@/lib/format";
import { notificationHref, useNotifications } from "@/lib/notifications";
import { useReadiness } from "@/lib/readiness";
import type { CandidateOffer } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

function NextInterviewCard({
  waiting,
  hasApplications,
}: {
  waiting: ApplicationWithJob[];
  hasApplications: boolean;
}) {
  const readiness = useReadiness();
  const next = waiting[0];

  return (
    <section
      aria-label="Next interview"
      className="grid gap-10 rounded-4xl bg-hero p-7 text-white sm:p-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12 lg:p-11"
    >
      <div className="min-w-0">
        <p className="caption text-hero-caption">Next interview</p>
        {next ? (
          <>
            <h2 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">
              {next.jobTitle}
            </h2>
            <p className="mt-2 text-hero-muted">
              {[next.job?.location, "Voice interview with Iris", "about 20 min"].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-5 flex items-center gap-3 text-[1.02rem]">
              <CalendarDays className="size-5 text-hero-muted" strokeWidth={1.6} />
              Applied {formatDate(next.created_at)} · start any time
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/candidate/interview/${next.id}`}
                className={buttonVariants({ variant: "hero-primary", size: "lg" })}
              >
                Join interview
              </Link>
              <Button variant="hero-outline" size="lg" onClick={readiness.runAll}>
                Test mic &amp; connection
              </Button>
            </div>
            {waiting.length > 1 && (
              <Link
                href="/candidate/interviews"
                className="mt-5 inline-block text-sm text-hero-muted underline underline-offset-4 hover:text-white"
              >
                {waiting.length - 1} more interview{waiting.length > 2 ? "s" : ""} waiting
              </Link>
            )}
          </>
        ) : (
          <>
            <h2 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">
              No interview waiting
            </h2>
            <p className="mt-2 max-w-md text-hero-muted">
              {hasApplications
                ? "You've finished every interview you applied for. Apply to another role to talk with Iris again."
                : "Apply to an open role with your résumé, and your voice interview with Iris will be ready here."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/jobs" className={buttonVariants({ variant: "hero-primary", size: "lg" })}>
                Browse open roles
              </Link>
              <Button variant="hero-outline" size="lg" onClick={readiness.runAll}>
                Test mic &amp; connection
              </Button>
            </div>
          </>
        )}
      </div>

      <div>
        <p className="caption text-hero-caption">Readiness</p>
        <div className="mt-4">
          <ReadinessList
            items={[
              {
                label: readiness.mic === "ok" ? "Microphone tested" : "Test microphone",
                state: readiness.mic,
                onClick: readiness.runMic,
              },
              { label: "Résumé uploaded", state: hasApplications },
              {
                label: "Quiet space confirmed",
                state: readiness.quiet,
                onClick: () => readiness.setQuiet(!readiness.quiet),
                hint: readiness.quiet ? undefined : "Tap to confirm",
              },
              {
                label: readiness.connection === "ok" ? "Connection checked" : "Run connection check",
                state: readiness.connection,
                onClick: readiness.runConnection,
              },
            ]}
          />
        </div>
        {readiness.message && (
          <p role="alert" className="mt-4 rounded-xl bg-white/8 px-3.5 py-2.5 text-sm text-[#f6c1b9]">
            {readiness.message}
          </p>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, loading }: { label: string; value: React.ReactNode; loading?: boolean }) {
  return (
    <div className="rounded-3xl border border-border bg-card px-7 py-6 sm:px-8 sm:py-7">
      <p className="text-[0.95rem] text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-12 w-16" />
      ) : (
        <p className="mt-2 text-[2.9rem] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      )}
    </div>
  );
}

function OpenRolesCard({
  applications,
  jobs,
  loading,
}: {
  applications: ApplicationWithJob[] | undefined;
  jobs: ReturnType<typeof useMyApplications>["jobs"];
  loading: boolean;
}) {
  const open = useMemo(() => {
    if (!jobs || !applications) return undefined;
    const applied = new Set(applications.map((a) => a.job_id));
    return jobs.filter((j) => !applied.has(j.id));
  }, [jobs, applications]);

  return (
    <section className="flex flex-col rounded-3xl border border-border bg-card p-7 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.2rem] font-semibold">Open roles</h2>
          <p className="mt-1 text-[0.95rem] text-muted-foreground">Roles you haven&apos;t applied to yet</p>
        </div>
        {open && open.length > 3 && (
          <Link href="/jobs" className="shrink-0 text-sm font-medium underline underline-offset-4">
            See all {open.length}
          </Link>
        )}
      </div>
      <div className="mt-5 border-t border-border">
        {loading || !open ? (
          <LoadingRows rows={3} className="pt-5" />
        ) : open.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No new roles right now"
            description="New openings will show up here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {open.slice(0, 3).map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block truncate text-[1.05rem] font-medium hover:underline"
                  >
                    {job.title}
                  </Link>
                  <p className="truncate text-[0.95rem] text-muted-foreground">
                    {[job.location, EMPLOYMENT_LABEL[job.employment_type]].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Link href={`/jobs/${job.id}#apply`} className={buttonVariants({ variant: "secondary" })}>
                  Apply
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function RecentUpdatesCard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useNotifications();
  return (
    <section className="flex flex-col rounded-3xl border border-border bg-card p-7 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.2rem] font-semibold">Recent updates</h2>
          <p className="mt-1 text-[0.95rem] text-muted-foreground">Shortlists, offers and decisions</p>
        </div>
        <Link href="/notifications" className="shrink-0 text-sm font-medium underline underline-offset-4">
          View all
        </Link>
      </div>
      <div className="mt-5 border-t border-border">
        {loading ? (
          <LoadingRows rows={3} className="pt-5" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} className="mt-5 border-0" />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No updates yet"
            description="You'll hear here when an employer acts on your application."
          />
        ) : (
          <ul className="divide-y divide-border">
            {data.slice(0, 4).map((n) => {
              const href = user ? notificationHref(n, user.role) : null;
              return (
                <li key={n.id} className="flex items-start gap-3 py-4">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-2 size-2 shrink-0 rounded-full",
                      n.read_at ? "bg-transparent" : "bg-brand-green",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link href={href} className="text-[0.95rem] hover:underline">
                        {n.message}
                      </Link>
                    ) : (
                      <p className="text-[0.95rem]">{n.message}</p>
                    )}
                    <p className="mt-0.5 text-sm text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

type HistoryFilter = "all" | InterviewStage;

function HistoryCard({
  applications,
  loading,
  error,
  reload,
}: {
  applications: ApplicationWithJob[] | undefined;
  loading: boolean;
  error: { message: string } | null;
  reload: () => void;
}) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const counts = useMemo(() => {
    const c = { all: 0, completed: 0, processing: 0, not_started: 0 };
    applications?.forEach((a) => {
      c.all++;
      c[interviewStage(a.status)]++;
    });
    return c;
  }, [applications]);
  const rows = applications?.filter((a) => filter === "all" || interviewStage(a.status) === filter);

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex flex-col gap-4 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-[1.2rem] font-semibold">Interview history</h2>
        <FilterPills<HistoryFilter>
          label="Filter interviews"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "completed", label: "Completed", count: counts.completed },
            { value: "processing", label: "Processing", count: counts.processing },
            { value: "not_started", label: "Not started", count: counts.not_started },
          ]}
        />
      </div>
      {loading ? (
        <LoadingRows rows={3} className="px-6 pb-6 sm:px-8" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} className="mx-6 mb-6 sm:mx-8" />
      ) : !rows || rows.length === 0 ? (
        <div className="border-t border-border">
          <EmptyState
            icon={Inbox}
            title={filter === "all" ? "No interviews yet" : "Nothing here"}
            description={
              filter === "all"
                ? "Apply to an open role to get your first interview with Iris."
                : "No interviews match this filter."
            }
            action={
              filter === "all" ? (
                <Link href="/jobs" className={buttonVariants({ variant: "secondary" })}>
                  Browse open roles
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ApplicationsTable applications={rows} mode="stage" />
      )}
    </section>
  );
}

export function CandidateDashboard() {
  const { applications, jobs, loading, error, reload } = useMyApplications();
  const offers = useApi<CandidateOffer[]>("/candidate/offers");

  const waiting = useMemo(
    // Oldest first: the interview that has been waiting longest is "next".
    () => (applications ?? []).filter((a) => a.status === "applied").reverse(),
    [applications],
  );
  const completed = applications?.filter((a) => a.status !== "applied").length ?? 0;
  const pendingOffers = offers.data?.filter((o) => o.status === "pending").length ?? 0;

  const subtitle = loading
    ? " "
    : waiting.length > 0
      ? `You have ${waiting.length} interview${waiting.length > 1 ? "s" : ""} ready to start. Iris will be ready when you are.`
      : "Find a role you like, apply with your résumé, and Iris will interview you.";

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <HomeGreeting
        subtitle={subtitle}
        action={
          <Link href="/jobs" className={buttonVariants({ size: "lg" })}>
            <Search />
            Browse open roles
          </Link>
        }
      />

      {loading ? (
        <Skeleton className="h-[340px] rounded-4xl" />
      ) : error && !applications ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : (
        <NextInterviewCard waiting={waiting} hasApplications={(applications?.length ?? 0) > 0} />
      )}

      <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
        <StatCard label="Interviews completed" value={completed} loading={loading} />
        <StatCard label="Applications" value={applications?.length ?? 0} loading={loading} />
        <StatCard
          label="Offers waiting"
          value={offers.error ? "—" : pendingOffers}
          loading={offers.loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OpenRolesCard applications={applications} jobs={jobs} loading={loading} />
        <RecentUpdatesCard />
      </div>

      <HistoryCard applications={applications} loading={loading} error={error} reload={reload} />

      {/* Live status hint for the interview that just ended. */}
      {applications?.some((a) => a.status === "interviewed") && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mic className="size-4" strokeWidth={1.6} />
          Interviews marked Processing are being scored. This page updates on its own.
        </p>
      )}
    </div>
  );
}
