"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { useAuth } from "@/lib/auth";
import { roleHome } from "@/lib/user";

export default function RootPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anon") router.replace("/login");
    else if (status === "authed" && user) router.replace(roleHome(user.role));
  }, [status, user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
      <Spinner className="size-5" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
