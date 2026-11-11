import { HERO } from "./content";
import { HeroSide } from "./hero-side";
import { CheckIcon } from "./icons";
import { InterviewCard } from "./interview-card";
import { s } from "./styles";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="mx-auto flex max-w-[1240px] scroll-mt-24 flex-wrap items-center gap-14 px-[clamp(16px,4vw,40px)] pt-[clamp(32px,6vw,80px)] pb-[88px]"
    >
      <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-7">
        <span className="inline-flex items-center gap-2.5 self-start rounded-full border border-(--lp-line) bg-white py-2 pr-4 pl-3 text-[13px] font-medium text-(--lp-text-3)">
          <span className="relative inline-block size-2" aria-hidden="true">
            <span className={`${s.ring} absolute inset-0 rounded-full bg-(--lp-ink)`} />
            <span className="absolute inset-0 rounded-full bg-(--lp-ink)" />
          </span>
          {HERO.badge}
        </span>
        <h1
          id="hero-title"
          className={`${s.serif} m-0 text-[clamp(52px,7.2vw,104px)] leading-[0.95] font-normal tracking-[-0.035em]`}
        >
          Hire from the <em className="italic">conversation,</em> not the keyword.
        </h1>

        <HeroSide />

        <ul className="m-0 flex list-none flex-wrap gap-x-[22px] gap-y-2.5 p-0 text-[14px] text-(--lp-text-2)">
          {HERO.checks.map((c) => (
            <li key={c} className="inline-flex items-center gap-2">
              <span className="inline-flex text-(--lp-ink)">
                <CheckIcon />
              </span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 flex-[1_1_480px]">
        <InterviewCard />
      </div>
    </section>
  );
}
