'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';

type MoneyValue = number | string | null | undefined;

type Customer = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  createdAt?: string | null;
};

type Payment = {
  id: string;
  amount: MoneyValue;
  status: string;
};

type Booking = {
  id: string;
  customerId?: string | null;
  pickupDate?: string | null;
  finalPrice?: MoneyValue;
  estimatedPrice?: MoneyValue;
  customer?: {
    id?: string | null;
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  payments?: Payment[];
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  paidRevenue: number;
  outstandingBalance: number;
  lastBookingDate: string;
  lastBookingTime: number;
  isWalkIn: boolean;
};

type WrappedResponse<T> =
  | T[]
  | T
  | {
      data?: T[] | T;
      items?: T[] | T;
      results?: T[] | T;
    };

function normalizeArray<T>(value: WrappedResponse<T>): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    const wrapped = value as {
      data?: T[] | T;
      items?: T[] | T;
      results?: T[] | T;
    };

    if (wrapped.data !== undefined) {
      return Array.isArray(wrapped.data) ? wrapped.data : [wrapped.data];
    }

    if (wrapped.items !== undefined) {
      return Array.isArray(wrapped.items) ? wrapped.items : [wrapped.items];
    }

    if (wrapped.results !== undefined) {
      return Array.isArray(wrapped.results)
        ? wrapped.results
        : [wrapped.results];
    }
  }

  return value ? [value as T] : [];
}

function toMoneyNumber(value: MoneyValue) {
  const amount = Number(String(value ?? 0).replace(',', '.'));
  return Number.isFinite(amount) ? amount : 0;
}

function money(value: MoneyValue) {
  return '$' + toMoneyNumber(value).toFixed(2);
}

function cleanText(value?: string | null, fallback = 'Not set') {
  const cleaned = value?.trim();
  return cleaned ? cleaned : fallback;
}

function getBookingTotal(booking: Booking) {
  return toMoneyNumber(booking.finalPrice ?? booking.estimatedPrice ?? 0);
}

function getPaidAmount(booking: Booking) {
  return (booking.payments ?? [])
    .filter((payment) => payment.status === 'PAID')
    .reduce((sum, payment) => sum + toMoneyNumber(payment.amount), 0);
}

function getBookingTime(value?: string | null) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatDate(value: number) {
  if (!value) {
    return 'No bookings';
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isWalkInCustomer(customer: Customer) {
  const name = customer.fullName.trim().toLowerCase();
  const phone = customer.phone?.trim().toUpperCase() ?? '';

  return name === 'walk-in customer' || phone.startsWith('WALK-IN-');
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  async function fetchCustomerDashboard() {
    try {
      setLoading(true);
      setErrorMessage('');

      const [customersData, bookingsData] = await Promise.all([
        apiGet<WrappedResponse<Customer>>('/customers'),
        apiGet<WrappedResponse<Booking>>('/bookings'),
      ]);

      setCustomers(normalizeArray(customersData));
      setBookings(normalizeArray(bookingsData));
      setLastUpdatedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading customers',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomerDashboard();
  }, []);

  const customerRows = useMemo(() => {
    const bookingsByCustomerId = new Map<string, Booking[]>();

    bookings.forEach((booking) => {
      const customerId = booking.customer?.id ?? booking.customerId;

      if (!customerId) {
        return;
      }

      bookingsByCustomerId.set(customerId, [
        ...(bookingsByCustomerId.get(customerId) ?? []),
        booking,
      ]);
    });

    return customers
      .map<CustomerRow>((customer) => {
        const customerBookings = bookingsByCustomerId.get(customer.id) ?? [];

        const paidRevenue = customerBookings.reduce(
          (sum, booking) => sum + getPaidAmount(booking),
          0,
        );

        const outstandingBalance = customerBookings.reduce((sum, booking) => {
          const balance = Math.max(
            getBookingTotal(booking) - getPaidAmount(booking),
            0,
          );

          return sum + balance;
        }, 0);

        const lastBookingTime = customerBookings.reduce((latest, booking) => {
          const bookingTime = getBookingTime(booking.pickupDate);
          return bookingTime > latest ? bookingTime : latest;
        }, 0);

        return {
          id: customer.id,
          name: cleanText(customer.fullName, 'Unnamed customer'),
          phone: cleanText(customer.phone),
          email: cleanText(customer.email),
          totalBookings: customerBookings.length,
          paidRevenue,
          outstandingBalance,
          lastBookingDate: formatDate(lastBookingTime),
          lastBookingTime,
          isWalkIn: isWalkInCustomer(customer),
        };
      })
      .sort((first, second) => {
        if (second.lastBookingTime !== first.lastBookingTime) {
          return second.lastBookingTime - first.lastBookingTime;
        }

        if (second.totalBookings !== first.totalBookings) {
          return second.totalBookings - first.totalBookings;
        }

        return first.name.localeCompare(second.name);
      });
  }, [bookings, customers]);

  const customerStats = useMemo(() => {
    return {
      total: customers.length,
      withBookings: customerRows.filter((customer) => customer.totalBookings > 0)
        .length,
      walkIn: customerRows.filter((customer) => customer.isWalkIn).length,
      repeat: customerRows.filter((customer) => customer.totalBookings > 1)
        .length,
    };
  }, [customerRows, customers.length]);

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Customer Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Customer Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Customer profiles, booking history and payment health from live
            booking records.
          </p>

          {lastUpdatedAt && (
            <p className="mt-2 text-xs text-neutral-600">
              Last updated {lastUpdatedAt.toLocaleTimeString()}.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={fetchCustomerDashboard}
          disabled={loading}
          className="self-start rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          Loading customers...
        </div>
      )}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Customers"
          value={customerStats.total}
          accent
        />
        <SummaryCard
          title="Customers With Bookings"
          value={customerStats.withBookings}
        />
        <SummaryCard
          title="Walk-in Customers"
          value={customerStats.walkIn}
        />
        <SummaryCard
          title="Repeat Customers"
          value={customerStats.repeat}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Customer Records
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            Customers and Booking Value
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Paid revenue is calculated from PAID booking payments only.
          </p>
        </div>

        <div className="grid gap-3 p-3 lg:hidden">
          {customerRows.map((customer) => (
            <article
              key={customer.id}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <div className="min-w-0">
                <p className="break-words text-base font-semibold text-white">
                  {customer.name}
                </p>
                <p className="mt-1 break-words text-sm text-neutral-400">
                  {customer.phone}
                </p>
                {customer.isWalkIn && (
                  <span className="mt-2 inline-flex rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#C8A96A]">
                    Walk-in
                  </span>
                )}
              </div>

              <p className="mt-2 break-words text-xs leading-5 text-neutral-500">
                {customer.email}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <MobileMetric label="Bookings" value={customer.totalBookings} />
                <MobileMetric label="Last booking" value={customer.lastBookingDate} />
                <MobileMetric
                  label="Paid revenue"
                  value={money(customer.paidRevenue)}
                  accent
                />
                <MobileMetric
                  label="Outstanding"
                  value={money(customer.outstandingBalance)}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1180px] table-fixed border-collapse text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
              <tr>
                <th className="w-[22%] px-4 py-4 font-medium">Customer</th>
                <th className="w-[20%] px-4 py-4 font-medium">Contact</th>
                <th className="w-[9%] px-3 py-4 text-center font-medium">
                  Bookings
                </th>
                <th className="w-[15%] px-4 py-4 text-right font-medium">
                  Paid Revenue
                </th>
                <th className="w-[16%] px-6 py-4 text-center font-medium">
                  Outstanding
                </th>
                <th className="w-[18%] px-8 py-4 font-medium">
                  Last Booking
                </th>
              </tr>
            </thead>

            <tbody>
              {customerRows.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <p className="font-semibold leading-5 text-white">
                        {customer.name}
                      </p>
                      {customer.isWalkIn && (
                        <span className="inline-flex rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#C8A96A]">
                          Walk-in
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium text-neutral-200">
                      {customer.phone}
                    </p>
                    <p className="mt-1 break-words text-[11px] text-neutral-500">
                      {customer.email}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-center font-semibold text-white">
                    {customer.totalBookings}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-[#C8A96A]">
                    {money(customer.paidRevenue)}
                  </td>

                  <td className="px-6 py-4 text-center font-semibold text-white">
                    {money(customer.outstandingBalance)}
                  </td>

                  <td className="px-8 py-4 text-neutral-400">
                    {customer.lastBookingDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {customerRows.length === 0 && !loading && (
          <div className="p-8 text-center text-sm text-neutral-500">
            No customers found.
          </div>
        )}
      </section>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 transition hover:border-[#C8A96A]/25">
      <p className="text-xs font-medium text-neutral-400">{title}</p>
      <p
        className={
          'mt-2 text-2xl font-semibold ' +
          (accent ? 'text-[#C8A96A]' : 'text-white')
        }
      >
        {value}
      </p>
    </div>
  );
}

function MobileMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p
        className={
          'mt-1 break-words text-sm font-semibold ' +
          (accent ? 'text-[#C8A96A]' : 'text-white')
        }
      >
        {value}
      </p>
    </div>
  );
}
