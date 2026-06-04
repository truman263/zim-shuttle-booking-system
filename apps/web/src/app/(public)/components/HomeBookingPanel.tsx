"use client";

import Link from "next/link";
import type { ReactNode } from "react";

function PanelAction({
  href,
  primary,
  children,
}: {
  href: string;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "homepage-panel-control inline-flex h-10 items-center justify-center rounded-full bg-white px-3 text-xs font-semibold text-black shadow-[0_14px_45px_rgba(255,255,255,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-200 sm:h-11 sm:px-5 sm:text-sm"
          : "homepage-panel-control inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-black/25 px-3 text-xs font-semibold text-neutral-300 transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.04] hover:text-white sm:h-11 sm:px-5 sm:text-sm"
      }
    >
      {children}
    </Link>
  );
}

export function HomeBookingPanel() {
  return (
    <section
      id="book"
      className="relative z-20 -mt-[11.5rem] px-4 pb-14 sm:-mt-[13rem] sm:px-6 sm:pb-14 lg:-mt-[16rem] lg:pb-16"
    >
      <div className="mx-auto max-w-2xl">
        <div
          className="homepage-booking-card relative overflow-hidden rounded-[30px] border border-white/10 bg-black/55 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.58)] backdrop-blur-2xl sm:p-4"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.085), rgba(255,255,255,0.032) 46%, rgba(0,0,0,0.62))",
          }}
        >
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-2.5">
              <PanelAction href="/booking" primary>
                Book a Shuttle
              </PanelAction>

              <PanelAction href="/booking/track">
                Track Booking
              </PanelAction>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-black/25 p-3">
              <Link
                href="/booking"
                className="homepage-panel-surface group grid gap-3 rounded-[20px] px-3 py-2.5 text-left transition duration-500 hover:bg-white/[0.045] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <span>
                  <span className="block text-sm font-semibold text-white">
                    Start a trip request
                  </span>
                  <span className="mt-1 block text-xs font-light leading-5 text-neutral-500">
                    Submit your route, passenger and travel details through the
                    secure booking page, then keep your reference for tracking.
                  </span>
                </span>

                <span className="homepage-panel-cta inline-flex h-10 w-full items-center justify-center rounded-full bg-white px-5 text-xs font-semibold text-black transition group-hover:bg-neutral-200 sm:w-auto">
                  Open Booking
                </span>
              </Link>

              <div className="homepage-route-line mt-3">
                <span className="homepage-route-dot" />
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-xs font-light text-neutral-500">
                <span className="homepage-live-dot" />
                Online booking and tracking
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .homepage-booking-card::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(
              circle at 28% 8%,
              rgba(255, 255, 255, 0.09),
              transparent 30%
            ),
            linear-gradient(
              110deg,
              transparent 0%,
              transparent 40%,
              rgba(255, 255, 255, 0.038) 51%,
              transparent 62%,
              transparent 100%
            );
          transform: translateX(-16%);
          opacity: 0.38;
          animation: homepagePanelSheen 24s ease-in-out infinite alternate;
        }

        .homepage-booking-card::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 1px;
          z-index: 0;
          border-radius: 29px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.11),
              transparent 22%,
              transparent 78%,
              rgba(255, 255, 255, 0.04)
            );
          opacity: 0.5;
        }

        .homepage-booking-card {
          animation: homepagePanelFloat 18s ease-in-out infinite alternate;
          transition:
            border-color 500ms ease,
            box-shadow 500ms ease,
            transform 500ms ease;
        }

        .homepage-booking-card:hover {
          animation-play-state: paused;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 36px 120px rgba(0, 0, 0, 0.66);
          transform: translate3d(0, -4px, 0) scale(1.003) !important;
        }

        .homepage-panel-control,
        .homepage-panel-cta,
        .homepage-panel-surface {
          position: relative;
          overflow: hidden;
        }

        .homepage-panel-control::after,
        .homepage-panel-cta::after,
        .homepage-panel-surface::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent,
            rgba(255, 255, 255, 0.24),
            transparent
          );
          opacity: 0;
          transform: translateX(-120%);
        }

        .homepage-panel-control:hover::after,
        .homepage-panel-cta:hover::after,
        .homepage-panel-surface:hover::after {
          animation: homepageInteractiveSheen 900ms ease-out both;
        }

        .homepage-route-line {
          position: relative;
          height: 1px;
          overflow: hidden;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
        }

        .homepage-route-line::before {
          content: "";
          position: absolute;
          inset: 0;
          width: 42%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.58),
            transparent
          );
          animation: homepageRouteTrace 4.8s ease-in-out infinite;
        }

        .homepage-route-dot {
          position: absolute;
          top: 50%;
          left: 0;
          height: 5px;
          width: 5px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.42);
          transform: translateY(-50%);
          animation: homepageRouteDot 4.8s ease-in-out infinite;
        }

        .homepage-live-dot {
          display: inline-flex;
          height: 8px;
          width: 8px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.62);
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.24);
          animation: homepageLivePulse 4.8s ease-out infinite;
        }

        @keyframes homepagePanelSheen {
          from {
            transform: translateX(-18%);
            opacity: 0.18;
          }
          to {
            transform: translateX(12%);
            opacity: 0.38;
          }
        }

        @keyframes homepagePanelFloat {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(0, -2px, 0);
          }
        }

        @keyframes homepageInteractiveSheen {
          0% {
            opacity: 0;
            transform: translateX(-120%);
          }
          28% {
            opacity: 0.42;
          }
          100% {
            opacity: 0;
            transform: translateX(120%);
          }
        }

        @keyframes homepageRouteTrace {
          0% {
            transform: translateX(-110%);
            opacity: 0;
          }
          20% {
            opacity: 0.72;
          }
          80% {
            opacity: 0.72;
          }
          100% {
            transform: translateX(250%);
            opacity: 0;
          }
        }

        @keyframes homepageRouteDot {
          0% {
            left: 0%;
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          84% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }

        @keyframes homepageLivePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.24);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .homepage-booking-card,
          .homepage-booking-card::before,
          .homepage-panel-control:hover::after,
          .homepage-panel-cta:hover::after,
          .homepage-panel-surface:hover::after,
          .homepage-route-line::before,
          .homepage-route-dot,
          .homepage-live-dot {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
