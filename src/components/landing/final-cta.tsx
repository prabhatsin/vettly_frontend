import Link from "next/link";
import { FINAL_CTA } from "./content";
import { MicIcon } from "./icons";
import { s } from "./styles";

export function FinalCta() {
  return (
    <section
      id="start"
      aria-labelledby="start-title"
      className="mx-auto flex max-w-[1240px] scroll-mt-24 flex-col items-center gap-8 px-[clamp(16px,4vw,40px)] py-[clamp(80px,10vw,144px)] text-center"
    >
      <Link
        href={FINAL_CTA.primary.href}
        aria-label="Start a sample interview with Iris"
        className="relative flex size-[120px] rounded-full no-underline"
      >
        <span className={`${s.ring} absolute inset-0 rounded-full border border-(--lp-ink)`} />
        <span className={`${s.ring2} absolute inset-0 rounded-full border border-(--lp-ink)`} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-(--lp-ink) text-(--lp-bg)">
          <MicIcon />
        </span>
      </Link>
      <h2
        id="start-title"
        className={`${s.serif} m-0 max-w-[900px] text-[clamp(44px,6.4vw,96px)] leading-[0.98] font-normal tracking-[-0.035em]`}
      >
        Your next hire is one <em>conversation</em> away.
      </h2>
      <p className="m-0 max-w-[520px] text-[18px] leading-[1.6] text-(--lp-text-2)">{FINAL_CTA.text}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={FINAL_CTA.primary.href}
          className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-(--lp-ink) px-7 text-[16px] font-medium text-(--lp-bg) no-underline"
        >
          {FINAL_CTA.primary.label}
        </Link>
        <Link
          href={FINAL_CTA.secondary.href}
          className="inline-flex min-h-[52px] items-center rounded-full border border-(--lp-ink) bg-transparent px-[26px] text-[16px] font-medium text-(--lp-ink) no-underline"
        >
          {FINAL_CTA.secondary.label}
        </Link>
      </div>
    </section>
  );
}
