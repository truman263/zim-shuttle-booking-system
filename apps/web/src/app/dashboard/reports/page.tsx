'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';

type MoneyValue = number | string | null | undefined;

type EmbeddedPayment = {
  id: string;
  amount: MoneyValue;
  status: string;
};

type RouteSummary = {
  id: string;
  name?: string | null;
  pickupCity?: string | null;
  destinationCity?: string | null;
};

type Booking = {
  id: string;
  bookingRef: string;
  pickupLocation?: string | null;
  destination?: string | null;
  pickupDate?: string | null;
  finalPrice?: MoneyValue;
  estimatedPrice?: MoneyValue;
  status: string;
  paymentStatus: string;
  matchedRouteId?: string | null;
  matchedRouteName?: string | null;
  route?: RouteSummary | null;
  payments?: EmbeddedPayment[];
};

type PaymentBooking = {
  id: string;
  pickupLocation?: string | null;
  destination?: string | null;
  finalPrice?: MoneyValue;
  estimatedPrice?: MoneyValue;
  route?: RouteSummary | null;
};

type Payment = {
  id: string;
  bookingId: string;
  amount: MoneyValue;
  method?: string | null;
  status: string;
  paymentType?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  booking?: PaymentBooking | null;
};

type RouteRecord = {
  id: string;
  name: string;
  pickupCity: string;
  destinationCity: string;
};

type BreakdownRow = {
  label: string;
  count: number;
  amount: number;
};

type RouteIdentity = {
  key: string;
  name: string;
  pickup: string;
  destination: string;
};

type RouteMetric = RouteIdentity & {
  bookingCount: number;
  paidRevenue: number;
  bookingValue: number;
};

function asArray<T>(data: T[] | T) {
  return Array.isArray(data) ? data : [data];
}

function toMoneyNumber(value: MoneyValue) {
  const amount = Number(String(value ?? 0).replace(',', '.'));
  return Number.isFinite(amount) ? amount : 0;
}

function money(value: MoneyValue) {
  return '$' + toMoneyNumber(value).toFixed(2);
}

function nice(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  return value.replaceAll('_', ' ');
}

function compactText(
  value?: string | null,
  fallback: string | null | undefined = 'Not set',
) {
  const cleaned = value?.trim();
  const fallbackText = fallback?.trim();

  if (cleaned) {
    return cleaned;
  }

  return fallbackText || 'Not set';
}

function normalizeKey(value?: string | null) {
  return compactText(value, 'unknown').toLowerCase().replace(/\s+/g, ' ');
}

function getBookingTotal(booking: Booking | PaymentBooking) {
  return toMoneyNumber(booking.finalPrice ?? booking.estimatedPrice ?? 0);
}

function getBookingRouteIdentity(booking: Booking): RouteIdentity {
  if (booking.route?.id) {
    return {
      key: 'route:' + booking.route.id,
      name: compactText(
        booking.route.name,
        compactText(booking.matchedRouteName, 'Saved route'),
      ),
      pickup: compactText(booking.route.pickupCity, booking.pickupLocation),
      destination: compactText(
        booking.route.destinationCity,
        booking.destination,
      ),
    };
  }

  if (booking.matchedRouteName) {
    return {
      key:
        'matched:' +
        normalizeKey(booking.matchedRouteId || booking.matchedRouteName),
      name: booking.matchedRouteName,
      pickup: compactText(booking.pickupLocation, 'Pickup not set'),
      destination: compactText(booking.destination, 'Destination not set'),
    };
  }

  return {
    key:
      'custom:' +
      normalizeKey(booking.pickupLocation) +
      ':' +
      normalizeKey(booking.destination),
    name: 'Custom trip',
    pickup: compactText(booking.pickupLocation, 'Pickup not set'),
    destination: compactText(booking.destination, 'Destination not set'),
  };
}

function getPaymentRouteIdentity(payment: Payment): RouteIdentity | null {
  const booking = payment.booking;

  if (!booking) {
    return null;
  }

  if (booking.route?.id) {
    return {
      key: 'route:' + booking.route.id,
      name: compactText(booking.route.name, 'Saved route'),
      pickup: compactText(booking.route.pickupCity, booking.pickupLocation),
      destination: compactText(
        booking.route.destinationCity,
        booking.destination,
      ),
    };
  }

  return {
    key:
      'custom:' +
      normalizeKey(booking.pickupLocation) +
      ':' +
      normalizeKey(booking.destination),
    name: 'Custom trip',
    pickup: compactText(booking.pickupLocation, 'Pickup not set'),
    destination: compactText(booking.destination, 'Destination not set'),
  };
}

function buildBreakdown(
  payments: Payment[],
  getLabel: (payment: Payment) => string,
) {
  const rows = new Map<string, BreakdownRow>();

  payments.forEach((payment) => {
    const label = getLabel(payment);
    const current = rows.get(label) ?? {
      label,
      count: 0,
      amount: 0,
    };

    current.count += 1;
    current.amount += toMoneyNumber(payment.amount);
    rows.set(label, current);
  });

  return Array.from(rows.values()).sort((first, second) => {
    if (second.amount !== first.amount) {
      return second.amount - first.amount;
    }

    return second.count - first.count;
  });
}

function getDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  async function fetchReports() {
    try {
      setLoading(true);
      setErrorMessage('');

      const [bookingsData, paymentsData, routesData] = await Promise.all([
        apiGet<Booking[] | Booking>('/bookings'),
        apiGet<Payment[] | Payment>('/payments'),
        apiGet<RouteRecord[] | RouteRecord>('/routes'),
      ]);

      setBookings(asArray(bookingsData));
      setPayments(asArray(paymentsData));
      setRoutes(asArray(routesData));
      setLastUpdatedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading reports',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const report = useMemo(() => {
    const paidPayments = payments.filter(
      (payment) => payment.status === 'PAID',
    );

    const paidByBookingId = new Map<string, number>();

    paidPayments.forEach((payment) => {
      paidByBookingId.set(
        payment.bookingId,
        (paidByBookingId.get(payment.bookingId) ?? 0) +
          toMoneyNumber(payment.amount),
      );
    });

    const totalRevenueReceived = paidPayments.reduce(
      (sum, payment) => sum + toMoneyNumber(payment.amount),
      0,
    );

    const outstandingBalance = bookings.reduce((sum, booking) => {
      const balance = Math.max(
        getBookingTotal(booking) - (paidByBookingId.get(booking.id) ?? 0),
        0,
      );

      return sum + balance;
    }, 0);

    const routeRows = new Map<string, RouteMetric>();
    const bookingRouteKeys = new Map<string, string>();

    function upsertRoute(identity: RouteIdentity) {
      const existing = routeRows.get(identity.key);

      if (existing) {
        return existing;
      }

      const created = {
        ...identity,
        bookingCount: 0,
        paidRevenue: 0,
        bookingValue: 0,
      };

      routeRows.set(identity.key, created);
      return created;
    }

    routes.forEach((route) => {
      upsertRoute({
        key: 'route:' + route.id,
        name: compactText(route.name, 'Saved route'),
        pickup: compactText(route.pickupCity, 'Pickup not set'),
        destination: compactText(route.destinationCity, 'Destination not set'),
      });
    });

    bookings.forEach((booking) => {
      const identity = getBookingRouteIdentity(booking);
      const row = upsertRoute(identity);

      row.bookingCount += 1;
      row.bookingValue += getBookingTotal(booking);
      bookingRouteKeys.set(booking.id, identity.key);
    });

    paidPayments.forEach((payment) => {
      let routeKey = bookingRouteKeys.get(payment.bookingId);

      if (!routeKey) {
        const identity = getPaymentRouteIdentity(payment);

        if (identity) {
          routeKey = identity.key;
          upsertRoute(identity);
        }
      }

      if (!routeKey) {
        return;
      }

      const row = routeRows.get(routeKey);

      if (row) {
        row.paidRevenue += toMoneyNumber(payment.amount);
      }
    });

    const now = Date.now();
    const upcomingBookings = bookings.filter((booking) => {
      const pickupTime = getDateTime(booking.pickupDate);

      return (
        pickupTime !== null &&
        pickupTime >= now &&
        booking.status !== 'COMPLETED' &&
        booking.status !== 'CANCELLED' &&
        booking.status !== 'NO_SHOW'
      );
    }).length;

    return {
      totalRevenueReceived,
      outstandingBalance,
      totalBookings: bookings.length,
      paidBookings: bookings.filter(
        (booking) => booking.paymentStatus === 'PAID',
      ).length,
      unpaidPartialBookings: bookings.filter(
        (booking) => booking.paymentStatus !== 'PAID',
      ).length,
      paymentMethodBreakdown: buildBreakdown(paidPayments, (payment) =>
        nice(payment.method || 'UNKNOWN'),
      ),
      paymentTypeBreakdown: buildBreakdown(paidPayments, (payment) =>
        nice(payment.paymentType || 'UNKNOWN'),
      ),
      routePerformance: Array.from(routeRows.values()).sort(
        (first, second) => {
          if (second.bookingCount !== first.bookingCount) {
            return second.bookingCount - first.bookingCount;
          }

          return second.paidRevenue - first.paidRevenue;
        },
      ),
      operations: {
        upcoming: upcomingBookings,
        completed: bookings.filter((booking) => booking.status === 'COMPLETED')
          .length,
        cancelledNoShow: bookings.filter(
          (booking) =>
            booking.status === 'CANCELLED' || booking.status === 'NO_SHOW',
        ).length,
        pendingInProgress: bookings.filter(
          (booking) =>
            booking.status === 'PENDING' || booking.status === 'IN_PROGRESS',
        ).length,
      },
    };
  }, [bookings, payments, routes]);

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Business Analytics
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Reports Dashboard
          </h1>

          <p className="mt-3 inline-flex rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#C8A96A]">
            All-time report
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Revenue, route performance and operational health from live booking
            and payment records.
          </p>

          {lastUpdatedAt && (
            <p className="mt-2 text-xs text-neutral-600">
              Last updated {lastUpdatedAt.toLocaleTimeString()}.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={fetchReports}
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
          Loading reports...
        </div>
      )}

      <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-neutral-400">
        Revenue includes PAID payments only.
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Revenue Received"
          value={money(report.totalRevenueReceived)}
          accent
        />
        <SummaryCard
          title="Outstanding Balance"
          value={money(report.outstandingBalance)}
        />
        <SummaryCard title="Total Bookings" value={report.totalBookings} />
        <SummaryCard title="Fully Paid Bookings" value={report.paidBookings} />
        <SummaryCard
          title="Unpaid / Partial"
          value={report.unpaidPartialBookings}
        />
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-2">
        <BreakdownTable
          title="Payment Method Breakdown"
          eyebrow="Revenue and Payments"
          rows={report.paymentMethodBreakdown}
          emptyMessage="No paid payment methods found."
        />
        <BreakdownTable
          title="Payment Type Breakdown"
          eyebrow="Deposit, Balance and Full Payments"
          rows={report.paymentTypeBreakdown}
          emptyMessage="No paid payment types found."
        />
      </section>

      <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Route Performance
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            Bookings and Revenue by Route
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Based on booking history and paid payment records. Active saved
            routes are included even when they have no bookings yet.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed border-collapse text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
              <tr>
                <th className="w-[26%] px-4 py-4 font-medium">Route Name</th>
                <th className="w-[34%] px-3 py-4 font-medium">
                  Pickup → Destination
                </th>
                <th className="w-[13%] px-3 py-4 text-right font-medium">
                  Booking Count
                </th>
                <th className="w-[14%] px-3 py-4 text-right font-medium">
                  Paid Revenue
                </th>
                <th className="w-[13%] px-4 py-4 text-right font-medium">
                  Booking Value
                </th>
              </tr>
            </thead>

            <tbody>
              {report.routePerformance.map((route) => (
                <tr
                  key={route.key}
                  className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{route.name}</p>
                  </td>
                  <td className="px-3 py-4 text-neutral-400">
                    {route.pickup} → {route.destination}
                  </td>
                  <td className="px-3 py-4 text-right font-semibold text-white">
                    {route.bookingCount}
                  </td>
                  <td className="px-3 py-4 text-right font-semibold text-[#C8A96A]">
                    {money(route.paidRevenue)}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-white">
                    {money(route.bookingValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report.routePerformance.length === 0 && !loading && (
          <div className="p-8 text-center text-sm text-neutral-500">
            No route performance records found.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Operations
          </p>
          <h2 className="mt-2 text-lg font-semibold">Operations Summary</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OperationCard
            title="Upcoming Bookings"
            value={report.operations.upcoming}
          />
          <OperationCard
            title="Completed Trips"
            value={report.operations.completed}
            accent
          />
          <OperationCard
            title="Cancelled / No-show"
            value={report.operations.cancelledNoShow}
          />
          <OperationCard
            title="Pending/In-progress"
            value={report.operations.pendingInProgress}
          />
        </div>
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

function BreakdownTable({
  title,
  eyebrow,
  rows,
  emptyMessage,
}: {
  title: string;
  eyebrow: string;
  rows: BreakdownRow[];
  emptyMessage: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-semibold">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] table-fixed border-collapse text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
            <tr>
              <th className="w-[45%] px-4 py-4 font-medium">Category</th>
              <th className="w-[20%] px-3 py-4 text-right font-medium">
                Count
              </th>
              <th className="w-[35%] px-4 py-4 text-right font-medium">
                Received
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-white/5 transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-4 font-semibold text-white">
                  {row.label}
                </td>
                <td className="px-3 py-4 text-right text-neutral-300">
                  {row.count}
                </td>
                <td className="px-4 py-4 text-right font-semibold text-[#C8A96A]">
                  {money(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="p-8 text-center text-sm text-neutral-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

function OperationCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
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
