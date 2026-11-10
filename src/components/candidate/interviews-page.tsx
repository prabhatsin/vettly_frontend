"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { ApplicationsTable } from "@/components/candidate/applications-table";
import { FilterPills } from "@/components/filter-pills";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { useMyApplications } from "@/lib/candidate-data";

type Filter = "all" | "active" | "closed";
const FINAL = new Set(["accepted", "declined", "rejected"]);

export function InterviewsPage() {
  const { applications, loading, error, reload } = useMyApplications();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const closed = applications?.filter((a) => FINAL.has(a.status)).length ?? 0;
    return { all: applications?.length ?? 0, closed, active: (applications?.length ?? 0) - closed };
  }, [applications]);

  const rows = applications?.filter((a) =>
    filter === "all" ? true : filter === "closed" ? FINAL.has(a.status) : !FINAL.has(a.status),
  );

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <PageHeader
        title="Interviews"
        subtitle="Every role you've applied to, and where it stands."
        action={
          <Link href="/jobs" className={buttonVariants({ size: "lg" })}>
            Browse open roles
          </Link>
        }
      />

      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex flex-col gap-4 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[1.2rem] font-semibold">My applications</h2>
          <FilterPills<Filter>
            label="Filter applications"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "In progress", count: counts.active },
              { value: "closed", label: "Closed", count: counts.closed },
            ]}
          />
        </div>
        {loading ? (
          <LoadingRows rows={4} className="px-6 pb-6 sm:px-8" />
        ) : error && !applications ? (
          <ErrorState message={error.message} onRetry={reload} className="mx-6 mb-6 sm:mx-8" />
        ) : !rows || rows.length === 0 ? (
          <div className="border-t border-border">
            <EmptyState
              icon={Inbox}
              title={filter === "all" ? "You haven't applied anywhere yet" : "Nothing here"}
              description={
                filter === "all"
                  ? "Pick an open role and upload your résumé to start."
                  : "No applications match this filter."
              }
              action={
                filter === "all" ? (
                  <Link href="/jobs" className={buttonVariants({ variant: "secondary" })}>
                    Browse open roles
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <ApplicationsTable applications={rows} mode="status" />
        )}
      </section>

      <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
        <p>
          <span className="font-medium text-foreground">Applied:</span> your interview is ready. Join it any
          time.
        </p>
        <p>
          <span className="font-medium text-foreground">Interviewed:</span> Iris is scoring your answers. This
          takes a few minutes.
        </p>
        <p>
          <span className="font-medium text-foreground">Offered:</span> the employer sent an offer. Review it
          on the Offers page.
        </p>
      </div>
    </div>
  );
}
