import type { Metadata } from "next";
import { OffersPage } from "@/components/candidate/offers-page";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Offers · Vettly" };

export default function Page() {
  return <OffersPage />;
}
