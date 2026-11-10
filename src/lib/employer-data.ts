"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useLiveEvent } from "@/lib/events";
import type { CandidateRow, Job } from "@/lib/types";

/**
 * Applicants for several jobs at once (one request per job, in parallel).
 * Used for counts on the jobs list, and to find an application's job.
 */
export function useCandidatesForJobs(jobs: Job[] | undefined) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<{
    key: string;
    byJob: Record<string, CandidateRow[]>;
    error: ApiError | null;
  } | null>(null);
  const key = jobs ? `${jobs.map((j) => j.id).join(",")}#${nonce}` : null;

  useEffect(() => {
    if (!jobs) return;
    let cancelled = false;
    const requestKey = `${jobs.map((j) => j.id).join(",")}#${nonce}`;
    Promise.all(
      jobs.map((j) =>
        apiFetch<CandidateRow[]>(`/employer/jobs/${j.id}/candidates`).then((rows) => [j.id, rows] as const),
      ),
    )
      .then((pairs) => {
        if (!cancelled) setState({ key: requestKey, byJob: Object.fromEntries(pairs), error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState((prev) => ({
            key: requestKey,
            byJob: prev?.byJob ?? {},
            error: err instanceof ApiError ? err : new ApiError(0, String(err)),
          }));
      });
    return () => {
      cancelled = true;
    };
  }, [jobs, nonce]);

  useLiveEvent(() => setNonce((n) => n + 1));

  return {
    byJob: state?.byJob,
    error: state?.error ?? null,
    loading: !!jobs && !state,
    stale: state?.key !== key,
    reload: () => setNonce((n) => n + 1),
  };
}
