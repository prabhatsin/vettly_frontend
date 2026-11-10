# Vettly frontend

Vettly is an AI interview and hiring platform. Candidates upload a résumé and take a voice interview with the AI interviewer "Iris". Employers see scored reports, rank candidates, shortlist them, send offers and fund them. This repo is the web frontend only. The backend is already built and deployed.

## Ground rules

- Do not change the backend. If an endpoint or field you need is missing, stop and tell me instead of inventing it.
- `openapi.json` in this repo is the source of truth for request and response shapes. If this file and the spec disagree, follow the spec and tell me.
- Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind. Next 16 differs from older versions, so check its docs instead of assuming older APIs.
- The API URL comes from `NEXT_PUBLIC_API_URL`, never hard-coded.
  - Live API: `https://api-production-5d50e41d.up.railway.app`
  - Local API: `http://localhost:8000`
- Build one page at a time. After each page run `npm run build` and `npm run lint`, fix everything, then stop and show me what you built before starting the next page.
- Every page needs loading, empty and error states, and must work on mobile and desktop.
- Never put secrets in the frontend. Never use the `/internal/*`, `/webhooks/*` routes. Those are for the agent and the payment provider.

## Auth

- `POST /auth/register` and `POST /auth/login` (body `{email, password}`) return an `access_token`. Check the spec for the register body.
- `GET /auth/me` returns `{id, email, role}`. Role is `candidate` or `employer`.
- Send `Authorization: Bearer <token>` on every request. Store the token in localStorage.
- Role pages: candidate pages are for candidates only, employer pages for employers only. A wrong role gets 403, so redirect to that role's home. A missing or expired token gets 401, so go to the login page.
- Errors come back as `{"detail": "message"}`. A 422 may have `detail` as an array, so handle both shapes.
- Status codes:
  - 404: the thing doesn't exist or isn't yours (the API deliberately hides which)
  - 409: an invalid status move or a conflict (show the `detail` text to the user)
  - 422: validation error

## Application status flow

`applied → interviewed → scored → shortlisted → offered → accepted | declined | rejected`

- `interviewed` and `scored` are set automatically by the system after the interview ends and scoring finishes.
- Show only the actions that are valid for the current status:
  - Employer **shortlist**: only when `scored`
  - Employer **reject**: when `applied`, `interviewed`, `scored` or `shortlisted`
  - Employer **make offer**: only when `shortlisted`
  - Employer **fund offer**: only when the offer is `pending` and unpaid (or the last payment failed)
  - Candidate **accept**: only when the offer is `pending` and funded
  - Candidate **decline**: only when the offer is `pending`
- `accepted`, `declined` and `rejected` are final.

## Pages and endpoints

### Public and shared
- Login and register pages.
- Jobs list: `GET /jobs`. Job detail: `GET /jobs/{id}`.
- Notifications page: `GET /notifications`, `POST /notifications/{id}/read`.
- A notification bell with an unread count in the navigation bar.

### Candidate
- Apply: `POST /jobs/{job_id}/apply`. This is multipart form data with one PDF field named `resume`. A 409 means already applied.
- My applications: `GET /applications/mine`. Shows each application's status. When the status is `offered`, link to the offers page.
- Interview room: see the next section.
- My offers: `GET /candidate/offers`. Each offer has `job_title`, `role_title`, `rate_amount`, `rate_period` (hour, month or year), `currency`, `start_date`, `expires_at`, `status` (pending, accepted, declined, expired) and `funded`.
  - Accept: `POST /candidate/offers/{id}/accept`. Disabled until `funded` is true.
  - Decline: `POST /candidate/offers/{id}/decline`.
  - Show the expiry time and a clear message when an offer has expired.

### Employer
- My jobs: `GET /jobs/mine`. Create: `POST /jobs` with `{title, description, location, employment_type}`. Employment type is `full_time`, `part_time` or `contract`. Update: `PUT /jobs/{id}`. Close: `DELETE /jobs/{id}`. Reopen: `PUT /jobs/{id}` with `{is_active: true}`.
- Ranked candidates for a job:
  - `GET /employer/jobs/{job_id}/candidates` lists applicants with `application_status`, `report_status`, `overall_score` and `recommendation`.
  - `GET /employer/jobs/{job_id}/matches` lists the ranking with `match_score` (0 to 1, show as a percentage), `interview_component`, `similarity`, `passed_filters` and `reasons` (a list of plain-language strings). Show the reasons for every candidate so the employer sees why someone ranked high. `passed_filters: false` means a must-have is missing.
  - `POST /employer/jobs/{job_id}/matches/recompute` refreshes the ranking.
  - `PUT /employer/jobs/{job_id}/must-haves` with `{must_haves: ["Python", ...]}` sets hard requirements, then recompute.
- Report: `GET /employer/applications/{id}/report`. The report has `overall_score` (1 to 5, or null), `recommendation` (`hire`, `maybe`, `no_hire`, `insufficient_data`), `advice_note`, `coverage`, `strengths`, `concerns`, and `criteria[]`. Each criterion has `key`, `name`, `weight`, `status` (`ok`, `unverified`, `failed`), `score`, `reason` and `evidence[]` of `{turn, quote}`. Report `status` is `pending`, `done` or `failed`. Handle a null score and a 404 when scoring hasn't happened yet.
- Transcript replay: `GET /employer/applications/{id}/replay` returns `turns[]` (`index`, `role`, `text`) and `evidence[]` (`criterion_key`, `criterion_name`, `turn`, `quote`). Clicking an evidence quote in the report must scroll to and highlight that turn in the transcript.
- Re-run scoring: `POST /employer/applications/{id}/rescore`.
- Status history: `GET /employer/applications/{id}/history` returns each change with `from_status`, `to_status`, `actor_role`, `note` and `created_at`.
- Actions: `POST .../shortlist`, `POST .../reject` (both accept an optional `{note}`), `POST /employer/applications/{id}/offer` with `{role_title, rate_amount, rate_period, currency (default INR), start_date, expires_in_days (1 to 30, default 7)}`. The start date can't be in the past.
- Offer and payment views: `GET .../offer` and `GET .../offer/payment`.
- Rubric (optional page): `GET` and `PUT /employer/jobs/{id}/rubric`.

## Interview room (voice)

1. `POST /applications/{application_id}/interview-token` returns `{token, url, room}`.
2. Join the room in the browser with the `livekit-client` package, using that `url` and `token`. Ask for microphone permission first.
3. The AI interviewer joins the room on its own and starts speaking. Play its audio track, and show clearly who is speaking and whether the agent is connected.
4. Show an elapsed-time indicator and a clear End interview button. The interview is limited to about 20 minutes, with a wrap-up warning near the end.
5. The agent saves the transcript to the backend. Nothing needs to be uploaded from the browser.
6. After the interview ends, send the candidate back to their applications page. Status moves to `interviewed` and then `scored` within a short time. The live events below tell the page when it changes.
7. Handle failures gracefully: microphone denied, the agent not joining after about 20 seconds, and a dropped connection.

## Live updates

- `GET /events/stream?token=<jwt>` is server-sent events. Use `EventSource`, with the token as a query parameter because `EventSource` can't set headers.
- Use one shared connection for the whole app, opened when logged in and closed on logout.
- Each message is JSON: `{type: "notification", id, kind, message, data}`.
- Kinds: `shortlisted`, `rejected`, `offer`, `offer_funded`, `offer_expired`, `offer_accepted`, `offer_declined`, `payment_succeeded`, `payment_failed`.
- On any event, refresh the notification count and refetch whatever the current page shows (offers, candidates, payment state) instead of patching local state by hand.

## Payment flow (test mode, fake provider)

1. The employer clicks Fund offer. `POST /employer/applications/{id}/offer/fund` needs an `Idempotency-Key` header (any unique string of 8 to 100 characters, such as a new UUID per click). It returns a payment with `status` and `checkout_url` (like `/pay/pi_fake_...`), which is null once the payment is no longer pending.
2. Send the employer to the frontend route `/pay/[intent]`. This page is our own stand-in for a provider's checkout page. It has a Pay button and a Simulate decline button, which call `POST /fake-provider/intents/{intent}/confirm?outcome=succeeded` or `outcome=failed`. The response is just "processing".
3. Never mark a payment as paid because this call returned or the user was redirected back. The backend confirms the payment through a webhook. The UI changes to paid when the `payment_succeeded` event arrives or `GET .../offer/payment` shows `status: succeeded`.
4. Payment statuses: `pending`, `succeeded`, `failed`, `released` (candidate accepted), `refunded` (offer declined or expired). After a `failed` payment the employer can fund again.
5. Double-clicking the Fund button must not create two payments. Disable it while the request runs.

## Design

Reference mockups live in `design/`. Open them and match them closely. Start with `design/candidate-dashboard.png` (the candidate dashboard). More mockups will be added there for other pages; use the same visual language for any page that has no mockup.

The values below are my estimates from the image. Look at the image yourself and correct them rather than trusting my numbers.

- **Feel:** calm, editorial and premium. Lots of whitespace, soft rounded cards, one strong dark hero card per screen. Light mode only.
- **Background:** warm off-white (about `#F7F7F4`). Cards are white with a 1px light border (about `#E8E8E3`), about 24px corner radius, and no heavy shadows.
- **Dark hero card:** near-black (about `#111111`) with white text, muted gray secondary text, and a rounded radius like the other cards.
- **Buttons:** pill-shaped. Primary is black with white text. Secondary is white with a 1px border. On the dark card, primary is white and secondary is an outlined pill.
- **Accent:** a deep green (about `#1F7A4D`) for progress bars and check icons.
- **Status pills:** small and rounded. "Completed" is light green background with dark green text. "Scheduled" is light blue background with dark blue text. Use the same pattern for other statuses.
- **Typography:** a refined serif for the large page greeting (something like Instrument Serif), and a clean sans (Inter or Geist) for everything else. Small uppercase tracked labels for section captions such as NEXT INTERVIEW and READINESS. Big bold numbers in stat cards.
- **Layout:** fixed left sidebar (about 300px) with line icons and a light gray pill behind the active item, and a user chip with initials at the bottom. Main area has a greeting row with one primary action on the right, then the dark hero card, then a row of three stat cards, then a two-column row of cards, then a full-width table with filter pills.
- **Tables:** quiet headers, thin row dividers, underlined text links for row actions.
- **Component library:** Tailwind with shadcn/ui primitives, restyled to match the above. Icons from Lucide.

### Mockup versus what the backend actually provides

The mockup shows some things the API cannot supply. Never invent or fake data. Build what the API supports, and for the rest either leave that section out or ask me.

| Mockup element | What to do |
|---|---|
| Name "Riya Sharma" | The API only has the email. Use the part before the `@` for the greeting and initials. |
| Next interview card with date, time, company, "30 min" | The API has no scheduling or company name. Show the candidate's applications that are still `applied`, with the job title, location and "about 20 min". "Join interview" goes to the interview room. |
| Readiness checklist | Do these in the browser: microphone permission, a LiveKit connection check, and a quiet-space confirmation checkbox. "Resume uploaded" is true for any application. |
| Interviews completed | Count applications past `applied`. |
| Average score, Profile strength, Skill breakdown, scores and "View feedback" in the history | The report endpoints are employer-only, so candidates cannot see scores or feedback today. Leave these out for now. Do not show placeholder numbers. Tell me when you reach them. |
| "Matched for you" | There is no candidate-side matching endpoint. Show open roles from `GET /jobs` that the candidate hasn't applied to, titled "Open roles", with an Apply button. |
| Interview history table | Use `GET /applications/mine`. Role is the job title (look it up from `GET /jobs`, with a fallback for closed jobs), date is `created_at`, and status maps as: `applied` is Not started, `interviewed` is Processing, anything later is Completed. |
| Sidebar: Dashboard, Interviews, Practice, Results, Profile | Build Dashboard and Interviews. Add Offers and Notifications, which the backend supports. Skip Practice, Results and Profile until the backend has them. |
| "Practice with Iris" button | Not supported. Leave it out. |

## Definition of done for each page

- Works against the live API with a real login, not mocked data.
- Matches the design above.
- Loading, empty and error states are handled.
- Looks right on a phone-sized screen.
- `npm run build` and `npm run lint` pass with no errors.

## Setup notes

- Local dev runs on `http://localhost:3000`, which the API already allows.
- Before deploying, the deployed frontend URL must be added to `CORS_ORIGINS` on the API (a Railway variable), or the browser blocks every call.
- The live database starts empty. Create test accounts through the register page: one employer and one candidate.
