import type { Metadata } from "next";
import { InterviewsPage } from "@/components/candidate/interviews-page";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Interviews · Vettly" };

export default function Page() {
  return <InterviewsPage />;
}
