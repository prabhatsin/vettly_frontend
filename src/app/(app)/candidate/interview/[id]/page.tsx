import type { Metadata } from "next";
import { InterviewRoom } from "@/components/candidate/interview-room";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Interview · Vettly" };

export default function Page() {
  return <InterviewRoom />;
}
