import Link from 'next/link';

const navigationItems = [
  { name: 'Overview', href: '/dashboard' },
  { name: 'Reports', href: '/dashboard/reports' },
  { name: 'Bookings', href: '/dashboard/bookings' },
  { name: 'Vehicles', href: '/dashboard/vehicles' },
  { name: 'Drivers', href: '/dashboard/drivers' },
  { name: 'Customers', href: '/dashboard/customers' },
  { name: 'Routes', href: '/dashboard/routes' },
  { name: 'Payments', href: '/dashboard/payments' },
  { name: 'Settings', href: '/dashboard/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-[#050505] px-6 py-6 lg:block">
        <div className="border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.45em] text-[#B8B8B8]">
            LadyBird
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Admin
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Shuttle operations system
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl px-4 py-3 text-sm text-neutral-400 transition hover:bg-white/5 hover:text-white"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#C8A96A]">
            Premium
          </p>
          <p className="mt-2 text-sm font-medium">LadyBird Shuttle Services</p>
          <p className="mt-1 text-xs text-neutral-500">
            Zimbabwe transport operations
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                Operations Control
              </p>
              <p className="mt-1 text-sm text-neutral-300">
                Manage bookings, fleet, drivers and payments
              </p>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <span className="rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-4 py-2 text-xs font-medium uppercase tracking-widest text-[#C8A96A]">
                Trial
              </span>
              <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-neutral-400">
                Admin
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
