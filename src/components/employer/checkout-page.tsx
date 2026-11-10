"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, CircleX, FlaskConical, Lock } from "lucide-react";
import { FormError } from "@/components/form-error";
import { LogoMark } from "@/components/logo";
import { Spinner } from "@/components/spinner";
import { Skeleton } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

/**
 * Our stand-in for a payment provider's hosted checkout (test mode).
 * Confirming here only tells the fake provider what to do. The payment is
 * marked paid only when the backend says so (webhook → event / GET payment).
 */
export function CheckoutPage() {
  const { intent } = useParams<{ intent: string }>();
  const params = useSearchParams();
  const appId = params.get("app");
  const rawReturn = params.get("return");
  const returnTo =
    rawReturn && rawReturn.startsWith("/employer/")
      ? rawReturn
      : appId
        ? `/employer/applications/${appId}`
        : "/employer";

  const [sent, setSent] = useState<"succeeded" | "failed" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payment = useApi<Payment>(appId ? `/employer/applications/${appId}/offer/payment` : null, {
    pollMs: sent ? 3000 : null,
  });
  const p = payment.data;
  const current = !p || p.provider_intent_id === intent;
  const settled = current && p && p.status !== "pending";

  async function confirm(outcome: "succeeded" | "failed") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/fake-provider/intents/${encodeURIComponent(intent)}/confirm?outcome=${outcome}`, {
        method: "POST",
      });
      setSent(outcome);
      payment.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The provider didn't accept the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link
        href={returnTo}
        className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to the offer
      </Link>

      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-table-head px-7 py-5">
          <span className="inline-flex items-center gap-3 font-semibold">
            <LogoMark className="size-8 text-lg" />
            Test checkout
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pill-amber px-3 py-1 text-xs font-medium text-pill-amber-foreground">
            <FlaskConical className="size-3.5" /> Test mode
          </span>
        </div>

        <div className="px-7 py-8">
          <p className="caption text-muted-foreground">Fund offer</p>
          {payment.loading ? (
            <Skeleton className="mt-3 h-12 w-48" />
          ) : p && current ? (
            <p className="mt-2 text-[2.8rem] leading-none font-semibold tabular-nums">
              {formatMoney(p.amount, p.currency)}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">Amount unavailable</p>
          )}
          <p className="mt-3 truncate font-mono text-xs text-muted-foreground" title={intent}>
            {intent}
          </p>

          {!current ? (
            <p className="mt-6 rounded-2xl bg-pill-gray px-4 py-3 text-sm text-pill-gray-foreground">
              This checkout is no longer the current payment for this offer. Go back to the offer to see its
              status.
            </p>
          ) : settled ? (
            <div
              className={cn(
                "mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm",
                p.status === "failed"
                  ? "bg-pill-red text-pill-red-foreground"
                  : "bg-pill-green text-pill-green-foreground",
              )}
              role="status"
            >
              {p.status === "failed" ? (
                <CircleX className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              )}
              <span>
                {p.status === "failed"
                  ? "The payment was declined. Go back to the offer to try again."
                  : p.status === "succeeded"
                    ? "Payment confirmed. The offer is funded and the candidate can accept it."
                    : `Payment status: ${p.status}.`}
              </span>
            </div>
          ) : sent ? (
            <div
              className="mt-6 flex items-start gap-3 rounded-2xl bg-table-head px-4 py-3 text-sm"
              role="status"
            >
              <Spinner className="mt-0.5" />
              <span>
                Processing. Waiting for the provider to confirm{" "}
                {sent === "failed" ? "the decline" : "the payment"}… You can go back now; the offer updates on
                its own.
              </span>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted-foreground">
                This page stands in for a real payment provider. No money moves. Pick an outcome to simulate.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => confirm("succeeded")} disabled={busy} className="flex-1">
                  {busy ? <Spinner /> : <Lock />}
                  Pay
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => confirm("failed")}
                  disabled={busy}
                  className="flex-1"
                >
                  Simulate decline
                </Button>
              </div>
            </>
          )}
          <div className="mt-4">
            <FormError message={error} />
          </div>
          {(settled || sent) && (
            <Link
              href={returnTo}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "mt-6 w-full")}
            >
              Back to the offer
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
