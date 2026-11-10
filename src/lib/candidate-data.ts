"use client";

import { useMemo, useState } from "react";
import type { Application, Job } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export interface ApplicationWithJob extends Application {
  job: Job | null;
  jobTitle: string;
}

/**
 * The candidate's applications joined with job details. `GET /jobs` lists
 * only open jobs (closed ones 404 for candidates), so a missing job is shown
 * as a closed role.
 */
export function useMyApplications() {
  // interviewed -> scored has no live event, so poll while anything is being scored.
  const [poll, setPoll] = useState(false);
  const apps = useApi<Application[]>("/applications/mine", { pollMs: poll ? 15000 : null });
  const scoring = !!apps.data?.some((a) => a.status === "interviewed");
  if (scoring !== poll) setPoll(scoring);
  const jobs = useApi<Job[]>("/jobs");

  const merged = useMemo<ApplicationWithJob[] | undefined>(() => {
    if (!apps.data) return undefined;
    const byId = new Map((jobs.data ?? []).map((j) => [j.id, j]));
    return [...apps.data]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((a) => {
        const job = byId.get(a.job_id) ?? null;
        return { ...a, job, jobTitle: job?.title ?? (jobs.data ? "Closed role" : "…") };
      });
  }, [apps.data, jobs.data]);

  return {
    applications: merged,
    jobs: jobs.data,
    loading: apps.loading || (jobs.loading && !jobs.error),
    error: apps.error ?? jobs.error,
    reload: () => {
      apps.reload();
      jobs.reload();
    },
  };
}
