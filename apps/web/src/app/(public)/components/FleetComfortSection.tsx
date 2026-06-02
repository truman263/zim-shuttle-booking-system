import Image from "next/image";
import Link from "next/link";

const comfortPoints = [
  {
    number: "01",
    title: "Clean passenger spaces",
    body: "Vehicles are presented for comfortable private transfers, airport trips and business travel.",
  },
  {
    number: "02",
    title: "Private and group movement",
    body: "Support for individuals, families, visitors, teams and small groups.",
  },
  {
    number: "03",
    title: "Luggage-aware travel",
    body: "Passenger and luggage notes can be submitted during the booking request.",
  },
  {
    number: "04",
    title: "Assigned for the trip",
    body: "Vehicle and driver details can be confirmed as the trip is arranged.",
  },
];

export function FleetComfortSection() {
  return (
    <section
      id="fleet"
      aria-labelledby="fleet-comfort-heading"
      className="relative overflow-hidden bg-[#030303] px-5 pb-12 pt-4 text-white sm:px-6 lg:pb-14 lg:pt-6"
    >
      <div className="pointer-events-none absolute left-1/2 top-12 h-72 w-[min(820px,86vw)] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[-10%] h-80 w-80 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <div className="fleet-comfort-image-panel group relative min-h-[320px] overflow-hidden rounded-[34px] border border-white/10 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.42)] sm:min-h-[390px] lg:min-h-full">
          <Image
            src="/images/public-site/fleet-interior.jpg"
            alt="Clean shuttle interior seating for LadyBird Shuttle Services passengers"
            fill
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="fleet-comfort-image object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
            <div className="max-w-sm rounded-[26px] border border-white/10 bg-black/40 p-4 backdrop-blur-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-400">
                Passenger comfort
              </p>
              <p className="mt-2 text-sm font-light leading-6 text-white/82">
                Clean interiors, practical luggage notes and vehicle assignment
                for confirmed trips.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl sm:p-7 lg:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
            Fleet and Comfort
          </p>
          <h2
            id="fleet-comfort-heading"
            className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-[42px]"
          >
            Comfortable vehicles prepared for private and group travel.
          </h2>
          <p className="mt-4 text-sm font-light leading-7 text-neutral-400 sm:text-base sm:leading-8">
            LadyBird focuses on clean passenger spaces, practical luggage
            consideration and professional vehicle assignment for airport
            transfers, corporate travel, private shuttle hire and custom route
            requests.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {comfortPoints.map((point) => (
              <article
                key={point.number}
                className="fleet-comfort-point group rounded-[22px] border border-white/10 bg-black/25 p-4 transition duration-500 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.035]"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-600 transition group-hover:text-neutral-400">
                  {point.number}
                </p>
                <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-white">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm font-light leading-6 text-neutral-400">
                  {point.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/booking"
              className="fleet-comfort-cta inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-200"
            >
              Book a Shuttle
            </Link>
            <Link
              href="/services"
              className="fleet-comfort-cta inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] px-5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.05]"
            >
              View services
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .fleet-comfort-image {
          transform-origin: center;
          transition: transform 1200ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .fleet-comfort-image-panel,
        .fleet-comfort-cta {
          position: relative;
          overflow: hidden;
        }

        .fleet-comfort-image-panel {
          transition:
            border-color 500ms ease,
            box-shadow 500ms ease,
            transform 500ms ease;
        }

        .fleet-comfort-image-panel:hover {
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow: 0 34px 110px rgba(0, 0, 0, 0.5);
          transform: translate3d(0, -3px, 0);
        }

        .fleet-comfort-image-panel:hover .fleet-comfort-image {
          transform: scale(1.045);
        }

        .fleet-comfort-point {
          animation: fleetComfortFloat 8.5s ease-in-out infinite;
        }

        .fleet-comfort-point:nth-child(2) {
          animation-delay: 0.5s;
        }

        .fleet-comfort-point:nth-child(3) {
          animation-delay: 1s;
        }

        .fleet-comfort-point:nth-child(4) {
          animation-delay: 1.5s;
        }

        .fleet-comfort-cta::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            118deg,
            transparent,
            rgba(255, 255, 255, 0.16),
            transparent
          );
          opacity: 0;
          transform: translateX(-120%);
        }

        .fleet-comfort-cta:hover::after {
          animation: fleetComfortSheen 900ms ease-out both;
        }

        @keyframes fleetComfortFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -3px, 0);
          }
        }

        @keyframes fleetComfortSheen {
          0% {
            opacity: 0;
            transform: translateX(-120%);
          }
          34% {
            opacity: 0.42;
          }
          100% {
            opacity: 0;
            transform: translateX(120%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fleet-comfort-image,
          .fleet-comfort-image-panel,
          .fleet-comfort-image-panel:hover,
          .fleet-comfort-image-panel:hover .fleet-comfort-image,
          .fleet-comfort-point,
          .fleet-comfort-cta,
          .fleet-comfort-cta:hover::after {
            animation: none;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
