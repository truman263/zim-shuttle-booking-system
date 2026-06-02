"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

const COMPANY_ID = "cmpfkzypy0000l4ew82k92cl1";

type RouteRecord = {
  id: string;
  name: string;
  pickupCity: string;
  destinationCity: string;
  distanceKm?: string | number | null;
  estimatedDurationMinutes?: number | null;
  routeType?: string;
  isActive?: boolean;
};

type SmartTripPreview = {
  requiresManualQuote?: boolean;
  pickupLocation: string;
  destination: string;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  matchedRouteName?: string | null;
  matchedPickupCity?: string | null;
  matchedDestinationCity?: string | null;
  message?: string;
};

function normalizeRoutes(data: RouteRecord[] | RouteRecord | null) {
  if (!data) {
    return [];
  }

  return (Array.isArray(data) ? data : [data]).filter((route) => {
    return route && route.pickupCity && route.destinationCity;
  });
}

function normalizeLocation(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDistance(value: string | number | null | undefined) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return null;
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km`;
}

function formatDuration(value: number | null | undefined) {
  if (value === null || typeof value === "undefined" || value <= 0) {
    return null;
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function SmartRoutesSection() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [preview, setPreview] = useState<SmartTripPreview | null>(null);
  const [previewSource, setPreviewSource] = useState<"saved" | "smart" | null>(
    null,
  );
  const [checkingTrip, setCheckingTrip] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchRoutes() {
      try {
        const routesData = await apiGet<RouteRecord[] | RouteRecord>("/routes");
        const activeRoutes = normalizeRoutes(routesData)
          .filter((route) => route.isActive !== false)
          .sort((first, second) => {
            return (first.name || first.pickupCity).localeCompare(
              second.name || second.pickupCity,
            );
          });

        if (mounted) {
          setRoutes(activeRoutes);
        }
      } catch {
        if (mounted) {
          setRoutes([]);
          setMessage(
            "Saved routes could not be loaded. You can still enter a trip below.",
          );
        }
      }
    }

    fetchRoutes();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!pickup && !destination && routes[0]) {
      setPickup(routes[0].pickupCity);
      setDestination(routes[0].destinationCity);
    }
  }, [destination, pickup, routes]);

  const locationSuggestions = useMemo(() => {
    const suggestions = new Map<string, string>();

    routes.forEach((route) => {
      const pickupKey = normalizeLocation(route.pickupCity);
      const destinationKey = normalizeLocation(route.destinationCity);

      if (!suggestions.has(pickupKey)) {
        suggestions.set(pickupKey, route.pickupCity);
      }

      if (!suggestions.has(destinationKey)) {
        suggestions.set(destinationKey, route.destinationCity);
      }
    });

    return Array.from(suggestions.values());
  }, [routes]);

  const matchingSavedRoute = useMemo(() => {
    const normalizedPickup = normalizeLocation(pickup);
    const normalizedDestination = normalizeLocation(destination);

    if (!normalizedPickup || !normalizedDestination) {
      return null;
    }

    return (
      routes.find((route) => {
        return (
          normalizeLocation(route.pickupCity) === normalizedPickup &&
          normalizeLocation(route.destinationCity) === normalizedDestination
        );
      }) ?? null
    );
  }, [destination, pickup, routes]);

  const previewDistance =
    previewSource === "saved"
      ? formatDistance(matchingSavedRoute?.distanceKm)
      : formatDistance(preview?.distanceKm);
  const previewDuration =
    previewSource === "saved"
      ? formatDuration(matchingSavedRoute?.estimatedDurationMinutes)
      : formatDuration(preview?.durationMinutes);
  const previewRouteType = formatLabel(matchingSavedRoute?.routeType);

  async function handleTripPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPickup = pickup.trim();
    const trimmedDestination = destination.trim();

    setMessage("");
    setPreview(null);
    setPreviewSource(null);

    if (!trimmedPickup || !trimmedDestination) {
      setMessage("Enter both pickup and destination to preview the trip.");
      return;
    }

    if (matchingSavedRoute) {
      setPreview({
        pickupLocation: matchingSavedRoute.pickupCity,
        destination: matchingSavedRoute.destinationCity,
        distanceKm:
          matchingSavedRoute.distanceKm === null ||
          typeof matchingSavedRoute.distanceKm === "undefined"
            ? null
            : Number(matchingSavedRoute.distanceKm),
        durationMinutes: matchingSavedRoute.estimatedDurationMinutes ?? null,
        matchedRouteName: matchingSavedRoute.name,
      });
      setPreviewSource("saved");
      return;
    }

    try {
      setCheckingTrip(true);
      const result = await apiPost<SmartTripPreview>("/smart-routes/estimate", {
        companyId: COMPANY_ID,
        pickupLocation: trimmedPickup,
        destination: trimmedDestination,
        tripDirection: "ONE_WAY",
        passengers: 1,
      });

      setPreview(result);
      setPreviewSource("smart");

      if (!result.distanceKm || !result.durationMinutes) {
        setMessage(
          "This route can still be submitted for review if distance and ETA are not available yet.",
        );
      }
    } catch {
      setMessage(
        "Trip details could not be checked right now. You can still continue to booking and submit the route for review.",
      );
    } finally {
      setCheckingTrip(false);
    }
  }

  return (
    <section
      id="routes"
      aria-labelledby="smart-routes-heading"
      className="relative overflow-hidden bg-[#F5F5F2] px-5 py-18 text-neutral-950 sm:px-6 lg:py-24"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[min(980px,88vw)] -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-neutral-950/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 border-y border-black/10 py-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:py-16">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
              Routes and Destinations
            </p>
            <h2
              id="smart-routes-heading"
              className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.04] tracking-[-0.045em] text-neutral-950 sm:text-4xl lg:text-5xl"
            >
              Check your route before you book.
            </h2>
          </div>

          <div className="max-w-2xl lg:ml-auto">
            <p className="text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8">
              Enter your pickup and destination to preview practical trip
              details such as distance and estimated travel time. LadyBird
              supports Harare airport transfers, city-to-city travel, private
              shuttle hire and custom Zimbabwe route requests.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="relative min-h-[460px] overflow-hidden rounded-[34px] border border-black/10 bg-neutral-950 p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.18)] sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(150deg,rgba(255,255,255,0.12),transparent_44%)]" />
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
              viewBox="0 0 560 560"
              preserveAspectRatio="none"
            >
              <path
                className="route-preview-line"
                d="M84 124 C184 92 226 196 286 250 C354 310 396 372 476 332"
              />
              <path
                className="route-preview-line route-preview-line-muted"
                d="M94 414 C166 350 232 364 286 250 C332 158 408 122 488 154"
              />
              <path
                className="route-preview-signal"
                d="M84 124 C184 92 226 196 286 250 C354 310 396 372 476 332"
              />
            </svg>

            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/45">
                  Trip preview
                </p>

                {preview ? (
                  <>
                    <h3 className="mt-8 text-3xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-4xl">
                      {previewSource === "saved"
                        ? preview.matchedRouteName || "Saved route"
                        : "Custom route preview"}
                    </h3>
                    <p className="mt-5 text-sm font-light leading-7 text-white/72 sm:text-base">
                      {preview.pickupLocation} to {preview.destination}
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Distance", previewDistance],
                        ["Estimated time", previewDuration],
                        ["Route type", previewRouteType],
                        [
                          "Route status",
                          previewSource === "saved"
                            ? "Saved LadyBird route"
                            : preview?.matchedRouteName
                              ? "Matched saved corridor"
                              : "Custom route",
                        ],
                      ]
                        .filter((detail): detail is [string, string] =>
                          Boolean(detail[1]),
                        )
                        .map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-[22px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-2xl"
                          >
                            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-white/38">
                              {label}
                            </p>
                            <p className="mt-2 text-base font-semibold text-white">
                              {value}
                            </p>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl">
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                      Enter a route to preview the journey.
                    </h3>
                    <p className="mt-4 text-sm font-light leading-7 text-white/70">
                      Use a saved LadyBird route or type a custom pickup and
                      destination. Distance and ETA can appear before you
                      continue to booking.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/25 p-5 backdrop-blur-2xl">
                <p className="text-sm font-light leading-7 text-white/72">
                  Trip details are a guide for planning. Booking details,
                  vehicle availability and final confirmation happen after you
                  submit your request.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-black/10 bg-white/74 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:p-7 lg:p-8">
            <div className="border-b border-black/10 pb-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-500">
                Route checker
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-neutral-950">
                Enter your trip details.
              </h3>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleTripPreview}>
              <label className="grid gap-2 text-sm font-semibold text-neutral-950">
                Pickup
                <input
                  list="ladybird-route-suggestions"
                  value={pickup}
                  onChange={(event) => setPickup(event.target.value)}
                  placeholder="Example: Harare"
                  className="h-13 rounded-[22px] border border-black/10 bg-[#FBFBFA] px-5 text-sm font-normal text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black/25 focus:bg-white"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-neutral-950">
                Destination
                <input
                  list="ladybird-route-suggestions"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Example: Mutare"
                  className="h-13 rounded-[22px] border border-black/10 bg-[#FBFBFA] px-5 text-sm font-normal text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black/25 focus:bg-white"
                />
              </label>

              <datalist id="ladybird-route-suggestions">
                {locationSuggestions.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>

              <button
                type="submit"
                disabled={checkingTrip}
                className="routes-premium-cta mt-1 inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkingTrip ? "Checking route" : "Check trip details"}
              </button>
            </form>

            {message ? (
              <div className="mt-5 rounded-[22px] border border-black/10 bg-[#F8F8F5]/90 p-4 text-sm font-normal leading-7 text-neutral-600">
                {message}
              </div>
            ) : null}

          </div>
        </div>
      </div>

      <style>{`
        .route-preview-line {
          fill: none;
          stroke: rgba(255, 255, 255, 0.12);
          stroke-width: 1.1;
          stroke-linecap: round;
        }

        .route-preview-line-muted {
          stroke: rgba(255, 255, 255, 0.07);
        }

        .route-preview-signal {
          fill: none;
          stroke: rgba(255, 255, 255, 0.35);
          stroke-width: 1.15;
          stroke-linecap: round;
          stroke-dasharray: 42 540;
          animation: routePreviewTrace 20s ease-in-out infinite;
        }

        .routes-premium-cta {
          position: relative;
          overflow: hidden;
        }

        .routes-premium-cta::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            118deg,
            transparent,
            rgba(255, 255, 255, 0.28),
            transparent
          );
          opacity: 0;
          transform: translateX(-120%);
        }

        .routes-premium-cta:hover::after {
          animation: routesPremiumSheen 900ms ease-out both;
        }

        @keyframes routePreviewTrace {
          0% {
            stroke-dashoffset: 600;
            opacity: 0;
          }
          20%,
          72% {
            opacity: 0.42;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes routesPremiumSheen {
          0% {
            opacity: 0;
            transform: translateX(-120%);
          }
          34% {
            opacity: 0.45;
          }
          100% {
            opacity: 0;
            transform: translateX(120%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .route-preview-signal,
          .routes-premium-cta,
          .routes-premium-cta:hover::after {
            animation: none;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
