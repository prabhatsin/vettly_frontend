import { Fragment } from "react";
import { QUOTES } from "./content";
import { s } from "./styles";

function Dot() {
  return <span aria-hidden="true" className="inline-block size-2 shrink-0 rounded-full bg-(--lp-bg)" />;
}

export function QuoteMarquee() {
  return (
    <section aria-label="Questions Iris asks" className="overflow-hidden bg-(--lp-ink) py-[26px] text-(--lp-bg)">
      {/* Two copies of the list; the track slides by half its width for a seamless loop.
          The trailing padding matches the gap so both halves are exactly equal. */}
      <div
        className={`${s.track} ${s.serif} flex w-max items-center gap-10 pr-10 text-[clamp(24px,2.6vw,34px)] whitespace-nowrap italic`}
      >
        {[false, true].map((copy) => (
          <Fragment key={String(copy)}>
            {QUOTES.map((q) => (
              <Fragment key={q}>
                <span aria-hidden={copy || undefined}>&quot;{q}&quot;</span>
                <Dot />
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
