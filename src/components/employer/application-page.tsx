"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, History } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { OfferDialog, OfferPanel } from "@/components/employer/offer-panel";
import { ReportPanel } from "@/components/employer/report-panel";
import { TranscriptPanel, type TranscriptHandle } from "@/components/employer/transcript-panel";
import { StatusPill } from "@/components/status-pill";
import { ErrorState, LoadingRows, Skeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useCandidatesForJobs } from "@/lib/employer-data";
import { APPLICATION_STATUS, formatDateTime } from "@/lib/format";
import type { ApplicationStatus, Job, Offer, Payment, ReplayOut, ReportOut, StatusEvent } from "@/lib/types";
import { useApi, type ApiResource } from "@/lib/use-api";
import { displayName } from "@/lib/user";

const REJECTABLE: ApplicationStatus[] = ["applied", "interviewed", "scored", "shortlisted"];

function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="action-note">
        Note <span className="font-normal text-muted-foreground">(optional, kept in the history)</span>
      </Label>
      <Textarea id="action-note" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function HistoryCard({ history }: { history: ApiResource<StatusEvent[]> }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-7 sm:p-8">
      <h2 className="flex items-center gap-2 text-[1.2rem] font-semibold">
        <History className="size-5" strokeWidth={1.6} /> Status history
      </h2>
      {history.loading ? (
        <LoadingRows rows={2} className="mt-5" />
      ) : history.error && !history.data ? (
        <ErrorState message={history.error.message} onRetry={history.reload} className="mt-5 border-0" />
      ) : !history.data?.length ? (
        <p className="mt-4 text-sm text-muted-foreground">No changes yet. The candidate has applied.</p>
      ) : (
        <ol className="relative mt-6 flex flex-col gap-6 border-l border-border pl-6">
          {[...history.data]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((h, i) => {
              const to = APPLICATION_STATUS[h.to_status as ApplicationStatus];
              return (
                <li key={i} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-hero ring-4 ring-card"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {APPLICATION_STATUS[h.from_status as ApplicationStatus]?.label ?? h.from_status} →
                    </span>
                    <StatusPill tone={to?.tone ?? "gray"}>{to?.label ?? h.to_status}</StatusPill>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {formatDateTime(h.created_at)} · by {h.actor_role}
                  </p>
                  {h.note && <p className="mt-1.5 text-[0.95rem]">“{h.note}”</p>}
                </li>
              );
            })}
        </ol>
      )}
    </section>
  );
}

export function EmployerApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const jobHint = useSearchParams().get("job");
  const transcript = useRef<TranscriptHandle>(null);

  // There's no "get application" endpoint for employers, so find it in the job's candidate list.
  const jobs = useApi<Job[]>("/jobs/mine");
  const searchJobs = useMemo(() => {
    if (!jobs.data) return undefined;
    const hinted = jobs.data.filter((j) => j.id === jobHint);
    return hinted.length ? hinted : jobs.data;
  }, [jobs.data, jobHint]);
  const candidates = useCandidatesForJobs(searchJobs);
  const byJob = candidates.byJob;
  const found =
    (searchJobs ?? [])
      .map((job) => ({ job, row: byJob?.[job.id]?.find((r) => r.application_id === id) }))
      .find((x): x is { job: Job; row: NonNullable<typeof x.row> } => !!x.row) ?? null;
  const status = found?.row.application_status;

  // Poll while scoring or a payment is pending: neither has its own live event.
  const [pollReport, setPollReport] = useState(false);
  const [pollPayment, setPollPayment] = useState(false);
  const report = useApi<ReportOut>(`/employer/applications/${id}/report`, {
    pollMs: pollReport ? 8000 : null,
  });
  const replay = useApi<ReplayOut>(`/employer/applications/${id}/replay`);
  const history = useApi<StatusEvent[]>(`/employer/applications/${id}/history`);
  const hasOfferStage = !!status && ["offered", "accepted", "declined"].includes(status);
  const offer = useApi<Offer>(hasOfferStage ? `/employer/applications/${id}/offer` : null);
  const payment = useApi<Payment>(offer.data ? `/employer/applications/${id}/offer/payment` : null, {
    pollMs: pollPayment ? 4000 : null,
  });

  const reportPending =
    report.data?.status === "pending" || (report.error?.status === 404 && status === "interviewed");
  if (reportPending !== pollReport) setPollReport(reportPending);
  const paymentPending = payment.data?.status === "pending";
  if (paymentPending !== pollPayment) setPollPayment(paymentPending);

  const [action, setAction] = useState<"shortlist" | "reject" | "offer" | null>(null);
  const [note, setNote] = useState("");

  function refreshAll() {
    candidates.reload();
    history.reload();
    offer.reload();
    report.reload();
  }

  async function move(kind: "shortlist" | "reject") {
    await apiFetch(`/employer/applications/${id}/${kind}`, {
      method: "POST",
      body: note.trim() ? { note: note.trim() } : {},
    });
    setNote("");
    refreshAll();
  }

  if (jobs.loading || (candidates.loading && !found)) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-14 w-1/2" />
        <Skeleton className="h-72 rounded-4xl" />
      </div>
    );
  }
  if (jobs.error && !jobs.data) return <ErrorState message={jobs.error.message} onRetry={jobs.reload} />;
  if (candidates.error && !found)
    return <ErrorState message={candidates.error.message} onRetry={candidates.reload} />;
  if (!found) return <ErrorState message="This application doesn't exist or isn't for one of your jobs." />;

  const { job, row } = found;
  const meta = APPLICATION_STATUS[row.application_status];
  const final = ["accepted", "declined", "rejected"].includes(row.application_status);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/employer/jobs/${job.id}`}
        className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {job.title}
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[2.6rem] leading-[1.05] sm:text-[3.4rem]">
              {displayName(row.candidate_email)}
            </h1>
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </div>
          <p className="mt-3 break-all text-muted-foreground">
            {row.candidate_email} · applied for {job.title}
          </p>
        </div>
        {!final && (
          <div className="flex flex-wrap gap-2">
            {row.application_status === "scored" && (
              <Button onClick={() => setAction("shortlist")}>Shortlist</Button>
            )}
            {row.application_status === "shortlisted" && (
              <Button onClick={() => setAction("offer")}>Make offer</Button>
            )}
            {REJECTABLE.includes(row.application_status) && (
              <Button variant="secondary" onClick={() => setAction("reject")}>
                Reject
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <OfferPanel applicationId={id} offer={offer} payment={payment} />
          <ReportPanel
            applicationId={id}
            report={report}
            applicationStatus={row.application_status}
            onEvidence={(turn, quote) => transcript.current?.focus(turn, quote)}
          />
          <HistoryCard history={history} />
        </div>
        <TranscriptPanel
          ref={transcript}
          replay={replay}
          className="max-h-[70dvh] lg:sticky lg:top-8 lg:max-h-[calc(100dvh-4rem)]"
        />
      </div>

      <ConfirmDialog
        open={action === "shortlist"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Shortlist this candidate?"
        description="They're notified, and you can make them an offer next."
        confirmLabel="Shortlist"
        onConfirm={() => move("shortlist")}
      >
        <NoteField value={note} onChange={setNote} />
      </ConfirmDialog>
      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Reject this candidate?"
        description="They're told their application wasn't taken forward. This is final."
        confirmLabel="Reject"
        destructive
        onConfirm={() => move("reject")}
      >
        <NoteField value={note} onChange={setNote} />
      </ConfirmDialog>
      <OfferDialog
        open={action === "offer"}
        onOpenChange={(o) => !o && setAction(null)}
        applicationId={id}
        defaultTitle={job.title}
        onDone={refreshAll}
      />
    </div>
  );
}
