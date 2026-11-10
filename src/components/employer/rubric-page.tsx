"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ChevronDown, Plus, Trash2 } from "lucide-react";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/spinner";
import { StatusPill } from "@/components/status-pill";
import { ErrorState, Skeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { Criterion, Job, Rubric } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

const LEVELS = ["1", "2", "3", "4", "5"];

interface Draft extends Criterion {
  /** Local id for React keys; new criteria get their key from the name on save. */
  uid: string;
  isNew: boolean;
}

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function toDrafts(criteria: Criterion[]): Draft[] {
  return criteria.map((c) => ({ ...c, uid: c.key, isNew: false }));
}

function CriterionEditor({
  c,
  onChange,
  onRemove,
  defaultOpen,
}: {
  c: Draft;
  onChange: (c: Draft) => void;
  onRemove: () => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li className="rounded-3xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left sm:px-7"
      >
        <span className="min-w-0">
          <span className="block truncate font-semibold">{c.name || "Untitled criterion"}</span>
          <span className="block truncate text-sm text-muted-foreground">
            Weight ×{c.weight} · {c.description || "No description"}
          </span>
        </span>
        <ChevronDown className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-col gap-5 border-t border-border px-6 py-6 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${c.uid}-name`}>Name</Label>
              <Input
                id={`${c.uid}-name`}
                value={c.name}
                onChange={(e) => onChange({ ...c, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${c.uid}-weight`}>Weight</Label>
              <Input
                id={`${c.uid}-weight`}
                type="number"
                min={0}
                step={0.5}
                value={c.weight}
                onChange={(e) => onChange({ ...c, weight: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${c.uid}-desc`}>What it measures</Label>
            <Textarea
              id={`${c.uid}-desc`}
              value={c.description}
              onChange={(e) => onChange({ ...c, description: e.target.value })}
            />
          </div>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">What each score means</legend>
            {LEVELS.map((lvl) => (
              <div key={lvl} className="flex items-start gap-3">
                <span className="mt-2.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {lvl}
                </span>
                <Textarea
                  aria-label={`Score ${lvl}`}
                  value={c.levels[lvl] ?? ""}
                  onChange={(e) => onChange({ ...c, levels: { ...c.levels, [lvl]: e.target.value } })}
                  className="min-h-12"
                />
              </div>
            ))}
          </fieldset>
          <Button
            type="button"
            variant="ghost"
            onClick={onRemove}
            className="self-start text-pill-red-foreground"
          >
            <Trash2 />
            Remove criterion
          </Button>
        </div>
      )}
    </li>
  );
}

function RubricEditor({
  jobId,
  rubric,
  onSaved,
}: {
  jobId: string;
  rubric: Rubric;
  onSaved: (r: Rubric) => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>(() => toDrafts(rubric.criteria));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(i: number, c: Draft) {
    setSaved(false);
    setDrafts(drafts.map((d, j) => (j === i ? c : d)));
  }

  async function save() {
    setError(null);
    setSaved(false);
    const used = new Set<string>();
    const criteria: Criterion[] = [];
    for (const d of drafts) {
      if (!d.name.trim()) return setError("Every criterion needs a name.");
      if (!d.description.trim()) return setError(`Add a description for “${d.name}”.`);
      if (LEVELS.some((l) => !d.levels[l]?.trim()))
        return setError(`Describe all five scores for “${d.name}”.`);
      if (!(d.weight > 0)) return setError(`The weight for “${d.name}” must be above 0.`);
      let key = d.isNew ? slug(d.name) : d.key;
      if (key.length < 2) key = `c_${key}`.slice(0, 40);
      let n = 2;
      while (used.has(key)) key = `${key.slice(0, 37)}_${n++}`;
      used.add(key);
      criteria.push({
        key,
        name: d.name.trim(),
        description: d.description.trim(),
        weight: d.weight,
        levels: Object.fromEntries(LEVELS.map((l) => [l, d.levels[l].trim()])),
      });
    }
    if (criteria.length === 0) return setError("Add at least one criterion.");

    setBusy(true);
    try {
      const res = await apiFetch<Rubric>(`/employer/jobs/${jobId}/rubric`, {
        method: "PUT",
        body: { criteria },
      });
      setDrafts(toDrafts(res.criteria));
      setSaved(true);
      onSaved(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the rubric.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {drafts.map((c, i) => (
          <CriterionEditor
            key={c.uid}
            c={c}
            defaultOpen={c.isNew}
            onChange={(next) => update(i, next)}
            onRemove={() => {
              setSaved(false);
              setDrafts(drafts.filter((_, j) => j !== i));
            }}
          />
        ))}
      </ul>
      <Button
        variant="secondary"
        className="self-start"
        onClick={() =>
          setDrafts([
            ...drafts,
            {
              uid: `new-${Date.now()}`,
              isNew: true,
              key: "",
              name: "",
              description: "",
              weight: 1,
              levels: Object.fromEntries(LEVELS.map((l) => [l, ""])),
            },
          ])
        }
      >
        <Plus />
        Add criterion
      </Button>
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-border bg-card/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <FormError message={error} />
          {!error && (
            <p className="text-sm text-muted-foreground">
              {saved
                ? "Saved. New scores use this rubric; re-run scoring to update existing reports."
                : "Changes apply to interviews scored after you save."}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDrafts(toDrafts(rubric.criteria));
              setError(null);
            }}
            disabled={busy}
          >
            Reset
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Spinner />}
            Save rubric
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RubricPage() {
  const { id } = useParams<{ id: string }>();
  const jobs = useApi<Job[]>("/jobs/mine", { live: false });
  const rubric = useApi<Rubric>(`/employer/jobs/${id}/rubric`, { live: false });
  const job = jobs.data?.find((j) => j.id === id);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/employer/jobs/${id}`}
        className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {job?.title ?? "Back to job"}
      </Link>
      <PageHeader
        title="Scoring rubric"
        subtitle="The criteria Iris scores each interview against, from 1 to 5. Higher weights count more in the overall score."
        action={
          rubric.data?.is_default ? <StatusPill tone="gray">Using the default rubric</StatusPill> : undefined
        }
      />
      {rubric.loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </div>
      ) : rubric.error && !rubric.data ? (
        <ErrorState
          message={
            rubric.error.status === 404 ? "This job doesn't exist or isn't yours." : rubric.error.message
          }
          onRetry={rubric.error.status === 404 ? undefined : rubric.reload}
        />
      ) : rubric.data ? (
        <RubricEditor
          key={rubric.data.criteria.map((c) => c.key).join()}
          jobId={id}
          rubric={rubric.data}
          onSaved={() => rubric.reload()}
        />
      ) : null}
    </div>
  );
}
