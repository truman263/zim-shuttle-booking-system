'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';

type NotificationStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';
type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'SYSTEM';

type NotificationLog = {
  id: string;
  companyId: string;
  bookingId?: string | null;
  customerId?: string | null;
  paymentId?: string | null;
  event: string;
  channel: NotificationChannel | string;
  recipient?: string | null;
  subject?: string | null;
  message: string;
  status: NotificationStatus | string;
  errorMessage?: string | null;
  metadata?: unknown;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type NotificationCounts = {
  total: number;
  queued: number;
  sent: number;
  failed: number;
  skipped: number;
};

const ALL = 'ALL';

const statusOptions = [ALL, 'SENT', 'FAILED', 'SKIPPED', 'QUEUED'];
const channelOptions = [ALL, 'EMAIL', 'WHATSAPP', 'SMS', 'SYSTEM'];
const eventOptions = [
  ALL,
  'BOOKING_RECEIVED',
  'BOOKING_CONFIRMED',
  'PAYMENT_RECEIVED',
  'TRIP_DETAILS_ASSIGNED',
  'BOOKING_CANCELLED',
  'DRIVER_ASSIGNED',
];

function humanise(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  return value.replaceAll('_', ' ');
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not sent';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeList<T>(data: T[] | T | { data?: T[] } | null): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && 'data' in data) {
    return Array.isArray(data.data) ? data.data : [];
  }

  return data ? [data as T] : [];
}

function getMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, unknown>;
}

function getBookingReference(notification: NotificationLog) {
  const metadata = getMetadataRecord(notification.metadata);
  const value = metadata.bookingRef;

  return typeof value === 'string' && value.trim() ? value : null;
}

function safeMetadataEntries(metadata: unknown) {
  const blockedPatterns = [
    'secret',
    'token',
    'password',
    'apikey',
    'api_key',
    'private',
    'national',
    'passport',
    'raw',
  ];

  return Object.entries(getMetadataRecord(metadata))
    .filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();

      if (blockedPatterns.some((pattern) => normalizedKey.includes(pattern))) {
        return false;
      }

      return (
        value === null ||
        ['string', 'number', 'boolean'].includes(typeof value)
      );
    })
    .slice(0, 10);
}

function includesSearchValue(notification: NotificationLog, search: string) {
  if (!search) {
    return true;
  }

  const query = search.toLowerCase();
  const bookingRef = getBookingReference(notification);

  return [
    notification.recipient,
    notification.subject,
    notification.message,
    notification.errorMessage,
    bookingRef,
    notification.bookingId,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [channelFilter, setChannelFilter] = useState(ALL);
  const [eventFilter, setEventFilter] = useState(ALL);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadNotifications() {
    try {
      setLoading(true);
      setErrorMessage('');

      const [logsData, countsData] = await Promise.all([
        apiGet<NotificationLog[] | NotificationLog | { data?: NotificationLog[] }>(
          '/notifications',
        ),
        apiGet<NotificationCounts>('/notifications/counts'),
      ]);

      setNotifications(normalizeList(logsData));
      setCounts(countsData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load notification logs.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const statusMatches =
        statusFilter === ALL || notification.status === statusFilter;
      const channelMatches =
        channelFilter === ALL || notification.channel === channelFilter;
      const eventMatches = eventFilter === ALL || notification.event === eventFilter;

      return (
        statusMatches &&
        channelMatches &&
        eventMatches &&
        includesSearchValue(notification, search.trim())
      );
    });
  }, [channelFilter, eventFilter, notifications, search, statusFilter]);

  const derivedCounts = useMemo(() => {
    if (counts) {
      return counts;
    }

    return {
      total: notifications.length,
      sent: notifications.filter((item) => item.status === 'SENT').length,
      failed: notifications.filter((item) => item.status === 'FAILED').length,
      skipped: notifications.filter((item) => item.status === 'SKIPPED').length,
      queued: notifications.filter((item) => item.status === 'QUEUED').length,
    };
  }, [counts, notifications]);

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#C8A96A]">
            Messaging
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Notification Center
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Monitor customer and admin booking notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadNotifications()}
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

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard title="Total notifications" value={derivedCounts.total} />
        <SummaryCard title="Sent" value={derivedCounts.sent} tone="success" />
        <SummaryCard title="Failed" value={derivedCounts.failed} tone="danger" />
        <SummaryCard title="Skipped" value={derivedCounts.skipped} />
        <SummaryCard title="Queued" value={derivedCounts.queued} tone="pending" />
      </div>

      <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_190px]">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">
              Search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Recipient, subject or booking reference"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/25"
            />
          </label>

          <FilterSelect
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
          <FilterSelect
            label="Channel"
            value={channelFilter}
            options={channelOptions}
            onChange={setChannelFilter}
          />
          <FilterSelect
            label="Event"
            value={eventFilter}
            options={eventOptions}
            onChange={setEventFilter}
          />
        </div>
      </section>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          Loading notification logs...
        </div>
      )}

      {!loading && filteredNotifications.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          No notifications match the current filters.
        </div>
      )}

      {!loading && filteredNotifications.length > 0 && (
        <>
          <section className="hidden overflow-hidden rounded-3xl border border-white/10 bg-[#050505] xl:block">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">
                Notification Logs
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Created</th>
                    <th className="px-5 py-4 font-medium">Event</th>
                    <th className="px-5 py-4 font-medium">Channel</th>
                    <th className="px-5 py-4 font-medium">Recipient</th>
                    <th className="px-5 py-4 font-medium">Subject</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Sent</th>
                    <th className="px-5 py-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      expanded={expandedId === notification.id}
                      onToggle={() =>
                        setExpandedId((current) =>
                          current === notification.id ? null : notification.id,
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 xl:hidden">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                expanded={expandedId === notification.id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === notification.id ? null : notification.id,
                  )
                }
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone = 'neutral',
}: {
  title: string;
  value: number;
  tone?: 'neutral' | 'success' | 'danger' | 'pending';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'danger'
        ? 'text-red-300'
        : tone === 'pending'
          ? 'text-neutral-200'
          : 'text-white';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 transition hover:border-[#C8A96A]/25">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-white/25"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-black text-white">
            {option === ALL ? `All ${label.toLowerCase()}` : humanise(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function NotificationRow({
  notification,
  expanded,
  onToggle,
}: {
  notification: NotificationLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-white/5 align-top transition hover:bg-white/[0.03]">
        <td className="whitespace-nowrap px-5 py-4 text-neutral-300">
          {formatDate(notification.createdAt)}
        </td>
        <td className="px-5 py-4 text-neutral-300">
          {humanise(notification.event)}
        </td>
        <td className="px-5 py-4 text-neutral-400">
          {humanise(notification.channel)}
        </td>
        <td className="max-w-[220px] px-5 py-4">
          <p className="truncate text-neutral-300">
            {notification.recipient || 'Not configured'}
          </p>
          {getBookingReference(notification) && (
            <p className="mt-1 text-xs text-neutral-600">
              {getBookingReference(notification)}
            </p>
          )}
        </td>
        <td className="max-w-[260px] px-5 py-4 text-neutral-300">
          <p className="truncate">{notification.subject || 'No subject'}</p>
          {notification.status === 'FAILED' && notification.errorMessage && (
            <p className="mt-1 truncate text-xs text-red-300">
              {notification.errorMessage}
            </p>
          )}
        </td>
        <td className="px-5 py-4">
          <StatusBadge status={notification.status} />
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-neutral-500">
          {formatDate(notification.sentAt)}
        </td>
        <td className="px-5 py-4">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white"
          >
            {expanded ? 'Close' : 'View'}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-white/5 bg-white/[0.025]">
          <td colSpan={8} className="px-5 py-5">
            <NotificationDetail notification={notification} />
          </td>
        </tr>
      )}
    </>
  );
}

function NotificationCard({
  notification,
  expanded,
  onToggle,
}: {
  notification: NotificationLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            {humanise(notification.event)}
          </p>
          <h2 className="mt-2 break-words text-lg font-semibold text-white">
            {notification.subject || 'No subject'}
          </h2>
          <p className="mt-2 break-words text-sm text-neutral-400">
            {notification.recipient || 'Not configured'}
          </p>
        </div>
        <StatusBadge status={notification.status} />
      </div>

      <div className="mt-4 grid gap-2 text-sm text-neutral-400 sm:grid-cols-2">
        <p>Created: {formatDate(notification.createdAt)}</p>
        <p>Sent: {formatDate(notification.sentAt)}</p>
        <p>Channel: {humanise(notification.channel)}</p>
        <p>Reference: {getBookingReference(notification) || 'Not linked'}</p>
      </div>

      {notification.status === 'FAILED' && notification.errorMessage && (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {notification.errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={onToggle}
        className="mt-5 w-full rounded-full border border-white/10 px-4 py-3 text-xs font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white"
      >
        {expanded ? 'Close details' : 'View details'}
      </button>

      {expanded && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <NotificationDetail notification={notification} />
        </div>
      )}
    </article>
  );
}

function NotificationDetail({
  notification,
}: {
  notification: NotificationLog;
}) {
  const metadataEntries = safeMetadataEntries(notification.metadata);
  const bookingRef = getBookingReference(notification);
  const isFailed = notification.status === 'FAILED';
  const isSkipped = notification.status === 'SKIPPED';
  const hasMessage = Boolean(notification.errorMessage);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
          Message
        </p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-300">
          {notification.message}
        </p>

        {isSkipped && hasMessage && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
              Skipped
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-neutral-300">
              {notification.errorMessage}
            </p>
          </div>
        )}

        {isFailed && hasMessage && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-red-300">
              Error
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-red-200">
              {notification.errorMessage}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
          Safe metadata
        </p>

        <dl className="mt-3 space-y-2 text-sm">
          {bookingRef && (
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt className="text-neutral-500">Booking ref</dt>
              <dd className="break-all text-right text-neutral-200">
                {bookingRef}
              </dd>
            </div>
          )}

          {metadataEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between gap-4 border-b border-white/5 pb-2"
            >
              <dt className="text-neutral-500">{humanise(key)}</dt>
              <dd className="break-all text-right text-neutral-200">
                {String(value)}
              </dd>
            </div>
          ))}

          {metadataEntries.length === 0 && !bookingRef && (
            <p className="text-neutral-500">No safe metadata to preview.</p>
          )}
        </dl>

        <button
          type="button"
          disabled
          className="mt-5 w-full cursor-not-allowed rounded-full border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-semibold text-neutral-600"
        >
          Retry failed coming later
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'SENT'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
      : status === 'FAILED'
        ? 'border-red-400/20 bg-red-400/10 text-red-300'
        : status === 'SKIPPED'
          ? 'border-white/10 bg-white/[0.055] text-neutral-300'
          : 'border-white/10 bg-white/[0.035] text-neutral-400';

  return (
    <span
      className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {humanise(status)}
    </span>
  );
}
