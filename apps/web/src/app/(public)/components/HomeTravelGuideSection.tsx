import Link from "next/link";
import { TravelGuideCard } from "./TravelGuideCard";
import { travelGuidePosts } from "../data/travelGuidePosts";

export function HomeTravelGuideSection() {
  const previewPosts = travelGuidePosts.slice(0, 3);

  return (
    <section className="bg-[#F5F5F2] px-5 py-16 text-neutral-950 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-y border-black/10 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
              Travel Guide
            </p>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Helpful guides before you book.
            </h2>
          </div>

          <div className="max-w-2xl lg:ml-auto">
            <p className="text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8">
              Read practical travel notes for airport pickups, private shuttle
              hire, corporate transport and city-to-city journeys across
              Zimbabwe.
            </p>
            <div className="mt-6">
              <Link
                href="/travel-guide"
                className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                View Travel Guide
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {previewPosts.map((post) => (
            <TravelGuideCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
