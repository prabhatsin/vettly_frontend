"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/form-error";
import { Spinner } from "@/components/spinner";
import { useAuth } from "@/lib/auth";
import type { UserResponse, UserRole } from "@/lib/types";
import { roleHome } from "@/lib/user";
import { cn } from "@/lib/utils";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

/** Only follow same-site paths from `?next=`, and only into the user's own area. */
function nextPath(user: UserResponse): string {
  const home = roleHome(user.role);
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith(home) && !next.startsWith("//")) return next;
  return home;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { user, status, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in: go straight to the right home.
  useEffect(() => {
    if (status === "authed" && user) router.replace(nextPath(user));
  }, [status, user, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (mode === "register" && password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const me =
        mode === "login"
          ? await login(email.trim(), password)
          : await register({ email: email.trim(), password, role });
      router.replace(nextPath(me));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div>
      <h1 className="font-serif text-[2.75rem] leading-[1.05] tracking-tight sm:text-5xl">
        {isLogin ? "Welcome back." : "Create your account."}
      </h1>
      <p className="mt-3 text-[0.95rem] text-muted-foreground">
        {isLogin ? "Sign in to continue to Vettly." : "Interview with Iris, or hire with confidence."}
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:p-8"
      >
        {!isLogin && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">I am</legend>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
              {(
                [
                  ["candidate", "A candidate"],
                  ["employer", "An employer"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center rounded-full text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    role === value
                      ? "bg-card text-foreground shadow-[0_1px_2px_rgba(17,17,16,0.08)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isLogin && (
            <p className="text-xs text-muted-foreground">
              {PASSWORD_MIN} to {PASSWORD_MAX} characters.
            </p>
          )}
        </div>

        <FormError message={error} />

        <Button type="submit" size="lg" disabled={submitting || !email || !password} className="mt-1 w-full">
          {submitting && <Spinner />}
          {isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? "New to Vettly? " : "Already have an account? "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
