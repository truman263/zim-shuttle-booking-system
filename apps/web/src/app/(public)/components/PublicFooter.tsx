"use client";

import Image from "next/image";
import Link from "next/link";
import { FloatingWhatsAppAgent } from "./FloatingWhatsAppAgent";

export function PublicFooter() {
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/#services" },
    { label: "Fleet", href: "/#fleet" },
    { label: "Routes", href: "/#routes" },
    { label: "Contact", href: "/#contact" },
  ];

  const services = [
    "Airport transfers",
    "Private shuttle hire",
    "Corporate travel",
    "Custom Zimbabwe routes",
  ];

  return (
    <>
      <footer
        id="contact"
        className="border-t border-white/10 bg-black px-5 py-12 text-white sm:px-6"
      >
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" aria-label="LadyBird Shuttle Services home">
              <Image
                src="/brand/ladybird-logo.png"
                alt="LadyBird Shuttle Services"
                width={210}
                height={54}
                className="h-auto w-[170px] object-contain"
              />
            </Link>

            <p className="mt-5 max-w-md text-sm font-light leading-7 text-neutral-400">
              Premium shuttle services for airport transfers, corporate travel,
              private hire and custom routes across Zimbabwe.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/booking"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Book Now
              </Link>
              <Link
                href="/booking/track"
                className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white"
              >
                Track Booking
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-500">
              Quick Links
            </p>
            <nav className="mt-5 grid gap-3 text-sm text-neutral-400">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-500">
              Services
            </p>
            <div className="mt-5 grid gap-3 text-sm text-neutral-400">
              {services.map((service) => (
                <p key={service}>{service}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p>LadyBird Shuttle Services</p>
          <p>Zimbabwe shuttle and airport transfer bookings</p>
        </div>
      </footer>

      <FloatingWhatsAppAgent />
    </>
  );
}
