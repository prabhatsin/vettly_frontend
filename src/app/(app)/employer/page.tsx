import type { Metadata } from "next";
import { EmployerJobsHome } from "@/components/employer/jobs-home";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Jobs · Vettly" };

export default function Page() {
  return <EmployerJobsHome />;
}
