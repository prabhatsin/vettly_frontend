import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-[10px] bg-hero font-serif text-[1.35rem] leading-none text-white",
        className,
      )}
    >
      V
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark />
      <span className="text-[1.15rem] font-semibold tracking-tight">Vettly</span>
    </Link>
  );
}
