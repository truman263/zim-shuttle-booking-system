"use client";

import Image from "next/image";
import Link from "next/link";
import { FloatingWhatsAppAgent } from "./FloatingWhatsAppAgent";

export function PublicFooter() {
  const year = new Date().getFullYear();

  const exploreLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Fleet", href: "/fleet" },
    { label: "Travel Guide", href: "/travel-guide" },
  ];

  const bookingLinks = [
    { label: "Book Now", href: "/booking" },
    { label: "Track Booking", href: "/booking/track" },
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
        className="border-t border-white/10 bg-black px-5 py-12 text-white sm:px-6 lg:py-14"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1fr]">
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
              Premium shuttle booking support for airport transfers, corporate
              transport, private hire and custom route requests across
              Zimbabwe.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-500">
              Explore
            </p>
            <nav className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-neutral-400 lg:grid-cols-1">
              {exploreLinks.map((item) => (
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
              Bookings
            </p>
            <nav className="mt-5 grid gap-3 text-sm text-neutral-400">
              {bookingLinks.map((item) => (
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

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs leading-6 text-neutral-500 lg:flex-row lg:items-center lg:justify-between">
          <p>&copy; {year} All Rights Reserved | LadyBird Shuttle Services</p>
          <p>
            Developed & Powered by{" "}
            <a
              href="https://truman.co.zw"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-300 transition hover:text-white"
            >
              Tirivsdhe Marinda
            </a>
          </p>
        </div>
      </footer>

      <FloatingWhatsAppAgent />
    </>
  );
}
