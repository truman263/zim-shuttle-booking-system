import Link from "next/link";
import type { TravelGuidePost } from "../data/travelGuidePosts";

export function TravelGuideCard({
  post,
  variant = "light",
}: {
  post: TravelGuidePost;
  variant?: "dark" | "light";
}) {
  const isDark = variant === "dark";

  return (
    <article
      className={[
        "group flex h-full flex-col rounded-[28px] border p-6 transition duration-500 hover:-translate-y-1",
        isDark
          ? "border-white/10 bg-white/[0.045] text-white hover:border-white/20 hover:bg-white/[0.065]"
          : "border-black/10 bg-white/80 text-neutral-950 shadow-[0_20px_70px_rgba(0,0,0,0.055)] hover:border-black/20 hover:bg-white",
      ].join(" ")}
    >
      <p
        className={[
          "text-[11px] font-medium uppercase tracking-[0.3em]",
          isDark ? "text-white/38" : "text-neutral-400",
        ].join(" ")}
      >
        {post.category}
      </p>
      <h3 className="mt-5 text-xl font-semibold leading-snug tracking-[-0.025em]">
        {post.title}
      </h3>
      <p
        className={[
          "mt-4 flex-1 text-sm font-normal leading-7",
          isDark ? "text-white/62" : "text-neutral-600",
        ].join(" ")}
      >
        {post.excerpt}
      </p>
      <div className="mt-6 flex items-center justify-between gap-4">
        <span
          className={[
            "text-xs font-medium",
            isDark ? "text-white/38" : "text-neutral-500",
          ].join(" ")}
        >
          {post.readTime}
        </span>
        <Link
          href={`/travel-guide/${post.slug}`}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition duration-300",
            isDark
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-neutral-950 text-white hover:bg-neutral-800",
          ].join(" ")}
        >
          Read guide
        </Link>
      </div>
    </article>
  );
}
