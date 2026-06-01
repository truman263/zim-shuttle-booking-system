const services = [
  {
    number: "01",
    title: "Airport transfers",
    body: "Arranged pickups and drop-offs for airport arrivals, departures, passenger details and luggage needs.",
  },
  {
    number: "02",
    title: "Corporate transport",
    body: "Professional movement for meetings, business visitors, staff travel and scheduled company trips.",
  },
  {
    number: "03",
    title: "Private shuttle hire",
    body: "Comfortable private transport for individuals, families, visitors and small groups.",
  },
  {
    number: "04",
    title: "Custom route requests",
    body: "Enter your own pickup and destination when your trip does not match a saved route.",
  },
];

export function ServicePromiseStrip() {
  return (
    <section
      aria-labelledby="homepage-services-heading"
      className="relative overflow-hidden bg-[#030303] px-5 py-20 text-white sm:px-6 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/20 to-transparent" />
      <div className="pointer-events-none absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-white/[0.035] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-8%] h-80 w-80 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 border-y border-white/10 py-9 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:py-11">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
              Services
            </p>
            <h2
              id="homepage-services-heading"
              className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
            >
              Clean, reliable shuttle services for airport, business and private
              travel.
            </h2>
          </div>

          <div className="max-w-2xl lg:ml-auto">
            <p className="text-sm font-light leading-7 text-neutral-400 sm:text-base sm:leading-8">
              LadyBird Shuttle Services helps travellers move comfortably across
              Zimbabwe with airport transfers, corporate transport, private
              shuttle hire and custom route support. We keep the process simple,
              the vehicles presentable and the pickup experience organised.
            </p>
            <p className="mt-4 border-l border-white/10 pl-4 text-sm font-light leading-7 text-white/82">
              No unnecessary waiting. Clean decent vehicles. Fair pricing. A
              more comfortable Zimbabwe visit.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.number}
              className="home-service-card group relative min-h-[205px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl transition duration-500 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.055] sm:p-6"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.045),transparent_44%)]" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-600 transition group-hover:text-neutral-400">
                    {service.number}
                  </p>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent opacity-0 transition group-hover:opacity-100" />
                </div>

                <h3 className="mt-7 text-lg font-semibold tracking-[-0.02em] text-white">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-7 text-neutral-400">
                  {service.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="home-services-marquee mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025] py-4 backdrop-blur-2xl">
          <div className="home-services-marquee-track">
            <span>
              No unnecessary waiting / Clean decent vehicles / Fair pricing /
              Comfortable Zimbabwe visits
            </span>
            <span aria-hidden="true">
              No unnecessary waiting / Clean decent vehicles / Fair pricing /
              Comfortable Zimbabwe visits
            </span>
            <span aria-hidden="true">
              No unnecessary waiting / Clean decent vehicles / Fair pricing /
              Comfortable Zimbabwe visits
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .home-service-card::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            118deg,
            transparent,
            rgba(255, 255, 255, 0.13),
            transparent
          );
          opacity: 0;
          transform: translateX(-120%);
        }

        .home-service-card:hover::before {
          animation: homeServicesSheen 950ms ease-out both;
        }

        .home-services-marquee {
          mask-image: linear-gradient(
            90deg,
            transparent,
            black 8%,
            black 92%,
            transparent
          );
        }

        .home-services-marquee-track {
          display: flex;
          width: max-content;
          gap: 4rem;
          animation: homeServicesMarquee 28s linear infinite;
        }

        .home-services-marquee-track span {
          display: inline-flex;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgb(163 163 163);
        }

        @keyframes homeServicesSheen {
          0% {
            opacity: 0;
            transform: translateX(-120%);
          }
          34% {
            opacity: 0.48;
          }
          100% {
            opacity: 0;
            transform: translateX(120%);
          }
        }

        @keyframes homeServicesMarquee {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-33.333%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-service-card,
          .home-service-card:hover::before,
          .home-services-marquee-track {
            animation: none;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
