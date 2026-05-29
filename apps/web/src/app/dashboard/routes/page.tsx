'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

const DEFAULT_COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

type RouteBooking = {
  id: string;
  bookingRef: string;
  status: string;
  paymentStatus: string;
  passengers: number;
  pickupDate?: string | null;
  finalPrice?: number | string | null;
  estimatedPrice?: number | string | null;
  customer?: {
    fullName?: string | null;
    phone?: string | null;
  } | null;
};

type RouteRecord = {
  id: string;
  companyId: string;
  name: string;
  pickupCity: string;
  destinationCity: string;
  basePrice: number | string;
  isActive: boolean;
  routeType: string;
  pricingMode: string;
  priceUnit: string;
  distanceKm?: number | string | null;
  estimatedDurationMinutes?: number | null;
  roadCondition: string;
  createdAt: string;
  updatedAt: string;
  bookings?: RouteBooking[];
  company?: {
    id: string;
    name: string;
  } | null;
};

type RouteForm = {
  name: string;
  pickupCity: string;
  destinationCity: string;
  basePrice: string;
  routeType: string;
  pricingMode: string;
  priceUnit: string;
  distanceKm: string;
  estimatedDurationMinutes: string;
  roadCondition: string;
  isActive: boolean;
};

const initialForm: RouteForm = {
  name: '',
  pickupCity: '',
  destinationCity: '',
  basePrice: '',
  routeType: 'CITY_TO_CITY',
  pricingMode: 'FIXED_ROUTE',
  priceUnit: 'PER_PASSENGER',
  distanceKm: '',
  estimatedDurationMinutes: '',
  roadCondition: 'GOOD',
  isActive: true,
};

const routeTypes = [
  'CITY_TO_CITY',
  'AIRPORT_TRANSFER',
  'LOCAL_TRANSFER',
  'PRIVATE_HIRE',
  'TOUR_PACKAGE',
  'CORPORATE_TRANSFER',
  'CUSTOM',
];

const pricingModes = [
  'FIXED_ROUTE',
  'DISTANCE_BASED',
  'HOURLY',
  'DAILY',
  'CUSTOM_QUOTE',
];

const priceUnits = ['PER_PASSENGER', 'PER_TRIP', 'PER_KM', 'PER_HOUR', 'PER_DAY'];

const roadConditions = ['GOOD', 'AVERAGE', 'BAD', 'RURAL', 'MIXED'];

function money(value?: number | string | null) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return '0.00';
  }

  return amount.toFixed(2);
}

function nice(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  return value.replaceAll('_', ' ');
}

function routeRevenue(route: RouteRecord) {
  return (route.bookings ?? []).reduce((sum, booking) => {
    return sum + Number(booking.finalPrice ?? booking.estimatedPrice ?? 0);
  }, 0);
}

function activeBookingCount(route: RouteRecord) {
  return (route.bookings ?? []).filter(
    (booking) =>
      booking.status === 'PENDING' ||
      booking.status === 'CONFIRMED' ||
      booking.status === 'DRIVER_ASSIGNED' ||
      booking.status === 'VEHICLE_ASSIGNED' ||
      booking.status === 'IN_PROGRESS',
  ).length;
}

function latestBooking(route: RouteRecord) {
  return route.bookings?.[0] ?? null;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [form, setForm] = useState<RouteForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [editingRouteId, setEditingRouteId] = useState('');

  async function fetchRoutes() {
    try {
      setErrorMessage('');
      const data = await apiGet<RouteRecord[] | RouteRecord>('/routes');
      setRoutes(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading routes',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoutes();
  }, []);

  const editingRoute =
    routes.find((route) => route.id === editingRouteId) ?? null;

  const routeStats = useMemo(() => {
    return {
      total: routes.length,
      active: routes.filter((route) => route.isActive).length,
      inactive: routes.filter((route) => !route.isActive).length,
      airport: routes.filter((route) => route.routeType === 'AIRPORT_TRANSFER')
        .length,
      city: routes.filter((route) => route.routeType === 'CITY_TO_CITY').length,
      bookings: routes.reduce(
        (sum, route) => sum + (route.bookings?.length ?? 0),
        0,
      ),
    };
  }, [routes]);

  function updateForm(field: keyof RouteForm, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingRouteId('');
    setErrorMessage('');
    setSuccessMessage('');
  }

  function startEdit(route: RouteRecord) {
    setEditingRouteId(route.id);
    setShowForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    setForm({
      name: route.name,
      pickupCity: route.pickupCity,
      destinationCity: route.destinationCity,
      basePrice: String(route.basePrice ?? ''),
      routeType: route.routeType || 'CITY_TO_CITY',
      pricingMode: route.pricingMode || 'FIXED_ROUTE',
      priceUnit: route.priceUnit || 'PER_PASSENGER',
      distanceKm:
        route.distanceKm === null || route.distanceKm === undefined
          ? ''
          : String(route.distanceKm),
      estimatedDurationMinutes:
        route.estimatedDurationMinutes === null ||
        route.estimatedDurationMinutes === undefined
          ? ''
          : String(route.estimatedDurationMinutes),
      roadCondition: route.roadCondition || 'GOOD',
      isActive: route.isActive,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const basePrice = Number(form.basePrice);
    const distanceKm = form.distanceKm ? Number(form.distanceKm) : undefined;
    const estimatedDurationMinutes = form.estimatedDurationMinutes
      ? Number(form.estimatedDurationMinutes)
      : undefined;

    if (!form.name.trim()) {
      setErrorMessage('Route name is required.');
      return;
    }

    if (!form.pickupCity.trim() || !form.destinationCity.trim()) {
      setErrorMessage('Pickup and destination are required.');
      return;
    }

    if (Number.isNaN(basePrice) || basePrice < 0) {
      setErrorMessage('Fare/base price must be a valid number.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const routePayload = {
        name: form.name.trim(),
        pickupCity: form.pickupCity.trim(),
        destinationCity: form.destinationCity.trim(),
        basePrice,
        routeType: form.routeType,
        pricingMode: form.pricingMode,
        priceUnit: form.priceUnit,
        distanceKm,
        estimatedDurationMinutes,
        roadCondition: form.roadCondition,
        isActive: form.isActive,
      };

      if (editingRouteId) {
        await apiPatch(`/routes/${editingRouteId}`, routePayload);
        setSuccessMessage('Route updated successfully.');
      } else {
        await apiPost('/routes', {
          companyId: routes[0]?.companyId ?? DEFAULT_COMPANY_ID,
          ...routePayload,
        });
        setSuccessMessage('Route and fare saved successfully.');
      }

      setForm(initialForm);
      setEditingRouteId('');
      await fetchRoutes();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the route',
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateRouteStatus(route: RouteRecord, isActive: boolean) {
    try {
      setActionLoadingId(route.id);
      setErrorMessage('');

      await apiPatch(`/routes/${route.id}`, {
        isActive,
      });

      await fetchRoutes();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating the route',
      );
    } finally {
      setActionLoadingId('');
    }
  }

  async function archiveRoute(route: RouteRecord) {
    const confirmed = window.confirm(
      `Archive "${route.name}"? This removes it from route management and public booking, but keeps historical booking records safe.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(route.id);
      setErrorMessage('');
      setSuccessMessage('');

      await apiDelete(`/routes/${route.id}`);

      if (editingRouteId === route.id) {
        resetForm();
      }

      await fetchRoutes();
      setSuccessMessage('Route archived successfully.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while archiving the route',
      );
    } finally {
      setActionLoadingId('');
    }
  }

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Route Pricing Control
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Route Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Add saved routes, set fares and control the pricing foundation used
            when customers create bookings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-5 py-3 text-sm font-semibold text-[#C8A96A] transition hover:bg-[#C8A96A]/20"
        >
          {showForm ? 'Hide Form' : 'Add Route'}
        </button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Total Routes" value={routeStats.total} />
        <SummaryCard title="Active" value={routeStats.active} accent />
        <SummaryCard title="Inactive" value={routeStats.inactive} />
        <SummaryCard title="Airport" value={routeStats.airport} />
        <SummaryCard title="City Routes" value={routeStats.city} />
        <SummaryCard title="Bookings" value={routeStats.bookings} />
      </section>

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-3xl border border-green-500/20 bg-green-500/10 p-5 text-sm text-green-300">
          {successMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C8A96A]">
              {editingRouteId ? 'Edit Route Fare' : 'Add Route Fare'}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{editingRouteId ? 'Update Saved Route' : 'Create Saved Route'}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Use this for fixed pricing, airport transfers and common
              city-to-city routes.
            </p>
          </div>

          {editingRoute && (editingRoute.bookings?.length ?? 0) > 0 && (
            <div className="mb-5 rounded-2xl border border-[#C8A96A]/25 bg-[#C8A96A]/10 p-4 text-sm leading-6 text-[#C8A96A]">
              Existing bookings keep their saved fare. Future estimates will use
              the updated route fare.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <InputField
              label="Route Name"
              value={form.name}
              onChange={(value) => updateForm('name', value)}
              placeholder="Harare to Masvingo"
            />
            <InputField
              label="Pickup City / Location"
              value={form.pickupCity}
              onChange={(value) => updateForm('pickupCity', value)}
              placeholder="Harare"
            />
            <InputField
              label="Destination City / Location"
              value={form.destinationCity}
              onChange={(value) => updateForm('destinationCity', value)}
              placeholder="Masvingo"
            />
            <InputField
              label="Fare / Base Price USD"
              value={form.basePrice}
              onChange={(value) => updateForm('basePrice', value)}
              placeholder="35"
              type="number"
            />
            <SelectField
              label="Route Type"
              value={form.routeType}
              options={routeTypes}
              onChange={(value) => updateForm('routeType', value)}
            />
            <SelectField
              label="Price Unit"
              value={form.priceUnit}
              options={priceUnits}
              onChange={(value) => updateForm('priceUnit', value)}
            />
            <SelectField
              label="Pricing Mode"
              value={form.pricingMode}
              options={pricingModes}
              onChange={(value) => updateForm('pricingMode', value)}
            />
            <InputField
              label="Distance KM"
              value={form.distanceKm}
              onChange={(value) => updateForm('distanceKm', value)}
              placeholder="297"
              type="number"
            />
            <InputField
              label="Duration Minutes"
              value={form.estimatedDurationMinutes}
              onChange={(value) =>
                updateForm('estimatedDurationMinutes', value)
              }
              placeholder="240"
              type="number"
            />
            <SelectField
              label="Road Condition"
              value={form.roadCondition}
              options={roadConditions}
              onChange={(value) => updateForm('roadCondition', value)}
            />
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateForm('isActive', event.target.checked)}
                className="h-4 w-4 accent-[#C8A96A]"
              />
              Active route
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#C8A96A] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#d9bd7a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingRouteId ? 'Save Changes' : 'Save Route & Fare'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-neutral-300 transition hover:border-white/20 hover:text-white"
            >
              {editingRouteId ? 'Cancel Edit' : 'Clear'}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          Loading routes...
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Route Records
              </p>
              <h2 className="mt-2 text-lg font-semibold">Saved Route Fares</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Pricing, journey context and booking usage for each saved route.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed border-collapse text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                <tr>
                  <th className="w-[24%] px-4 py-4 font-medium">Route</th>
                  <th className="w-[17%] px-3 py-4 font-medium">Fare</th>
                  <th className="w-[19%] px-3 py-4 font-medium">
                    Journey Context
                  </th>
                  <th className="w-[21%] px-3 py-4 font-medium">
                    Booking Usage
                  </th>
                  <th className="w-[9%] px-3 py-4 font-medium">Status</th>
                  <th className="w-[10%] px-3 py-4 text-center font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {routes.map((route) => {
                  const recentBooking = latestBooking(route);
                  const bookingsCount = route.bookings?.length ?? 0;
                  const activeCount = activeBookingCount(route);

                  return (
                    <tr
                      key={route.id}
                      className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <p className="font-semibold text-white">{route.name}</p>
                          <p className="text-[11px] leading-5 text-neutral-400">
                            {route.pickupCity} → {route.destinationCity}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <RouteTypeBadge status={route.routeType} />
                            <PricingModeBadge status={route.pricingMode} />
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <p className="text-lg font-semibold text-[#C8A96A]">
                          {'$' + money(route.basePrice)}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Unit: {nice(route.priceUnit)}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Revenue linked: {'$' + money(routeRevenue(route))}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="font-medium text-white">
                            {route.distanceKm
                              ? `${route.distanceKm} km`
                              : 'Distance not set'}
                          </p>
                          <p className="mt-1 text-[11px] text-neutral-500">
                            {route.estimatedDurationMinutes
                              ? `${route.estimatedDurationMinutes} min`
                              : 'Duration not set'}
                          </p>
                          <p className="mt-1 text-[11px] text-neutral-500">
                            Road: {nice(route.roadCondition)}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-neutral-300">
                              {bookingsCount} bookings
                            </span>
                            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-300">
                              {activeCount} active
                            </span>
                          </div>

                          {recentBooking ? (
                            <>
                              <p className="mt-2 font-medium text-white">
                                {recentBooking.bookingRef}
                              </p>
                              <p className="mt-1 text-[11px] text-neutral-500">
                                {recentBooking.customer?.fullName ??
                                  'Customer not available'}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <BookingStatusBadge status={recentBooking.status} />
                                <PaymentStatusBadge
                                  status={recentBooking.paymentStatus}
                                />
                              </div>
                            </>
                          ) : (
                            <p className="mt-2 text-[11px] leading-5 text-neutral-500">
                              No bookings linked yet.
                            </p>
                          )}

                          <button
                            type="button"
                            disabled={actionLoadingId === route.id}
                            onClick={() => archiveRoute(route)}
                            className="w-[104px] rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Archive
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <RouteStatusBadge isActive={route.isActive} />
                      </td>

                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(route)}
                            className="w-[104px] rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-[#C8A96A]"
                          >
                            Edit
                          </button>

                          {route.isActive ? (
                            <button
                              disabled={actionLoadingId === route.id}
                              onClick={() => updateRouteStatus(route, false)}
                              className="w-[104px] rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              disabled={actionLoadingId === route.id}
                              onClick={() => updateRouteStatus(route, true)}
                              className="w-[104px] rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-3 py-1.5 text-[11px] font-medium text-[#C8A96A] transition hover:bg-[#C8A96A]/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {routes.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">
              No routes found.
            </div>
          )}
        </div>
      )}
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#C8A96A]/30">
      <p className="text-sm text-neutral-400">{title}</p>
      <p
        className={
          'mt-3 text-3xl font-semibold ' +
          (accent ? 'text-[#C8A96A]' : 'text-white')
        }
      >
        {value}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-[#C8A96A]/50"
      />
    </label>
  );
}

function SelectField({
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
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#C8A96A]/50"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-black">
            {nice(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function RouteStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (isActive
          ? 'border-green-500/30 bg-green-500/10 text-green-300'
          : 'border-red-500/30 bg-red-500/10 text-red-300')
      }
    >
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
}

function RouteTypeBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CITY_TO_CITY: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    AIRPORT_TRANSFER: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    LOCAL_TRANSFER: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    CUSTOM: 'border-white/10 bg-white/5 text-neutral-300',
  };

  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300')
      }
    >
      {nice(status)}
    </span>
  );
}

function PricingModeBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-neutral-300">
      {nice(status)}
    </span>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    CONFIRMED: 'border-green-500/30 bg-green-500/10 text-green-300',
    DRIVER_ASSIGNED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    VEHICLE_ASSIGNED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    IN_PROGRESS: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    COMPLETED: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    CANCELLED: 'border-red-500/30 bg-red-500/10 text-red-300',
    NO_SHOW: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300')
      }
    >
      {nice(status)}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UNPAID: 'border-neutral-500/30 bg-neutral-500/10 text-neutral-300',
    PARTIALLY_PAID: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    PAID: 'border-green-500/30 bg-green-500/10 text-green-300',
    FAILED: 'border-red-500/30 bg-red-500/10 text-red-300',
    REFUNDED: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  };

  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300')
      }
    >
      {nice(status)}
    </span>
  );
}
