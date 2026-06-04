'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

const navigationItems = [
  { name: 'Overview', href: '/dashboard' },
  { name: 'Reports', href: '/dashboard/reports' },
  { name: 'Bookings', href: '/dashboard/bookings' },
  { name: 'Vehicles', href: '/dashboard/vehicles' },
  { name: 'Drivers', href: '/dashboard/drivers' },
  { name: 'Customers', href: '/dashboard/customers' },
  { name: 'Routes', href: '/dashboard/routes' },
  { name: 'Payments', href: '/dashboard/payments' },
];

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  function isActiveRoute(href: string) {
    return href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const user = await apiGet<AdminUser>('/auth/me');

        if (mounted) {
          setAdminUser(user);
        }
      } catch {
        if (mounted) {
          router.replace('/admin-login');
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function logout() {
    await apiPost('/auth/logout', {});
    setAdminUser(null);
    router.replace('/admin-login');
  }

  if (checkingSession || !adminUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          Checking admin access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-black text-white">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-[#050505] px-6 py-6 lg:block">
        <div className="border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.45em] text-[#B8B8B8]">
            LadyBird
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Shuttle operations system
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm transition hover:bg-white/5 hover:text-white ${
                isActiveRoute(item.href)
                  ? 'bg-white/[0.07] text-white'
                  : 'text-neutral-400'
              }`}
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
        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-[0.24em] text-neutral-500 sm:text-xs sm:tracking-[0.35em]">
                Operations Control
              </p>
              <p className="mt-1 hidden text-sm text-neutral-300 sm:block">
                Manage bookings, fleet, drivers and payments
              </p>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-4 py-2 text-xs font-medium uppercase tracking-widest text-[#C8A96A]">
                Trial
              </span>
              <span className="hidden rounded-full border border-white/10 px-4 py-2 text-xs text-neutral-400 md:inline-flex">
                {adminUser.fullName}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-neutral-300 transition hover:border-white/25 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mx-auto mt-3 max-w-7xl lg:hidden">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${
                    isActiveRoute(item.href)
                      ? 'border-white/25 bg-white text-black'
                      : 'border-white/10 bg-white/[0.035] text-neutral-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <button
                type="button"
                onClick={logout}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-medium text-neutral-300 transition hover:border-white/25 hover:text-white sm:hidden"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
