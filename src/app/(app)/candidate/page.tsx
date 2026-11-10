import type { Metadata } from "next";
import { CandidateDashboard } from "@/components/candidate/dashboard";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Dashboard · Vettly" };

export default function CandidateHomePage() {
  return <CandidateDashboard />;
}
