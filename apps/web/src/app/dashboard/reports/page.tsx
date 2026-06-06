'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiGet } from '@/lib/api';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

const bookingStatusOptions = [
  'PENDING',
  'CONFIRMED',
  'DRIVER_ASSIGNED',
  'VEHICLE_ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

const paymentStatusOptions = [
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'FAILED',
  'REFUNDED',
];

type DatePreset = '7' | '30' | '90' | 'custom';

type AnalyticsResponse = {
  range: {
    from: string;
    to: string;
  };
  summary: {
    totalBookings: number;
    bookingValue: number;
    paidRevenue: number;
    manualQuotePending: number;
    unassignedConfirmedTrips: number;
    tripsInProgress: number;
    completedTrips: number;
    notificationFailures: number;
  };
  bookingsOverTime: Array<{
    date: string;
    count: number;
  }>;
  bookingStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  paymentStatusBreakdown: Array<{
    status: string;
    count: number;
    bookingValue: number;
  }>;
  routeDemand: Array<{
    routeId: string | null;
    name: string;
    pickup: string | null;
    destination: string | null;
    count: number;
  }>;
  customRouteDemand: Array<{
    pickup: string;
    destination: string;
    count: number;
    averageDistanceKm: number | null;
    averageDurationMinutes: number | null;
  }>;
  manualQuoteQueue: Array<{
    id: string;
    bookingRef: string;
    routeDisplay: string;
    pickupDate: string;
    customerName: string;
    status: string;
  }>;
  notificationHealth: {
    breakdown: Array<{
      status: string;
      count: number;
    }>;
    recentFailures: Array<{
      id: string;
      event: string;
      recipient: string | null;
      subject: string | null;
      errorMessage: string | null;
      createdAt: string;
    }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  filterOptions: {
    routes: Array<{
      id: string;
      name: string;
      label: string;
      isActive: boolean;
    }>;
    drivers: Array<{
      id: string;
      name: string;
      status: string;
    }>;
    vehicles: Array<{
      id: string;
      name: string;
      label: string;
      status: string;
    }>;
  };
};

type AnalyticsFilters = {
  from: string;
  to: string;
  bookingStatus: string;
  paymentStatus: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string;
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPresetRange(preset: Exclude<DatePreset, 'custom'>) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (Number(preset) - 1));

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
}

function money(value: number) {
  return '$' + Number(value || 0).toFixed(2);
}

function nice(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function compactLabel(value: string, length = 24) {
  return value.length > length ? value.slice(0, length - 1) + '...' : value;
}

function statusTone(status: string) {
  if (['SENT', 'PAID', 'COMPLETED', 'CONFIRMED'].includes(status)) {
    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  }

  if (['FAILED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
    return 'border-red-400/20 bg-red-400/10 text-red-200';
  }

  if (['IN_PROGRESS', 'QUEUED', 'PARTIALLY_PAID'].includes(status)) {
    return 'border-white/15 bg-white/[0.06] text-neutral-200';
  }

  return 'border-white/10 bg-white/[0.035] text-neutral-400';
}

function chartColor(index: number) {
  const colors = ['#ffffff', '#a3a3a3', '#737373', '#22c55e', '#ef4444'];
  return colors[index % colors.length];
}

export default function ReportsPage() {
  const initialRange = getPresetRange('30');
  const [preset, setPreset] = useState<DatePreset>('30');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...initialRange,
    bookingStatus: '',
    paymentStatus: '',
    routeId: '',
    driverId: '',
    vehicleId: '',
  });
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  async function fetchAnalytics(nextFilters = filters) {
    try {
      setLoading(true);
      setErrorMessage('');

      const params = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const data = await apiGet<AnalyticsResponse>(
        `/dashboard/analytics/${COMPANY_ID}?${params.toString()}`,
      );

      setAnalytics(data);
      setLastUpdatedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading analytics.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter<K extends keyof AnalyticsFilters>(
    key: K,
    value: AnalyticsFilters[K],
  ) {
    const nextFilters = {
      ...filters,
      [key]: value,
    };

    setFilters(nextFilters);
    void fetchAnalytics(nextFilters);
  }

  function applyPreset(nextPreset: DatePreset) {
    setPreset(nextPreset);

    if (nextPreset === 'custom') {
      return;
    }

    const range = getPresetRange(nextPreset);
    const nextFilters = {
      ...filters,
      ...range,
    };

    setFilters(nextFilters);
    void fetchAnalytics(nextFilters);
  }

  const chartData = useMemo(() => {
    const emptyRows = [{ name: 'No data', count: 0 }];

    return {
      bookingsOverTime:
        analytics?.bookingsOverTime.map((row) => ({
          date: formatDate(row.date),
          count: row.count,
        })) ?? [],
      bookingStatus:
        analytics?.bookingStatusBreakdown
          .filter((row) => row.count > 0)
          .map((row) => ({
            name: nice(row.status),
            count: row.count,
            status: row.status,
          })) ?? emptyRows,
      paymentStatus:
        analytics?.paymentStatusBreakdown
          .filter((row) => row.count > 0)
          .map((row) => ({
            name: nice(row.status),
            count: row.count,
            bookingValue: row.bookingValue,
            status: row.status,
          })) ?? emptyRows,
      routeDemand:
        analytics?.routeDemand.map((route) => ({
          name: compactLabel(route.name, 28),
          count: route.count,
          route: route.name,
        })) ?? [],
      customRouteDemand:
        analytics?.customRouteDemand.map((route) => ({
          name: compactLabel(`${route.pickup} to ${route.destination}`, 34),
          count: route.count,
          route: `${route.pickup} to ${route.destination}`,
        })) ?? [],
    };
  }, [analytics]);

  const summary = analytics?.summary;

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Business Intelligence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Reports & Analytics
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
            Understand bookings, route demand, paid revenue, notification health
            and daily operating pressure from live system records.
          </p>
          {lastUpdatedAt ? (
            <p className="mt-2 text-xs text-neutral-600">
              Last refreshed {lastUpdatedAt.toLocaleTimeString()}.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => fetchAnalytics()}
          disabled={loading}
          className="self-start rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {(['7', '30', '90'] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => applyPreset(days)}
              className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                preset === days
                  ? 'border-white bg-white text-black'
                  : 'border-white/10 bg-black/20 text-neutral-300 hover:border-white/25'
              }`}
            >
              {days} days
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyPreset('custom')}
            className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
              preset === 'custom'
                ? 'border-white bg-white text-black'
                : 'border-white/10 bg-black/20 text-neutral-300 hover:border-white/25'
            }`}
          >
            Custom
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <FilterInput
            label="From"
            type="date"
            value={filters.from}
            onChange={(value) => {
              setPreset('custom');
              updateFilter('from', value);
            }}
          />
          <FilterInput
            label="To"
            type="date"
            value={filters.to}
            onChange={(value) => {
              setPreset('custom');
              updateFilter('to', value);
            }}
          />
          <FilterSelect
            label="Booking Status"
            value={filters.bookingStatus}
            onChange={(value) => updateFilter('bookingStatus', value)}
            options={bookingStatusOptions.map((status) => ({
              value: status,
              label: nice(status),
            }))}
          />
          <FilterSelect
            label="Payment Status"
            value={filters.paymentStatus}
            onChange={(value) => updateFilter('paymentStatus', value)}
            options={paymentStatusOptions.map((status) => ({
              value: status,
              label: nice(status),
            }))}
          />
          <FilterSelect
            label="Route"
            value={filters.routeId}
            onChange={(value) => updateFilter('routeId', value)}
            options={
              analytics?.filterOptions.routes.map((route) => ({
                value: route.id,
                label: route.label,
              })) ?? []
            }
          />
          <FilterSelect
            label="Driver"
            value={filters.driverId}
            onChange={(value) => updateFilter('driverId', value)}
            options={
              analytics?.filterOptions.drivers.map((driver) => ({
                value: driver.id,
                label: driver.name,
              })) ?? []
            }
          />
          <FilterSelect
            label="Vehicle"
            value={filters.vehicleId}
            onChange={(value) => updateFilter('vehicleId', value)}
            options={
              analytics?.filterOptions.vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: vehicle.label,
              })) ?? []
            }
          />
        </div>
      </section>

      {errorMessage ? (
        <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {loading && !analytics ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-sm text-neutral-400">
          Loading analytics...
        </div>
      ) : null}

      {summary ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total bookings"
              value={summary.totalBookings}
              note="Requests created in selected range"
            />
            <KpiCard
              title="Paid revenue"
              value={money(summary.paidRevenue)}
              note="PAID payments only"
              tone="success"
            />
            <KpiCard
              title="Booking value"
              value={money(summary.bookingValue)}
              note="Estimated or final booking totals"
            />
            <KpiCard
              title="Manual quote pending"
              value={summary.manualQuotePending}
              note="Custom trips needing price action"
              tone={summary.manualQuotePending ? 'attention' : 'neutral'}
            />
            <KpiCard
              title="Unassigned confirmed trips"
              value={summary.unassignedConfirmedTrips}
              note="Driver or vehicle still missing"
              tone={summary.unassignedConfirmedTrips ? 'danger' : 'neutral'}
            />
            <KpiCard
              title="Trips in progress"
              value={summary.tripsInProgress}
              note="Active operations"
            />
            <KpiCard
              title="Completed trips"
              value={summary.completedTrips}
              note="Closed journeys"
              tone="success"
            />
            <KpiCard
              title="Notification failures"
              value={summary.notificationFailures}
              note="Email events needing review"
              tone={summary.notificationFailures ? 'danger' : 'neutral'}
            />
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            <ChartPanel
              title="Bookings Over Time"
              eyebrow="Demand"
              description="Booking requests grouped by creation date."
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData.bookingsOverTime}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ffffff"
                    strokeWidth={2.4}
                    dot={false}
                    activeDot={{ r: 5, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel
              title="Booking Status"
              eyebrow="Operations"
              description="Where bookings sit in the current workflow."
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.bookingStatus}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                    {chartData.bookingStatus.map((_, index) => (
                      <Cell key={index} fill={chartColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel
              title="Payment Status"
              eyebrow="Money"
              description="Booking counts and booking value by payment state."
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.paymentStatus}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                    {chartData.paymentStatus.map((_, index) => (
                      <Cell key={index} fill={chartColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel
              title="Top Saved Routes"
              eyebrow="Route Demand"
              description="Approved saved routes ranked by booking count."
            >
              {chartData.routeDemand.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData.routeDemand}
                    layout="vertical"
                    margin={{ left: 8, right: 20 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: '#a3a3a3', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fill: '#a3a3a3', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#ffffff" radius={[0, 12, 12, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel message="No saved route demand in this range." />
              )}
            </ChartPanel>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            <ChartPanel
              title="Top Custom Route Requests"
              eyebrow="Custom Demand"
              description="Repeated custom corridors that may deserve saved route review."
            >
              {analytics.customRouteDemand.length ? (
                <div className="space-y-3">
                  {analytics.customRouteDemand.map((route) => (
                    <div
                      key={`${route.pickup}-${route.destination}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {route.pickup} to {route.destination}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {route.averageDistanceKm
                              ? `${route.averageDistanceKm} km`
                              : 'Distance not always available'}
                            {route.averageDurationMinutes
                              ? ` - ${route.averageDurationMinutes} min`
                              : ''}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300">
                          {route.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel message="No custom route demand in this range." />
              )}
            </ChartPanel>

            <ChartPanel
              title="Notification Health"
              eyebrow="Communication"
              description="Email delivery outcomes from booking notifications."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {analytics.notificationHealth.breakdown.map((row) => (
                  <div
                    key={row.status}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                      {nice(row.status)}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{row.count}</p>
                  </div>
                ))}
              </div>

              {analytics.notificationHealth.recentFailures.length ? (
                <div className="mt-4 space-y-2">
                  {analytics.notificationHealth.recentFailures.map((failure) => (
                    <div
                      key={failure.id}
                      className="rounded-2xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-100"
                    >
                      <p className="font-semibold">{nice(failure.event)}</p>
                      <p className="mt-1 break-words text-red-200/70">
                        {failure.errorMessage || 'Delivery failed.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </ChartPanel>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            <Panel title="Manual Quote Queue" eyebrow="Pricing Attention">
              {analytics.manualQuoteQueue.length ? (
                <div className="space-y-3">
                  {analytics.manualQuoteQueue.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">
                          {booking.bookingRef}
                        </p>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone(
                            booking.status,
                          )}`}
                        >
                          {nice(booking.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-300">
                        {booking.routeDisplay}
                      </p>
                      <p className="mt-2 text-xs text-neutral-500">
                        {booking.customerName} - pickup{' '}
                        {formatDateTime(booking.pickupDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel message="No manual quote bookings need attention." />
              )}
            </Panel>

            <Panel title="Recent Activity" eyebrow="Operations Feed">
              {analytics.recentActivity.length ? (
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">
                          {activity.title}
                        </p>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone(
                            activity.status,
                          )}`}
                        >
                          {nice(activity.type)}
                        </span>
                      </div>
                      <p className="mt-2 break-words text-sm text-neutral-400">
                        {activity.description}
                      </p>
                      <p className="mt-2 text-xs text-neutral-600">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel message="No recent activity in this range." />
              )}
            </Panel>
          </section>
        </>
      ) : null}
    </section>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium text-neutral-400">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition focus:border-white/30"
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium text-neutral-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition focus:border-white/30"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function KpiCard({
  title,
  value,
  note,
  tone = 'neutral',
}: {
  title: string;
  value: number | string;
  note: string;
  tone?: 'neutral' | 'success' | 'danger' | 'attention';
}) {
  const toneClass = {
    neutral: 'text-white',
    success: 'text-emerald-200',
    danger: 'text-red-200',
    attention: 'text-neutral-100',
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 transition hover:border-white/20">
      <p className="text-xs font-medium text-neutral-400">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-neutral-600">{note}</p>
    </div>
  );
}

function ChartPanel({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-500">
          {description}
        </p>
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-neutral-500">
      {message}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/90 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl">
      {label ? <p className="mb-1 font-semibold text-white">{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`} className="text-neutral-300">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}
