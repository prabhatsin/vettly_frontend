"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import type { ReplayOut } from "@/lib/types";
import type { ApiResource } from "@/lib/use-api";
import { cn } from "@/lib/utils";

export interface TranscriptHandle {
  /** Scrolls to a turn and highlights it (and the quote, if found). */
  focus: (turn: number, quote?: string) => void;
}

function isInterviewer(role: string) {
  return ["interviewer", "assistant", "agent"].includes(role.toLowerCase());
}

/** Wraps the first occurrence of `quote` in a <mark>. */
function Highlighted({ text, quote }: { text: string; quote: string | null }) {
  if (!quote) return <>{text}</>;
  const i = text.toLowerCase().indexOf(quote.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-[#fde9a8] px-0.5 text-foreground">{text.slice(i, i + quote.length)}</mark>
      {text.slice(i + quote.length)}
    </>
  );
}

export const TranscriptPanel = forwardRef<
  TranscriptHandle,
  { replay: ApiResource<ReplayOut>; className?: string }
>(function TranscriptPanel({ replay, className }, ref) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{ turn: number; quote: string | null } | null>(null);

  useImperativeHandle(ref, () => ({
    focus(turn, quote) {
      setActive({ turn, quote: quote ?? null });
      const el = scroller.current?.querySelector<HTMLElement>(`[data-turn="${turn}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    },
  }));

  const evidenceByTurn = new Map<number, string[]>();
  replay.data?.evidence.forEach((e) => {
    const list = evidenceByTurn.get(e.turn) ?? [];
    if (!list.includes(e.criterion_name)) list.push(e.criterion_name);
    evidenceByTurn.set(e.turn, list);
  });

  return (
    <section
      className={cn("flex flex-col overflow-hidden rounded-3xl border border-border bg-card", className)}
      aria-label="Interview transcript"
    >
      <div className="border-b border-border px-6 py-5 sm:px-7">
        <h2 className="text-[1.2rem] font-semibold">Transcript</h2>
        <p className="mt-1 text-sm text-muted-foreground">Click a quote in the report to jump to it here.</p>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {replay.loading ? (
          <LoadingRows rows={5} />
        ) : replay.error && !replay.data ? (
          <ErrorState message={replay.error.message} onRetry={replay.reload} className="border-0" />
        ) : !replay.data || replay.data.turns.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="No transcript yet"
            description="It appears here after the candidate finishes the interview."
          />
        ) : (
          <ol className="flex flex-col gap-1">
            {replay.data.turns.map((t) => {
              const iris = isInterviewer(t.role);
              const isActive = active?.turn === t.index;
              const tags = evidenceByTurn.get(t.index);
              return (
                <li
                  key={t.index}
                  data-turn={t.index}
                  tabIndex={-1}
                  className={cn(
                    "scroll-mt-4 rounded-2xl px-3 py-3 outline-none transition-colors",
                    isActive && "bg-[#fdf6dc] ring-1 ring-[#f0d77a]",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
                        iris ? "bg-hero text-white" : "bg-pill-blue text-pill-blue-foreground",
                      )}
                    >
                      {iris ? "Iris" : "Candidate"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">Turn {t.index}</span>
                    {tags?.map((name) => (
                      <span key={name} className="text-xs text-pill-green-foreground">
                        · {name}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed">
                    <Highlighted text={t.text} quote={isActive ? (active?.quote ?? null) : null} />
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
});
