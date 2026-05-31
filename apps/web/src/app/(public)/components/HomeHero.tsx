"use client";

export function HomeHero() {
  return (
    <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden px-5 pb-24 pt-16 text-center sm:min-h-[640px] sm:px-6 sm:pt-20 lg:min-h-[700px] lg:pb-28 lg:pt-14 xl:min-h-[730px]">
      <div
        className="homepage-bg-image pointer-events-none absolute inset-0 bg-center bg-no-repeat opacity-88"
        style={{
          backgroundImage: "url('/images/public-site/lb-hero-shuttle.jpg')",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-black/42" />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.14) 32%, rgba(0,0,0,0.88) 90%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 42%, rgba(3,3,3,1) 100%)",
        }}
      />

      <div className="homepage-atmosphere" />
      <div className="homepage-light-sweep" />
      <div className="homepage-orb homepage-orb-one" />
      <div className="homepage-orb homepage-orb-two" />

      <div className="relative z-10 mx-auto max-w-5xl -translate-y-14 sm:-translate-y-16 lg:-translate-y-32">
        <div className="homepage-fade-up mx-auto max-w-4xl overflow-hidden">
          <div className="homepage-service-marquee">
            <div className="homepage-service-track">
              <span>
                AIRPORT TRANSFERS · PRIVATE SHUTTLES · CORPORATE TRAVEL
              </span>
              <span aria-hidden="true">
                AIRPORT TRANSFERS · PRIVATE SHUTTLES · CORPORATE TRAVEL
              </span>
            </div>
          </div>
        </div>

        <h1 className="homepage-fade-up mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.02] tracking-[-0.052em] text-white drop-shadow-[0_18px_46px_rgba(0,0,0,0.52)] sm:text-5xl lg:text-6xl">
          Airport transfers and private shuttle travel across Zimbabwe.
        </h1>

        <p className="homepage-fade-up mx-auto mt-5 max-w-3xl text-sm font-light leading-8 text-neutral-300/85 sm:text-base">
          Arrange airport transfers, corporate travel, private shuttle hire and
          custom routes across Zimbabwe with a clear booking process, confirmed
          trip details and reliable communication before you travel.
        </p>
      </div>

      <style jsx global>{`
        .homepage-bg-image {
          background-size: min(1420px, 108vw) auto;
          background-position: center 45%;
          transform-origin: 58% 44%;
          will-change: transform;
          animation: homepageImageDrift 36s cubic-bezier(0.45, 0, 0.2, 1)
            infinite;
        }

        .homepage-fade-up {
          animation: homepageFadeUp 950ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .homepage-fade-up:nth-child(2) {
          animation-delay: 90ms;
        }

        .homepage-fade-up:nth-child(3) {
          animation-delay: 180ms;
        }

        .homepage-service-marquee {
          display: flex;
          white-space: nowrap;
          mask-image: linear-gradient(
            90deg,
            transparent,
            black 12%,
            black 88%,
            transparent
          );
        }

        .homepage-service-track {
          display: flex;
          width: max-content;
          gap: 3.2rem;
          animation: homepageMarquee 22s linear infinite;
        }

        .homepage-service-track span {
          display: inline-flex;
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: rgb(115 115 115);
        }

        .homepage-orb {
          pointer-events: none;
          position: absolute;
          z-index: 1;
          border-radius: 9999px;
          filter: blur(78px);
          opacity: 0.07;
          animation: homepageOrbFloat 26s ease-in-out infinite alternate;
        }

        .homepage-atmosphere {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(
              circle at 50% 44%,
              rgba(255, 255, 255, 0.07),
              transparent 30%
            ),
            linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.24),
              transparent 24%,
              transparent 76%,
              rgba(0, 0, 0, 0.26)
            );
          opacity: 0.45;
          animation: homepageAtmosphereBreathe 24s ease-in-out infinite alternate;
        }

        .homepage-light-sweep {
          pointer-events: none;
          position: absolute;
          inset: -24% -18%;
          z-index: 1;
          background:
            linear-gradient(
              115deg,
              transparent 0%,
              transparent 36%,
              rgba(255, 255, 255, 0.026) 48%,
              transparent 60%,
              transparent 100%
            );
          opacity: 0.28;
          transform: translate3d(-16%, 0, 0) rotate(-4deg);
          animation: homepageSweep 30s ease-in-out infinite alternate;
        }

        .homepage-orb-one {
          top: 20%;
          left: 20%;
          width: 250px;
          height: 250px;
          background: rgba(255, 255, 255, 0.14);
        }

        .homepage-orb-two {
          right: 18%;
          bottom: 28%;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.08);
          animation-delay: 2.8s;
        }

        @keyframes homepageFadeUp {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.988);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes homepageOrbFloat {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(14px, -12px, 0) scale(1.04);
          }
        }

        @keyframes homepageImageDrift {
          0% {
            transform: translate3d(-0.45%, -0.25%, 0) scale(1.025);
          }
          46% {
            transform: translate3d(0.42%, 0.26%, 0) scale(1.078);
          }
          72% {
            transform: translate3d(0.58%, -0.12%, 0) scale(1.055);
          }
          100% {
            transform: translate3d(-0.45%, -0.25%, 0) scale(1.025);
          }
        }

        @keyframes homepageAtmosphereBreathe {
          from {
            opacity: 0.34;
            transform: scale(1);
          }
          to {
            opacity: 0.52;
            transform: scale(1.015);
          }
        }

        @keyframes homepageMarquee {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0%);
          }
        }

        @keyframes homepageSweep {
          from {
            transform: translate3d(-10%, -2%, 0) rotate(-4deg);
            opacity: 0.12;
          }
          to {
            transform: translate3d(10%, 1%, 0) rotate(-4deg);
            opacity: 0.28;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .homepage-fade-up,
          .homepage-orb,
          .homepage-service-track,
          .homepage-bg-image,
          .homepage-atmosphere,
          .homepage-light-sweep {
            animation: none;
          }
        }

        @media (max-width: 768px) {
          .homepage-bg-image {
            background-size: auto 100%;
            background-position: center 48%;
          }
        }
      `}</style>
    </section>
  );
}
