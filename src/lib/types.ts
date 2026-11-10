// Shapes from openapi.json (Voice Interview Platform API 0.1.0).

export type UserRole = "candidate" | "employer";

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  /** 8 to 128 characters. */
  password: string;
  role: UserRole;
}

export type ApplicationStatus =
  "applied" | "interviewed" | "scored" | "shortlisted" | "offered" | "accepted" | "declined" | "rejected";

export type EmploymentType = "full_time" | "part_time" | "contract";

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location: string | null;
  employment_type: EmploymentType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  title: string;
  description: string;
  location: string | null;
  employment_type: EmploymentType;
}

export type JobUpdate = Partial<JobCreate> & { is_active?: boolean };

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface InterviewToken {
  token: string;
  url: string;
  room: string;
}

export type RatePeriod = "hour" | "month" | "year";
export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

export interface Offer {
  id: string;
  application_id: string;
  role_title: string;
  /** Whole currency units. */
  rate_amount: number;
  rate_period: RatePeriod;
  currency: string;
  start_date: string;
  expires_at: string;
  status: OfferStatus;
  created_at: string;
  responded_at: string | null;
}

export interface CandidateOffer extends Offer {
  job_title: string;
  application_status: ApplicationStatus;
  funded: boolean;
}

export interface OfferIn {
  role_title: string;
  rate_amount: number;
  rate_period: RatePeriod;
  currency: string;
  start_date: string;
  expires_in_days: number;
}

export type PaymentStatus = "pending" | "succeeded" | "failed" | "released" | "refunded";

export interface Payment {
  id: string;
  offer_id: string;
  /** Whole currency units. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider_intent_id: string | null;
  created_at: string;
  checkout_url: string | null;
}

export interface CandidateRow {
  application_id: string;
  candidate_email: string;
  application_status: ApplicationStatus;
  report_status: ReportStatus | null;
  overall_score: number | null;
  recommendation: Recommendation | null;
}

export interface MatchRow {
  application_id: string;
  candidate_email: string;
  /** 0 to 1. */
  match_score: number;
  interview_component: number;
  similarity: number | null;
  passed_filters: boolean;
  reasons: string[];
  computed_at: string;
}

export type ReportStatus = "pending" | "done" | "failed";
export type Recommendation = "hire" | "maybe" | "no_hire" | "insufficient_data";
export type CriterionStatus = "ok" | "unverified" | "failed";

export interface Evidence {
  turn: number;
  quote: string;
}

export interface CriterionResult {
  key: string;
  name: string;
  weight: number;
  status: CriterionStatus;
  score: number | null;
  reason: string;
  evidence: Evidence[];
}

export interface Report {
  overall_score: number | null;
  recommendation: Recommendation;
  advice_note: string;
  coverage: number;
  criteria: CriterionResult[];
  strengths: string[];
  concerns: string[];
}

export interface ReportOut {
  application_id: string;
  status: ReportStatus;
  error: string | null;
  report: Report | null;
  updated_at: string;
}

export interface ReplayTurn {
  index: number;
  role: string;
  text: string;
  seqs: number[];
}

export interface ReplayEvidence {
  criterion_key: string;
  criterion_name: string;
  turn: number;
  quote: string;
}

export interface ReplayOut {
  turns: ReplayTurn[];
  evidence: ReplayEvidence[];
}

export interface StatusEvent {
  from_status: string;
  to_status: string;
  actor_role: string;
  actor_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Criterion {
  key: string;
  name: string;
  description: string;
  /** Score level ("1" to "5") to its description. */
  levels: Record<string, string>;
  weight: number;
}

export interface Rubric {
  job_id: string;
  is_default: boolean;
  criteria: Criterion[];
}

export type NotificationKind =
  | "shortlisted"
  | "rejected"
  | "offer"
  | "offer_funded"
  | "offer_expired"
  | "offer_accepted"
  | "offer_declined"
  | "payment_succeeded"
  | "payment_failed";

export interface AppNotification {
  id: string;
  kind: NotificationKind | string;
  message: string;
  data: Record<string, string>;
  read_at: string | null;
  created_at: string;
}

export interface LiveEvent {
  type: "notification";
  id: string;
  kind: NotificationKind | string;
  message: string;
  data: Record<string, string>;
}
