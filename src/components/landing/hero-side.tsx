"use client";

import Link from "next/link";
import { useState } from "react";
import { HERO, type Side } from "./content";
import { ArrowIcon, PlayIcon } from "./icons";

const SIDES: { id: Side; label: string }[] = [
  { id: "hire", label: "I'm hiring" },
  { id: "candidate", label: "I'm interviewing" },
];

/** The "I'm hiring / I'm interviewing" toggle and the copy and CTAs it switches. */
export function HeroSide() {
  const [side, setSide] = useState<Side>("hire");
  const copy = HERO.sides[side];

  return (
    <>
      <div role="group" aria-label="Choose your side" className="inline-flex gap-1 self-start rounded-full bg-(--lp-sand) p-1">
        {SIDES.map((o) => {
          const active = o.id === side;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSide(o.id)}
              className={`min-h-11 cursor-pointer rounded-full border-0 px-[18px] text-[14px] font-medium ${
                active ? "bg-(--lp-ink) text-(--lp-bg)" : "bg-transparent text-(--lp-text-3)"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <p className="m-0 max-w-[520px] text-[19px] leading-[1.55] text-(--lp-text-2)">{copy.text}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={copy.primary.href}
          className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-(--lp-ink) px-[26px] text-[16px] font-medium text-(--lp-bg) no-underline"
        >
          {copy.primary.label}
          <ArrowIcon />
        </Link>
        <a
          href={copy.secondary.href}
          className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full border border-(--lp-ink) bg-transparent px-6 text-[16px] font-medium text-(--lp-ink) no-underline"
        >
          {copy.secondary.play && <PlayIcon />}
          {copy.secondary.label}
        </a>
      </div>
    </>
  );
}
