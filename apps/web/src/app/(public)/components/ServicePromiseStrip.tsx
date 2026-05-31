import Image from "next/image";

const servicePromises = [
  {
    label: "01",
    title: "Airport transfers",
    body: "Robert Gabriel Mugabe International Airport pickups and drop-offs arranged with clear travel details.",
  },
  {
    label: "02",
    title: "Corporate travel",
    body: "Professional transport support for meetings, teams, business visitors and executive movement.",
  },
  {
    label: "03",
    title: "Private shuttle hire",
    body: "Comfortable private transfers for individuals, families and small groups.",
  },
  {
    label: "04",
    title: "Custom routes",
    body: "City-to-city and custom Zimbabwe destinations submitted for confirmation before travel.",
  },
];

export function ServicePromiseStrip() {
  return (
    <section
      aria-labelledby="service-promise-heading"
      className="relative bg-[#030303] px-5 pb-16 pt-20 text-white sm:px-6 lg:pb-20 lg:pt-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/[0.035] to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-64 w-[min(760px,82vw)] -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />

      <div className="mx-auto max-w-7xl">
        <div className="relative grid gap-6 border-y border-white/10 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:py-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
              Service Promise
            </p>
            <h2
              id="service-promise-heading"
              className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
            >
              Clear shuttle arrangements before you travel.
            </h2>
          </div>

          <p className="max-w-2xl text-sm font-normal leading-7 text-neutral-400 sm:text-base sm:leading-8 lg:ml-auto">
            From airport arrivals to city-to-city transfers, LadyBird keeps
            route details, timing and confirmation clear before the journey
            begins.
          </p>
        </div>

        <div className="relative mt-9 grid gap-6 lg:mt-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="relative order-2 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] p-px shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_90%_100%,rgba(255,255,255,0.05),transparent_30%)]" />
            <div className="relative grid overflow-hidden rounded-[33px] bg-black/30 sm:grid-cols-2">
              {servicePromises.map((promise, index) => (
                <article
                  key={promise.title}
                  className={[
                    "group relative min-h-[205px] p-6 transition duration-500 hover:bg-white/[0.035] sm:p-7 lg:p-8",
                    index > 0 ? "border-t border-white/10" : "",
                    index % 2 === 1 ? "sm:border-l sm:border-white/10" : "",
                    index === 1 ? "sm:border-t-0" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-600 transition group-hover:text-neutral-400">
                      {promise.label}
                    </p>
                    <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>

                  <h3 className="mt-8 text-lg font-semibold tracking-[-0.02em] text-white">
                    {promise.title}
                  </h3>
                  <p className="mt-3 text-sm font-normal leading-7 text-neutral-400">
                    {promise.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative order-1 min-h-[360px] overflow-hidden rounded-[34px] border border-white/10 bg-black/40 shadow-[0_24px_90px_rgba(0,0,0,0.38)] sm:min-h-[430px] lg:min-h-full">
            <Image
              src="/images/public-site/corporate-transfer.jpg"
              alt="Corporate shuttle transfer at Robert Gabriel Mugabe International Airport"
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
              <div className="max-w-sm border-l border-white/20 pl-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-400">
                  Transport coordination
                </p>
                <p className="mt-2 text-sm font-normal leading-6 text-neutral-300">
                  Airport pickups, corporate movement and custom route requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
