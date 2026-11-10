"use client";

import { Check, Circle, Loader2, X } from "lucide-react";
import type { CheckState } from "@/lib/readiness";
import { cn } from "@/lib/utils";

function Icon({ state }: { state: CheckState | boolean }) {
  if (state === "running")
    return <Loader2 className="size-[22px] animate-spin text-hero-muted" strokeWidth={1.6} />;
  if (state === true || state === "ok") {
    return (
      <span className="inline-flex size-[22px] items-center justify-center rounded-full border-[1.6px] border-hero-check text-hero-check">
        <Check className="size-3" strokeWidth={2.6} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="inline-flex size-[22px] items-center justify-center rounded-full border-[1.6px] border-[#f2a59b] text-[#f2a59b]">
        <X className="size-3" strokeWidth={2.6} />
      </span>
    );
  }
  return <Circle className="size-[22px] text-hero-muted/70" strokeWidth={1.6} />;
}

export interface ReadinessItem {
  label: string;
  state: CheckState | boolean;
  /** Runs the check, or toggles a confirmation. */
  onClick?: () => void;
  hint?: string;
}

/** Readiness checklist for the dark hero card. */
export function ReadinessList({ items }: { items: ReadinessItem[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const content = (
          <>
            <Icon state={item.state} />
            <span className="text-[0.98rem] text-white">{item.label}</span>
            {item.hint && <span className="ml-auto text-xs text-hero-caption">{item.hint}</span>}
          </>
        );
        return (
          <li key={item.label}>
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                disabled={item.state === "running"}
                className={cn(
                  "-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none",
                )}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-3.5 py-2">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
