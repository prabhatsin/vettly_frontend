"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, MapPin, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { EMPLOYMENT_LABEL, timeAgo } from "@/lib/format";
import type { Application, Job } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export function JobsList() {
  const { user } = useAuth();
  const isCandidate = user?.role === "candidate";
  const jobs = useApi<Job[]>("/jobs");
  const apps = useApi<Application[]>(isCandidate ? "/applications/mine" : null);
  const [query, setQuery] = useState("");

  const applied = useMemo(() => new Set(apps.data?.map((a) => a.job_id)), [apps.data]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...(jobs.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (!q) return list;
    return list.filter((j) =>
      [j.title, j.location ?? "", j.description].some((f) => f.toLowerCase().includes(q)),
    );
  }, [jobs.data, query]);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <PageHeader
        title="Open roles"
        subtitle={
          isCandidate
            ? "Apply with your résumé, then interview with Iris whenever you're ready."
            : "Every open role on Vettly."
        }
      />

      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <h2 className="text-[1.2rem] font-semibold">
            {jobs.data ? `${jobs.data.length} open role${jobs.data.length === 1 ? "" : "s"}` : "Open roles"}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or location"
              aria-label="Search roles"
              className="rounded-full pl-10"
            />
          </div>
        </div>

        {jobs.loading ? (
          <LoadingRows rows={4} className="px-6 pb-6 sm:px-8" />
        ) : jobs.error ? (
          <ErrorState message={jobs.error.message} onRetry={jobs.reload} className="mx-6 mb-6 sm:mx-8" />
        ) : rows.length === 0 ? (
          <div className="border-t border-border">
            <EmptyState
              icon={Briefcase}
              title={query ? "No roles match your search" : "No open roles yet"}
              description={
                query
                  ? "Try a different word."
                  : "Check back soon. New roles appear here as employers post them."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {rows.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-table-head sm:flex-row sm:items-center sm:justify-between sm:px-8"
                >
                  <div className="min-w-0">
                    <p className="text-[1.05rem] font-medium">{job.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span>{EMPLOYMENT_LABEL[job.employment_type]}</span>
                      <span>Posted {timeAgo(job.created_at)}</span>
                    </p>
                  </div>
                  {isCandidate &&
                    (applied.has(job.id) ? (
                      <StatusPill tone="green">Applied</StatusPill>
                    ) : (
                      <span className="text-sm font-medium underline underline-offset-4">
                        View &amp; apply
                      </span>
                    ))}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
