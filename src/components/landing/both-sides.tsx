import { CANDIDATE_STEPS, TEAM_STEPS } from "./content";
import { s } from "./styles";
import { Eyebrow, SectionTitle } from "./section-heading";

function Steps({
  title,
  steps,
  light,
}: {
  title: string;
  steps: { title: string; text: string }[];
  light: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-[1_1_420px] flex-col gap-2 rounded-[28px] p-[clamp(24px,3vw,40px)] ${
        light ? "bg-(--lp-bg) text-(--lp-ink)" : "border border-(--lp-dark-line)"
      }`}
    >
      <h3
        className={`m-0 mb-4 text-[14px] font-semibold tracking-[0.08em] uppercase ${
          light ? "text-(--lp-text-2)" : "text-(--lp-dark-cap)"
        }`}
      >
        {title}
      </h3>
      <ol className="m-0 list-none p-0">
        {steps.map((st, i) => (
          <li
            key={st.title}
            className={`flex gap-5 border-t pt-[18px] ${i < steps.length - 1 ? "pb-[18px]" : ""} ${
              light ? "border-(--lp-dash)" : "border-(--lp-dark-line)"
            }`}
          >
            <span className={`${s.serif} flex-[0_0_44px] text-[32px] leading-none`} aria-hidden="true">
              0{i + 1}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-[18px] font-medium">{st.title}</span>
              <span className={`text-[15px] leading-[1.55] ${light ? "text-(--lp-text-2)" : "text-(--lp-dark-cap)"}`}>
                {st.text}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function BothSides() {
  return (
    <section id="sides" aria-labelledby="sides-title" className={`${s.dark} scroll-mt-24 bg-(--lp-ink) text-(--lp-bg)`}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-14 px-[clamp(16px,4vw,40px)] py-[clamp(72px,9vw,128px)]">
        <div className="flex max-w-[760px] flex-col gap-4">
          <Eyebrow dark>04 — Both sides</Eyebrow>
          <SectionTitle id="sides-title">
            Two sides of the <em>same table.</em>
          </SectionTitle>
        </div>
        <div className="flex flex-wrap gap-5">
          <Steps title="For candidates" steps={CANDIDATE_STEPS} light={false} />
          <Steps title="For hiring teams" steps={TEAM_STEPS} light />
        </div>
      </div>
    </section>
  );
}
