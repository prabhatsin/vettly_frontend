import type { Metadata } from "next";
import { JobCandidates } from "@/components/employer/job-candidates";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Candidates · Vettly" };

export default function Page() {
  return <JobCandidates />;
}
