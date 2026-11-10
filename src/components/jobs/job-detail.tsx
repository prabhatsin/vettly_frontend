"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, FileUp, MapPin, Mic } from "lucide-react";
import { FormError } from "@/components/form-error";
import { Spinner } from "@/components/spinner";
import { StatusPill } from "@/components/status-pill";
import { ErrorState, Skeleton } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { APPLICATION_STATUS, EMPLOYMENT_LABEL, formatDate } from "@/lib/format";
import type { Application, Job } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

function ApplyCard({
  job,
  existing,
  onApplied,
}: {
  job: Job;
  existing: Application | undefined;
  onApplied: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  if (existing) {
    const meta = APPLICATION_STATUS[existing.status];
    return (
      <div className="rounded-3xl border border-border bg-card p-7 sm:p-8">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-brand-green" />
          <p className="font-semibold">You applied on {formatDate(existing.created_at)}</p>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          Status <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {existing.status === "applied" ? (
            <Link href={`/candidate/interview/${existing.id}`} className={buttonVariants({ size: "lg" })}>
              <Mic />
              Join interview
            </Link>
          ) : existing.status === "offered" ? (
            <Link href="/candidate/offers" className={buttonVariants({ size: "lg" })}>
              View offer
            </Link>
          ) : null}
          <Link href="/candidate/interviews" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            My applications
          </Link>
        </div>
      </div>
    );
  }

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setError("Please choose a PDF file.");
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    const form = new FormData();
    form.append("resume", file);
    try {
      await apiFetch<Application>(`/jobs/${job.id}/apply`, { method: "POST", formData: form });
      onApplied();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        onApplied();
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't send your application.");
      setSubmitting(false);
    }
  }

  return (
    <div id="apply" className="scroll-mt-24 rounded-3xl border border-border bg-card p-7 sm:p-8">
      <h2 className="text-[1.2rem] font-semibold">Apply for this role</h2>
      <p className="mt-1 text-[0.95rem] text-muted-foreground">
        Upload your résumé as a PDF. Your voice interview with Iris is ready as soon as you apply.
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-5 py-8 text-center transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          dragging ? "border-hero bg-table-head" : "border-border hover:bg-table-head",
        )}
      >
        <FileUp className="size-6 text-muted-foreground" strokeWidth={1.6} />
        {file ? (
          <>
            <span className="max-w-full truncate font-medium">{file.name}</span>
            <span className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB · click to change
            </span>
          </>
        ) : (
          <>
            <span className="font-medium">Choose your résumé</span>
            <span className="text-sm text-muted-foreground">PDF only · drag it here or click to browse</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </label>

      <div className="mt-5 flex flex-col gap-4">
        <FormError message={error} />
        <Button
          size="lg"
          onClick={submit}
          disabled={!file || submitting}
          className="w-full sm:w-auto sm:self-start"
        >
          {submitting && <Spinner />}
          {submitting ? "Sending…" : "Submit application"}
        </Button>
      </div>
    </div>
  );
}

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isCandidate = user?.role === "candidate";
  const job = useApi<Job>(`/jobs/${id}`, { live: false });
  const apps = useApi<Application[]>(isCandidate ? "/applications/mine" : null);
  const existing = apps.data?.find((a) => a.job_id === id);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Open roles
      </Link>

      {job.loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-6 h-64" />
        </div>
      ) : job.error ? (
        <ErrorState
          message={
            job.error.status === 404 ? "This role doesn't exist or is no longer open." : job.error.message
          }
          onRetry={job.error.status === 404 ? undefined : job.reload}
        />
      ) : job.data ? (
        <>
          <div>
            <h1 className="font-serif text-[2.6rem] leading-[1.05] sm:text-[3.4rem]">{job.data.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
              {job.data.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {job.data.location}
                </span>
              )}
              <span>{EMPLOYMENT_LABEL[job.data.employment_type]}</span>
              <span>Posted {formatDate(job.data.created_at)}</span>
              {!job.data.is_active && <StatusPill tone="gray">Closed</StatusPill>}
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-3xl border border-border bg-card p-7 sm:p-8">
              <p className="caption text-muted-foreground">About the role</p>
              <p className="mt-4 leading-relaxed whitespace-pre-line">{job.data.description}</p>
            </section>
            <div className="flex flex-col gap-6 lg:sticky lg:top-8">
              {isCandidate ? (
                apps.loading ? (
                  <Skeleton className="h-64 rounded-3xl" />
                ) : (
                  <ApplyCard job={job.data} existing={existing} onApplied={apps.reload} />
                )
              ) : user?.id === job.data.employer_id ? (
                <div className="rounded-3xl border border-border bg-card p-7 sm:p-8">
                  <p className="font-semibold">This is your job</p>
                  <p className="mt-1 text-sm text-muted-foreground">See applicants and the ranking.</p>
                  <Link
                    href={`/employer/jobs/${job.data.id}`}
                    className={cn(buttonVariants({ size: "lg" }), "mt-5")}
                  >
                    Manage job
                  </Link>
                </div>
              ) : null}
              <div className="rounded-3xl border border-border bg-card p-7 text-sm text-muted-foreground sm:p-8">
                <p className="caption text-muted-foreground">How it works</p>
                <ol className="mt-4 flex list-decimal flex-col gap-2 pl-4">
                  <li>Apply with your résumé (PDF).</li>
                  <li>Take a voice interview with Iris, about 20 minutes, whenever you&apos;re ready.</li>
                  <li>The employer reviews your scored interview and may shortlist you or send an offer.</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
