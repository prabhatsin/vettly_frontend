"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthCta } from "./auth-cta";
import { NAV_LINKS, ROUTES } from "./content";
import { MenuIcon } from "./icons";
import { s } from "./styles";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 820) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="landing-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-(--lp-line) bg-white text-(--lp-ink) min-[821px]:hidden"
      >
        <MenuIcon open={open} />
      </button>
      {open && (
        <nav
          id="landing-mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full border-b border-(--lp-line) bg-(--lp-bg) px-[clamp(16px,4vw,40px)] pt-2 pb-6 min-[821px]:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <li key={l.href} className="border-b border-(--lp-line)">
                <a href={l.href} onClick={close} className={`${s.navlink} flex min-h-[52px] items-center text-[17px]`}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={ROUTES.signIn}
              onClick={close}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-(--lp-ink) px-5 text-[15px] font-medium no-underline"
            >
              Sign in
            </Link>
            <AuthCta
              onNavigate={close}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-(--lp-ink) px-5 text-[15px] font-medium text-(--lp-bg) no-underline"
            />
          </div>
        </nav>
      )}
    </>
  );
}
