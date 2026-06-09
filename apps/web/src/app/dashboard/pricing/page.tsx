'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL, apiGet } from '@/lib/api';

type PricingSettings = {
  id: string;
  companyId: string;
  customRouteAutoEstimateEnabled: boolean;
  customRouteBaseFare: number;
  customRoutePricePerKm: number;
  customRouteMinimumFare: number;
  customRouteManualQuoteThresholdKm: number | null;
  depositRequired: boolean;
  depositPercentage: number;
  minimumDepositAmount: number;
  isConfigured: boolean;
  configuredAt: string | null;
  configuredByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
};

type PricingForm = {
  customRouteAutoEstimateEnabled: boolean;
  customRouteBaseFare: string;
  customRoutePricePerKm: string;
  customRouteMinimumFare: string;
  customRouteManualQuoteThresholdKm: string;
  depositRequired: boolean;
  depositPercentage: string;
  minimumDepositAmount: string;
};

type PricingAudit = {
  id: string;
  changeType: string;
  createdAt: string;
  changedByAdmin?: {
    fullName?: string | null;
    email?: string | null;
  } | null;
};

type AdminUser = {
  companyId: string | null;
};

function toForm(settings: PricingSettings): PricingForm {
  return {
    customRouteAutoEstimateEnabled: settings.customRouteAutoEstimateEnabled,
    customRouteBaseFare: String(settings.customRouteBaseFare ?? 10),
    customRoutePricePerKm: String(settings.customRoutePricePerKm ?? 1.2),
    customRouteMinimumFare: String(settings.customRouteMinimumFare ?? 15),
    customRouteManualQuoteThresholdKm:
      settings.customRouteManualQuoteThresholdKm === null
        ? ''
        : String(settings.customRouteManualQuoteThresholdKm),
    depositRequired: settings.depositRequired,
    depositPercentage: String(settings.depositPercentage ?? 30),
    minimumDepositAmount: String(settings.minimumDepositAmount ?? 10),
  };
}

function money(value: number) {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }

  return `$${value.toFixed(2)}`;
}

function numberFrom(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not recorded';
  }

  return date.toLocaleString();
}

export default function PricingPage() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [audit, setAudit] = useState<PricingAudit[]>([]);
  const [form, setForm] = useState<PricingForm | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function fetchPricingSettings() {
    try {
      setLoading(true);
      setErrorMessage('');

      const adminUser = await apiGet<AdminUser>('/auth/me');
      const activeCompanyId = adminUser.companyId;

      if (!activeCompanyId) {
        throw new Error(
          'Your admin account is not linked to a company yet.',
        );
      }

      setCompanyId(activeCompanyId);

      const [settingsData, auditData] = await Promise.all([
        apiGet<PricingSettings>(`/pricing-settings/${activeCompanyId}`),
        apiGet<PricingAudit[]>(`/pricing-settings/${activeCompanyId}/audit`),
      ]);

      setSettings(settingsData);
      setForm(toForm(settingsData));
      setAudit(Array.isArray(auditData) ? auditData : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading pricing settings.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPricingSettings();
  }, []);

  const preview = useMemo(() => {
    if (!form) {
      return {
        oneWayFare: 0,
        deposit: 0,
      };
    }

    const exampleDistanceKm = 100;
    const baseFare = numberFrom(form.customRouteBaseFare);
    const pricePerKm = numberFrom(form.customRoutePricePerKm);
    const minimumFare = numberFrom(form.customRouteMinimumFare);
    const calculatedFare = baseFare + exampleDistanceKm * pricePerKm;
    const oneWayFare = Math.max(minimumFare, calculatedFare);
    const percentageDeposit =
      oneWayFare * (numberFrom(form.depositPercentage) / 100);
    const deposit = form.depositRequired
      ? Math.min(
          oneWayFare,
          Math.max(numberFrom(form.minimumDepositAmount), percentageDeposit),
        )
      : 0;

    return {
      oneWayFare,
      deposit,
    };
  }, [form]);

  function updateForm<K extends keyof PricingForm>(
    field: K,
    value: PricingForm[K],
  ) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function validateForm(current: PricingForm) {
    const values = [
      ['Base fare', current.customRouteBaseFare],
      ['Price per km', current.customRoutePricePerKm],
      ['Minimum fare', current.customRouteMinimumFare],
      ['Deposit percentage', current.depositPercentage],
      ['Minimum deposit amount', current.minimumDepositAmount],
    ];

    for (const [label, value] of values) {
      const parsed = Number(value);

      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${label} must be zero or greater.`);
      }
    }

    const depositPercentage = Number(current.depositPercentage);

    if (depositPercentage > 100) {
      throw new Error('Deposit percentage must be between 0 and 100.');
    }

    if (current.customRouteManualQuoteThresholdKm.trim()) {
      const threshold = Number(current.customRouteManualQuoteThresholdKm);

      if (!Number.isFinite(threshold) || threshold <= 0) {
        throw new Error('Manual quote threshold must be a positive distance.');
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form || !companyId) {
      return;
    }

    try {
      validateForm(form);
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await fetch(
        `${API_BASE_URL}/pricing-settings/${companyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            customRouteAutoEstimateEnabled:
              form.customRouteAutoEstimateEnabled,
            customRouteBaseFare: Number(form.customRouteBaseFare),
            customRoutePricePerKm: Number(form.customRoutePricePerKm),
            customRouteMinimumFare: Number(form.customRouteMinimumFare),
            customRouteManualQuoteThresholdKm:
              form.customRouteManualQuoteThresholdKm.trim() === ''
                ? null
                : Number(form.customRouteManualQuoteThresholdKm),
            depositRequired: form.depositRequired,
            depositPercentage: Number(form.depositPercentage),
            minimumDepositAmount: Number(form.minimumDepositAmount),
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(
          error?.message || 'Something went wrong while saving pricing.',
        );
      }

      const updatedSettings = (await response.json()) as PricingSettings;
      setSettings(updatedSettings);
      setForm(toForm(updatedSettings));
      setSuccessMessage('Pricing settings saved and activated.');
      await fetchPricingSettings();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving pricing.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 text-sm leading-6 text-neutral-400">
        Loading pricing settings...
      </div>
    );
  }

  if (!form) {
    return (
      <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-sm leading-6 text-red-100">
        {errorMessage || 'Pricing settings could not be loaded.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-neutral-500">
            Pricing setup
          </p>
          <h1 className="mt-3 text-3xl font-medium leading-[1.05] tracking-[-0.035em] text-white sm:text-4xl">
            Pricing Control
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-neutral-400 sm:text-[15px]">
            These rules control future custom route estimates and deposit
            calculations for your company. Saved route fares remain under
            Routes.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
          {settings?.isConfigured ? 'Pricing active' : 'Setup required'}
        </div>
      </section>

      {(errorMessage || successMessage) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-6 ${
            errorMessage
              ? 'border-red-500/20 bg-red-500/10 text-red-100'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {errorMessage || successMessage}
        </div>
      )}

      {!settings?.isConfigured ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
            Pricing setup required
          </p>
          <h2 className="mt-3 text-lg font-medium tracking-[-0.015em] text-white sm:text-xl">
            Review and activate pricing before it controls customer estimates.
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-light leading-7 text-neutral-400">
            Starter values can be edited below, but custom route prices and
            deposit amounts will stay unavailable until an owner saves and
            activates these settings.
          </p>
        </div>
      ) : (
        <div className="rounded-[28px] border border-emerald-500/15 bg-emerald-500/10 p-5 text-sm font-light leading-6 text-emerald-100">
          Pricing active. Future custom route estimates and deposits use these
          owner-confirmed company rules.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Panel
            label="Custom Route Pricing"
            title="Google distance, owner-controlled estimate rules."
            description="Custom route estimates use Google distance when available. These are planning estimates until the fare is approved."
          >
            <ToggleRow
              label="Auto-estimate custom routes"
              description="When off, custom trips remain manual quote requests even if distance is available."
              checked={form.customRouteAutoEstimateEnabled}
              onChange={(value) =>
                updateForm('customRouteAutoEstimateEnabled', value)
              }
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="Base fare"
                value={form.customRouteBaseFare}
                onChange={(value) => updateForm('customRouteBaseFare', value)}
              />
              <Field
                label="Price per km"
                value={form.customRoutePricePerKm}
                onChange={(value) => updateForm('customRoutePricePerKm', value)}
              />
              <Field
                label="Minimum fare"
                value={form.customRouteMinimumFare}
                onChange={(value) => updateForm('customRouteMinimumFare', value)}
              />
            </div>

            <Field
              label="Manual quote threshold km"
              value={form.customRouteManualQuoteThresholdKm}
              placeholder="Optional"
              onChange={(value) =>
                updateForm('customRouteManualQuoteThresholdKm', value)
              }
            />
          </Panel>

          <Panel
            label="Deposit Rules"
            title="Control payment expectations for new bookings."
            description="Deposit rules apply to new bookings only. Existing bookings keep their saved payment snapshot."
          >
            <ToggleRow
              label="Deposit required"
              description="When disabled, new bookings start with no deposit requirement."
              checked={form.depositRequired}
              onChange={(value) => updateForm('depositRequired', value)}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Deposit percentage"
                value={form.depositPercentage}
                onChange={(value) => updateForm('depositPercentage', value)}
              />
              <Field
                label="Minimum deposit amount"
                value={form.minimumDepositAmount}
                onChange={(value) => updateForm('minimumDepositAmount', value)}
              />
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel
            label="Saved Route Pricing"
            title="Fixed saved route fares stay in Routes."
            description="Route-specific fares are managed under Routes. Route fares, route types, fare units, distance, duration and active status remain managed from the Routes dashboard."
          >
            <a
              href="/dashboard/routes"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              Manage saved routes
            </a>
          </Panel>

          <Panel
            label="Safety Preview"
            title="Example custom route calculation."
            description="This preview is local to this page. It does not save or create a booking."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <PreviewMetric label="Distance" value="100 km" />
              <PreviewMetric label="Estimate" value={money(preview.oneWayFare)} />
              <PreviewMetric label="Deposit" value={money(preview.deposit)} />
            </div>
            <p className="text-xs font-light leading-5 text-neutral-500">
              Estimate = base fare + distance x price per km, subject to the
              minimum fare. Deposit follows the saved deposit rule and never
              exceeds the fare.
            </p>
          </Panel>
        </section>

        <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-light leading-6 text-neutral-400">
            Last updated:{' '}
            <span className="font-normal text-neutral-200">
              {settings ? formatDate(settings.updatedAt) : 'Not saved yet'}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => settings && setForm(toForm(settings))}
              className="h-11 rounded-full border border-white/10 px-5 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              Reset form
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : settings?.isConfigured
                  ? 'Save pricing changes'
                  : 'Save and activate pricing'}
            </button>
          </div>
        </div>
      </form>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
              Pricing History
            </p>
            <h2 className="mt-2 text-lg font-medium tracking-[-0.015em] text-white sm:text-xl">
              Recent changes
            </h2>
          </div>
          <p className="text-sm font-light text-neutral-500">Latest 10 entries</p>
        </div>

        <div className="mt-5 space-y-3">
          {audit.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-light leading-6 text-neutral-500">
              No pricing changes recorded yet.
            </div>
          ) : (
            audit.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-white">
                    {entry.changeType.replaceAll('_', ' ')}
                  </p>
                  <p className="text-xs font-light text-neutral-500">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-xs font-light text-neutral-500">
                  Updated by{' '}
                  {entry.changedByAdmin?.fullName ||
                    entry.changedByAdmin?.email ||
                    'admin'}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Panel({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
        {label}
      </p>
      <h2 className="mt-3 text-lg font-medium tracking-[-0.02em] text-white sm:text-xl">
        {title}
      </h2>
      <p className="mt-3 text-sm font-light leading-7 text-neutral-400">
        {description}
      </p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
      <input
        value={value}
        inputMode="decimal"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-[15px] font-medium text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium tracking-[-0.01em] text-white">
          {label}
        </p>
        <p className="mt-1 text-xs font-light leading-5 text-neutral-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full border transition ${
          checked
            ? 'border-white/30 bg-white'
            : 'border-white/10 bg-white/[0.05]'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full transition ${
            checked ? 'left-7 bg-black' : 'left-1 bg-neutral-500'
          }`}
        />
      </button>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-medium text-white sm:text-xl">{value}</p>
    </div>
  );
}
