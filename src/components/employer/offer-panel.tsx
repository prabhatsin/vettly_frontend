"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CalendarDays, CircleDollarSign, Clock, CreditCard } from "lucide-react";
import { FormError } from "@/components/form-error";
import { Spinner } from "@/components/spinner";
import { StatusPill } from "@/components/status-pill";
import { Skeleton } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatRate,
  OFFER_STATUS,
  PAYMENT_STATUS,
} from "@/lib/format";
import type { Offer, OfferIn, Payment, RatePeriod } from "@/lib/types";
import type { ApiResource } from "@/lib/use-api";
import { cn } from "@/lib/utils";

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function OfferForm({
  applicationId,
  defaultTitle,
  onDone,
  onCancel,
}: {
  applicationId: string;
  defaultTitle: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [roleTitle, setRoleTitle] = useState(defaultTitle);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<RatePeriod>("month");
  const [currency, setCurrency] = useState("INR");
  const [startDate, setStartDate] = useState(todayISO());
  const [expires, setExpires] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const rate = Number(amount);
    const days = Number(expires);
    if (roleTitle.trim().length < 2) return setError("Role title must be at least 2 characters.");
    if (!Number.isInteger(rate) || rate <= 0) return setError("Enter the pay as a whole number above 0.");
    if (!/^[A-Za-z]{3}$/.test(currency.trim()))
      return setError("Currency must be a 3-letter code, such as INR.");
    if (!startDate || startDate < todayISO()) return setError("The start date can't be in the past.");
    if (!Number.isInteger(days) || days < 1 || days > 30)
      return setError("Expiry must be between 1 and 30 days.");

    setBusy(true);
    setError(null);
    const body: OfferIn = {
      role_title: roleTitle.trim(),
      rate_amount: rate,
      rate_period: period,
      currency: currency.trim().toUpperCase(),
      start_date: startDate,
      expires_in_days: days,
    };
    try {
      await apiFetch<Offer>(`/employer/applications/${applicationId}/offer`, { method: "POST", body });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the offer.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="offer-title">Role title</Label>
        <Input
          id="offer-title"
          value={roleTitle}
          maxLength={200}
          onChange={(e) => setRoleTitle(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="offer-amount">Pay</Label>
          <Input
            id="offer-amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="150000"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="offer-currency">Currency</Label>
          <Input
            id="offer-currency"
            value={currency}
            maxLength={3}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className="w-24 uppercase"
          />
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Per</legend>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
          {(["hour", "month", "year"] as const).map((p) => (
            <label
              key={p}
              className={cn(
                "flex h-9 cursor-pointer items-center justify-center rounded-full text-sm font-medium capitalize transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                period === p
                  ? "bg-card shadow-[0_1px_2px_rgba(17,17,16,0.08)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="period"
                value={p}
                checked={period === p}
                onChange={() => setPeriod(p)}
                className="sr-only"
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="offer-start">Start date</Label>
          <Input
            id="offer-start"
            type="date"
            min={todayISO()}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="offer-expires">Expires in (days)</Label>
          <Input
            id="offer-expires"
            type="number"
            min={1}
            max={30}
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </div>
      </div>
      <FormError message={error} />
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Spinner />}
          Send offer
        </Button>
      </DialogFooter>
    </form>
  );
}

export function OfferDialog({
  open,
  onOpenChange,
  applicationId,
  defaultTitle,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applicationId: string;
  defaultTitle: string;
  onDone: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Make an offer</DialogTitle>
          <DialogDescription>
            The candidate is notified right away. They can accept once you&apos;ve funded the offer.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <OfferForm
            applicationId={applicationId}
            defaultTitle={defaultTitle}
            onCancel={() => onOpenChange(false)}
            onDone={() => {
              onOpenChange(false);
              onDone();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Offer details, payment state and the Fund button. */
export function OfferPanel({
  applicationId,
  offer,
  payment,
}: {
  applicationId: string;
  offer: ApiResource<Offer>;
  payment: ApiResource<Payment>;
}) {
  const router = useRouter();
  const [funding, setFunding] = useState(false);
  const fundingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  if (offer.loading) return <Skeleton className="h-56 rounded-3xl" />;
  if (!offer.data) {
    if (offer.error && offer.error.status !== 404) {
      return (
        <section className="rounded-3xl border border-border bg-card p-7 text-sm text-pill-red-foreground">
          {offer.error.message}
        </section>
      );
    }
    return null;
  }

  const o = offer.data;
  const p = payment.data;
  const offerMeta = OFFER_STATUS[o.status] ?? { label: o.status, tone: "gray" as const };
  const payMeta = p ? (PAYMENT_STATUS[p.status] ?? { label: p.status, tone: "gray" as const }) : null;
  const canFund = o.status === "pending" && (!p || p.status === "failed");
  const checkoutPath =
    p?.status === "pending" && p.checkout_url ? new URL(p.checkout_url, "http://x").pathname : null;
  const returnTo = typeof window === "undefined" ? "" : window.location.pathname + window.location.search;

  function checkoutHref(path: string) {
    const q = new URLSearchParams({ app: applicationId, return: returnTo });
    return `${path}?${q}`;
  }

  async function fund() {
    // A ref as well as state, so a fast double-click can't send two requests.
    if (fundingRef.current) return;
    fundingRef.current = true;
    setFunding(true);
    setError(null);
    try {
      const res = await apiFetch<Payment>(`/employer/applications/${applicationId}/offer/fund`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });
      if (res.checkout_url) {
        router.push(checkoutHref(new URL(res.checkout_url, "http://x").pathname));
        return;
      }
      payment.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the payment.");
    } finally {
      fundingRef.current = false;
      setFunding(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-7 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="caption text-muted-foreground">Offer</p>
          <h2 className="mt-2 text-[1.35rem] font-semibold">{o.role_title}</h2>
        </div>
        <StatusPill tone={offerMeta.tone}>{offerMeta.label}</StatusPill>
      </div>
      <dl className="mt-5 grid gap-3 text-[0.95rem] text-muted-foreground sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="size-4 shrink-0" />
          <dt className="sr-only">Pay</dt>
          <dd className="font-medium text-foreground">
            {formatRate(o.rate_amount, o.currency, o.rate_period)}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" />
          <dt className="sr-only">Start</dt>
          <dd>Starts {formatDate(o.start_date)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <dt className="sr-only">Expires</dt>
          <dd>Expires {formatDateTime(o.expires_at)}</dd>
        </div>
      </dl>
      {o.responded_at && (
        <p className="mt-3 text-sm text-muted-foreground">
          Candidate responded {formatDateTime(o.responded_at)}.
        </p>
      )}

      <div className="mt-6 rounded-2xl bg-table-head p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-medium">
            <CreditCard className="size-4" /> Payment
          </p>
          {payment.loading ? (
            <Spinner />
          ) : payMeta ? (
            <StatusPill tone={payMeta.tone}>{payMeta.label}</StatusPill>
          ) : (
            <StatusPill tone="gray">Not funded</StatusPill>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {p
            ? `${formatMoney(p.amount, p.currency)} · started ${formatDateTime(p.created_at)}`
            : o.status === "pending"
              ? "Fund the offer so the candidate can accept it. The money is held until they respond."
              : "This offer was never funded."}
        </p>
        {p?.status === "pending" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Waiting for the payment provider to confirm. This updates on its own.
          </p>
        )}
        {p?.status === "failed" && o.status === "pending" && (
          <p className="mt-2 text-sm text-pill-red-foreground">The last payment failed. You can try again.</p>
        )}
        <FormError message={error} />
        <div className="mt-4 flex flex-wrap gap-3">
          {canFund && (
            <Button onClick={fund} disabled={funding}>
              {funding && <Spinner />}
              {p?.status === "failed" ? "Try funding again" : "Fund offer"}
            </Button>
          )}
          {checkoutPath && o.status === "pending" && (
            <Link href={checkoutHref(checkoutPath)} className={buttonVariants({ variant: "secondary" })}>
              Continue to checkout
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
