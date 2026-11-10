"use client";

import { cn } from "@/lib/utils";

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm transition-colors sm:h-11 sm:px-5",
              active
                ? "border-hero bg-hero text-white"
                : "border-border bg-card text-foreground/80 hover:bg-muted",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("tabular-nums", active ? "text-white/70" : "text-muted-foreground")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
