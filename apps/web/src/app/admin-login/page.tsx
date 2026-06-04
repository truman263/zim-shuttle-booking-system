'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        await apiGet<AdminUser>('/auth/me');

        if (mounted) {
          router.replace('/dashboard');
        }
      } catch {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Enter your admin email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await apiPost('/auth/login', {
        email: email.trim(),
        password,
      });
      router.replace('/dashboard');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please check your details.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-dvh bg-[#030303] px-4 py-8 text-white sm:px-6 sm:py-10"
      style={{
        fontFamily:
          "Inter, Montserrat, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:rounded-[34px] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden border-r border-white/10 bg-black/40 p-8 lg:block">
            <Image
              src="/brand/ladybird-logo.png"
              alt="LadyBird Shuttle Services"
              width={220}
              height={90}
              priority
              className="h-auto w-52"
            />

            <div className="mt-20">
              <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
                Admin Access
              </p>
              <h1 className="mt-5 max-w-md text-4xl font-semibold leading-[1.05] tracking-[-0.045em]">
                Secure operations for LadyBird Shuttle Services.
              </h1>
              <p className="mt-5 max-w-md text-sm font-light leading-7 text-neutral-400">
                Sign in to manage bookings, route fares, customers, fleet,
                drivers, payments and reports.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <Image
              src="/brand/ladybird-logo.png"
              alt="LadyBird Shuttle Services"
              width={180}
              height={74}
              priority
              className="h-auto w-40 lg:hidden"
            />

            <div className="mt-10 lg:mt-0">
              <p className="text-xs uppercase tracking-[0.36em] text-neutral-500">
                Login
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
                Admin sign in
              </h2>
              <p className="mt-3 text-sm font-light leading-6 text-neutral-400">
                Use your approved administrator account to continue.
              </p>
            </div>

            {checkingSession ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-neutral-400">
                Checking admin session...
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="mt-8">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-300">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="admin-input"
                    placeholder="admin@example.com"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-medium text-neutral-300">
                    Password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="admin-input"
                    placeholder="Enter password"
                  />
                </label>

                {errorMessage && (
                  <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .admin-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.045);
          padding: 0.9rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .admin-input::placeholder {
          color: rgba(163, 163, 163, 0.65);
        }

        .admin-input:focus {
          border-color: rgba(255, 255, 255, 0.34);
          background: rgba(255, 255, 255, 0.07);
        }
      `}</style>
    </main>
  );
}
