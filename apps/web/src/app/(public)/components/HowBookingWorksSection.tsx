import Link from "next/link";

const bookingSteps = [
  {
    number: "01",
    title: "Submit trip details",
    text: "Share your pickup, destination, date, passengers and travel notes through the booking page.",
  },
  {
    number: "02",
    title: "Confirm route and fare",
    text: "The team reviews availability, route details and the fare before the trip is confirmed.",
  },
  {
    number: "03",
    title: "Travel and track",
    text: "Use your booking reference to follow trip status, payment progress and booking updates online.",
  },
];

export function HowBookingWorksSection() {
  return (
    <section
      aria-labelledby="how-booking-works-heading"
      className="relative overflow-hidden bg-[#F5F5F2] px-5 py-16 text-neutral-950 sm:px-6 lg:py-20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#030303] to-transparent opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[min(780px,82vw)] -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-1/2 h-80 w-[min(980px,90vw)] -translate-x-1/2 rounded-full bg-neutral-950/[0.045] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
            How Booking Works
          </p>
          <h2
            id="how-booking-works-heading"
            className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-neutral-950 sm:text-4xl lg:text-5xl"
          >
            A clear booking process from request to travel.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8">
            Submit your route, confirm the details and track your booking online
            with a simple customer journey from first request to completed
            journey.
          </p>
        </div>

        <div className="relative mt-10 lg:mt-12">
          <div className="booking-mobile-flow pointer-events-none absolute bottom-8 left-10 top-8 md:hidden" />
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-10 hidden h-px bg-neutral-950/15 lg:block" />
          <div className="booking-flow-signal pointer-events-none absolute left-[16.66%] right-[16.66%] top-10 hidden lg:block" />

          <div className="grid gap-5 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <article
                key={step.number}
                className="booking-step-card group relative overflow-hidden rounded-[30px] border border-white/55 bg-neutral-950/[0.08] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.1)] backdrop-blur-2xl transition duration-500 hover:-translate-y-1 hover:border-white/80 hover:bg-neutral-950/[0.11] sm:p-6 lg:p-7"
              >
                <div className="booking-step-glass pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.72),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0.08)_48%,rgba(0,0,0,0.04))]" />
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                <span className="booking-step-corner pointer-events-none absolute right-6 top-6 h-10 w-10 rounded-full border border-white/45" />
                <div className="relative z-10">
                  <div className="booking-step-number relative grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-neutral-950 text-xs font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] sm:h-16 sm:w-16 lg:h-20 lg:w-20 lg:text-sm">
                    {step.number}
                  </div>

                  <h3 className="mt-6 text-lg font-semibold tracking-[-0.02em] text-neutral-950 sm:text-xl lg:mt-8">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-normal leading-7 text-neutral-600">
                    {step.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/booking"
            className="booking-primary-cta inline-flex h-10 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800 sm:h-11 sm:text-sm lg:h-12 lg:px-6"
          >
            Start Booking
          </Link>
          <Link
            href="/booking/track"
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/60 px-5 text-[13px] font-semibold text-neutral-950 transition hover:border-black/20 hover:bg-white sm:h-11 sm:text-sm lg:h-12 lg:px-6"
          >
            Track Booking
          </Link>
        </div>
      </div>

      <style>{`
        .booking-step-card {
          animation: bookingStepFloat 8.5s ease-in-out infinite;
        }

        .booking-step-card::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            118deg,
            transparent 0%,
            transparent 38%,
            rgba(255, 255, 255, 0.42) 50%,
            transparent 62%,
            transparent 100%
          );
          opacity: 0;
          transform: translateX(-110%);
        }

        .booking-step-card:hover::before {
          animation: bookingStepSheen 950ms ease-out both;
        }

        .booking-step-card:nth-child(2) {
          animation-delay: 0.55s;
        }

        .booking-step-card:nth-child(3) {
          animation-delay: 1.1s;
        }

        .booking-step-glass {
          animation: bookingGlassShift 10s ease-in-out infinite alternate;
        }

        .booking-step-corner {
          opacity: 0.24;
          transform: translate3d(14px, -14px, 0) scale(0.72);
          animation: bookingCornerBreathe 6s ease-in-out infinite alternate;
        }

        .booking-step-number::after {
          content: "";
          position: absolute;
          inset: -7px;
          border-radius: inherit;
          border: 1px solid rgba(10, 10, 10, 0.1);
          opacity: 0;
          animation: bookingNumberPulse 4.2s ease-in-out infinite;
        }

        .booking-step-card:nth-child(2) .booking-step-number::after {
          animation-delay: 0.7s;
        }

        .booking-step-card:nth-child(3) .booking-step-number::after {
          animation-delay: 1.4s;
        }

        .booking-flow-signal {
          height: 1px;
          overflow: visible;
        }

        .booking-mobile-flow {
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(10, 10, 10, 0.14),
            transparent
          );
        }

        .booking-mobile-flow::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 28%;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(10, 10, 10, 0.46),
            transparent
          );
          animation: bookingMobileTrace 5.8s ease-in-out infinite;
        }

        .booking-mobile-flow::after {
          content: "";
          position: absolute;
          top: 0;
          left: -3px;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: rgba(10, 10, 10, 0.62);
          box-shadow: 0 0 18px rgba(10, 10, 10, 0.18);
          animation: bookingMobileDot 5.8s ease-in-out infinite;
        }

        .booking-flow-signal::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 24%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(10, 10, 10, 0.52),
            transparent
          );
          animation: bookingSignalTrace 5.4s ease-in-out infinite;
        }

        .booking-flow-signal::after {
          content: "";
          position: absolute;
          top: -3px;
          left: 0;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: rgba(10, 10, 10, 0.72);
          box-shadow: 0 0 24px rgba(10, 10, 10, 0.22);
          animation: bookingSignalDot 5.4s ease-in-out infinite;
        }

        .booking-primary-cta {
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
          animation: bookingCtaBreathe 5.8s ease-in-out infinite;
        }

        @keyframes bookingStepFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -5px, 0);
          }
        }

        @keyframes bookingGlassShift {
          from {
            opacity: 0.86;
            transform: translate3d(-1.5%, -1%, 0) scale(1);
          }
          to {
            opacity: 1;
            transform: translate3d(1.5%, 1%, 0) scale(1.015);
          }
        }

        @keyframes bookingCornerBreathe {
          from {
            opacity: 0.14;
            transform: translate3d(14px, -14px, 0) scale(0.72);
          }
          to {
            opacity: 0.32;
            transform: translate3d(7px, -7px, 0) scale(1);
          }
        }

        @keyframes bookingNumberPulse {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          42% {
            opacity: 0.46;
          }
          100% {
            opacity: 0;
            transform: scale(1.26);
          }
        }

        @keyframes bookingSignalTrace {
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

        @keyframes bookingSignalDot {
          0% {
            opacity: 0;
            transform: translateX(-20%);
          }
          18%,
          78% {
            opacity: 0.82;
          }
          100% {
            opacity: 0;
            transform: translateX(340%);
          }
        }

        @keyframes bookingMobileTrace {
          0% {
            opacity: 0;
            transform: translateY(-18%);
          }
          18%,
          78% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(340%);
          }
        }

        @keyframes bookingMobileDot {
          0% {
            opacity: 0;
            transform: translateY(-18%);
          }
          18%,
          78% {
            opacity: 0.82;
          }
          100% {
            opacity: 0;
            transform: translateY(340%);
          }
        }

        @keyframes bookingCtaBreathe {
          0%,
          100% {
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
          }
          50% {
            box-shadow: 0 22px 70px rgba(0, 0, 0, 0.24);
          }
        }

        @keyframes bookingStepSheen {
          0% {
            opacity: 0;
            transform: translateX(-110%);
          }
          35% {
            opacity: 0.28;
          }
          100% {
            opacity: 0;
            transform: translateX(110%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .booking-step-card,
          .booking-step-card:hover::before,
          .booking-step-glass,
          .booking-step-corner,
          .booking-step-number::after,
          .booking-flow-signal::before,
          .booking-flow-signal::after,
          .booking-mobile-flow::before,
          .booking-mobile-flow::after,
          .booking-primary-cta {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
