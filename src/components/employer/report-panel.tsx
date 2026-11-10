"use client";

import { useState } from "react";
import { AlertTriangle, Hourglass, Quote, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { StatusPill } from "@/components/status-pill";
import { ErrorState, Skeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { percent, RECOMMENDATION, timeAgo, type Tone } from "@/lib/format";
import type { ApplicationStatus, CriterionResult, CriterionStatus, ReportOut } from "@/lib/types";
import type { ApiResource } from "@/lib/use-api";

const CRITERION_STATUS: Record<CriterionStatus, { label: string; tone: Tone }> = {
  // ok: scored with quotes found in the transcript. unverified: no quote matched, so no score.
  // failed: the scorer errored, or the candidate didn't speak.
  ok: { label: "Evidence verified", tone: "green" },
  unverified: { label: "No verified evidence", tone: "amber" },
  failed: { label: "Couldn't score", tone: "red" },
};

function ScoreBar({ score }: { score: number | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
        {score !== null && (
          <div className="h-full rounded-full bg-brand-green" style={{ width: `${(score / 5) * 100}%` }} />
        )}
      </div>
      <span className="w-10 text-right font-semibold tabular-nums">{score ?? "—"}</span>
    </div>
  );
}

function CriterionCard({
  c,
  onEvidence,
}: {
  c: CriterionResult;
  onEvidence: (turn: number, quote: string) => void;
}) {
  const status = CRITERION_STATUS[c.status] ?? { label: c.status, tone: "gray" as const };
  return (
    <li className="flex flex-col gap-3 py-6 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{c.name}</h3>
          {c.weight !== 1 && <span className="text-xs text-muted-foreground">weight ×{c.weight}</span>}
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>
      <ScoreBar score={c.score} />
      {c.reason && <p className="text-[0.95rem] text-muted-foreground">{c.reason}</p>}
      {c.evidence.length > 0 && (
        <ul className="flex flex-col gap-2">
          {c.evidence.map((e, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onEvidence(e.turn, e.quote)}
                className="group flex w-full cursor-pointer items-start gap-2.5 rounded-2xl border border-border bg-table-head px-3.5 py-2.5 text-left text-[0.92rem] transition-colors hover:border-foreground/30 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
                <span className="flex-1 italic">“{e.quote}”</span>
                <span className="shrink-0 text-xs text-muted-foreground underline-offset-4 group-hover:underline">
                  Turn {e.turn}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function ReportPanel({
  applicationId,
  report,
  applicationStatus,
  onEvidence,
}: {
  applicationId: string;
  report: ApiResource<ReportOut>;
  applicationStatus: ApplicationStatus | undefined;
  onEvidence: (turn: number, quote: string) => void;
}) {
  const [rescoring, setRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState<string | null>(null);

  async function rescore() {
    setRescoring(true);
    setRescoreError(null);
    try {
      await apiFetch(`/employer/applications/${applicationId}/rescore`, { method: "POST" });
      report.reload();
    } catch (err) {
      setRescoreError(err instanceof Error ? err.message : "Couldn't re-run scoring.");
    } finally {
      setRescoring(false);
    }
  }

  const rescoreButton = (
    <Button variant="hero-outline" onClick={rescore} disabled={rescoring}>
      {rescoring ? <Spinner /> : <RefreshCw />}
      Re-run scoring
    </Button>
  );

  if (report.loading) return <Skeleton className="h-72 rounded-4xl" />;

  // 404: not scored yet.
  if (report.error?.status === 404 || (!report.data && !report.error)) {
    const waiting = applicationStatus === "applied";
    return (
      <section className="rounded-4xl bg-hero p-7 text-white sm:p-10">
        <p className="caption text-hero-caption">Interview report</p>
        <div className="mt-5 flex items-start gap-3">
          <Hourglass className="mt-1 size-6 shrink-0 text-hero-muted" strokeWidth={1.5} />
          <div>
            <h2 className="text-[1.6rem] leading-tight font-semibold">
              {waiting ? "Interview not taken yet" : "Not scored yet"}
            </h2>
            <p className="mt-2 max-w-lg text-hero-muted">
              {waiting
                ? "The candidate hasn't finished their interview with Iris. The report appears here once they do."
                : "Scoring starts automatically after the interview and usually takes a few minutes."}
            </p>
          </div>
        </div>
      </section>
    );
  }
  if (report.error && !report.data)
    return <ErrorState message={report.error.message} onRetry={report.reload} />;

  const out = report.data!;
  if (out.status === "pending") {
    return (
      <section className="rounded-4xl bg-hero p-7 text-white sm:p-10">
        <p className="caption text-hero-caption">Interview report</p>
        <div className="mt-5 flex items-center gap-3">
          <Spinner className="size-6 text-hero-muted" />
          <h2 className="text-[1.6rem] font-semibold">Scoring in progress…</h2>
        </div>
        <p className="mt-2 text-hero-muted">This page updates when it&apos;s done.</p>
      </section>
    );
  }
  if (out.status === "failed" || !out.report) {
    return (
      <section className="rounded-4xl bg-hero p-7 text-white sm:p-10">
        <p className="caption text-hero-caption">Interview report</p>
        <div className="mt-5 flex items-start gap-3">
          <AlertTriangle className="mt-1 size-6 shrink-0 text-amber-200" strokeWidth={1.5} />
          <div>
            <h2 className="text-[1.6rem] font-semibold">Scoring failed</h2>
            <p className="mt-2 max-w-lg text-hero-muted">
              {out.error ?? "Something went wrong while scoring."}
            </p>
          </div>
        </div>
        <div className="mt-6">{rescoreButton}</div>
        {rescoreError && <p className="mt-3 text-sm text-[#f6c1b9]">{rescoreError}</p>}
      </section>
    );
  }

  const r = out.report;
  const rec = RECOMMENDATION[r.recommendation] ?? { label: r.recommendation, tone: "gray" as const };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-8 rounded-4xl bg-hero p-7 text-white sm:p-10 md:grid-cols-[auto_1fr] md:gap-12">
        <div>
          <p className="caption text-hero-caption">Overall score</p>
          {r.overall_score !== null ? (
            <p className="mt-3 text-[4rem] leading-none font-semibold tabular-nums">
              {r.overall_score.toFixed(1)}
              <span className="text-2xl font-normal text-hero-caption"> / 5</span>
            </p>
          ) : (
            <p className="mt-3 max-w-[12rem] text-lg text-hero-muted">No score: not enough evidence</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone={rec.tone}>{rec.label}</StatusPill>
            <StatusPill tone="dark" className="border border-white/20">
              {percent(r.coverage)} covered
            </StatusPill>
          </div>
        </div>
        <div className="min-w-0">
          <p className="caption text-hero-caption">Iris&apos;s advice</p>
          <p className="mt-3 text-[1.05rem] leading-relaxed">{r.advice_note || "No advice note."}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {rescoreButton}
            <span className="text-sm text-hero-caption">Scored {timeAgo(out.updated_at)}</span>
          </div>
          {rescoreError && <p className="mt-3 text-sm text-[#f6c1b9]">{rescoreError}</p>}
        </div>
      </section>

      {(r.strengths.length > 0 || r.concerns.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border bg-card p-7">
            <h2 className="flex items-center gap-2 font-semibold">
              <ThumbsUp className="size-4 text-brand-green" /> Strengths
            </h2>
            {r.strengths.length ? (
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[0.95rem]">
                {r.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">None noted.</p>
            )}
          </section>
          <section className="rounded-3xl border border-border bg-card p-7">
            <h2 className="flex items-center gap-2 font-semibold">
              <ThumbsDown className="size-4 text-pill-red-foreground" /> Concerns
            </h2>
            {r.concerns.length ? (
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[0.95rem]">
                {r.concerns.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">None noted.</p>
            )}
          </section>
        </div>
      )}

      <section className="rounded-3xl border border-border bg-card p-7 sm:p-8">
        <h2 className="text-[1.2rem] font-semibold">Criteria</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Scores are 1 to 5. Click a quote to see it in the transcript.
        </p>
        {r.criteria.length ? (
          <ul className="mt-6 divide-y divide-border">
            {r.criteria.map((c) => (
              <CriterionCard key={c.key} c={c} onEvidence={onEvidence} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No criteria in this report.</p>
        )}
      </section>
    </div>
  );
}
