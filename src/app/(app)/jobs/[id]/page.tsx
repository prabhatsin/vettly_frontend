import type { Metadata } from "next";
import { JobDetail } from "@/components/jobs/job-detail";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Role · Vettly" };

export default function Page() {
  return <JobDetail />;
}
