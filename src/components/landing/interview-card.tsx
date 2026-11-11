"use client";

import { useState } from "react";
import { DEFAULT_STAGE, STAGES, WAVE_BARS } from "./content";
import { ArrowIcon, CheckIcon } from "./icons";
import { s } from "./styles";

/** The live interview mock in the hero. Each round tab swaps the timer, transcript and signals. */
export function InterviewCard() {
  const [stage, setStage] = useState(DEFAULT_STAGE);
  const cur = STAGES[stage];

  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-(--lp-line) bg-white p-[clamp(18px,2.4vw,28px)] shadow-[0_40px_80px_-40px_rgba(18,18,18,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[13px] font-medium">
          <span className={`${s.live} inline-block size-2 rounded-full bg-(--lp-live)`} aria-hidden="true" />
          <span>Live</span>
          <span className="text-(--lp-muted)" aria-hidden="true">
            ·
          </span>
          <span className="text-(--lp-text-2)">Senior Backend Engineer</span>
        </div>
        <span
          className={`${s.mono} rounded-lg bg-(--lp-bg) px-2.5 py-1.5 text-[13px] text-(--lp-text-2)`}
          aria-label={`Elapsed time ${cur.timer}`}
        >
          {cur.timer}
        </span>
      </div>

      <div className="flex items-center gap-[18px]">
        <div className="relative size-16 flex-[0_0_64px]" aria-hidden="true">
          <span className={`${s.ring} absolute inset-0 rounded-full border border-(--lp-ink)`} />
          <span className={`${s.ring2} absolute inset-0 rounded-full border border-(--lp-ink)`} />
          <span
            className={`${s.serif} absolute inset-0 flex items-center justify-center rounded-full bg-(--lp-ink) text-[32px] text-(--lp-bg) italic`}
          >
            I
          </span>
        </div>
        <div className="flex flex-none flex-col gap-0.5">
          <span className={`${s.serif} text-[26px] leading-none`}>Iris</span>
          <span className="text-[13px] text-(--lp-text-2)">{cur.role}</span>
        </div>
        <div aria-hidden="true" className="flex h-12 min-w-0 flex-auto items-center justify-end gap-[3px] overflow-hidden">
          {WAVE_BARS.map((h, i) => (
            <span key={i} className={`${s.bar} w-[3px] flex-[0_0_3px] rounded-[2px] bg-(--lp-ink)`} style={{ height: h }} />
          ))}
        </div>
      </div>

      <div role="group" aria-label="Interview round" className="flex gap-1.5 rounded-full bg-(--lp-bg) p-1">
        {STAGES.map((st, i) => {
          const active = i === stage;
          return (
            <button
              key={st.name}
              type="button"
              aria-pressed={active}
              onClick={() => setStage(i)}
              className={`flex min-h-11 min-w-0 flex-[1_1_0] cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 px-2 text-[13px] font-medium ${
                active ? "bg-(--lp-ink) text-(--lp-bg)" : "bg-transparent text-(--lp-text-3)"
              }`}
            >
              <span className={`${s.mono} text-[11px] ${active ? "opacity-70" : "text-(--lp-muted)"}`}>0{i + 1}</span>
              {st.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 px-0.5 py-1">
        {cur.lines.map((l) =>
          l.iris ? (
            <div key={l.time} className="flex items-start gap-3.5">
              <span className={`${s.mono} flex-[0_0_40px] pt-1.5 text-[11px] text-(--lp-muted)`}>{l.time}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[12px] font-semibold tracking-[0.06em] uppercase">Iris</span>
                <span className={`${s.serif} text-[22px] leading-[1.25]`}>{l.text}</span>
              </div>
            </div>
          ) : (
            <div key={l.time} className="flex items-start gap-3.5">
              <span className={`${s.mono} flex-[0_0_40px] pt-1 text-[11px] text-(--lp-muted)`}>{l.time}</span>
              <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-(--lp-bg) px-4 py-3">
                <span className="text-[12px] font-semibold tracking-[0.06em] text-(--lp-text-2) uppercase">Candidate</span>
                <span className="text-[15px] leading-normal text-(--lp-cand)">{l.text}</span>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-dashed border-(--lp-dash) pt-4">
        <span className="text-[12px] font-semibold tracking-[0.06em] text-(--lp-text-2) uppercase">Signals noted</span>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {cur.signals.map((sig) => (
            <li key={sig} className="inline-flex items-center gap-1.5 rounded-full border border-(--lp-line) px-3 py-1.5 text-[13px]">
              <CheckIcon size={12} strokeWidth={2.4} />
              {sig}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-(--lp-ink) px-[18px] py-3.5 text-[14px] text-(--lp-bg)">
        <span>{cur.handoff}</span>
        <ArrowIcon />
      </div>
    </div>
  );
}
