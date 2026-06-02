import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicFooter } from "../(public)/components/PublicFooter";
import { PublicHeader } from "../(public)/components/PublicHeader";
import { TravelGuideCard } from "../(public)/components/TravelGuideCard";
import {
  featuredTravelGuidePost,
  travelGuidePosts,
} from "../(public)/data/travelGuidePosts";

export const metadata: Metadata = {
  title: "LadyBird Travel Guide | Airport Transfers & Shuttle Travel Zimbabwe",
  description:
    "Read LadyBird Shuttle Services travel guides for Harare airport transfers, private shuttle hire, corporate transport and shuttle travel planning across Zimbabwe.",
};

export default function TravelGuide() {
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
        <section className="relative min-h-[620px] overflow-hidden px-5 py-20 sm:px-6 lg:min-h-[700px] lg:py-24">
          <Image
            src="/images/public-site/great-zimbabwe.jpg"
            alt="Great Zimbabwe travel guide for LadyBird Shuttle Services"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.64)_42%,rgba(0,0,0,0.42)),radial-gradient(circle_at_72%_34%,rgba(255,255,255,0.14),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030303] to-transparent" />

          <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center lg:min-h-[560px]">
            <div className="max-w-4xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.36em] text-white/55">
                LadyBird Travel Guide
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
                Travel guidance for airport transfers and private shuttle journeys.
              </h1>
              <p className="mt-6 max-w-2xl text-sm font-light leading-7 text-white/72 sm:text-base sm:leading-8">
                Helpful guides for planning Harare airport pickups, corporate
                transport, private shuttle hire and custom travel requests
                across Zimbabwe.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/booking"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-200"
                >
                  Book a Shuttle
                </Link>
                <Link
                  href="/services"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] px-6 text-sm font-semibold text-white backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.075]"
                >
                  View Services
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F2] px-5 py-16 text-neutral-950 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 border-y border-black/10 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                  Featured Guide
                </p>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                  How to plan a Harare airport transfer before you arrive.
                </h2>
              </div>
              <article className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.08)] sm:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                  {featuredTravelGuidePost.category}
                </p>
                <p className="mt-5 text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8">
                  {featuredTravelGuidePost.excerpt}
                </p>
                <div className="mt-6">
                  <Link
                    href={`/travel-guide/${featuredTravelGuidePost.slug}`}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-800"
                  >
                    Read guide
                  </Link>
                </div>
              </article>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {travelGuidePosts.map((post) => (
                <TravelGuideCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#030303] px-5 py-16 text-white sm:px-6 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/40">
                Travel Planning
              </p>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Helpful travel planning for Zimbabwe shuttle journeys.
              </h2>
            </div>
            <p className="text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
              LadyBird Shuttle Services helps customers submit clear travel
              details for airport transfers, corporate transport, private hire
              and custom route requests. These guides are written to help
              travellers understand what information to prepare before booking.
            </p>
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
