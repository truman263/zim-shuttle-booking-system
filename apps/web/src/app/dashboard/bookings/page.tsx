'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';

type Booking = {
  id: string;
  bookingRef: string;
  tripType: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  passengers: number;
  finalPrice: string | number | null;
  status: string;
  paymentStatus: string;
  customer?: {
    fullName: string;
    phone: string;
  };
  route?: {
    name: string;
  };
  driver?: {
    fullName: string;
    status: string;
  } | null;
  vehicle?: {
    name: string;
    registrationNo: string;
    status: string;
  } | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function fetchBookings() {
    try {
      setErrorMessage('');
      const data = await apiGet<Booking[] | Booking>('/bookings');
      setBookings(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading bookings',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      setActionLoadingId(bookingId);

      await apiPatch(`/bookings/${bookingId}/status`, {
        status,
      });

      await fetchBookings();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating booking',
      );
    } finally {
      setActionLoadingId('');
    }
  }

  const bookingStats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === 'PENDING')
        .length,
      completed: bookings.filter((booking) => booking.status === 'COMPLETED')
        .length,
      paid: bookings.filter((booking) => booking.paymentStatus === 'PAID')
        .length,
    };
  }, [bookings]);

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Bookings
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Bookings Management
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-400">
            Manage customer trips, assigned vehicles, drivers, payment status
            and booking lifecycle operations.
          </p>
        </div>

        <button className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-[#C8A96A]">
          New Booking
        </button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Bookings" value={bookingStats.total} />
        <SummaryCard title="Pending" value={bookingStats.pending} />
        <SummaryCard title="Completed" value={bookingStats.completed} />
        <SummaryCard title="Paid" value={bookingStats.paid} accent />
      </section>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          Loading bookings...
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">All Bookings</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Live records from the booking system database.
              </p>
            </div>

            <button
              onClick={fetchBookings}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                <tr>
                  <th className="w-[11%] px-3 py-4 font-medium">Booking</th>
                  <th className="w-[12%] px-3 py-4 font-medium">Customer</th>
                  <th className="w-[13%] px-3 py-4 font-medium">Route</th>
                  <th className="w-[11%] px-3 py-4 font-medium">Pickup</th>
                  <th className="w-[10%] px-3 py-4 font-medium">Driver</th>
                  <th className="w-[12%] px-3 py-4 font-medium">Vehicle</th>
                  <th className="w-[7%] px-3 py-4 font-medium">Pax</th>
                  <th className="w-[10%] px-3 py-4 font-medium">Status</th>
                  <th className="w-[9%] px-3 py-4 font-medium">Payment</th>
                  <th className="w-[7%] px-3 py-4 font-medium">Amount</th>
                  <th className="w-[13%] px-3 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => {
                  const isFinalStatus =
                    booking.status === 'COMPLETED' ||
                    booking.status === 'CANCELLED';

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-4">
                        <p className="break-words font-semibold text-white">
                          {booking.bookingRef}
                        </p>
                        <p className="mt-1 text-neutral-500">
                          {booking.tripType.replaceAll('_', ' ')}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">
                          {booking.customer?.fullName ?? 'Unknown'}
                        </p>
                        <p className="mt-1 text-neutral-500">
                          {booking.customer?.phone ?? 'No phone'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">
                          {booking.route?.name ?? 'Custom route'}
                        </p>
                        <p className="mt-1 text-neutral-500">
                          {booking.pickupLocation} → {booking.destination}
                        </p>
                      </td>

                      <td className="px-3 py-4 text-neutral-300">
                        {new Date(booking.pickupDate).toLocaleString()}
                      </td>

                      <td className="px-3 py-4 font-semibold text-white">
                        {booking.driver?.fullName ?? 'Not assigned'}
                      </td>

                      <td className="px-3 py-4">
                        {booking.vehicle ? (
                          <>
                            <p className="font-semibold text-white">
                              {booking.vehicle.name}
                            </p>
                            <p className="mt-1 text-neutral-500">
                              {booking.vehicle.registrationNo}
                            </p>
                          </>
                        ) : (
                          <span className="text-neutral-400">Not assigned</span>
                        )}
                      </td>

                      <td className="px-3 py-4 font-semibold text-white">
                        {booking.passengers}
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge status={booking.status} />
                      </td>

                      <td className="px-3 py-4">
                        <PaymentBadge status={booking.paymentStatus} />
                      </td>

                      <td className="px-3 py-4 font-semibold text-[#C8A96A]">
                        ${booking.finalPrice ?? 0}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            disabled={
                              actionLoadingId === booking.id || isFinalStatus
                            }
                            onClick={() =>
                              updateBookingStatus(booking.id, 'COMPLETED')
                            }
                            className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {actionLoadingId === booking.id
                              ? 'Working'
                              : 'Complete'}
                          </button>

                          <button
                            disabled={
                              actionLoadingId === booking.id || isFinalStatus
                            }
                            onClick={() =>
                              updateBookingStatus(booking.id, 'CANCELLED')
                            }
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {bookings.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">
              No bookings found.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-neutral-400">{title}</p>
      <p
        className={`mt-3 text-3xl font-semibold ${
          accent ? 'text-[#C8A96A]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300'
      }`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: 'border-green-500/30 bg-green-500/10 text-green-300',
    PARTIALLY_PAID: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    UNPAID: 'border-red-500/30 bg-red-500/10 text-red-300',
    FAILED: 'border-red-500/30 bg-red-500/10 text-red-300',
    REFUNDED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300'
      }`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}