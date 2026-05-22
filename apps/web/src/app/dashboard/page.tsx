'use client';

import { useEffect, useState } from 'react';

type DashboardSummary = {
  company: {
    id: string;
    name: string;
    status: string;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  payments: {
    paidBookings: number;
    partiallyPaidBookings: number;
    unpaidBookings: number;
    totalRevenue: number;
  };
  vehicles: {
    total: number;
    available: number;
    booked: number;
  };
  drivers: {
    total: number;
    available: number;
    busy: number;
  };
  customers: {
    total: number;
  };
  todayTrips: unknown[];
};

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchDashboardSummary() {
      try {
        const response = await fetch(
          `http://localhost:5000/dashboard/summary/${COMPANY_ID}`,
        );

        if (!response.ok) {
          throw new Error('Failed to load dashboard summary');
        }

        const data = await response.json();
        setSummary(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading dashboard data',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardSummary();
  }, []);

  if (loading) {
    return <p className="text-neutral-400">Loading dashboard...</p>;
  }

  if (errorMessage || !summary) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
        <h1 className="text-2xl font-semibold">Dashboard Error</h1>
        <p className="mt-3 text-red-300">{errorMessage}</p>
        <p className="mt-3 text-sm text-neutral-400">
          Make sure the backend is running on http://localhost:5000.
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Bookings',
      value: summary.bookings.total,
      description: 'All bookings recorded',
    },
    {
      title: 'Pending Bookings',
      value: summary.bookings.pending,
      description: 'Bookings awaiting action',
    },
    {
      title: 'Completed Trips',
      value: summary.bookings.completed,
      description: 'Successfully completed trips',
    },
    {
      title: 'Total Revenue',
      value: `$${summary.payments.totalRevenue}`,
      description: 'Confirmed paid revenue',
      accent: true,
    },
    {
      title: 'Paid Bookings',
      value: summary.payments.paidBookings,
      description: 'Fully paid bookings',
    },
    {
      title: 'Unpaid Bookings',
      value: summary.payments.unpaidBookings,
      description: 'Bookings still unpaid',
    },
    {
      title: 'Available Vehicles',
      value: `${summary.vehicles.available}/${summary.vehicles.total}`,
      description: 'Vehicles ready for assignment',
    },
    {
      title: 'Available Drivers',
      value: `${summary.drivers.available}/${summary.drivers.total}`,
      description: 'Drivers ready for assignment',
    },
    {
      title: 'Customers',
      value: summary.customers.total,
      description: 'Registered customers',
    },
  ];

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">
            LadyBird Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Operations Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-400">
            Live overview for bookings, payments, vehicles, drivers and
            customer activity.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-sm text-neutral-400">Company</p>
          <p className="mt-1 font-medium">{summary.company.name}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">
            {summary.company.status}
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl transition hover:border-[#C8A96A]/40"
          >
            <p className="text-sm text-neutral-400">{card.title}</p>
            <p
              className={`mt-4 text-4xl font-semibold ${
                card.accent ? 'text-[#C8A96A]' : 'text-white'
              }`}
            >
              {card.value}
            </p>
            <p className="mt-3 text-sm text-neutral-500">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Booking Status</h2>
          <div className="mt-5 space-y-3 text-sm">
            <DashboardRow label="Pending" value={summary.bookings.pending} />
            <DashboardRow label="Confirmed" value={summary.bookings.confirmed} />
            <DashboardRow label="Completed" value={summary.bookings.completed} />
            <DashboardRow label="Cancelled" value={summary.bookings.cancelled} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Today&apos;s Trips</h2>
          {summary.todayTrips.length === 0 ? (
            <p className="mt-5 text-sm text-neutral-500">
              No trips scheduled for today.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {summary.todayTrips.map((trip, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 p-4 text-sm text-neutral-300"
                >
                  Trip #{index + 1}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function DashboardRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}