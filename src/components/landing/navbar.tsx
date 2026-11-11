import Link from "next/link";
import { AuthCta } from "./auth-cta";
import { NAV_LINKS, ROUTES } from "./content";
import { MobileMenu } from "./mobile-menu";
import { s } from "./styles";

export function Brand() {
  return (
    <>
      <span
        aria-hidden="true"
        className={`${s.serif} flex size-9 items-center justify-center rounded-[10px] bg-(--lp-ink) text-[24px] leading-none text-(--lp-bg)`}
      >
        V
      </span>
      <span className="text-[18px] font-semibold tracking-[-0.01em]">Vettly</span>
    </>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-(--lp-bg)/90 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-[clamp(16px,4vw,40px)] py-[22px]">
        <a href="#top" className="flex items-center gap-3 text-(--lp-ink) no-underline" aria-label="Vettly home">
          <Brand />
        </a>
        <nav aria-label="Primary" className="hidden gap-8 text-[15px] min-[821px]:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} className={s.navlink} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.signIn}
            className="inline-flex min-h-11 items-center px-4 text-[15px] font-medium text-(--lp-ink) no-underline max-[480px]:hidden"
          >
            Sign in
          </Link>
          <AuthCta className="inline-flex min-h-11 items-center rounded-full bg-(--lp-ink) px-[22px] text-[15px] font-medium whitespace-nowrap text-(--lp-bg) no-underline" />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
