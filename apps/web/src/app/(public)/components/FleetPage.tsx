import Image from "next/image";
import Link from "next/link";

const overviewPoints = [
  {
    title: "Clean passenger spaces",
    body: "Vehicle presentation matters for airport transfers, private shuttle hire and longer Zimbabwe journeys.",
  },
  {
    title: "Private and group movement",
    body: "Trips can be arranged around individuals, families, visiting teams, business guests and small groups.",
  },
  {
    title: "Luggage-aware planning",
    body: "Passenger count, luggage notes and timing help the team prepare the journey with clearer expectations.",
  },
];

const showcasePoints = [
  "Suitable for airport pickups and drop-offs",
  "Suitable for private and family travel",
  "Suitable for business and group movement",
];

const comfortPoints = [
  "Seating comfort",
  "Clean interiors",
  "Passenger and luggage notes",
  "Trip-specific assignment",
];

const travelDetails = [
  "Passenger count",
  "Luggage notes",
  "Pickup and destination",
  "Travel date and timing",
  "Special notes for the team",
];

function ArrowLink({
  href,
  label,
  variant = "light",
}: {
  href: string;
  label: string;
  variant?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-10 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition duration-300 hover:-translate-y-0.5 sm:h-12 sm:px-6 sm:text-sm",
        variant === "dark"
          ? "bg-neutral-950 text-white hover:bg-neutral-800"
          : "bg-white text-black hover:bg-neutral-200",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function FleetPage() {
  return (
    <main className="overflow-x-hidden bg-[#030303] text-white">
      <section className="relative min-h-[650px] overflow-hidden px-7 py-16 sm:min-h-[680px] sm:px-8 sm:py-20 lg:min-h-[700px] lg:px-6 lg:py-24">
        <Image
          src="/images/public-site/fleet/fleet-hero-mobile.jpg"
          alt="LadyBird shuttle vehicle prepared for private and group travel"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[52%_center] lg:hidden"
        />
        <Image
          src="/images/public-site/fleet/fleet-hero.jpg"
          alt="LadyBird shuttle vehicle prepared for private and group travel"
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-[60%_center] lg:block lg:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86),rgba(0,0,0,0.58)_44%,rgba(0,0,0,0.36)),radial-gradient(circle_at_72%_34%,rgba(255,255,255,0.16),transparent_36%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030303] to-transparent" />

        <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center lg:min-h-[560px]">
          <div className="w-full max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.36em] text-white/55">
              LadyBird Fleet
            </p>
            <h1 className="mt-6 max-w-[22rem] break-words text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:max-w-3xl sm:text-5xl sm:leading-[0.98] lg:text-6xl">
              Comfortable vehicles prepared for private and group travel.
            </h1>
            <p className="mt-6 max-w-[22rem] text-[15px] font-light leading-8 text-white/78 sm:max-w-2xl sm:text-base">
              LadyBird focuses on clean passenger spaces, practical luggage
              consideration and professional vehicle assignment for airport
              transfers, corporate travel, private shuttle hire and custom
              route requests.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5 sm:gap-3">
              <ArrowLink href="/booking" label="Book a Shuttle" />
              <Link
                href="/services"
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] px-4 text-[13px] font-semibold text-white backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.075] sm:h-12 sm:px-6 sm:text-sm"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F5F2] px-5 py-16 text-neutral-950 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-y border-black/10 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                Fleet Promise
              </p>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Clean, comfortable and arranged around the journey.
              </h2>
            </div>
            <p className="max-w-2xl text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8 lg:ml-auto">
              From airport pickups to city-to-city travel, the vehicle
              experience is planned around passengers, luggage notes, timing and
              the confirmed trip details.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {overviewPoints.map((point, index) => (
              <div
                key={point.title}
                className="rounded-[28px] border border-black/10 bg-white/78 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.055)]"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
                  {point.title}
                </h3>
                <p className="mt-4 text-sm font-normal leading-7 text-neutral-600">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#030303] px-5 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] shadow-[0_30px_110px_rgba(0,0,0,0.28)] sm:min-h-[520px]">
            <Image
              src="/images/public-site/fleet/fleet-exterior.jpg"
              alt="LadyBird shuttle exterior ready for planned airport and city travel"
              fill
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
          </div>

          <div className="lg:pl-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/40">
              Vehicle Showcase
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              A professional shuttle experience for planned travel.
            </h2>
            <p className="mt-6 text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
              The fleet presentation supports airport transfers, corporate
              movement, private hire and group trips where comfort, timing and
              communication matter.
            </p>

            <div className="mt-7 grid gap-3">
              {showcasePoints.map((point) => (
                <div
                  key={point}
                  className="rounded-[24px] border border-white/10 bg-white/[0.045] px-5 py-4 text-sm font-light text-white/72 backdrop-blur-2xl"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#030303] px-5 pb-16 text-white sm:px-6 lg:pb-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/40">
              Interior Comfort
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Passenger comfort that feels considered.
            </h2>
            <p className="mt-6 text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
              Customers can submit passenger, luggage and travel notes through
              the booking process so the team can arrange the journey with
              clearer expectations.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {comfortPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 text-sm font-semibold text-white backdrop-blur-2xl"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] sm:min-h-[520px]">
            <Image
              src="/images/public-site/fleet/fleet-interior.jpg"
              alt="Clean shuttle interior arranged for passenger comfort"
              fill
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="bg-[#F7F7F4] px-5 py-16 text-neutral-950 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
              Practical Travel Details
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Practical details matter before the trip begins.
            </h2>
            <p className="mt-6 text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8">
              The booking process helps customers share the details that make
              the journey easier to arrange, without turning the fleet
              experience into a vehicle catalogue.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {travelDetails.map((detail) => (
                <div
                  key={detail}
                  className="rounded-[22px] border border-black/10 bg-white/80 px-5 py-4 text-sm font-semibold text-neutral-950"
                >
                  {detail}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[380px] overflow-hidden rounded-[34px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:min-h-[500px]">
            <Image
              src="/images/public-site/fleet/fleet-luggage.jpg"
              alt="Passenger luggage planning for a LadyBird shuttle trip"
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#030303] px-5 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] sm:min-h-[520px]">
            <Image
              src="/images/public-site/fleet/fleet-transfer.jpg"
              alt="LadyBird shuttle context for airport and corporate transfers in Zimbabwe"
              fill
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          </div>

          <div className="lg:pl-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/40">
              Transfer Context
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Prepared for airport pickups, business movement and private trips.
            </h2>
            <p className="mt-6 text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
              Whether the journey starts at the airport, a hotel, home, office
              or event location, the booking process helps collect the right
              trip details before confirmation. This supports Robert Gabriel
              Mugabe International Airport transfers, corporate transport
              Zimbabwe, private shuttle hire Zimbabwe and group travel Zimbabwe.
            </p>
            <div className="mt-8">
              <ArrowLink href="/booking" label="Book this journey" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#030303] px-5 pb-16 text-white sm:px-6 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-8 text-center backdrop-blur-2xl sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(720px,80vw)] -translate-x-1/2 rounded-full bg-white/[0.075] blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/40">
                Arrange Your Shuttle
              </p>
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Ready to arrange your shuttle?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
                Submit your trip details online and receive a booking reference
                for follow-up and tracking.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
                <ArrowLink href="/booking" label="Book Now" />
                <Link
                  href="/booking/track"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] px-4 text-[13px] font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.075] sm:h-12 sm:px-6 sm:text-sm"
                >
                  Track Booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
