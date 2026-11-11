import { s } from "./styles";

/** Mono "NN — Label" eyebrow used above each numbered section heading. */
export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`${s.mono} text-[13px] ${dark ? "text-(--lp-dark-cap)" : "text-(--lp-text-2)"}`}>{children}</span>
  );
}

export function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className={`${s.serif} m-0 text-[clamp(40px,5.4vw,72px)] leading-none font-normal tracking-[-0.03em]`}>
      {children}
    </h2>
  );
}
