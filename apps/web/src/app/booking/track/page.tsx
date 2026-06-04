'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PublicFooter } from '../../(public)/components/PublicFooter';
import { PublicHeader } from '../../(public)/components/PublicHeader';
import { apiGet } from '@/lib/api';

type TrackedBooking = {
  bookingRef: string;
  status: string;
  paymentStatus: string;
  tripType: string;
  tripDirection: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  dropoffDate?: string | null;
  returnDate?: string | null;
  returnPickupLocation?: string | null;
  returnDestination?: string | null;
  passengers: number;
  estimatedPrice?: string | number | null;
  finalPrice?: string | number | null;
  depositAmount?: string | number | null;
  customer: {
    fullName: string;
    phone: string;
  };
  route?: {
    name: string;
    pickupCity: string;
    destinationCity: string;
  } | null;
  driver?: {
    fullName: string;
  } | null;
  vehicle?: {
    name: string;
    registrationNo: string;
  } | null;
};

export default function TrackBookingPage() {
  const [bookingRef, setBookingRef] = useState('');
  const [booking, setBooking] = useState<TrackedBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function formatMoney(value: string | number | null | undefined) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
  }

  function formatDate(value?: string | null) {
    if (!value) {
      return 'Not set';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not set';
    }

    return date.toLocaleString();
  }

  function humanise(value?: string | null) {
    if (!value) {
      return 'Not set';
    }

    return value.replaceAll('_', ' ');
  }

  const trackBookingByReference = useCallback(async (reference: string) => {
    const cleanRef = reference.trim().toUpperCase();

    setBookingRef(cleanRef);
    setBooking(null);
    setErrorMessage('');

    if (!cleanRef) {
      setErrorMessage('Please enter your booking reference.');
      return;
    }

    try {
      setLoading(true);

      const result = await apiGet<TrackedBooking>(
        `/public-bookings/track/${encodeURIComponent(cleanRef)}`,
      );

      setBooking(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to find booking. Please check your booking reference.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get(
      'reference',
    );

    if (reference) {
      void trackBookingByReference(reference);
    }
  }, [trackBookingByReference]);

  async function trackBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await trackBookingByReference(bookingRef);
  }

  return (
    <div
      className="min-h-dvh bg-[#030303] text-white"
      style={{
        fontFamily:
          "Inter, Montserrat, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <PublicHeader />

      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-cover bg-center opacity-35"
          style={{
            backgroundImage: "url('/images/public-site/lb-hero-shuttle.jpg')",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[linear-gradient(180deg,rgba(0,0,0,0.70)_0%,rgba(0,0,0,0.42)_44%,#030303_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-28 h-72 w-72 -translate-x-1/2 rounded-full bg-white/[0.055] blur-3xl" />

        <section className="relative px-7 pb-12 pt-14 sm:px-6 sm:pt-16 lg:pb-16 lg:pt-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-[11px] font-light uppercase tracking-[0.42em] text-neutral-500">
              Booking tracking
            </p>

            <h1 className="mt-5 max-w-[22rem] break-words text-[2.55rem] font-semibold leading-[1.02] tracking-[-0.052em] text-white sm:max-w-4xl sm:text-5xl lg:text-6xl">
              Track your shuttle booking.
            </h1>

            <p className="mt-5 max-w-[22rem] text-[15px] font-light leading-8 text-neutral-300/85 sm:max-w-2xl sm:text-base">
              Enter your booking reference to view trip status, payment state,
              passenger details and assignment updates from LadyBird Shuttle
              Services.
            </p>
          </div>
        </section>

        <section className="relative px-5 pb-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            <form
              noValidate
              onSubmit={trackBooking}
              className="h-fit rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:rounded-[30px] sm:p-6"
            >
              <p className="text-[11px] font-light uppercase tracking-[0.34em] text-neutral-500">
                Booking Reference
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
                Find your booking
              </h2>

              <p className="mt-2 text-sm font-light leading-6 text-neutral-500">
                Your booking reference looks like LB-20260523-3899.
              </p>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-medium text-neutral-300">
                  Booking Reference <span className="text-white">*</span>
                </span>

                <input
                  value={bookingRef}
                  onChange={(event) => setBookingRef(event.target.value)}
                  placeholder="Example: LB-20260523-3899"
                  className="track-input uppercase"
                />
              </label>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-neutral-200">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Track Booking'}
              </button>

              <Link
                href="/booking"
                className="mt-3 block rounded-full border border-white/10 px-6 py-3 text-center text-sm font-medium text-neutral-300 transition hover:border-white/25 hover:text-white"
              >
                Make a New Booking
              </Link>
            </form>

            <section className="min-w-0 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:rounded-[30px]">
              {loading && !booking && (
                <EmptyState
                  eyebrow="Checking"
                  title="Looking up your booking."
                  description="Please wait while we check the latest status for this reference."
                />
              )}

              {!loading && !booking && (
                <EmptyState
                  eyebrow="Status"
                  title="Booking details will appear here."
                  description="After entering your booking reference, you will see trip details, payment status and assignment information."
                />
              )}

              {booking && (
                <div>
                  <div className="border-b border-white/10 p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-[11px] font-light uppercase tracking-[0.34em] text-neutral-500">
                          Booking Found
                        </p>

                        <h2 className="mt-3 break-words text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
                          {booking.bookingRef}
                        </h2>

                        <p className="mt-2 text-sm text-neutral-500">
                          {booking.customer.fullName} / {booking.customer.phone}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <StatusBadge label={booking.status} />
                        <PaymentBadge label={booking.paymentStatus} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
                    <InfoCard
                      title="Trip"
                      lines={[
                        booking.route?.name || 'Custom trip',
                        humanise(booking.tripType),
                        humanise(booking.tripDirection),
                        `${booking.pickupLocation} -> ${booking.destination}`,
                      ]}
                    />

                    <InfoCard
                      title="Schedule"
                      lines={[
                        `Pickup: ${formatDate(booking.pickupDate)}`,
                        booking.tripDirection === 'ROUND_TRIP'
                          ? `Return: ${formatDate(booking.returnDate)}`
                          : `Drop-off: ${formatDate(booking.dropoffDate)}`,
                        booking.tripDirection === 'ROUND_TRIP'
                          ? `${booking.returnPickupLocation || 'Return pickup'} -> ${
                              booking.returnDestination || 'Return destination'
                            }`
                          : '',
                      ].filter(Boolean)}
                    />

                    <InfoCard
                      title="Passengers and Price"
                      lines={[
                        `Passengers: ${booking.passengers}`,
                        `Estimated Price: $${formatMoney(
                          booking.estimatedPrice,
                        )}`,
                        `Final Price: $${formatMoney(booking.finalPrice)}`,
                        `Deposit: $${formatMoney(booking.depositAmount)}`,
                      ]}
                    />

                    <InfoCard
                      title="Assignment"
                      lines={[
                        `Driver: ${
                          booking.driver?.fullName || 'Not assigned yet'
                        }`,
                        `Vehicle: ${
                          booking.vehicle
                            ? `${booking.vehicle.name} (${booking.vehicle.registrationNo})`
                            : 'Not assigned yet'
                        }`,
                      ]}
                    />
                  </div>

                  <div className="border-t border-white/10 p-5 sm:p-6">
                    <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
                      <p className="text-sm font-semibold text-white">
                        What happens next?
                      </p>
                      <p className="mt-2 text-sm font-light leading-6 text-neutral-400">
                        The operations team will continue updating this booking
                        as availability, payment and assignment details change.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>

      <PublicFooter />

      <style jsx>{`
        .track-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.045);
          padding: 0.9rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .track-input::placeholder {
          color: rgba(163, 163, 163, 0.65);
        }

        .track-input:focus {
          border-color: rgba(255, 255, 255, 0.34);
          background: rgba(255, 255, 255, 0.07);
        }
      `}</style>
    </div>
  );
}

function EmptyState({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 sm:p-10">
      <p className="text-[11px] font-light uppercase tracking-[0.34em] text-neutral-500">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
        {title}
      </h2>

      <p className="mt-3 max-w-xl text-sm font-light leading-6 text-neutral-500">
        {description}
      </p>
    </div>
  );
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
      <p className="text-[11px] font-light uppercase tracking-[0.28em] text-neutral-500">
        {title}
      </p>

      <div className="mt-4 space-y-2">
        {lines.map((line, index) => (
          <p
            key={`${title}-${index}`}
            className={
              index === 0
                ? 'break-words font-semibold text-white'
                : 'break-words text-sm font-light text-neutral-400'
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const activeStatuses = ['CONFIRMED', 'DRIVER_ASSIGNED', 'VEHICLE_ASSIGNED'];
  const completeStatuses = ['COMPLETED'];

  const className = completeStatuses.includes(label)
    ? 'border-white bg-white text-black'
    : activeStatuses.includes(label)
      ? 'border-white/25 bg-white/[0.10] text-white'
      : 'border-white/15 bg-white/[0.055] text-neutral-200';

  return (
    <span
      className={`inline-flex h-9 items-center justify-center rounded-full border px-4 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {label.replaceAll('_', ' ')}
    </span>
  );
}

function PaymentBadge({ label }: { label: string }) {
  const className =
    label === 'PAID'
      ? 'border-white bg-white text-black'
      : 'border-white/15 bg-white/[0.055] text-neutral-200';

  return (
    <span
      className={`inline-flex h-9 items-center justify-center rounded-full border px-4 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {label.replaceAll('_', ' ')}
    </span>
  );
}
