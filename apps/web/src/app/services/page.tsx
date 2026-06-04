import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicFooter } from "../(public)/components/PublicFooter";
import { PublicHeader } from "../(public)/components/PublicHeader";

export const metadata: Metadata = {
  title:
    "LadyBird Shuttle Services | Airport Transfers, Corporate Transport & Private Shuttle Hire",
  description:
    "Explore LadyBird Shuttle Services for Harare airport transfers, corporate transport, private shuttle hire and custom route requests across Zimbabwe.",
};

const services = [
  {
    title: "Airport Transfers",
    description:
      "Airport pickup and drop-off support for Robert Gabriel Mugabe International Airport, arranged around arrival time, passenger details and luggage notes.",
    bestFor: "airport arrivals, departures, visiting guests and business travellers.",
  },
  {
    title: "Corporate Transport",
    description:
      "Professional transport support for meetings, business visitors, executive movement, team travel and scheduled company trips.",
    bestFor: "meetings, staff movement, conferences and business visitors.",
  },
  {
    title: "Private Shuttle Hire",
    description:
      "Comfortable private shuttle hire for individuals, families and small groups that need planned, reliable transport.",
    bestFor: "family travel, private errands, events and group movement.",
  },
  {
    title: "Custom Route Requests",
    description:
      "Customers can submit their own pickup and destination when the journey does not match a saved route.",
    bestFor: "city-to-city trips, special destinations and flexible Zimbabwe routes.",
  },
];

const serviceDetails = [
  {
    label: "01",
    title: "Route and passenger details",
    text: "Customers submit pickup, destination, travel date, passenger count and notes so the trip request is clear from the beginning.",
  },
  {
    label: "02",
    title: "Fare and availability confirmation",
    text: "The team reviews the journey, checks availability and confirms the route details and fare before travel.",
  },
  {
    label: "03",
    title: "Booking reference and status tracking",
    text: "Every confirmed request can be followed online using the booking reference for trip, payment and status updates.",
  },
];

const travelComfortPoints = [
  "Clean passenger spaces",
  "Practical luggage consideration",
  "Vehicle assignment for confirmed trips",
];

export default function ServicesPage() {
  return (
    <div
      className="min-h-screen bg-[#030303] text-white"
      style={{
        fontFamily:
          "Inter, Montserrat, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <PublicHeader />

      <main className="overflow-x-hidden">
        <section className="relative min-h-[660px] overflow-hidden px-7 py-16 sm:min-h-[680px] sm:px-8 sm:py-20 lg:min-h-[640px] lg:px-6 lg:py-28">
          <Image
            src="/images/public-site/fleet/services-hero-mobile.jpg"
            alt="LadyBird Shuttle Services corporate transfer"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[54%_center] opacity-75 lg:hidden"
          />
          <Image
            src="/images/public-site/corporate-transfer.jpg"
            alt="LadyBird Shuttle Services corporate transfer"
            fill
            priority
            sizes="100vw"
            className="services-hero-image hidden object-cover object-[58%_center] opacity-75 lg:block lg:object-center"
          />
          <div className="absolute inset-0 bg-black/62" />
          <div className="services-hero-sweep pointer-events-none absolute inset-[-18%]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 62% 42%, rgba(255,255,255,0.12), transparent 34%), linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.22) 42%, rgba(3,3,3,1))",
            }}
          />

          <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center lg:min-h-[460px]">
            <div className="w-full max-w-4xl">
              <p className="services-reveal text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-400">
                LadyBird Shuttle Services
              </p>
              <h1 className="services-reveal mt-5 max-w-[22rem] break-words text-[2.55rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:max-w-3xl sm:text-5xl lg:max-w-4xl lg:text-6xl">
                Airport transfers, corporate transport and private shuttle hire
                across Zimbabwe.
              </h1>
              <p className="services-reveal mt-6 max-w-[22rem] text-[15px] font-light leading-8 text-neutral-300 sm:max-w-2xl sm:text-base">
                From Harare airport pickups to corporate travel, private shuttle
                hire and custom Zimbabwe routes, LadyBird helps customers submit
                clear trip details and receive confirmation before travel.
              </p>

              <div className="services-reveal mt-8 flex flex-wrap gap-2.5 sm:gap-3">
                <Link
                  href="/booking"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-neutral-200 sm:h-12 sm:px-6 sm:text-sm"
                >
                  Book a Shuttle
                </Link>
                <Link
                  href="/booking/track"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-black/25 px-4 text-[13px] font-semibold text-white backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.05] sm:h-12 sm:px-6 sm:text-sm"
                >
                  Track Booking
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-[#F5F5F2] px-5 py-20 text-neutral-950 sm:px-6 lg:py-24">
          <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[min(900px,86vw)] -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
          <div className="services-soft-orb pointer-events-none absolute bottom-12 right-0 h-80 w-80 rounded-full bg-neutral-950/[0.045] blur-3xl" />

          <div className="relative mx-auto max-w-7xl">
            <div className="services-page-marquee mb-8 overflow-hidden py-2">
              <div className="services-page-marquee-track">
                <span>
                  LADYBIRD SHUTTLE SERVICES - HARARE AIRPORT TRANSFERS -
                  CORPORATE TRANSPORT - PRIVATE SHUTTLE HIRE - CUSTOM ZIMBABWE
                  ROUTES
                </span>
                <span aria-hidden="true">
                  LADYBIRD SHUTTLE SERVICES - HARARE AIRPORT TRANSFERS -
                  CORPORATE TRANSPORT - PRIVATE SHUTTLE HIRE - CUSTOM ZIMBABWE
                  ROUTES
                </span>
              </div>
            </div>

            <div className="grid gap-6 border-y border-black/10 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:py-10">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                  Services
                </p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-neutral-950 sm:text-4xl lg:text-5xl">
                  Choose the shuttle service that matches your journey.
                </h2>
              </div>
              <p className="max-w-2xl text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8 lg:ml-auto">
                Select from airport transfers, corporate transport, private
                shuttle hire or custom route requests, then continue to the
                booking page to submit your travel details.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service.title}
                  className="services-card group relative overflow-hidden rounded-[32px] border border-white/70 bg-neutral-950/[0.07] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.09)] backdrop-blur-2xl transition duration-500 hover:-translate-y-1 hover:bg-neutral-950/[0.1] sm:p-8"
                >
                  <div className="services-card-glass pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.78),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.08)_48%,rgba(0,0,0,0.035))]" />
                  <span className="services-card-signal pointer-events-none absolute left-8 right-8 top-0 h-px" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                      {service.title}
                    </h3>
                    <p className="mt-4 text-sm font-normal leading-7 text-neutral-600">
                      {service.description}
                    </p>
                    <p className="mt-5 border-l border-black/15 pl-4 text-sm font-normal leading-6 text-neutral-700">
                      <span className="font-semibold text-neutral-950">
                        Best for:
                      </span>{" "}
                      {service.bestFor}
                    </p>
                    <Link
                      href="/booking"
                      className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    >
                      Book this service
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#030303] px-5 py-20 text-white sm:px-6 lg:py-24">
          <div className="services-dark-orb pointer-events-none absolute left-1/2 top-16 h-72 w-[min(760px,82vw)] -translate-x-1/2 rounded-full bg-white/[0.045] blur-3xl" />
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                Trip Coordination
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Clear details, confirmed fares and online status tracking.
              </h2>
            </div>

            <div className="relative mt-12 grid gap-5 md:grid-cols-3">
              <div className="services-coordination-signal pointer-events-none absolute left-[16.66%] right-[16.66%] top-6 hidden h-px md:block" />
              {serviceDetails.map((detail) => (
                <article
                  key={detail.title}
                  className="services-detail-card rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-7"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white text-sm font-semibold text-black">
                    {detail.label}
                  </div>
                  <h3 className="mt-7 text-lg font-semibold tracking-[-0.02em] text-white">
                    {detail.title}
                  </h3>
                  <p className="mt-3 text-sm font-light leading-7 text-white/82">
                    {detail.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#030303] px-5 pb-20 text-white sm:px-6 lg:pb-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="services-editorial-image group relative min-h-[360px] overflow-hidden rounded-[36px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:min-h-[460px]">
              <Image
                src="/images/public-site/fleet-interior.jpg"
                alt="Clean shuttle interior for private and group travel"
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="services-editorial-photo object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/12 to-transparent" />
            </div>

            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl sm:p-9">
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                Travel Experience
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.06] tracking-[-0.04em] text-white sm:text-4xl">
                Transport planned for comfort, timing and clear communication.
              </h2>
              <p className="mt-5 text-sm font-light leading-8 text-neutral-400 sm:text-base">
                LadyBird focuses on practical movement for individuals,
                families, teams and visitors who need a managed shuttle request
                before travel.
              </p>
              <div className="mt-7 grid gap-3">
                {travelComfortPoints.map((point) => (
                  <div
                    key={point}
                    className="services-comfort-point flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-normal text-neutral-300"
                  >
                    <span className="h-2 w-2 rounded-full bg-white/75 shadow-[0_0_18px_rgba(255,255,255,0.28)]" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#030303] px-5 pb-20 text-white sm:px-6 lg:pb-24">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                  Next Step
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-[1.06] tracking-[-0.04em] text-white sm:text-4xl">
                  Ready to arrange your shuttle?
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-neutral-400 sm:text-base sm:leading-8">
                  Submit your trip details online and receive a booking
                  reference for follow-up and tracking.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 sm:gap-3 lg:justify-end">
                <Link
                  href="/booking"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-neutral-200 sm:h-12 sm:px-6 sm:text-sm"
                >
                  Book Now
                </Link>
                <Link
                  href="/booking/track"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 text-[13px] font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.045] sm:h-12 sm:px-6 sm:text-sm"
                >
                  Track Booking
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      <style>{`
        .services-hero-image {
          transform-origin: 58% 44%;
          animation: servicesHeroBreathe 24s cubic-bezier(0.45, 0, 0.2, 1)
            infinite;
          will-change: transform;
        }

        .services-hero-sweep {
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 38%,
            rgba(255, 255, 255, 0.045) 50%,
            transparent 62%,
            transparent 100%
          );
          opacity: 0.25;
          animation: servicesHeroSweep 22s ease-in-out infinite alternate;
        }

        .services-reveal {
          animation: servicesReveal 950ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .services-reveal:nth-child(2) {
          animation-delay: 90ms;
        }

        .services-reveal:nth-child(3) {
          animation-delay: 180ms;
        }

        .services-reveal:nth-child(4) {
          animation-delay: 270ms;
        }

        .services-page-marquee {
          mask-image: linear-gradient(
            90deg,
            transparent,
            black 10%,
            black 90%,
            transparent
          );
        }

        .services-page-marquee-track {
          display: flex;
          width: max-content;
          gap: 4rem;
          animation: servicesPageMarquee 24s linear infinite;
        }

        .services-page-marquee-track span {
          display: inline-flex;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: rgba(10, 10, 10, 0.68);
        }

        .services-soft-orb,
        .services-dark-orb {
          animation: servicesOrbFloat 18s ease-in-out infinite alternate;
        }

        .services-card {
          animation: servicesCardFloat 9s ease-in-out infinite;
        }

        .services-card:nth-child(2),
        .services-detail-card:nth-child(3),
        .services-comfort-point:nth-child(2) {
          animation-delay: 0.6s;
        }

        .services-card:nth-child(3),
        .services-detail-card:nth-child(4),
        .services-comfort-point:nth-child(3) {
          animation-delay: 1.2s;
        }

        .services-card:nth-child(4) {
          animation-delay: 1.8s;
        }

        .services-card-glass {
          animation: servicesGlassShift 11s ease-in-out infinite alternate;
        }

        .services-card-signal {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.86),
            transparent
          );
          opacity: 0;
          transform: translateX(-40%);
          transition: opacity 500ms ease;
        }

        .services-card:hover .services-card-signal {
          opacity: 1;
          animation: servicesSignalSweep 1.2s ease-out both;
        }

        .services-detail-card,
        .services-comfort-point {
          animation: servicesCardFloat 8.5s ease-in-out infinite;
        }

        .services-coordination-signal::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 1px;
          width: 28%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          animation: servicesCoordinationTrace 5.8s ease-in-out infinite;
        }

        .services-editorial-photo {
          transform-origin: center;
          transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .services-editorial-image:hover .services-editorial-photo {
          transform: scale(1.045);
        }

        @keyframes servicesHeroBreathe {
          0% {
            transform: translate3d(-1.1%, -0.55%, 0) scale(1.01);
          }
          48% {
            transform: translate3d(1%, 0.45%, 0) scale(1.14);
          }
          72% {
            transform: translate3d(0.45%, -0.2%, 0) scale(1.08);
          }
          100% {
            transform: translate3d(-1.1%, -0.55%, 0) scale(1.01);
          }
        }

        @keyframes servicesHeroSweep {
          from {
            transform: translate3d(-12%, -2%, 0) rotate(-3deg);
            opacity: 0.1;
          }
          to {
            transform: translate3d(10%, 1%, 0) rotate(-3deg);
            opacity: 0.28;
          }
        }

        @keyframes servicesReveal {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.99);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes servicesPageMarquee {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes servicesOrbFloat {
          from {
            transform: translate3d(-50%, 0, 0) scale(1);
          }
          to {
            transform: translate3d(-48%, -12px, 0) scale(1.04);
          }
        }

        @keyframes servicesCardFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -4px, 0);
          }
        }

        @keyframes servicesGlassShift {
          from {
            opacity: 0.86;
            transform: translate3d(-1%, -1%, 0) scale(1);
          }
          to {
            opacity: 1;
            transform: translate3d(1%, 1%, 0) scale(1.012);
          }
        }

        @keyframes servicesSignalSweep {
          from {
            transform: translateX(-40%);
          }
          to {
            transform: translateX(40%);
          }
        }

        @keyframes servicesCoordinationTrace {
          0% {
            opacity: 0;
            transform: translateX(-20%);
          }
          18%,
          78% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(340%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .services-hero-image,
          .services-hero-sweep,
          .services-reveal,
          .services-page-marquee-track,
          .services-soft-orb,
          .services-dark-orb,
          .services-card,
          .services-card-glass,
          .services-card:hover .services-card-signal,
          .services-detail-card,
          .services-comfort-point,
          .services-coordination-signal::before {
            animation: none;
          }

          .services-editorial-image:hover .services-editorial-photo {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
