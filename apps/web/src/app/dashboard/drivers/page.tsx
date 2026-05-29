'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

type DriverBooking = {
  id: string;
  bookingRef: string;
  status: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  passengers: number;
  customer?: {
    fullName: string;
    phone?: string | null;
  } | null;
  vehicle?: {
    name: string;
    registrationNo: string;
  } | null;
  route?: {
    name?: string | null;
  } | null;
};

type Driver = {
  id: string;
  companyId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  licenseNumber?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  bookings?: DriverBooking[];
  company?: {
    id: string;
    name: string;
  };
};

type DriverForm = {
  fullName: string;
  phone: string;
  email: string;
  licenseNumber: string;
};

const initialForm: DriverForm = {
  fullName: '',
  phone: '',
  email: '',
  licenseNumber: '',
};

function getDriverOperationalBooking(driver: Driver) {
  const bookings = [...(driver.bookings ?? [])];

  return (
    bookings.find((booking) => booking.status === 'IN_PROGRESS') ??
    bookings.find((booking) => booking.status === 'CONFIRMED') ??
    bookings.find((booking) => booking.status === 'PENDING') ??
    bookings[0] ??
    null
  );
}

function formatBookingDate(value?: string | null) {
  if (!value) {
    return 'Date not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date not set';
  }

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDriverOperationalLabel(driver: Driver) {
  const booking = getDriverOperationalBooking(driver);

  if (!booking) {
    return 'No assigned active or upcoming booking';
  }

  if (booking.status === 'IN_PROGRESS') {
    return 'Driver is currently on trip';
  }

  if (booking.status === 'CONFIRMED') {
    return 'Driver is reserved for a confirmed booking';
  }

  return 'Driver is assigned to a pending booking';
}

function getDriverDisplayStatus(driver: Driver) {
  const booking = getDriverOperationalBooking(driver);

  if (driver.status === 'OFF_DUTY' || driver.status === 'INACTIVE') {
    return driver.status;
  }

  if (booking?.status === 'IN_PROGRESS') {
    return 'ON_TRIP';
  }

  if (booking?.status === 'CONFIRMED') {
    return 'RESERVED';
  }

  if (booking?.status === 'PENDING') {
    return 'ASSIGNED';
  }

  return driver.status;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState<DriverForm>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function fetchDrivers() {
    try {
      setErrorMessage('');
      const data = await apiGet<Driver[] | Driver>('/drivers');
      setDrivers(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading drivers',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  const driverStats = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter((driver) => driver.status === 'AVAILABLE')
        .length,
      assigned: drivers.filter((driver) =>
        Boolean(getDriverOperationalBooking(driver)),
      ).length,
      onTrip: drivers.filter(
        (driver) => getDriverDisplayStatus(driver) === 'ON_TRIP',
      ).length,
      offDuty: drivers.filter((driver) => driver.status === 'OFF_DUTY').length,
      inactive: drivers.filter((driver) => driver.status === 'INACTIVE').length,
    };
  }, [drivers]);

  function updateForm(field: keyof DriverForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setShowForm(false);
    setEditingDriverId('');
    setErrorMessage('');
    setSuccessMessage('');
  }

  function startEdit(driver: Driver) {
    setEditingDriverId(driver.id);
    setShowForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    setForm({
      fullName: driver.fullName,
      phone: driver.phone,
      email: driver.email ?? '',
      licenseNumber: driver.licenseNumber ?? '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!form.fullName.trim()) {
      setErrorMessage('Driver full name is required.');
      return;
    }

    if (!form.phone.trim()) {
      setErrorMessage('Driver phone number is required.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
      };

      if (editingDriverId) {
        await apiPatch<Driver>(`/drivers/${editingDriverId}`, payload);
        setSuccessMessage('Driver updated successfully.');
      } else {
        await apiPost<Driver>('/drivers', {
          companyId: COMPANY_ID,
          ...payload,
        });
        setSuccessMessage('Driver added successfully.');
      }

      setForm(initialForm);
      setShowForm(false);
      setEditingDriverId('');
      await fetchDrivers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the driver',
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateDriverStatus(driverId: string, status: string) {
    try {
      setActionLoadingId(driverId);
      setErrorMessage('');
      setSuccessMessage('');

      await apiPatch<Driver>(`/drivers/${driverId}`, {
        status,
      });

      setSuccessMessage(`Driver status updated to ${status}.`);
      await fetchDrivers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating driver status',
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
            Driver Control
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Driver Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Add, edit and manage driver profiles, availability, contact details
            and ID/passport records for premium shuttle operations.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setEditingDriverId('');
              setForm(initialForm);
              setErrorMessage('');
              setSuccessMessage('');
            }
          }}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C8A96A]"
        >
          {showForm ? 'Close Form' : 'Add Driver'}
        </button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Total Drivers" value={driverStats.total} />
        <SummaryCard title="Available" value={driverStats.available} accent />
        <SummaryCard title="Assigned Trips" value={driverStats.assigned} />
        <SummaryCard title="On Trip" value={driverStats.onTrip} />
        <SummaryCard title="Off Duty" value={driverStats.offDuty} />
        <SummaryCard title="Inactive" value={driverStats.inactive} />
      </section>

      {successMessage && (
        <div className="mb-6 rounded-3xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 p-5 text-sm text-[#C8A96A]">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#050505]"
        >
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C8A96A]">
              {editingDriverId ? 'Edit Driver Profile' : 'New Driver Profile'}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editingDriverId ? 'Edit Driver' : 'Add Driver'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
              Register or update a driver for shuttle, private hire, airport
              transfer and corporate transport operations.
            </p>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Full Name" required>
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    updateForm('fullName', event.target.value)
                  }
                  placeholder="Blessing Dube"
                  className="input-field"
                />
              </FormField>

              <FormField label="Phone Number" required>
                <input
                  value={form.phone}
                  onChange={(event) => updateForm('phone', event.target.value)}
                  placeholder="+263773456789"
                  className="input-field"
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  value={form.email}
                  onChange={(event) => updateForm('email', event.target.value)}
                  placeholder="driver@ladybird.co.zw"
                  type="email"
                  className="input-field"
                />
              </FormField>

              <FormField label="ID/Passport No.">
                <input
                  value={form.licenseNumber}
                  onChange={(event) =>
                    updateForm('licenseNumber', event.target.value)
                  }
                  placeholder="ID / Passport number"
                  className="input-field uppercase"
                />
              </FormField>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#C8A96A] px-6 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? editingDriverId
                    ? 'Updating Driver...'
                    : 'Saving Driver...'
                  : editingDriverId
                    ? 'Update Driver'
                    : 'Save Driver'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-neutral-300 transition hover:border-white/30 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          Loading drivers...
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Driver Records
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Registered Drivers
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Live driver data from the operations database.
              </p>
            </div>

            <button
              onClick={fetchDrivers}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                <tr>
                  <th className="w-[20%] px-4 py-4 font-medium">Driver</th>
                  <th className="w-[16%] px-3 py-4 font-medium">Contact</th>
                  <th className="w-[38%] px-3 py-4 font-medium">
                    Assignment & Trip Context
                  </th>
                  <th className="w-[13%] px-3 py-4 font-medium">Company</th>
                  <th className="w-[13%] px-3 py-4 text-center font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {drivers.map((driver) => {
                  const operationalBooking = getDriverOperationalBooking(driver);

                  return (
                    <tr
                      key={driver.id}
                      className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-white">
                            {driver.fullName}
                          </p>
                          <p className="text-[11px] font-medium text-[#C8A96A]">
                            {driver.licenseNumber || 'ID/Passport not specified'}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            ID: {driver.id.slice(0, 8)}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">{driver.phone}</p>
                        <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                          {driver.email || 'Email not specified'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        {operationalBooking ? (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <DriverStatusBadge status={getDriverDisplayStatus(driver)} />
                              <BookingStatusPill status={operationalBooking.status} />
                              <span className="text-[11px] font-semibold text-white">
                                {operationalBooking.bookingRef}
                              </span>
                            </div>

                            <p className="mt-2 font-medium text-white">
                              {operationalBooking.customer?.fullName ?? 'Customer not set'}
                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-neutral-400">
                              {operationalBooking.pickupLocation} → {operationalBooking.destination}
                            </p>

                            <div className="mt-2 grid gap-2 text-[11px] text-neutral-500 sm:grid-cols-2">
                              <p>
                                Pickup:{' '}
                                <span className="text-neutral-300">
                                  {formatBookingDate(operationalBooking.pickupDate)}
                                </span>
                              </p>
                              <p>
                                Vehicle:{' '}
                                <span className="text-neutral-300">
                                  {operationalBooking.vehicle
                                    ? `${operationalBooking.vehicle.name} · ${operationalBooking.vehicle.registrationNo}`
                                    : 'Not assigned'}
                                </span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <DriverStatusBadge status={getDriverDisplayStatus(driver)} />
                              <span className="text-[11px] font-semibold text-neutral-300">
                                No active or upcoming assignment
                              </span>
                            </div>

                            <p className="mt-2 text-[11px] leading-5 text-neutral-500">
                              {getDriverOperationalLabel(driver)}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 text-neutral-300">
                        {driver.company?.name ?? 'Unknown company'}
                      </td>

                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => startEdit(driver)}
                            className="w-[104px] rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-[#C8A96A]/40 hover:text-[#C8A96A]"
                          >
                            Edit
                          </button>

                          {driver.status !== 'OFF_DUTY' && (
                            <button
                              disabled={actionLoadingId === driver.id}
                              onClick={() =>
                                updateDriverStatus(driver.id, 'OFF_DUTY')
                              }
                              className="w-[104px] rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-[11px] font-medium text-yellow-300 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Off Duty
                            </button>
                          )}

                          {driver.status !== 'INACTIVE' && (
                            <button
                              disabled={actionLoadingId === driver.id}
                              onClick={() =>
                                updateDriverStatus(driver.id, 'INACTIVE')
                              }
                              className="w-[104px] rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Deactivate
                            </button>
                          )}

                          {driver.status !== 'AVAILABLE' && (
                            <button
                              disabled={actionLoadingId === driver.id}
                              onClick={() =>
                                updateDriverStatus(driver.id, 'AVAILABLE')
                              }
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

          {drivers.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">
              No drivers found.
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.85rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .input-field::placeholder {
          color: rgba(163, 163, 163, 0.65);
        }

        .input-field:focus {
          border-color: rgba(200, 169, 106, 0.7);
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </section>
  );
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-300">
        {label}
        {required && <span className="ml-1 text-[#C8A96A]">*</span>}
      </span>
      {children}
    </label>
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
        className={`mt-3 text-3xl font-semibold ${
          accent ? 'text-[#C8A96A]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BookingStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    CONFIRMED: 'border-green-500/30 bg-green-500/10 text-green-300',
    IN_PROGRESS: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  };

  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300')
      }
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function DriverStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    ASSIGNED: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    RESERVED: 'border-green-500/30 bg-green-500/10 text-green-300',
    ON_TRIP: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    OFF_DUTY: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    INACTIVE: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300'
      }`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}