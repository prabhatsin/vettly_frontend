import type { Metadata } from "next";
import { EmployerApplicationPage } from "@/components/employer/application-page";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Application · Vettly" };

export default function Page() {
  return <EmployerApplicationPage />;
}
