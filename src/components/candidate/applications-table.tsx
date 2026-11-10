"use client";

import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import type { ApplicationWithJob } from "@/lib/candidate-data";
import { APPLICATION_STATUS, formatDate, INTERVIEW_STAGE, interviewStage } from "@/lib/format";

function RowAction({ app }: { app: ApplicationWithJob }) {
  const linkClass = "text-sm font-medium underline underline-offset-4 hover:text-muted-foreground";
  if (app.status === "applied") {
    return (
      <Link href={`/candidate/interview/${app.id}`} className={linkClass}>
        Join interview
      </Link>
    );
  }
  if (app.status === "offered") {
    return (
      <Link href="/candidate/offers" className={linkClass}>
        View offer
      </Link>
    );
  }
  if (app.status === "interviewed") {
    return <span className="text-sm text-muted-foreground">Scoring…</span>;
  }
  return <span className="text-muted-foreground">—</span>;
}

function Pill({ app, mode }: { app: ApplicationWithJob; mode: "stage" | "status" }) {
  const meta =
    mode === "stage" ? INTERVIEW_STAGE[interviewStage(app.status)] : APPLICATION_STATUS[app.status];
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
}

function RoleCell({ app }: { app: ApplicationWithJob }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{app.jobTitle}</p>
      {app.job?.location && <p className="truncate text-sm text-muted-foreground">{app.job.location}</p>}
    </div>
  );
}

/**
 * `stage` shows Not started / Processing / Completed (dashboard history);
 * `status` shows the full application status (Interviews page).
 */
export function ApplicationsTable({
  applications,
  mode,
}: {
  applications: ApplicationWithJob[];
  mode: "stage" | "status";
}) {
  return (
    <>
      {/* Desktop table */}
      <table className="hidden w-full text-left md:table">
        <thead className="bg-table-head text-sm text-muted-foreground">
          <tr className="border-y border-border">
            <th scope="col" className="py-3 pr-4 pl-8 font-medium">
              Role
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Applied
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="py-3 pr-8 pl-4 font-medium">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border last:border-b-0">
              <td className="max-w-0 py-5 pr-4 pl-8 lg:w-[45%]">
                <RoleCell app={app} />
              </td>
              <td className="px-4 py-5 whitespace-nowrap">{formatDate(app.created_at)}</td>
              <td className="px-4 py-5">
                <Pill app={app} mode={mode} />
              </td>
              <td className="py-5 pr-8 pl-4 text-right whitespace-nowrap md:text-left">
                <RowAction app={app} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile list */}
      <ul className="divide-y divide-border border-t border-border md:hidden">
        {applications.map((app) => (
          <li key={app.id} className="flex flex-col gap-3 px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <RoleCell app={app} />
              <Pill app={app} mode={mode} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Applied {formatDate(app.created_at)}</span>
              <RowAction app={app} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
