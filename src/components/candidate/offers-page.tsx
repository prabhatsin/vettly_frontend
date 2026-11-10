"use client";

import { useState } from "react";
import { CalendarDays, CircleDollarSign, Clock, FileText, Hourglass, ShieldCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { formatDate, formatDateTime, formatRate, OFFER_STATUS, timeUntil } from "@/lib/format";
import type { CandidateOffer } from "@/lib/types";
import { useApi } from "@/lib/use-api";

function OfferCard({ offer, onChanged }: { offer: CandidateOffer; onChanged: () => void }) {
  const [dialog, setDialog] = useState<"accept" | "decline" | null>(null);
  // The server expires offers on its own schedule; treat a passed deadline as expired in the UI too.
  const [now] = useState(() => Date.now());
  const lapsed = offer.status === "pending" && new Date(offer.expires_at).getTime() <= now;
  const status = lapsed ? "expired" : offer.status;
  const meta = OFFER_STATUS[status] ?? { label: status, tone: "gray" as const };
  const pending = status === "pending";
  const left = timeUntil(offer.expires_at, now);

  async function respond(action: "accept" | "decline") {
    await apiFetch(`/candidate/offers/${offer.id}/${action}`, { method: "POST" });
    onChanged();
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className={pending ? "bg-hero p-7 text-white sm:p-9" : "p-7 sm:p-9"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`caption ${pending ? "text-hero-caption" : "text-muted-foreground"}`}>
              {offer.job_title}
            </p>
            <h2 className="mt-3 text-[1.6rem] leading-tight font-semibold tracking-tight sm:text-[1.9rem]">
              {offer.role_title}
            </h2>
          </div>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        </div>

        <dl
          className={`mt-6 grid gap-4 text-[0.95rem] sm:grid-cols-3 ${pending ? "text-hero-muted" : "text-muted-foreground"}`}
        >
          <div className="flex items-center gap-2.5">
            <CircleDollarSign className="size-5 shrink-0" strokeWidth={1.6} />
            <dt className="sr-only">Pay</dt>
            <dd className={pending ? "font-medium text-white" : "font-medium text-foreground"}>
              {formatRate(offer.rate_amount, offer.currency, offer.rate_period)}
            </dd>
          </div>
          <div className="flex items-center gap-2.5">
            <CalendarDays className="size-5 shrink-0" strokeWidth={1.6} />
            <dt className="sr-only">Start date</dt>
            <dd>Starts {formatDate(offer.start_date)}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="size-5 shrink-0" strokeWidth={1.6} />
            <dt className="sr-only">Expires</dt>
            <dd>{pending ? `Expires ${left ?? "soon"}` : `Expires ${formatDateTime(offer.expires_at)}`}</dd>
          </div>
        </dl>

        {pending && (
          <>
            <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-white/8 px-4 py-3 text-sm">
              {offer.funded ? (
                <>
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-hero-check" />
                  <span>The employer has funded this offer. You can accept it now.</span>
                </>
              ) : (
                <>
                  <Hourglass className="mt-0.5 size-4 shrink-0 text-hero-muted" />
                  <span>
                    Waiting for the employer to fund this offer. You can accept once it&apos;s funded, and
                    we&apos;ll tell you when that happens.
                  </span>
                </>
              )}
            </p>
            <p className="mt-3 text-sm text-hero-caption">Respond by {formatDateTime(offer.expires_at)}.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="hero-primary"
                size="lg"
                disabled={!offer.funded}
                onClick={() => setDialog("accept")}
                title={offer.funded ? undefined : "Available once the employer funds the offer"}
              >
                Accept offer
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => setDialog("decline")}>
                Decline
              </Button>
            </div>
          </>
        )}

        {status === "expired" && (
          <p className="mt-6 rounded-2xl bg-pill-gray px-4 py-3 text-sm text-pill-gray-foreground">
            This offer expired on {formatDateTime(offer.expires_at)} without a response, so it can no longer
            be accepted.
            {offer.funded ? " Any funds held for it are returned to the employer." : ""}
          </p>
        )}
        {status === "accepted" && offer.responded_at && (
          <p className="mt-6 text-sm text-muted-foreground">
            You accepted on {formatDateTime(offer.responded_at)}.
          </p>
        )}
        {status === "declined" && offer.responded_at && (
          <p className="mt-6 text-sm text-muted-foreground">
            You declined on {formatDateTime(offer.responded_at)}.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={dialog === "accept"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Accept this offer?"
        description={`${offer.role_title} at ${formatRate(offer.rate_amount, offer.currency, offer.rate_period)}, starting ${formatDate(offer.start_date)}. This is final.`}
        confirmLabel="Accept offer"
        onConfirm={() => respond("accept")}
      />
      <ConfirmDialog
        open={dialog === "decline"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Decline this offer?"
        description="The employer will be told, and you won't be able to accept it later."
        confirmLabel="Decline offer"
        destructive
        onConfirm={() => respond("decline")}
      />
    </article>
  );
}

export function OffersPage() {
  const offers = useApi<CandidateOffer[]>("/candidate/offers");
  const sorted = [...(offers.data ?? [])].sort((a, b) => {
    // Pending first, then newest.
    if ((a.status === "pending") !== (b.status === "pending")) return a.status === "pending" ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <PageHeader
        title="Offers"
        subtitle="Offers from employers. Accept once the employer has funded the offer."
      />
      {offers.loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : offers.error && !offers.data ? (
        <ErrorState message={offers.error.message} onRetry={offers.reload} />
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card">
          <EmptyState
            icon={FileText}
            title="No offers yet"
            description="When an employer sends you an offer, it shows up here and you'll get a notification."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sorted.map((o) => (
            <OfferCard key={o.id} offer={o} onChanged={offers.reload} />
          ))}
        </div>
      )}
    </div>
  );
}
