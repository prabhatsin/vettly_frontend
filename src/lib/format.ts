import type {
  ApplicationStatus,
  EmploymentType,
  PaymentStatus,
  RatePeriod,
  Recommendation,
} from "@/lib/types";

export type Tone = "green" | "blue" | "amber" | "red" | "gray" | "dark";

export function formatDate(iso: string): string {
  // Dates without a time (YYYY-MM-DD) are calendar dates: don't shift by timezone.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} d ago`;
  return formatDate(iso);
}

/** "in 3 days", "in 5 h" until a future time, or null if it has passed. */
export function timeUntil(iso: string, now = Date.now()): string | null {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return null;
  const m = Math.round(ms / 60000);
  if (m < 60) return `in ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `in ${h} h`;
  return `in ${Math.round(h / 24)} days`;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-IN")} ${currency}`;
  }
}

const PERIOD: Record<RatePeriod, string> = { hour: "hour", month: "month", year: "year" };
export function formatRate(amount: number, currency: string, period: string): string {
  return `${formatMoney(amount, currency)} / ${PERIOD[period as RatePeriod] ?? period}`;
}

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  applied: { label: "Applied", tone: "gray" },
  interviewed: { label: "Interviewed", tone: "amber" },
  scored: { label: "Scored", tone: "blue" },
  shortlisted: { label: "Shortlisted", tone: "blue" },
  offered: { label: "Offered", tone: "green" },
  accepted: { label: "Accepted", tone: "green" },
  declined: { label: "Declined", tone: "red" },
  rejected: { label: "Rejected", tone: "red" },
};

/** The candidate-facing interview stage, as CLAUDE.md maps it. */
export type InterviewStage = "not_started" | "processing" | "completed";
export function interviewStage(status: ApplicationStatus): InterviewStage {
  if (status === "applied") return "not_started";
  if (status === "interviewed") return "processing";
  return "completed";
}
export const INTERVIEW_STAGE: Record<InterviewStage, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "blue" },
  processing: { label: "Processing", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
};

export const RECOMMENDATION: Record<Recommendation, { label: string; tone: Tone }> = {
  hire: { label: "Hire", tone: "green" },
  maybe: { label: "Maybe", tone: "amber" },
  no_hire: { label: "No hire", tone: "red" },
  insufficient_data: { label: "Not enough data", tone: "gray" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: "Awaiting payment", tone: "amber" },
  succeeded: { label: "Funded", tone: "green" },
  failed: { label: "Payment failed", tone: "red" },
  released: { label: "Released to candidate", tone: "green" },
  refunded: { label: "Refunded", tone: "gray" },
};

export const OFFER_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "blue" },
  accepted: { label: "Accepted", tone: "green" },
  declined: { label: "Declined", tone: "red" },
  expired: { label: "Expired", tone: "gray" },
};

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
