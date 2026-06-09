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
import { API_BASE_URL, apiGet } from '@/lib/api';

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
    paidAmount?: number;
    unpaidAmount?: number;
    paidBookings?: number;
    pendingBookings?: number;
    cancelledBookings?: number;
    customers?: number;
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

function makeParams(filters: AnalyticsFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params;
}

function money(value: number | undefined) {
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

function compactLabel(value: string, length = 28) {
  return value.length > length ? value.slice(0, length - 1) + '...' : value;
}

function statusTone(status: string) {
  if (['SENT', 'PAID', 'COMPLETED', 'CONFIRMED'].includes(status)) {
    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  }

  if (['FAILED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
    return 'border-red-400/20 bg-red-400/10 text-red-200';
  }

  return 'border-white/10 bg-white/[0.04] text-neutral-300';
}

function chartColor(index: number) {
  const colors = ['#ffffff', '#a3a3a3', '#737373', '#525252'];
  return colors[index % colors.length];
}

function getFileName(disposition: string | null) {
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || 'ladybird-reports.xlsx';
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
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  async function fetchAnalytics(nextFilters = filters) {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await apiGet<AnalyticsResponse>(
        `/dashboard/analytics/${COMPANY_ID}?${makeParams(
          nextFilters,
        ).toString()}`,
      );

      setAnalytics(data);
      setLastUpdatedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading reports.',
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

  async function exportExcel() {
    try {
      setExporting(true);
      setExportError('');

      const response = await fetch(
        `${API_BASE_URL}/dashboard/analytics/${COMPANY_ID}/export?${makeParams(
          filters,
        ).toString()}`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Export failed.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getFileName(response.headers.get('Content-Disposition'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while exporting Excel.',
      );
    } finally {
      setExporting(false);
    }
  }

  const summary = analytics?.summary;
  const paidAmount = summary?.paidAmount ?? summary?.paidRevenue ?? 0;
  const unpaidAmount =
    summary?.unpaidAmount ?? Math.max((summary?.bookingValue ?? 0) - paidAmount, 0);
  const paidBookings =
    summary?.paidBookings ??
    analytics?.paymentStatusBreakdown.find((row) => row.status === 'PAID')
      ?.count ??
    0;
  const pendingBookings =
    summary?.pendingBookings ??
    analytics?.bookingStatusBreakdown.find((row) => row.status === 'PENDING')
      ?.count ??
    0;
  const customerCount = summary?.customers ?? 0;

  const chartData = useMemo(() => {
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
          })) ?? [],
      routeDemand:
        analytics?.routeDemand.map((route) => ({
          name: compactLabel(route.name, 30),
          count: route.count,
          route: route.name,
        })) ?? [],
    };
  }, [analytics]);

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-neutral-500">
            Business Intelligence
          </p>
          <h1 className="mt-3 text-3xl font-medium leading-[1.05] tracking-[-0.035em] text-white sm:text-4xl">
            Reports
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-light leading-6 text-neutral-400 sm:text-[15px]">
            Business performance, revenue, bookings and exports.
          </p>
          {lastUpdatedAt ? (
            <p className="mt-2 text-xs font-light text-neutral-600">
              Last refreshed {lastUpdatedAt.toLocaleTimeString()}.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="h-11 rounded-full border border-white/10 px-5 text-sm font-medium text-neutral-300 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={exportExcel}
            disabled={exporting}
            className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <section className="mb-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-wrap gap-2">
          {(['7', '30', '90'] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => applyPreset(days)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
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
            className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
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
            label="Booking"
            value={filters.bookingStatus}
            onChange={(value) => updateFilter('bookingStatus', value)}
            options={bookingStatusOptions.map((status) => ({
              value: status,
              label: nice(status),
            }))}
          />
          <FilterSelect
            label="Payment"
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

      {(errorMessage || exportError) && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-200">
          {errorMessage || exportError}
        </div>
      )}

      {loading && !analytics ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-neutral-400">
          Loading reports...
        </div>
      ) : null}

      {summary ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <KpiCard title="Total Revenue" value={money(paidAmount)} note="Paid payments" tone="success" />
            <KpiCard title="Total Bookings" value={summary.totalBookings} note="Filtered requests" />
            <KpiCard title="Paid Bookings" value={paidBookings} note="Fully paid bookings" />
            <KpiCard title="Pending Bookings" value={pendingBookings} note="Awaiting action" />
            <KpiCard
              title="Manual Quotes"
              value={summary.manualQuotePending}
              note="Needs fare review"
              tone={summary.manualQuotePending ? 'attention' : 'neutral'}
            />
            <KpiCard title="Customers" value={customerCount} note="In selected range" />
          </section>

          <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <ExecutivePanel
              eyebrow="Revenue overview"
              title="Money movement"
              description="Paid amount is based on PAID payment records only."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric label="Booking value" value={money(summary.bookingValue)} />
                <MiniMetric label="Paid amount" value={money(paidAmount)} />
                <MiniMetric label="Unpaid amount" value={money(unpaidAmount)} />
              </div>

              <div className="mt-5 h-[220px]">
                {chartData.bookingsOverTime.length ? (
                  <ResponsiveContainer width="100%" height="100%">
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
                        strokeWidth={2.2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyPanel message="No booking trend data in this range." />
                )}
              </div>
            </ExecutivePanel>

            <ExecutivePanel
              eyebrow="Booking status"
              title="Workflow position"
              description="A quick view of booking movement."
            >
              <StatusBreakdown rows={analytics.bookingStatusBreakdown} />
            </ExecutivePanel>
          </section>

          <section className="mt-5 grid gap-4 xl:grid-cols-2">
            <ExecutivePanel
              eyebrow="Route performance"
              title="Saved route demand"
              description="Approved routes ranked by booking count."
            >
              {chartData.routeDemand.length ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.routeDemand} layout="vertical">
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
                      <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                        {chartData.routeDemand.map((_, index) => (
                          <Cell key={index} fill={chartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel message="No saved route bookings in this range." />
              )}
            </ExecutivePanel>

            <ExecutivePanel
              eyebrow="Manual quote queue"
              title="Trips needing price attention"
              description="Custom requests that still need final fare review."
            >
              {analytics.manualQuoteQueue.length ? (
                <div className="space-y-3">
                  {analytics.manualQuoteQueue.slice(0, 6).map((booking) => (
                    <RecordRow
                      key={booking.id}
                      title={booking.bookingRef}
                      subtitle={booking.routeDisplay}
                      meta={`${booking.customerName} - ${formatDateTime(
                        booking.pickupDate,
                      )}`}
                      status={booking.status}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanel message="No manual quote bookings need attention." />
              )}
            </ExecutivePanel>
          </section>

          <section className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <ExecutivePanel
              eyebrow="Communication"
              title="Notification health"
              description="Email delivery outcomes from booking notifications."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {analytics.notificationHealth.breakdown.map((row) => (
                  <MiniMetric
                    key={row.status}
                    label={nice(row.status)}
                    value={row.count}
                  />
                ))}
              </div>
              {analytics.notificationHealth.recentFailures.length ? (
                <div className="mt-4 space-y-2">
                  {analytics.notificationHealth.recentFailures
                    .slice(0, 3)
                    .map((failure) => (
                      <div
                        key={failure.id}
                        className="rounded-2xl border border-red-400/15 bg-red-400/5 p-3 text-xs leading-5 text-red-100"
                      >
                        <p className="font-medium">{nice(failure.event)}</p>
                        <p className="mt-1 break-words text-red-200/70">
                          {failure.errorMessage || 'Delivery failed.'}
                        </p>
                      </div>
                    ))}
                </div>
              ) : null}
            </ExecutivePanel>

            <ExecutivePanel
              eyebrow="Recent activity"
              title="Operational feed"
              description="Bookings, payments, trip actions and delivery issues."
            >
              {analytics.recentActivity.length ? (
                <div className="space-y-3">
                  {analytics.recentActivity.slice(0, 7).map((activity) => (
                    <RecordRow
                      key={activity.id}
                      title={activity.title}
                      subtitle={activity.description}
                      meta={formatDateTime(activity.createdAt)}
                      status={activity.status}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanel message="No recent activity in this range." />
              )}
            </ExecutivePanel>
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
    <label className="grid gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition focus:border-white/30"
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
    <label className="grid gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition focus:border-white/30"
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
      <p className={`mt-2 text-2xl font-medium ${toneClass}`}>{value}</p>
      <p className="mt-1.5 text-xs font-light leading-5 text-neutral-600">
        {note}
      </p>
    </div>
  );
}

function ExecutivePanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
        {eyebrow}
      </p>
      <h2 className="mt-2.5 text-lg font-medium tracking-[-0.02em] text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm font-light leading-6 text-neutral-500">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
    </div>
  );
}

function StatusBreakdown({
  rows,
}: {
  rows: Array<{ status: string; count: number }>;
}) {
  const visibleRows = rows.filter((row) => row.count > 0);

  if (!visibleRows.length) {
    return <EmptyPanel message="No booking statuses in this range." />;
  }

  const maxCount = Math.max(...visibleRows.map((row) => row.count), 1);

  return (
    <div className="space-y-3">
      {visibleRows.map((row) => (
        <div key={row.status} className="rounded-2xl bg-black/25 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-neutral-200">
              {nice(row.status)}
            </span>
            <span className="text-neutral-400">{row.count}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.max((row.count / maxCount) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordRow({
  title,
  subtitle,
  meta,
  status,
}: {
  title: string;
  subtitle: string;
  meta: string;
  status: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-white">{title}</p>
          <p className="mt-1 break-words text-sm font-light leading-6 text-neutral-400">
            {subtitle}
          </p>
          <p className="mt-1 text-xs font-light text-neutral-600">{meta}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${statusTone(
            status,
          )}`}
        >
          {nice(status)}
        </span>
      </div>
    </article>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm font-light leading-6 text-neutral-500">
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
      {label ? <p className="mb-1 font-medium text-white">{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`} className="text-neutral-300">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}
