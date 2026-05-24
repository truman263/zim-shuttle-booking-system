'use client';

import { FormEvent, useState } from 'react';
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

  async function trackBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanRef = bookingRef.trim().toUpperCase();

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
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#1f1a10_0%,#050505_45%)] px-6 py-12 md:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C8A96A]">
            LadyBird Shuttle Services
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Track your booking.
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400 md:text-base">
            Enter your booking reference to check the latest status of your
            shuttle request, payment state, trip details and assignment updates.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 md:px-10">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[420px_1fr]">
          <form
            noValidate
            onSubmit={trackBooking}
            className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Booking Reference
            </p>

            <h2 className="mt-3 text-2xl font-semibold">Find your booking</h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Your booking reference looks like LB-20260523-3899.
            </p>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                Booking Reference <span className="text-[#C8A96A]">*</span>
              </span>

              <input
                value={bookingRef}
                onChange={(event) => setBookingRef(event.target.value)}
                placeholder="Example: LB-20260523-3899"
                className="input-field uppercase"
              />
            </label>

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#C8A96A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Track Booking'}
            </button>

            <a
              href="/booking"
              className="mt-3 block rounded-full border border-white/10 px-6 py-3 text-center text-sm font-medium text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
            >
              Make a New Booking
            </a>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04]">
            {!booking && (
              <div className="p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Status
                </p>

                <h2 className="mt-3 text-2xl font-semibold">
                  Booking details will appear here.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
                  After entering your booking reference, you will see your trip
                  details, payment status and assignment information.
                </p>
              </div>
            )}

            {booking && (
              <div>
                <div className="border-b border-white/10 p-6">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#C8A96A]">
                        Booking Found
                      </p>

                      <h2 className="mt-3 text-3xl font-semibold">
                        {booking.bookingRef}
                      </h2>

                      <p className="mt-2 text-sm text-neutral-500">
                        {booking.customer.fullName} • {booking.customer.phone}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <StatusBadge label={booking.status} />
                      <PaymentBadge label={booking.paymentStatus} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-2">
                  <InfoCard
                    title="Trip"
                    lines={[
                      booking.route?.name || 'Custom trip',
                      humanise(booking.tripType),
                      humanise(booking.tripDirection),
                      `${booking.pickupLocation} → ${booking.destination}`,
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
                        ? `${booking.returnPickupLocation || 'Return pickup'} → ${
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
                      `Driver: ${booking.driver?.fullName || 'Not assigned yet'}`,
                      `Vehicle: ${
                        booking.vehicle
                          ? `${booking.vehicle.name} (${booking.vehicle.registrationNo})`
                          : 'Not assigned yet'
                      }`,
                    ]}
                  />
                </div>

                <div className="border-t border-white/10 p-6">
                  <div className="rounded-3xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-5">
                    <p className="text-sm font-semibold text-[#C8A96A]">
                      What happens next?
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">
                      Our team will review your booking, confirm availability
                      and update the booking status. Keep your booking reference
                      safe for future tracking.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.85rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .input-field::placeholder {
          color: rgba(163, 163, 163, 0.65);
        }

        .input-field:focus {
          border-color: rgba(200, 169, 106, 0.7);
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </main>
  );
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
        {title}
      </p>

      <div className="mt-4 space-y-2">
        {lines.map((line, index) => (
          <p
            key={`${title}-${index}`}
            className={index === 0 ? 'font-semibold text-white' : 'text-sm text-neutral-400'}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    CONFIRMED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    DRIVER_ASSIGNED: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    VEHICLE_ASSIGNED: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    IN_PROGRESS: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    COMPLETED: 'border-green-500/30 bg-green-500/10 text-green-300',
    CANCELLED: 'border-red-500/30 bg-red-500/10 text-red-300',
    NO_SHOW: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return (
    <span
      className={`inline-flex h-8 items-center justify-center rounded-full border px-4 text-[11px] font-bold uppercase tracking-wide ${
        styles[label] ?? 'border-white/10 bg-white/5 text-neutral-300'
      }`}
    >
      {label.replaceAll('_', ' ')}
    </span>
  );
}

function PaymentBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    PAID: 'border-green-500/30 bg-green-500/10 text-green-300',
    PARTIALLY_PAID: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    UNPAID: 'border-red-500/30 bg-red-500/10 text-red-300',
    FAILED: 'border-red-500/30 bg-red-500/10 text-red-300',
    REFUNDED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  };

  return (
    <span
      className={`inline-flex h-8 items-center justify-center rounded-full border px-4 text-[11px] font-bold uppercase tracking-wide ${
        styles[label] ?? 'border-white/10 bg-white/5 text-neutral-300'
      }`}
    >
      {label.replaceAll('_', ' ')}
    </span>
  );
}