import type { Metadata } from "next";
import { CheckoutPage } from "@/components/employer/checkout-page";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Checkout · Vettly" };

export default function Page() {
  return <CheckoutPage />;
}
