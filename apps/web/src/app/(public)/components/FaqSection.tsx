"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Can I book airport transfers with LadyBird?",
    answer:
      "Yes. You can submit your airport pickup or drop-off details, including travel date, passenger details and route notes. The team confirms the trip details before travel.",
  },
  {
    question: "What if my destination is not listed?",
    answer:
      "You can still request a custom route. Enter your pickup and destination through the booking page, then the team can review the journey and confirm the details.",
  },
  {
    question: "Can I preview distance and travel time before booking?",
    answer:
      "For supported routes, the website can show a planning preview with distance and estimated travel time. These details help you plan before submitting the booking request.",
  },
  {
    question: "How do I track my booking?",
    answer:
      "After submitting a booking, use your booking reference on the tracking page to check trip status, payment status and confirmed trip information.",
  },
  {
    question: "Are fares confirmed immediately?",
    answer:
      "Trip details are reviewed before confirmation. This keeps airport transfers, private shuttle hire and city-to-city travel clear before you travel.",
  },
  {
    question: "Do you handle business and private travel?",
    answer:
      "Yes. LadyBird supports corporate transport, private shuttle hire, airport transfers, small group travel and custom Zimbabwe route requests.",
  },
];

export function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section
      id="faqs"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden bg-[#030303] px-5 py-16 text-white sm:px-6 lg:py-18"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[min(900px,86vw)] -translate-x-1/2 rounded-full bg-white/[0.055] blur-3xl" />

      <div className="relative mx-auto max-w-7xl border-y border-white/10 py-10 lg:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/38">
            FAQs
          </p>
          <h2
            id="faq-heading"
            className="mx-auto mt-5 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl"
          >
            Questions before you book.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-7 text-white/62 sm:text-base sm:leading-8">
            A short guide to airport transfers, custom routes, tracking and
            trip confirmation before you continue to the booking page.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl items-start gap-3 lg:grid-cols-2">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;
            const panelId = `faq-answer-${index}`;

            return (
              <div
                key={faq.question}
                className={[
                  "rounded-[28px] border p-5 backdrop-blur-2xl transition duration-300 sm:p-6",
                  isOpen
                    ? "border-white/12 bg-white/[0.065]"
                    : "border-white/10 bg-white/[0.04] hover:border-white/14 hover:bg-white/[0.055]",
                ].join(" ")}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() =>
                    setActiveIndex((currentIndex) =>
                      currentIndex === index ? null : index,
                    )
                  }
                  className="flex w-full items-center justify-between gap-5 text-left"
                >
                  <span className="text-base font-semibold tracking-[-0.015em] text-white sm:text-lg">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-xl font-light text-white/72 transition duration-300",
                      isOpen ? "rotate-45 bg-white/[0.095]" : "",
                    ].join(" ")}
                  >
                    +
                  </span>
                </button>

                {isOpen ? (
                  <div id={panelId} className="min-h-[112px]">
                    <p className="mt-4 max-w-3xl text-sm font-light leading-7 text-white/64 sm:text-base sm:leading-8">
                      {faq.answer}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
