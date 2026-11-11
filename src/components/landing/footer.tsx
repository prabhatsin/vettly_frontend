import Link from "next/link";
import { FOOTER_COLUMNS } from "./content";
import { s } from "./styles";
import { Brand } from "./navbar";

export function Footer() {
  return (
    <footer className="border-t border-(--lp-line)">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-[clamp(16px,4vw,40px)] pt-14 pb-10">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <Brand />
            </div>
            <p className="m-0 max-w-[280px] text-[15px] leading-[1.55] text-(--lp-text-2)">
              Voice interviews, scored with evidence.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-16 gap-y-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3 text-[15px]">
                <span className="text-[12px] font-semibold tracking-[0.08em] text-(--lp-text-2) uppercase">{col.title}</span>
                {col.links.map((l) =>
                  l.href.startsWith("/") ? (
                    <Link key={l.label} href={l.href} className={s.navlink}>
                      {l.label}
                    </Link>
                  ) : (
                    <a key={l.label} href={l.href} className={s.navlink}>
                      {l.label}
                    </a>
                  ),
                )}
              </div>
            ))}
          </nav>
        </div>
        <div
          aria-hidden="true"
          className={`${s.serif} overflow-hidden text-[clamp(96px,22vw,320px)] leading-[0.8] tracking-[-0.05em] text-(--lp-ink)`}
        >
          Vettly
        </div>
        <div className="flex flex-wrap justify-between gap-3 text-[13px] text-(--lp-text-2)">
          <span>© 2026 Vettly</span>
          <span>Interviews by Iris</span>
        </div>
      </div>
    </footer>
  );
}
