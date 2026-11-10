"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Plus, RefreshCw, SlidersHorizontal, Users, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormError } from "@/components/form-error";
import { JobFormDialog } from "@/components/employer/job-form-dialog";
import { Spinner } from "@/components/spinner";
import { StatusPill } from "@/components/status-pill";
import { EmptyState, ErrorState, LoadingRows, Skeleton } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  APPLICATION_STATUS,
  EMPLOYMENT_LABEL,
  formatDate,
  percent,
  RECOMMENDATION,
  timeAgo,
} from "@/lib/format";
import type { CandidateRow, Job, MatchRow } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { displayName } from "@/lib/user";
import { cn } from "@/lib/utils";

interface Ranked {
  application_id: string;
  email: string;
  match: MatchRow | null;
  row: CandidateRow | null;
}

function Score({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="font-semibold tabular-nums">
      {value.toFixed(1)}
      <span className="font-normal text-muted-foreground"> / 5</span>
    </span>
  );
}

function MatchBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-track sm:w-32">
        <div
          className="h-full rounded-full bg-brand-green"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="font-semibold tabular-nums">{percent(value)}</span>
    </div>
  );
}

function MustHavesEditor({ jobId, onSaved }: { jobId: string; onSaved: () => Promise<void> }) {
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!items.some((i) => i.toLowerCase() === v.toLowerCase())) setItems([...items, v]);
    setDraft("");
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await apiFetch<{ must_haves: string[] }>(`/employer/jobs/${jobId}/must-haves`, {
        method: "PUT",
        body: { must_haves: items },
      });
      setItems(res.must_haves);
      await onSaved();
      setSaved(res.must_haves.length ? "Saved and re-ranked." : "Must-haves cleared and re-ranked.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save must-haves.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-7 sm:p-8">
      <div className="flex items-start gap-3">
        <SlidersHorizontal className="mt-1 size-5 shrink-0 text-muted-foreground" strokeWidth={1.6} />
        <div>
          <h2 className="text-[1.2rem] font-semibold">Must-haves</h2>
          <p className="mt-1 text-[0.95rem] text-muted-foreground">
            Hard requirements, such as a skill or tool. Candidates missing one are flagged in the ranking.
            Saving replaces the current list.
          </p>
        </div>
      </div>
      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Python"
          aria-label="Add a must-have"
          className="rounded-full"
        />
        <Button type="submit" variant="secondary" disabled={!draft.trim()}>
          <Plus />
          Add
        </Button>
      </form>
      {items.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-muted pr-1 pl-3.5 text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => setItems(items.filter((i) => i !== item))}
                aria-label={`Remove ${item}`}
                className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-card"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-col gap-3">
        <FormError message={error} />
        {saved && <p className="text-sm text-pill-green-foreground">{saved}</p>}
        <Button onClick={save} disabled={busy} className="self-start">
          {busy && <Spinner />}
          Save and re-rank
        </Button>
      </div>
    </section>
  );
}

function CandidateCard({ c, rank, jobId }: { c: Ranked; rank: number | null; jobId: string }) {
  const status = c.row ? APPLICATION_STATUS[c.row.application_status] : null;
  const rec = c.row?.recommendation ? RECOMMENDATION[c.row.recommendation] : null;
  const href = `/employer/applications/${c.application_id}?job=${jobId}`;
  return (
    <li className="flex flex-col gap-4 px-6 py-6 sm:px-8 lg:flex-row lg:gap-8">
      <div className="flex min-w-0 items-start gap-4 lg:w-[38%]">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
            rank === 1 ? "bg-hero text-white" : "border border-border bg-card",
          )}
          aria-label={rank ? `Rank ${rank}` : "Not ranked"}
        >
          {rank ?? "–"}
        </span>
        <div className="min-w-0">
          <Link href={href} className="block truncate text-[1.05rem] font-medium hover:underline">
            {displayName(c.email)}
          </Link>
          <p className="truncate text-sm text-muted-foreground">{c.email}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {status && <StatusPill tone={status.tone}>{status.label}</StatusPill>}
            {rec && <StatusPill tone={rec.tone}>{rec.label}</StatusPill>}
            {c.match && !c.match.passed_filters && (
              <StatusPill tone="red">
                <AlertTriangle className="mr-1 size-3.5" />
                Missing a must-have
              </StatusPill>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Match</dt>
            <dd className="mt-1">
              {c.match ? (
                <MatchBar value={c.match.match_score} />
              ) : (
                <span className="text-muted-foreground">Not ranked yet</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Interview score</dt>
            <dd className="mt-1">
              {c.row?.report_status === "pending" ? (
                <span className="text-muted-foreground">Scoring…</span>
              ) : c.row?.report_status === "failed" ? (
                <span className="text-pill-red-foreground">Scoring failed</span>
              ) : (
                <Score value={c.row?.overall_score} />
              )}
            </dd>
          </div>
          {c.match?.similarity !== null && c.match?.similarity !== undefined && (
            <div>
              <dt className="text-muted-foreground">Résumé fit</dt>
              <dd className="mt-1 font-semibold tabular-nums">{percent(c.match.similarity)}</dd>
            </div>
          )}
        </dl>
        {c.match && c.match.reasons.length > 0 && (
          <div>
            <p className="caption text-muted-foreground">Why this rank</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[0.95rem]">
              {c.match.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="shrink-0 lg:pt-1">
        <Link href={href} className="text-sm font-medium underline underline-offset-4">
          {c.row?.report_status === "done" ? "View report" : "Open"}
        </Link>
      </div>
    </li>
  );
}

export function JobCandidates() {
  const { id } = useParams<{ id: string }>();
  const jobs = useApi<Job[]>("/jobs/mine");
  const job = jobs.data?.find((j) => j.id === id);
  const candidates = useApi<CandidateRow[]>(`/employer/jobs/${id}/candidates`);
  const matches = useApi<MatchRow[]>(`/employer/jobs/${id}/matches`);
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeError, setRecomputeError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);

  const ranked = useMemo(() => {
    const rows = new Map((candidates.data ?? []).map((r) => [r.application_id, r]));
    const out: Ranked[] = [...(matches.data ?? [])]
      .sort((a, b) => b.match_score - a.match_score)
      .map((m) => ({
        application_id: m.application_id,
        email: m.candidate_email,
        match: m,
        row: rows.get(m.application_id) ?? null,
      }));
    const seen = new Set(out.map((r) => r.application_id));
    const unranked: Ranked[] = (candidates.data ?? [])
      .filter((r) => !seen.has(r.application_id))
      .map((r) => ({ application_id: r.application_id, email: r.candidate_email, match: null, row: r }));
    return { ranked: out, unranked };
  }, [candidates.data, matches.data]);

  async function recompute() {
    setRecomputing(true);
    setRecomputeError(null);
    try {
      await apiFetch<MatchRow[]>(`/employer/jobs/${id}/matches/recompute`, { method: "POST" });
      matches.reload();
      candidates.reload();
    } catch (err) {
      setRecomputeError(err instanceof Error ? err.message : "Couldn't refresh the ranking.");
    } finally {
      setRecomputing(false);
    }
  }

  async function reopen() {
    await apiFetch(`/jobs/${id}`, { method: "PUT", body: { is_active: true } });
    jobs.reload();
  }

  const top = ranked.ranked[0];
  const lastComputed = matches.data?.reduce<string | null>(
    (acc, m) => (!acc || m.computed_at > acc ? m.computed_at : acc),
    null,
  );
  const loadingList = candidates.loading || matches.loading;
  const listError =
    candidates.error && !candidates.data
      ? candidates.error
      : matches.error && !matches.data
        ? matches.error
        : null;

  if (jobs.loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="h-64 rounded-4xl" />
      </div>
    );
  }
  if (jobs.error && !jobs.data) return <ErrorState message={jobs.error.message} onRetry={jobs.reload} />;
  if (!job) return <ErrorState message="This job doesn't exist or isn't yours." />;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <Link
        href="/employer"
        className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        My jobs
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[2.6rem] leading-[1.05] sm:text-[3.4rem]">{job.title}</h1>
            <StatusPill tone={job.is_active ? "green" : "gray"}>
              {job.is_active ? "Open" : "Closed"}
            </StatusPill>
          </div>
          <p className="mt-3 text-muted-foreground">
            {[job.location, EMPLOYMENT_LABEL[job.employment_type], `Posted ${formatDate(job.created_at)}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Link href={`/employer/jobs/${id}/rubric`} className={buttonVariants({ variant: "secondary" })}>
            Rubric
          </Link>
          {job.is_active ? (
            <Button variant="secondary" onClick={() => setClosing(true)}>
              Close job
            </Button>
          ) : (
            <Button variant="secondary" onClick={reopen}>
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Hero: the top match */}
      {loadingList ? (
        <Skeleton className="h-56 rounded-4xl" />
      ) : (
        <section className="grid gap-8 rounded-4xl bg-hero p-7 text-white sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:p-11">
          {top ? (
            <>
              <div className="min-w-0">
                <p className="caption text-hero-caption">Top match</p>
                <h2 className="mt-5 truncate text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">
                  {displayName(top.email)}
                </h2>
                <p className="mt-2 truncate text-hero-muted">{top.email}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href={`/employer/applications/${top.application_id}?job=${id}`}
                    className={buttonVariants({ variant: "hero-primary", size: "lg" })}
                  >
                    {top.row?.report_status === "done" ? "View report" : "Open application"}
                  </Link>
                  <Button variant="hero-outline" size="lg" onClick={recompute} disabled={recomputing}>
                    {recomputing ? <Spinner /> : <RefreshCw />}
                    Refresh ranking
                  </Button>
                </div>
              </div>
              <div>
                <p className="caption text-hero-caption">Match score</p>
                <p className="mt-3 text-[3.5rem] leading-none font-semibold tabular-nums">
                  {percent(top.match!.match_score)}
                </p>
                <ul className="mt-4 flex flex-col gap-1.5 text-sm text-hero-muted">
                  {top.match!.reasons.slice(0, 3).map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="lg:col-span-2">
              <p className="caption text-hero-caption">Ranking</p>
              <h2 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-tight">
                {candidates.data?.length ? "Not ranked yet" : "No applicants yet"}
              </h2>
              <p className="mt-2 max-w-lg text-hero-muted">
                {candidates.data?.length
                  ? "Build the ranking from résumés and interview scores. Refresh it any time new interviews are scored."
                  : "Once candidates apply and interview with Iris, they're ranked here with the reasons for each rank."}
              </p>
              {!!candidates.data?.length && (
                <Button
                  variant="hero-primary"
                  size="lg"
                  className="mt-7"
                  onClick={recompute}
                  disabled={recomputing}
                >
                  {recomputing ? <Spinner /> : <RefreshCw />}
                  Build ranking
                </Button>
              )}
            </div>
          )}
          {recomputeError && <p className="text-sm text-[#f6c1b9] lg:col-span-2">{recomputeError}</p>}
        </section>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <h2 className="text-[1.2rem] font-semibold">Ranked candidates</h2>
              {lastComputed && (
                <p className="mt-1 text-sm text-muted-foreground">Ranked {timeAgo(lastComputed)}</p>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={recompute}
              disabled={recomputing || !candidates.data?.length}
            >
              {recomputing ? <Spinner /> : <RefreshCw />}
              Refresh ranking
            </Button>
          </div>
          {loadingList ? (
            <LoadingRows rows={3} className="px-6 pb-6 sm:px-8" />
          ) : listError ? (
            <ErrorState
              message={listError.message}
              onRetry={() => {
                candidates.reload();
                matches.reload();
              }}
              className="mx-6 mb-6 sm:mx-8"
            />
          ) : ranked.ranked.length + ranked.unranked.length === 0 ? (
            <div className="border-t border-border">
              <EmptyState
                icon={Users}
                title="No applicants yet"
                description="Share the role. Applicants appear here as soon as they apply."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {ranked.ranked.map((c, i) => (
                <CandidateCard key={c.application_id} c={c} rank={i + 1} jobId={id} />
              ))}
              {ranked.unranked.length > 0 && (
                <li className="bg-table-head px-6 py-3 text-sm text-muted-foreground sm:px-8">
                  Not in the ranking yet. Refresh the ranking to include them.
                </li>
              )}
              {ranked.unranked.map((c) => (
                <CandidateCard key={c.application_id} c={c} rank={null} jobId={id} />
              ))}
            </ul>
          )}
        </section>

        <MustHavesEditor
          jobId={id}
          onSaved={async () => {
            await apiFetch(`/employer/jobs/${id}/matches/recompute`, { method: "POST" });
            matches.reload();
          }}
        />
      </div>

      <JobFormDialog open={editing} onOpenChange={setEditing} job={job} onSaved={() => jobs.reload()} />
      <ConfirmDialog
        open={closing}
        onOpenChange={setClosing}
        title="Close this job?"
        description="It stops accepting applicants. Existing applicants and reports stay. You can reopen it later."
        confirmLabel="Close job"
        destructive
        onConfirm={async () => {
          await apiFetch(`/jobs/${id}`, { method: "DELETE" });
          jobs.reload();
        }}
      />
    </div>
  );
}
