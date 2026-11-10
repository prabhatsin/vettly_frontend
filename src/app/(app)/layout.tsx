import { Suspense } from "react";
import { AppShell, ShellSkeleton } from "@/components/app-shell";

// Signed-in pages render only after the client-side session check (the token is in
// localStorage), so Next can't validate them for instant navigation. Opt out.
export const instant = false;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
