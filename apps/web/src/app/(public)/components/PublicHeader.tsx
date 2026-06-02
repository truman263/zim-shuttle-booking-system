"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Fleet", href: "/fleet" },
    { label: "Travel Guide", href: "/travel-guide" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-6">
        <Link
          href="/"
          aria-label="LadyBird Shuttle Services home"
          className="flex min-w-[160px] items-center transition duration-500 hover:scale-[1.012] hover:opacity-95 sm:min-w-[200px] lg:min-w-[230px]"
        >
          <Image
            src="/brand/ladybird-logo.png"
            alt="LadyBird Shuttle Services"
            width={220}
            height={54}
            priority
            className="h-auto w-[158px] object-contain sm:w-[190px] lg:w-[210px]"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-medium text-neutral-400 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="public-nav-link relative py-2 transition duration-300 hover:-translate-y-0.5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/booking/track"
            className="public-header-action hidden rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/5 sm:inline-flex"
          >
            Track
          </Link>

          <Link
            href="/booking"
            className="public-header-action rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-200 sm:px-6"
          >
            Book Now
          </Link>

          <button
            type="button"
            aria-controls="public-mobile-navigation"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
            className="public-mobile-toggle relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] transition duration-300 hover:border-white/25 hover:bg-white/[0.06] lg:hidden"
          >
            <span className="sr-only">
              {mobileOpen ? "Close menu" : "Open menu"}
            </span>
            <span
              className={[
                "absolute h-px w-5 rounded-full bg-white transition duration-300",
                mobileOpen ? "translate-y-0 rotate-45" : "-translate-y-1.5",
              ].join(" ")}
            />
            <span
              className={[
                "absolute h-px w-5 rounded-full bg-white transition duration-300",
                mobileOpen ? "opacity-0" : "opacity-100",
              ].join(" ")}
            />
            <span
              className={[
                "absolute h-px w-5 rounded-full bg-white transition duration-300",
                mobileOpen ? "translate-y-0 -rotate-45" : "translate-y-1.5",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      <div
        id="public-mobile-navigation"
        className={[
          "public-mobile-nav overflow-hidden border-t border-white/10 transition-all duration-500 lg:hidden",
          mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <nav className="mx-auto grid max-w-7xl gap-0 px-5 py-4 sm:px-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="border-b border-white/10 py-3.5 text-sm font-medium text-neutral-400 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <div className="grid gap-3 pt-5 sm:grid-cols-2">
            <Link
              href="/booking"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Book Now
            </Link>
            <Link
              href="/booking/track"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              Track Booking
            </Link>
          </div>
        </nav>
      </div>

      <style jsx global>{`
        .public-nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.72);
          transform: scaleX(0);
          transform-origin: center;
          opacity: 0;
          transition:
            transform 320ms ease,
            opacity 320ms ease;
        }

        .public-nav-link:hover::after {
          transform: scaleX(1);
          opacity: 1;
        }

        .public-header-action {
          box-shadow: 0 0 0 rgba(255, 255, 255, 0);
        }

        .public-header-action:hover {
          box-shadow: 0 12px 34px rgba(255, 255, 255, 0.08);
        }

        .public-mobile-nav {
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .public-mobile-toggle {
          box-shadow: 0 0 0 rgba(255, 255, 255, 0);
        }

        .public-mobile-toggle:hover {
          box-shadow: 0 12px 34px rgba(255, 255, 255, 0.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .public-nav-link,
          .public-header-action,
          .public-mobile-nav,
          .public-mobile-toggle,
          .public-mobile-toggle span {
            transition: none;
          }

          .public-nav-link:hover,
          .public-header-action:hover,
          .public-mobile-toggle:hover {
            transform: none;
          }
        }
      `}</style>
    </header>
  );
}
