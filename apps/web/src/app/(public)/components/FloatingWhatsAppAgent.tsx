"use client";

import { useEffect, useMemo, useState } from "react";

const WHATSAPP_NUMBER = "263773615432";

export function FloatingWhatsAppAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [typedText, setTypedText] = useState("");

  const prompt =
    "Hi, need help with a route, fare or booking status? Talk to us on WhatsApp and the team can assist.";

  const whatsappUrl = useMemo(() => {
    const message =
      "Hello LadyBird Shuttle Services, I need help with a shuttle booking.";

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message,
    )}`;
  }, []);

  useEffect(() => {
    const canAutoOpen = window.matchMedia("(min-width: 768px)").matches;

    if (!canAutoOpen) {
      return;
    }

    const timer = window.setTimeout(() => setIsOpen(true), 1400);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTypedText("");
      return;
    }

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setTypedText(prompt.slice(0, index));

      if (index >= prompt.length) {
        window.clearInterval(interval);
      }
    }, 23);

    return () => window.clearInterval(interval);
  }, [isOpen, prompt]);

  return (
    <div className="fixed bottom-5 right-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      {isOpen && (
        <div className="whatsapp-agent-card relative w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-white/15 bg-black/70 p-4 text-white shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_5%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.1),transparent_45%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-400">
                  Booking Support
                </p>
                <h2 className="mt-2 text-base font-semibold tracking-[-0.02em]">
                  Need help?
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-neutral-400 transition hover:border-white/25 hover:text-white"
                aria-label="Close WhatsApp help"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <p className="mt-4 min-h-[72px] text-sm font-light leading-6 text-neutral-300">
              {typedText}
              <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-white/70 align-middle whatsapp-agent-cursor" />
            </p>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.5)] whatsapp-agent-pulse" />
                Opens WhatsApp chat
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200"
              >
                <WhatsAppIcon />
                Chat
              </a>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="whatsapp-agent-button inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:bg-neutral-200"
        aria-expanded={isOpen}
        aria-label="Open WhatsApp help"
      >
        <WhatsAppIcon />
        Need help?
      </button>

      <style jsx>{`
        .whatsapp-agent-card {
          animation: whatsappAgentFloat 520ms ease-out both,
            whatsappAgentBreathe 7s ease-in-out infinite;
        }

        .whatsapp-agent-button {
          animation: whatsappButtonEntrance 700ms ease-out both,
            whatsappButtonBreathe 5.8s ease-in-out infinite;
        }

        .whatsapp-agent-cursor {
          animation: whatsappCursor 900ms steps(2, start) infinite;
        }

        .whatsapp-agent-pulse {
          animation: whatsappPulse 2.4s ease-in-out infinite;
        }

        @keyframes whatsappAgentFloat {
          from {
            opacity: 0;
            transform: translate3d(0, 18px, 0) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes whatsappAgentBreathe {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -4px, 0);
          }
        }

        @keyframes whatsappButtonEntrance {
          from {
            opacity: 0;
            transform: translate3d(0, 14px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes whatsappButtonBreathe {
          0%,
          100% {
            box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
          }
          50% {
            box-shadow: 0 22px 80px rgba(255, 255, 255, 0.12);
          }
        }

        @keyframes whatsappCursor {
          0%,
          45% {
            opacity: 1;
          }
          46%,
          100% {
            opacity: 0;
          }
        }

        @keyframes whatsappPulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.18);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .whatsapp-agent-card,
          .whatsapp-agent-button,
          .whatsapp-agent-cursor,
          .whatsapp-agent-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2.05 22l5.25-1.38a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.37c0-4.54 3.69-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.41 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.96-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.64 4.2 3.7.59.25 1.05.4 1.41.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z"
      />
    </svg>
  );
}
