'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

type TripAction = {
  id: string;
  action: string;
  note?: string | null;
  createdAt: string;
};

type DriverTrip = {
  bookingRef: string;
  status: string;
  pickupDate: string;
  pickupLocation: string;
  destination: string;
  tripType: string;
  tripDirection: string;
  routeName?: string | null;
  passengers: number;
  luggageDetails?: string | null;
  specialNotes?: string | null;
  customer: {
    fullName: string;
    phone: string;
  };
  driver: {
    fullName: string;
    phone: string;
  };
  vehicle?: {
    name: string;
    registrationNo: string;
  } | null;
  actions: TripAction[];
  canStart: boolean;
  canComplete: boolean;
  canReportIssue: boolean;
};

export default function DriverTripPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [issueNote, setIssueNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchTrip = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiGet<DriverTrip>(
        `/driver-trips/${encodeURIComponent(token)}`,
      );
      setTrip(data);
    } catch (fetchError) {
      setTrip(null);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Driver trip link could not be opened.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchTrip();
  }, [fetchTrip]);

  async function runAction(
    action: 'start' | 'complete',
    successMessage: string,
  ) {
    if (!token) {
      return;
    }

    setActionLoading(action);
    setMessage('');
    setError('');

    try {
      const updatedTrip = await apiPost<DriverTrip>(
        `/driver-trips/${encodeURIComponent(token)}/${action}`,
        {},
      );
      setTrip(updatedTrip);
      setMessage(successMessage);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Trip action could not be completed.',
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setActionLoading('report-issue');
    setMessage('');
    setError('');

    try {
      const updatedTrip = await apiPost<DriverTrip>(
        `/driver-trips/${encodeURIComponent(token)}/report-issue`,
        {
          note: issueNote.trim() || undefined,
        },
      );
      setTrip(updatedTrip);
      setIssueNote('');
      setMessage('Issue sent to LadyBird operations.');
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Issue could not be reported.',
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="relative isolate min-h-screen overflow-hidden px-5 py-6 sm:px-8">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.14),transparent_34%),linear-gradient(135deg,#050505,#111111_48%,#030303)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-white/[0.035] blur-3xl" />

        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/brand/ladybird-logo.png"
              alt="LadyBird Shuttle Services"
              width={190}
              height={82}
              priority
              className="h-auto w-[148px] sm:w-[178px]"
            />
          </Link>

          <Link
            href="/booking/track"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20"
          >
            Track
          </Link>
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-5 pt-10 lg:grid-cols-[0.92fr_1.08fr] lg:pt-16">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-500">
              Driver trip
            </p>

            {loading ? (
              <div className="mt-8 space-y-4">
                <div className="h-10 rounded-2xl bg-white/[0.06]" />
                <div className="h-24 rounded-3xl bg-white/[0.035]" />
              </div>
            ) : error && !trip ? (
              <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
                <h1 className="text-2xl font-semibold tracking-[-0.04em]">
                  Trip link unavailable.
                </h1>
                <p className="mt-3 text-sm leading-7 text-red-100/80">
                  {error}
                </p>
              </div>
            ) : trip ? (
              <>
                <div className="mt-6">
                  <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl">
                    {trip.bookingRef}
                  </h1>
                  <p className="mt-4 text-sm leading-7 text-neutral-300">
                    {trip.pickupLocation} to {trip.destination}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <StatusPill status={trip.status} />
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-neutral-300">
                    {trip.tripDirection.replaceAll('_', ' ')}
                  </span>
                </div>

                <div className="mt-8 grid gap-3">
                  <DetailRow label="Pickup" value={formatDate(trip.pickupDate)} />
                  <DetailRow label="Pickup point" value={trip.pickupLocation} />
                  <DetailRow label="Destination" value={trip.destination} />
                  <DetailRow
                    label="Route"
                    value={trip.routeName || trip.tripType.replaceAll('_', ' ')}
                  />
                  <DetailRow label="Passengers" value={String(trip.passengers)} />
                  <DetailRow
                    label="Passenger"
                    value={`${trip.customer.fullName} · ${trip.customer.phone}`}
                  />
                  <DetailRow
                    label="Vehicle"
                    value={
                      trip.vehicle
                        ? `${trip.vehicle.name} · ${trip.vehicle.registrationNo}`
                        : 'To be confirmed by operations'
                    }
                  />
                </div>
              </>
            ) : null}
          </section>

          <section className="rounded-[32px] border border-white/10 bg-black/50 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
            {trip ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={!trip.canStart || actionLoading !== null}
                    onClick={() =>
                      runAction('start', 'Trip started. The dashboard is updated.')
                    }
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-neutral-500"
                  >
                    {actionLoading === 'start' ? 'Starting...' : 'Start Trip'}
                  </button>

                  <button
                    type="button"
                    disabled={!trip.canComplete || actionLoading !== null}
                    onClick={() =>
                      runAction(
                        'complete',
                        'Trip completed. The dashboard is updated.',
                      )
                    }
                    className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:text-neutral-500"
                  >
                    {actionLoading === 'complete'
                      ? 'Completing...'
                      : 'Complete Trip'}
                  </button>
                </div>

                {(message || error) && (
                  <div
                    className={`mt-5 rounded-3xl border p-4 text-sm leading-7 ${
                      error
                        ? 'border-red-500/20 bg-red-500/10 text-red-100'
                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                    }`}
                  >
                    {error || message}
                  </div>
                )}

                <form onSubmit={submitIssue} className="mt-8">
                  <label
                    htmlFor="issueNote"
                    className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500"
                  >
                    Report issue
                  </label>
                  <textarea
                    id="issueNote"
                    value={issueNote}
                    onChange={(event) => setIssueNote(event.target.value)}
                    rows={5}
                    disabled={!trip.canReportIssue || actionLoading !== null}
                    placeholder="Add a short note for LadyBird operations."
                    className="mt-3 w-full resize-none rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!trip.canReportIssue || actionLoading !== null}
                    className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:text-neutral-500"
                  >
                    {actionLoading === 'report-issue'
                      ? 'Sending...'
                      : 'Report Issue / Cannot Complete Trip'}
                  </button>
                </form>

                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
                    Notes
                  </p>
                  <p className="mt-4 text-sm leading-7 text-neutral-300">
                    Luggage: {trip.luggageDetails || 'No luggage note provided.'}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    Special request:{' '}
                    {trip.specialNotes || 'No special request provided.'}
                  </p>
                </div>

                {trip.actions.length > 0 && (
                  <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
                      Recent activity
                    </p>
                    <div className="mt-4 space-y-4">
                      {trip.actions.map((action) => (
                        <div
                          key={action.id}
                          className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                        >
                          <p className="text-sm font-semibold text-white">
                            {action.action.replaceAll('_', ' ')}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatDate(action.createdAt)}
                          </p>
                          {action.note && (
                            <p className="mt-2 text-sm leading-6 text-neutral-300">
                              {action.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm leading-7 text-neutral-400">
                Trip actions will appear once the secure driver link is opened.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-6 text-neutral-100">
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'COMPLETED'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
      : status === 'IN_PROGRESS'
        ? 'border-sky-500/25 bg-sky-500/10 text-sky-200'
        : status === 'CONFIRMED'
          ? 'border-white/15 bg-white/[0.06] text-white'
          : 'border-white/10 bg-white/[0.04] text-neutral-300';

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleString('en-ZW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
