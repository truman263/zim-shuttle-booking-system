"use client";

import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/#services" },
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
          className="flex min-w-[160px] items-center sm:min-w-[200px] lg:min-w-[230px]"
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
              className="transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/booking/track"
            className="hidden rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5 sm:inline-flex"
          >
            Track
          </Link>

          <Link
            href="/booking"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 sm:px-6"
          >
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
}
