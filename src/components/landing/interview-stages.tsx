import { INTERVIEW_ROUNDS } from "./content";
import { ArrowIcon } from "./icons";
import { s } from "./styles";
import { Eyebrow, SectionTitle } from "./section-heading";

export function InterviewStages() {
  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="mx-auto flex max-w-[1240px] scroll-mt-24 flex-col gap-12 px-[clamp(16px,4vw,40px)] pt-[clamp(72px,9vw,128px)] pb-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-6">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
          <Eyebrow>01 — The interview</Eyebrow>
          <SectionTitle id="how-title">
            One conversation. <em>Three</em> interviewers.
          </SectionTitle>
        </div>
        <p className="m-0 max-w-[420px] flex-[1_1_320px] text-[17px] leading-[1.6] text-(--lp-text-2)">
          Iris hands the call between specialist agents as it goes. Context travels with every handoff, so no candidate
          has to repeat themselves.
        </p>
      </div>

      <div className="flex flex-wrap gap-5">
        {INTERVIEW_ROUNDS.map((r, i) => {
          const dark = i === INTERVIEW_ROUNDS.length - 1;
          return (
            <article
              key={r.num}
              className={`flex min-w-0 flex-[1_1_300px] flex-col gap-[18px] rounded-3xl p-7 ${
                dark ? `${s.dark} bg-(--lp-ink) text-(--lp-bg)` : "border border-(--lp-line) bg-white"
              }`}
            >
              <div className="flex gap-1.5" aria-hidden="true">
                {INTERVIEW_ROUNDS.map((_, j) => (
                  <span
                    key={j}
                    className={`h-1 flex-1 rounded-[4px] ${
                      dark ? "bg-(--lp-bg)" : j <= i ? "bg-(--lp-ink)" : "bg-(--lp-line)"
                    }`}
                  />
                ))}
              </div>
              <span className={`${s.serif} text-[64px] leading-none`} aria-hidden="true">
                {r.num}
              </span>
              <h3 className="m-0 text-[22px] font-semibold tracking-[-0.01em]">{r.title}</h3>
              <p className={`m-0 text-[16px] leading-[1.6] ${dark ? "text-(--lp-dark-text)" : "text-(--lp-text-2)"}`}>
                {r.text}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 text-[14px] font-medium">
                {r.next}
                <ArrowIcon size={14} />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
