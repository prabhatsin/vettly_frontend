"use client";

import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth";
import { firstName, greeting } from "@/lib/user";

export function HomeGreeting({ subtitle, action }: { subtitle?: React.ReactNode; action?: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <PageHeader title={`${greeting()}, ${firstName(user.email)}.`} subtitle={subtitle} action={action} />
  );
}
