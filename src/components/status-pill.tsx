import type { Tone } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONES: Record<Tone, string> = {
  green: "bg-pill-green text-pill-green-foreground",
  blue: "bg-pill-blue text-pill-blue-foreground",
  amber: "bg-pill-amber text-pill-amber-foreground",
  red: "bg-pill-red text-pill-red-foreground",
  gray: "bg-pill-gray text-pill-gray-foreground",
  dark: "bg-hero text-white",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[0.8rem] font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
