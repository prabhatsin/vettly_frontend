// All copy and sample data for the landing page, taken from
// landing_page/Landing page-html/Main.dc.html (the design reference).

export const ROUTES = {
  signIn: "/login",
  signUp: "/register",
} as const;

export const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#iris", label: "Meet Iris" },
  { href: "#reports", label: "Reports" },
  { href: "#sides", label: "For teams" },
] as const;

export type Side = "hire" | "candidate";

export const HERO = {
  badge: "Meet Iris, the interviewer that listens",
  sides: {
    hire: {
      text: "Iris reads every résumé, talks with every applicant in real time, and hands your team a scored report where each score links back to what the candidate actually said.",
      primary: { label: "Post a role", href: ROUTES.signUp },
      secondary: { label: "See a sample report", href: "#reports", play: false },
    },
    candidate: {
      text: "Upload your résumé and talk with Iris whenever it suits you. She asks about the work you've actually done, and lets you think out loud.",
      primary: { label: "Upload résumé", href: ROUTES.signUp },
      secondary: { label: "Hear Iris", href: "#iris", play: true },
    },
  },
  checks: ["Résumé-aware questions", "Three rounds, one call", "Evidence-backed scores"],
} as const;

export interface TranscriptLine {
  iris: boolean;
  time: string;
  text: string;
}

export interface Stage {
  name: string;
  role: string;
  timer: string;
  lines: TranscriptLine[];
  signals: string[];
  handoff: string;
}

export const DEFAULT_STAGE = 1; // Technical

export const STAGES: Stage[] = [
  {
    name: "Screener",
    role: "Screening round",
    timer: "01:08",
    lines: [
      { iris: true, time: "00:42", text: "I see you led the payments migration at your last role. What made you move on from it?" },
      { iris: false, time: "00:51", text: "Honestly, it was finished. We'd cut the old ledger over, and I wanted a team still building the hard parts." },
      { iris: true, time: "01:08", text: "That makes sense. This role is hybrid, two days a week in the office. Does that work for you?" },
    ],
    signals: ["Résumé claim checked", "Clear motivation", "Logistics confirmed"],
    handoff: "Next: Technical agent picks up with full context",
  },
  {
    name: "Technical",
    role: "Technical deep-dive",
    timer: "12:48",
    lines: [
      { iris: true, time: "12:31", text: "You mentioned retries on the payment webhook. How do you stop a customer being charged twice?" },
      { iris: false, time: "12:40", text: "Every request carries an idempotency key. We store it with the result, so a retry just returns the first response." },
      { iris: true, time: "12:48", text: "And if two retries arrive at the same moment, before the first one is stored?" },
    ],
    signals: ["Idempotency keys", "Concrete example", "Concurrency probed"],
    handoff: "Next: Behavioral agent picks up with full context",
  },
  {
    name: "Behavioral",
    role: "Behavioral round",
    timer: "17:40",
    lines: [
      { iris: true, time: "17:16", text: "Tell me about a time you disagreed with a product decision." },
      { iris: false, time: "17:25", text: "We wanted to ship without a rollback plan. I wrote one in an evening and showed the risk in numbers." },
      { iris: true, time: "17:40", text: "What happened after you shared it?" },
    ],
    signals: ["Ownership", "Data-led persuasion", "Complete story"],
    handoff: "Next: scored report goes to the hiring team",
  },
];

/** Waveform bar heights in px, left to right. */
export const WAVE_BARS = [
  14, 22, 30, 18, 38, 26, 44, 20, 34, 46, 28, 16, 40, 24, 36, 48, 30, 18, 42, 26, 34, 20, 44, 32, 22, 38, 16,
  28, 14, 10,
];

export const QUOTES = [
  "Walk me through the trade-off you made there.",
  "You said 'we'. What was your part?",
  "How would that hold up at ten times the load?",
  "Can you go one level deeper?",
  "What would you do differently next time?",
];

export const INTERVIEW_ROUNDS = [
  {
    num: "01",
    title: "Screener",
    text: "Checks the résumé against reality: motivation, notice period, location, and the claims worth a closer look.",
    next: "Hands off to Technical",
  },
  {
    num: "02",
    title: "Technical",
    text: "Goes deep on the role's real skills, and follows up on what the candidate just said instead of reading the next question off a list.",
    next: "Hands off to Behavioral",
  },
  {
    num: "03",
    title: "Behavioral",
    text: "Draws out real stories about ownership, conflict and collaboration, and pushes past rehearsed answers to the specifics.",
    next: "Then: your scored report",
  },
];

export const INTERVIEW_PLAN = [
  { label: "From the résumé", text: "Led payments ledger migration → probe ownership and rollback" },
  { label: "From the job description", text: "Distributed systems → idempotency, queues, failure modes" },
  { label: "Gap to explore", text: "No on-call experience listed → ask about incidents" },
];

export const REPORT_CHECKS = [
  "Ranked shortlist for each role",
  "Timestamped evidence for every score",
  "Shortlist and send offers from the report",
];

export const SAMPLE_REPORT = {
  candidate: "Candidate A",
  meta: "Senior Backend Engineer · 20 min interview",
  score: "4.25",
  recommendation: "Advance to onsite",
  criteria: [
    {
      name: "Technical depth",
      score: "4.5",
      pct: 90,
      time: "12:40",
      quote: "Every request carries an idempotency key, so a retry just returns the first response.",
    },
    {
      name: "Problem solving",
      score: "4.0",
      pct: 80,
      time: "13:02",
      quote: "I'd take a lock on the key and make the second request wait.",
    },
    {
      name: "Communication",
      score: "4.0",
      pct: 80,
      time: "00:51",
      quote: "We'd cut the old ledger over, and I wanted a team still building the hard parts.",
    },
    {
      name: "Ownership",
      score: "4.5",
      pct: 90,
      time: "17:25",
      quote: "I wrote a rollback plan in an evening and showed the risk in numbers.",
    },
  ],
};

export const CANDIDATE_STEPS = [
  { title: "Upload your résumé", text: "Iris prepares questions about the work you've actually done." },
  { title: "Interview when it suits you", text: "Talk with Iris from your browser, at any hour." },
  { title: "Get notified", text: "You hear the moment your application status changes." },
  { title: "Accept or decline offers", text: "Respond to offers in one place, without the email chase." },
];

export const TEAM_STEPS = [
  { title: "Post a role", text: "Add the job description. Iris builds the interview plan from it." },
  { title: "Iris interviews every applicant", text: "Screening, technical and behavioral rounds in a single call." },
  { title: "Shortlist from evidence", text: "Ranked, scored reports with links into the transcript." },
  { title: "Send offers", text: "Move people from shortlist to offer and see their answer." },
];

export const FINAL_CTA = {
  text: "Try a sample interview with Iris, or post your first role and let her talk to every applicant.",
  primary: { label: "Start a sample interview", href: ROUTES.signUp },
  secondary: { label: "Post a role", href: ROUTES.signUp },
};

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#how", label: "How it works" },
      { href: "#iris", label: "Meet Iris" },
      { href: "#reports", label: "Reports" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: ROUTES.signIn, label: "Sign in" },
      { href: ROUTES.signUp, label: "Create an account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#privacy", label: "Privacy" },
      { href: "#terms", label: "Terms" },
    ],
  },
];
