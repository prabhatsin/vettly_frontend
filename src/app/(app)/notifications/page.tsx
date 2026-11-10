import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications-page";

// Rendered after the client-side session check; see (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "Notifications · Vettly" };

export default function Page() {
  return <NotificationsPage />;
}
