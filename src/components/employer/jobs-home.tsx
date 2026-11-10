"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, Plus, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FilterPills } from "@/components/filter-pills";
import { HomeGreeting } from "@/components/home-greeting";
import { JobFormDialog } from "@/components/employer/job-form-dialog";
import { StatusPill } from "@/components/status-pill";
import { EmptyState, ErrorState, LoadingRows, Skeleton } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useCandidatesForJobs } from "@/lib/employer-data";
import { EMPLOYMENT_LABEL, formatDate } from "@/lib/format";
import type { CandidateRow, Job } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

type Filter = "all" | "open" | "closed";

function counts(rows: CandidateRow[] | undefined) {
  const c = { total: 0, review: 0, shortlisted: 0, offered: 0, waiting: 0 };
  rows?.forEach((r) => {
    c.total++;
    if (r.application_status === "scored") c.review++;
    if (r.application_status === "shortlisted") c.shortlisted++;
    if (r.application_status === "offered") c.offered++;
    if (r.application_status === "applied" || r.application_status === "interviewed") c.waiting++;
  });
  return c;
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

export function EmployerJobsHome() {
  const jobs = useApi<Job[]>("/jobs/mine");
  const sorted = useMemo(
    () => [...(jobs.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [jobs.data],
  );
  const candidates = useCandidatesForJobs(jobs.data);
  const [filter, setFilter] = useState<Filter>("open");
  const [editing, setEditing] = useState<Job | "new" | null>(null);
  const [closing, setClosing] = useState<Job | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const open = sorted.filter((j) => j.is_active);
  const all = useMemo(() => counts(Object.values(candidates.byJob ?? {}).flat()), [candidates.byJob]);
  const rows = sorted.filter((j) =>
    filter === "all" ? true : filter === "open" ? j.is_active : !j.is_active,
  );

  // The hero highlights the open job with the most candidates waiting for review.
  const focus = useMemo(() => {
    if (!candidates.byJob) return open[0];
    return [...open].sort(
      (a, b) => counts(candidates.byJob?.[b.id]).review - counts(candidates.byJob?.[a.id]).review,
    )[0];
  }, [open, candidates.byJob]);
  const focusCounts = focus ? counts(candidates.byJob?.[focus.id]) : null;

  async function reopen(job: Job) {
    setRowError(null);
    try {
      await apiFetch(`/jobs/${job.id}`, { method: "PUT", body: { is_active: true } });
      jobs.reload();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Couldn't reopen the job.");
    }
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <HomeGreeting
        subtitle={
          jobs.loading
            ? " "
            : all.review > 0
              ? `${all.review} interview${all.review > 1 ? "s are" : " is"} scored and ready for your review.`
              : "Post a role, and Iris interviews and ranks every applicant for you."
        }
        action={
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus />
            Post a job
          </Button>
        }
      />

      {/* Hero */}
      {jobs.loading ? (
        <Skeleton className="h-[260px] rounded-4xl" />
      ) : jobs.error && !jobs.data ? (
        <ErrorState message={jobs.error.message} onRetry={jobs.reload} />
      ) : (
        <section className="grid gap-10 rounded-4xl bg-hero p-7 text-white sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:p-11">
          {focus ? (
            <div className="min-w-0">
              <p className="caption text-hero-caption">Needs your attention</p>
              <h2 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">
                {focus.title}
              </h2>
              <p className="mt-2 text-hero-muted">
                {[
                  focus.location,
                  EMPLOYMENT_LABEL[focus.employment_type],
                  `posted ${formatDate(focus.created_at)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/employer/jobs/${focus.id}`}
                  className={buttonVariants({ variant: "hero-primary", size: "lg" })}
                >
                  View ranked candidates
                </Link>
                <Button variant="hero-outline" size="lg" onClick={() => setEditing(focus)}>
                  Edit job
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="caption text-hero-caption">Get started</p>
              <h2 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">
                {sorted.length ? "No open jobs" : "Post your first job"}
              </h2>
              <p className="mt-2 max-w-md text-hero-muted">
                Candidates apply with a résumé and take a voice interview with Iris. You get a scored report
                and a ranking.
              </p>
              <Button variant="hero-primary" size="lg" className="mt-7" onClick={() => setEditing("new")}>
                <Plus />
                Post a job
              </Button>
            </div>
          )}
          {focus && (
            <div>
              <p className="caption text-hero-caption">Pipeline</p>
              <ul className="mt-4 flex flex-col divide-y divide-white/10">
                {[
                  ["Ready to review", focusCounts?.review],
                  ["Interview pending", focusCounts?.waiting],
                  ["Shortlisted", focusCounts?.shortlisted],
                  ["Offered", focusCounts?.offered],
                ].map(([label, n]) => (
                  <li key={label as string} className="flex items-center justify-between py-2.5">
                    <span className="text-hero-muted">{label}</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {candidates.loading ? "…" : ((n as number | undefined) ?? "—")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
        <StatCard label="Open jobs" value={open.length} loading={jobs.loading} />
        <StatCard
          label="Applicants"
          value={candidates.error ? "—" : all.total}
          loading={jobs.loading || candidates.loading}
        />
        <StatCard
          label="Ready to review"
          value={candidates.error ? "—" : all.review}
          loading={jobs.loading || candidates.loading}
        />
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex flex-col gap-4 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[1.2rem] font-semibold">My jobs</h2>
          <FilterPills<Filter>
            label="Filter jobs"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "open", label: "Open", count: open.length },
              { value: "closed", label: "Closed", count: sorted.length - open.length },
              { value: "all", label: "All", count: sorted.length },
            ]}
          />
        </div>
        {rowError && (
          <p role="alert" className="px-6 pb-4 text-sm text-pill-red-foreground sm:px-8">
            {rowError}
          </p>
        )}
        {jobs.loading ? (
          <LoadingRows rows={3} className="px-6 pb-6 sm:px-8" />
        ) : jobs.error && !jobs.data ? (
          <ErrorState message={jobs.error.message} onRetry={jobs.reload} className="mx-6 mb-6 sm:mx-8" />
        ) : rows.length === 0 ? (
          <div className="border-t border-border">
            <EmptyState
              icon={Briefcase}
              title={
                sorted.length === 0 ? "No jobs yet" : filter === "closed" ? "No closed jobs" : "No open jobs"
              }
              description={sorted.length === 0 ? "Post a job to start receiving applicants." : undefined}
              action={
                <Button variant="secondary" onClick={() => setEditing("new")}>
                  <Plus />
                  Post a job
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {rows.map((job) => {
              const c = counts(candidates.byJob?.[job.id]);
              return (
                <li
                  key={job.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/employer/jobs/${job.id}`}
                        className="text-[1.05rem] font-medium hover:underline"
                      >
                        {job.title}
                      </Link>
                      <StatusPill tone={job.is_active ? "green" : "gray"}>
                        {job.is_active ? "Open" : "Closed"}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[
                        job.location,
                        EMPLOYMENT_LABEL[job.employment_type],
                        `Posted ${formatDate(job.created_at)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm",
                        c.review ? "font-medium" : "text-muted-foreground",
                      )}
                    >
                      <Users className="size-4" strokeWidth={1.6} />
                      {candidates.loading ? "…" : `${c.total} applicant${c.total === 1 ? "" : "s"}`}
                      {c.review > 0 && ` · ${c.review} to review`}
                    </span>
                    <Link
                      href={`/employer/jobs/${job.id}`}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      Candidates
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditing(job)}
                      className="cursor-pointer text-sm underline underline-offset-4"
                    >
                      Edit
                    </button>
                    {job.is_active ? (
                      <button
                        type="button"
                        onClick={() => setClosing(job)}
                        className="cursor-pointer text-sm text-muted-foreground underline underline-offset-4"
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reopen(job)}
                        className="cursor-pointer text-sm underline underline-offset-4"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <JobFormDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        job={editing && editing !== "new" ? editing : undefined}
        onSaved={() => jobs.reload()}
      />
      <ConfirmDialog
        open={closing !== null}
        onOpenChange={(o) => !o && setClosing(null)}
        title="Close this job?"
        description={`"${closing?.title}" stops accepting applicants. Existing applicants and reports stay. You can reopen it later.`}
        confirmLabel="Close job"
        destructive
        onConfirm={async () => {
          if (!closing) return;
          await apiFetch(`/jobs/${closing.id}`, { method: "DELETE" });
          jobs.reload();
        }}
      />
    </div>
  );
}
