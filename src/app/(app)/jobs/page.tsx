import type { Metadata } from "next";
import { JobsList } from "@/components/jobs/jobs-list";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Open roles · Vettly" };

export default function Page() {
  return <JobsList />;
}
