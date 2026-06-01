"use client";

import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Fleet", href: "/#fleet" },
    { label: "Routes", href: "/#routes" },
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
        </div>
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

        @media (prefers-reduced-motion: reduce) {
          .public-nav-link,
          .public-header-action {
            transition: none;
          }

          .public-nav-link:hover,
          .public-header-action:hover {
            transform: none;
          }
        }
      `}</style>
    </header>
  );
}
