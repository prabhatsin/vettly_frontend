import { INTERVIEW_PLAN } from "./content";
import { s } from "./styles";
import { Eyebrow, SectionTitle } from "./section-heading";

export function MeetIris() {
  return (
    <section
      id="iris"
      aria-labelledby="iris-title"
      className="mx-auto flex max-w-[1240px] scroll-mt-24 flex-col gap-12 px-[clamp(16px,4vw,40px)] pt-[clamp(72px,9vw,120px)] pb-10"
    >
      <div className="flex max-w-[820px] flex-col gap-4">
        <Eyebrow>02 — Meet Iris</Eyebrow>
        <SectionTitle id="iris-title">
          Built to sound like a good interviewer, <em>not a form.</em>
        </SectionTitle>
      </div>

      <div className="flex flex-wrap gap-5">
        <article className="flex min-w-0 flex-[2_1_560px] flex-wrap items-start gap-8 rounded-[28px] bg-(--lp-ink) p-[clamp(24px,3vw,40px)] text-(--lp-bg)">
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5">
            <h3 className={`${s.serif} m-0 text-[36px] leading-[1.05] font-normal`}>Reads the résumé before she says hello.</h3>
            <p className="m-0 text-[16px] leading-[1.6] text-(--lp-dark-text)">
              Iris builds an interview plan from the candidate&apos;s résumé and your job description, so every question
              is about their actual work.
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5 rounded-[20px] border border-(--lp-dark-line) bg-(--lp-dark-box) p-5 text-[14px]">
            <span className={`${s.mono} text-[12px] text-(--lp-dark-cap)`}>interview_plan</span>
            {INTERVIEW_PLAN.map((p, i) => (
              <div
                key={p.label}
                className={`flex flex-col gap-1 ${i < INTERVIEW_PLAN.length - 1 ? "border-b border-(--lp-dark-line) pb-3" : ""}`}
              >
                <span className="text-[12px] text-(--lp-dark-cap)">{p.label}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-[28px] border border-(--lp-line) bg-white p-8">
          <div aria-hidden="true" className="mb-2 flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-16 text-[12px] text-(--lp-text-2)">Iris</span>
              <span className="h-2.5 w-[46%] rounded-md bg-(--lp-ink)" />
              <span className="h-2.5 w-[14%] rounded-md bg-(--lp-line)" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-16 text-[12px] text-(--lp-text-2)">You</span>
              <span className="h-2.5 w-[30%] rounded-md bg-transparent" />
              <span className="h-2.5 w-[38%] rounded-md bg-(--lp-gray)" />
            </div>
          </div>
          <h3 className="m-0 text-[22px] font-semibold tracking-[-0.01em]">Lets you interrupt</h3>
          <p className="m-0 text-[16px] leading-[1.6] text-(--lp-text-2)">
            Cut in, pause to think, or ask her to repeat the question. Iris stops, listens, and picks the thread back up.
          </p>
        </article>

        <article className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-[28px] border border-(--lp-line) bg-white p-8">
          <span className={`${s.mono} mb-2 self-start rounded-lg bg-(--lp-bg) px-2.5 py-1.5 text-[12px]`}>
            Reconnected · resuming at 14:02
          </span>
          <h3 className="m-0 text-[22px] font-semibold tracking-[-0.01em]">Survives a dropped call</h3>
          <p className="m-0 text-[16px] leading-[1.6] text-(--lp-text-2)">
            If the connection drops, the interview resumes where it stopped, with the transcript and plan intact.
          </p>
        </article>

        <article className="flex min-w-0 flex-[2_1_560px] flex-wrap items-center gap-x-10 gap-y-6 rounded-[28px] bg-(--lp-sand) p-[clamp(24px,3vw,40px)]">
          <h3 className={`${s.serif} m-0 flex-[1_1_260px] text-[36px] leading-[1.05] font-normal`}>
            Same rubric for every candidate.
          </h3>
          <p className="m-0 flex-[1_1_260px] text-[16px] leading-[1.6] text-(--lp-text-3)">
            Every applicant for a role is scored against the same role-specific rubric, so your shortlist compares like
            with like, not whoever interviewed on a good day.
          </p>
        </article>
      </div>
    </section>
  );
}
