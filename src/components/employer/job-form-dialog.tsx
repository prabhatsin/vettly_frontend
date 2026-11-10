"use client";

import { useState } from "react";
import { FormError } from "@/components/form-error";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { EMPLOYMENT_LABEL } from "@/lib/format";
import type { EmploymentType, Job, JobCreate } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES = Object.keys(EMPLOYMENT_LABEL) as EmploymentType[];

function JobForm({
  job,
  onSaved,
  onCancel,
}: {
  job?: Job;
  onSaved: (job: Job) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(job?.title ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [location, setLocation] = useState(job?.location ?? "");
  const [type, setType] = useState<EmploymentType>(job?.employment_type ?? "full_time");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const t = title.trim();
    const d = description.trim();
    if (t.length < 3) return setError("Title must be at least 3 characters.");
    if (d.length < 10) return setError("Description must be at least 10 characters.");
    setBusy(true);
    setError(null);
    const body: JobCreate = {
      title: t,
      description: d,
      location: location.trim() || null,
      employment_type: type,
    };
    try {
      const saved = job
        ? await apiFetch<Job>(`/jobs/${job.id}`, { method: "PUT", body })
        : await apiFetch<Job>("/jobs", { method: "POST", body });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the job.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="job-title">Title</Label>
        <Input
          id="job-title"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Backend Engineer"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="job-location">
          Location <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="job-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Remote, Bengaluru…"
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Employment type</legend>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
          {TYPES.map((t) => (
            <label
              key={t}
              className={cn(
                "flex h-9 cursor-pointer items-center justify-center rounded-full text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                type === t
                  ? "bg-card shadow-[0_1px_2px_rgba(17,17,16,0.08)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="employment_type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="sr-only"
              />
              {EMPLOYMENT_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="job-description">Description</Label>
        <Textarea
          id="job-description"
          value={description}
          maxLength={10000}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-40"
          placeholder="What the role involves, the skills that matter, and the tech stack."
        />
        <p className="text-xs text-muted-foreground">
          Iris uses this to plan the interview and to rank applicants.
        </p>
      </div>
      <FormError message={error} />
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Spinner />}
          {job ? "Save changes" : "Post job"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function JobFormDialog({
  open,
  onOpenChange,
  job,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job;
  onSaved: (job: Job) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{job ? "Edit job" : "Post a job"}</DialogTitle>
          <DialogDescription>
            {job
              ? "Changes apply to new interviews and rankings."
              : "Candidates can apply as soon as it's posted."}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so the form resets each time it opens. */}
        {open && (
          <JobForm
            key={job?.id ?? "new"}
            job={job}
            onCancel={() => onOpenChange(false)}
            onSaved={(j) => {
              onOpenChange(false);
              onSaved(j);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
