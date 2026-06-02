import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicFooter } from "../(public)/components/PublicFooter";
import { PublicHeader } from "../(public)/components/PublicHeader";

const email = "info@ladybirdshuttles.co.zw";
const phoneDisplay = "+263 77 361 5432";
const whatsappNumber = "263773615432";
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Hello LadyBird Shuttle Services, I need help with a shuttle booking enquiry.",
)}`;

const optionCards = [
  {
    title: "Make a new booking",
    text: "Submit pickup, destination, travel date, passenger count and trip notes through the booking page.",
    cta: "Start Booking",
    href: "/booking",
  },
  {
    title: "Track an existing booking",
    text: "Use your booking reference to follow trip status, payment progress and booking updates online.",
    cta: "Track Booking",
    href: "/booking/track",
  },
  {
    title: "Explore services first",
    text: "Review airport transfers, corporate transport, private shuttle hire and custom route requests before booking.",
    cta: "View Services",
    href: "/services",
  },
];

const checklist = [
  "Pickup point",
  "Destination",
  "Travel date and preferred time",
  "Passenger count",
  "Luggage notes",
  "Booking reference if already submitted",
];

const preparationCards = [
  {
    title: "Route information",
    text: "Pickup, destination and any stops or custom route notes.",
  },
  {
    title: "Passenger and luggage details",
    text: "Passenger count, luggage notes and group travel requirements.",
  },
  {
    title: "Timing and follow-up",
    text: "Travel date, preferred pickup time and booking reference if available.",
  },
];

const faqs = [
  {
    question: "Can I request a custom route?",
    answer:
      "Yes. Customers can submit pickup and destination details when the journey does not match a saved route. The route and fare are reviewed before confirmation.",
  },
  {
    question: "Can I track my booking online?",
    answer:
      "Yes. Use your booking reference on the tracking page to follow booking status, payment progress and trip updates.",
  },
  {
    question: "Are airport transfers supported?",
    answer:
      "Yes. Customers can request airport pickup and drop-off support, including travel date, passenger details and luggage notes.",
  },
  {
    question: "Are fares confirmed instantly?",
    answer:
      "Saved route information may help speed up the process, but fare and availability confirmation should happen through the booking process before travel.",
  },
];

export const metadata: Metadata = {
  title: "Contact LadyBird Shuttle Services | Shuttle Booking Enquiries Zimbabwe",
  description:
    "Contact LadyBird Shuttle Services for shuttle booking enquiries, Harare airport transfers, corporate transport, private shuttle hire and custom route requests across Zimbabwe.",
};

export default function ContactPage() {
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
        <section className="relative min-h-[620px] overflow-hidden px-5 py-16 sm:px-6 lg:min-h-[700px] lg:py-20">
          <Image
            src="/images/public-site/corporate-transfer.jpg"
            alt="LadyBird Shuttle Services contact and shuttle booking enquiries"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.66)_46%,rgba(0,0,0,0.48)),radial-gradient(circle_at_68%_35%,rgba(255,255,255,0.13),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030303] to-transparent" />

          <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center lg:min-h-[560px]">
            <div className="max-w-4xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.36em] text-white/55">
                Contact LadyBird
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-[58px]">
                Let's arrange the right shuttle journey.
              </h1>
              <p className="mt-6 max-w-2xl text-sm font-light leading-7 text-white/75 sm:text-base sm:leading-8">
                Start with your route, travel date, passenger details and any
                luggage notes so the team can review your request and guide the
                next step.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/booking"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-200"
                >
                  Book a Shuttle
                </Link>
                <Link
                  href="/booking/track"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] px-6 text-sm font-semibold text-white backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.075]"
                >
                  Track Booking
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F2] px-5 py-14 text-neutral-950 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 border-y border-black/10 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                  Contact Options
                </p>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                  Choose the best way to continue.
                </h2>
              </div>
              <p className="max-w-2xl text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8 lg:ml-auto">
                For shuttle booking enquiries Zimbabwe customers can either
                submit a new request, track a booking reference or review the
                service options before continuing.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {optionCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[30px] border border-black/10 bg-white/[0.82] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.055)] transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:bg-white"
                >
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">
                    {card.title}
                  </h3>
                  <p className="mt-4 min-h-[84px] text-sm font-normal leading-7 text-neutral-600">
                    {card.text}
                  </p>
                  <Link
                    href={card.href}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-800"
                  >
                    {card.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#030303] px-5 py-16 text-white sm:px-6 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/38">
                Direct Enquiries
              </p>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Direct enquiries and trip details.
              </h2>
              <p className="mt-5 max-w-xl text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
                Contact LadyBird Shuttle Services for Harare airport transfer
                enquiries, private shuttle hire Zimbabwe requests, corporate
                transport enquiries and custom route requests Zimbabwe.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/38">
                  WhatsApp
                </p>
                <h3 className="mt-5 text-lg font-semibold">{phoneDisplay}</h3>
                <p className="mt-4 text-sm font-light leading-7 text-white/58">
                  Talk to the team about a route, fare review or booking
                  status.
                </p>
              </a>

              <a
                href={`tel:+${whatsappNumber}`}
                className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/38">
                  Phone
                </p>
                <h3 className="mt-5 text-lg font-semibold">{phoneDisplay}</h3>
                <p className="mt-4 text-sm font-light leading-7 text-white/58">
                  Use the same number for direct phone and customer support
                  follow-up.
                </p>
              </a>

              <a
                href={`mailto:${email}`}
                className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/38">
                  Email
                </p>
                <h3 className="mt-5 break-words text-lg font-semibold">
                  {email}
                </h3>
                <p className="mt-4 text-sm font-light leading-7 text-white/58">
                  Send route details, passenger notes or booking enquiry
                  context.
                </p>
              </a>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-7xl rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                  Prepare your trip details before contacting the team.
                </h3>
                <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-white/65 sm:text-base sm:leading-8">
                  For faster support, prepare your pickup point, destination,
                  travel date, passenger count, luggage notes and any special
                  travel instructions.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {checklist.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/72"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F7F7F4] px-5 py-14 text-neutral-950 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                Enquiry Preparation
              </p>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                What helps us respond clearly.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {preparationCards.map((card, index) => (
                <article
                  key={card.title}
                  className="rounded-[30px] border border-black/10 bg-white/[0.82] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.05)]"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.025em]">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-sm font-normal leading-7 text-neutral-600">
                    {card.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#030303] px-5 py-16 text-white sm:px-6 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 border-y border-white/10 py-10 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/38">
                  Quick Answers
                </p>
                <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                  Questions before you contact us.
                </h2>
              </div>

              <div className="grid gap-4">
                {faqs.map((faq) => (
                  <article
                    key={faq.question}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6"
                  >
                    <h3 className="text-lg font-semibold tracking-[-0.02em]">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm font-light leading-7 text-white/62">
                      {faq.answer}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#030303] px-5 pb-16 text-white sm:px-6 lg:pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-8 text-center backdrop-blur-2xl sm:p-10 lg:p-12">
              <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(720px,80vw)] -translate-x-1/2 rounded-full bg-white/[0.075] blur-3xl" />
              <div className="relative">
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/38">
                  Shuttle Enquiries
                </p>
                <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                  Ready to arrange your shuttle?
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
                  Submit your trip details online and receive a booking
                  reference for follow-up and tracking.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/booking"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-200"
                  >
                    Book Now
                  </Link>
                  <Link
                    href="/booking/track"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.075]"
                  >
                    Track Booking
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
