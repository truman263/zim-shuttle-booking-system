import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter } from "../../(public)/components/PublicFooter";
import { PublicHeader } from "../../(public)/components/PublicHeader";
import {
  getTravelGuidePost,
  travelGuidePosts,
} from "../../(public)/data/travelGuidePosts";

export function generateStaticParams() {
  return travelGuidePosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getTravelGuidePost(slug);

  if (!post) {
    return {
      title: "LadyBird Travel Guide",
    };
  }

  return {
    title: `${post.title} | LadyBird Travel Guide`,
    description: post.excerpt,
  };
}

export default async function TravelGuideArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getTravelGuidePost(slug);

  if (!post) {
    notFound();
  }

  const currentIndex = travelGuidePosts.findIndex(
    (guide) => guide.slug === post.slug,
  );
  const nextPost =
    travelGuidePosts[(currentIndex + 1) % travelGuidePosts.length];
  const otherPosts = travelGuidePosts.filter((guide) => guide.slug !== post.slug);

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
        <section className="relative px-7 py-14 sm:px-8 sm:py-16 lg:px-6 lg:py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_58%)]" />
          <div className="relative mx-auto max-w-4xl border-y border-white/10 py-12">
            <Link
              href="/travel-guide"
              className="text-xs font-medium uppercase tracking-[0.28em] text-white/45 transition hover:text-white"
            >
              Travel Guide
            </Link>
            <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.34em] text-white/38">
              {post.category}
            </p>
            <h1 className="mt-5 max-w-[22rem] break-words text-[2.45rem] font-semibold leading-[1.02] tracking-[-0.055em] sm:max-w-3xl sm:text-5xl lg:max-w-4xl lg:text-[56px]">
              {post.title}
            </h1>
            <p className="mt-6 max-w-[22rem] text-[15px] font-light leading-8 text-white/72 sm:max-w-3xl sm:text-base">
              {post.intro}
            </p>
            <p className="mt-6 text-sm text-white/38">{post.readTime}</p>
          </div>
        </section>

        <section className="bg-[#F5F5F2] px-5 py-14 text-neutral-950 sm:px-6 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <article className="rounded-[34px] border border-black/10 bg-white/[0.84] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.07)] sm:p-8 lg:p-10">
              <div className="grid gap-8">
                {post.sections.map((section, index) => (
                  <section
                    key={section.heading}
                    className="border-b border-black/10 pb-8 last:border-b-0 last:pb-0"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-4 max-w-3xl text-xl font-semibold leading-snug tracking-[-0.025em] sm:text-2xl">
                      {section.heading}
                    </h2>
                    <div className="mt-5 grid gap-4">
                      {section.body.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="max-w-4xl text-[15px] font-normal leading-8 text-neutral-700"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-[32px] border border-black/10 bg-neutral-950 p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.12)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/38">
                  Other Guides
                </p>
                <div className="mt-5 grid gap-3">
                  {otherPosts.map((guide) => (
                    <Link
                      key={guide.slug}
                      href={`/travel-guide/${guide.slug}`}
                      className="group rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35">
                        {guide.category}
                      </p>
                      <h3 className="mt-3 text-sm font-semibold leading-6 text-white">
                        {guide.title}
                      </h3>
                      <p className="mt-3 text-xs font-light leading-6 text-white/52">
                        {guide.readTime}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[28px] border border-black/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.055)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-400">
                  Next Guide
                </p>
                <h3 className="mt-4 text-lg font-semibold leading-snug tracking-[-0.02em]">
                  {nextPost.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">
                  {nextPost.excerpt}
                </p>
                <Link
                  href={`/travel-guide/${nextPost.slug}`}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  Next guide
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-[#030303] px-5 py-14 text-white sm:px-6 lg:py-20">
          <div className="mx-auto max-w-4xl rounded-[34px] border border-white/10 bg-white/[0.045] p-8 text-center backdrop-blur-2xl sm:p-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/38">
              Next Step
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-4xl">
              Ready to arrange your shuttle?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-7 text-white/68 sm:text-base sm:leading-8">
              Submit your trip details online and receive a booking reference
              for follow-up and tracking.
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
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
