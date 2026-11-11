import { REPORT_CHECKS, SAMPLE_REPORT } from "./content";
import { CheckIcon } from "./icons";
import { s } from "./styles";
import { Eyebrow, SectionTitle } from "./section-heading";

export function ReportSection() {
  const r = SAMPLE_REPORT;
  return (
    <section
      id="reports"
      aria-labelledby="reports-title"
      className="mx-auto flex max-w-[1240px] scroll-mt-24 flex-wrap items-center gap-14 px-[clamp(16px,4vw,40px)] py-[clamp(72px,9vw,120px)]"
    >
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-5">
        <Eyebrow>03 — The report</Eyebrow>
        <SectionTitle id="reports-title">
          Every score points back to a <em>moment.</em>
        </SectionTitle>
        <p className="m-0 max-w-[460px] text-[17px] leading-[1.6] text-(--lp-text-2)">
          When the call ends, the report lands on your dashboard. Each rubric score cites the exact line in the
          transcript that earned it, so you can check the reasoning in seconds.
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
          {REPORT_CHECKS.map((c) => (
            <li key={c} className="flex items-center gap-2.5">
              <CheckIcon />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div
        role="figure"
        aria-label="Sample report"
        className="flex min-w-0 flex-[1.4_1_520px] flex-col gap-6 rounded-[28px] border border-(--lp-line) bg-white p-[clamp(20px,3vw,36px)] shadow-[0_40px_80px_-40px_rgba(18,18,18,0.22)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="self-start text-[12px] font-semibold tracking-[0.06em] text-(--lp-text-2) uppercase">
              Sample report
            </span>
            <span className="text-[20px] font-semibold">{r.candidate}</span>
            <span className="text-[14px] text-(--lp-text-2)">{r.meta}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1">
              <span className={`${s.serif} text-[56px] leading-none`}>{r.score}</span>
              <span className="text-[14px] text-(--lp-text-2)">/ 5</span>
            </div>
            <span className="rounded-full bg-(--lp-ink) px-3.5 py-2 text-[13px] font-medium text-(--lp-bg)">
              {r.recommendation}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          {r.criteria.map((c, i) => (
            <div
              key={c.name}
              className={`flex flex-col gap-2.5 border-t border-(--lp-sand) pt-4 ${i < r.criteria.length - 1 ? "pb-4" : ""}`}
            >
              <div className="flex items-center gap-3.5">
                <span className="flex-[0_0_150px] text-[15px] font-medium max-[420px]:flex-[0_0_120px]">{c.name}</span>
                <span
                  role="meter"
                  aria-label={`${c.name} score`}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={Number(c.score)}
                  className="flex h-1.5 flex-auto rounded-md bg-(--lp-sand)"
                >
                  <span className="rounded-md bg-(--lp-ink)" style={{ width: `${c.pct}%` }} />
                </span>
                <span className={`${s.mono} flex-[0_0_32px] text-right text-[13px]`}>{c.score}</span>
              </div>
              <div className="flex items-baseline gap-2.5 text-[14px] text-(--lp-text-3)">
                <span className={`${s.mono} flex-none rounded-md bg-(--lp-bg) px-[7px] py-[3px] text-[11px]`}>{c.time}</span>
                <span className={`${s.serif} text-[18px] leading-[1.35] italic`}>&quot;{c.quote}&quot;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
