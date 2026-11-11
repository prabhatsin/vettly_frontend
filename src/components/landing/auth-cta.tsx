"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { roleHome } from "@/lib/user";
import { ROUTES } from "./content";

/** "Get started" for visitors, "Go to dashboard" once the stored session checks out. */
export function AuthCta({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { user, status } = useAuth();
  const authed = status === "authed" && user;
  return (
    <Link href={authed ? roleHome(user.role) : ROUTES.signUp} className={className} onClick={onNavigate}>
      {authed ? "Go to dashboard" : "Get started"}
    </Link>
  );
}
