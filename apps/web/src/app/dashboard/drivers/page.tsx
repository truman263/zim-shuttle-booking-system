'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

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
      onTrip: drivers.filter((driver) => driver.status === 'ON_TRIP').length,
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
            and licence records for premium shuttle operations.
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

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total Drivers" value={driverStats.total} />
        <SummaryCard title="Available" value={driverStats.available} accent />
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

              <FormField label="Licence Number">
                <input
                  value={form.licenseNumber}
                  onChange={(event) =>
                    updateForm('licenseNumber', event.target.value)
                  }
                  placeholder="DL-789101"
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
            <table className="w-full min-w-[950px] table-fixed border-collapse text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                <tr>
                  <th className="w-[18%] px-3 py-4 font-medium">Driver</th>
                  <th className="w-[14%] px-3 py-4 font-medium">Phone</th>
                  <th className="w-[18%] px-3 py-4 font-medium">Email</th>
                  <th className="w-[14%] px-3 py-4 font-medium">Licence</th>
                  <th className="w-[12%] px-3 py-4 font-medium">Status</th>
                  <th className="w-[14%] px-3 py-4 font-medium">Company</th>
                  <th className="w-[18%] px-3 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {drivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-4">
                      <p className="font-semibold text-white">
                        {driver.fullName}
                      </p>
                      <p className="mt-1 text-neutral-500">
                        ID: {driver.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="px-3 py-4 font-semibold text-white">
                      {driver.phone}
                    </td>

                    <td className="px-3 py-4 text-neutral-300">
                      {driver.email || 'Not specified'}
                    </td>

                    <td className="px-3 py-4 text-neutral-300">
                      {driver.licenseNumber || 'Not specified'}
                    </td>

                    <td className="px-3 py-4">
                      <DriverStatusBadge status={driver.status} />
                    </td>

                    <td className="px-3 py-4 text-neutral-300">
                      {driver.company?.name ?? 'Unknown company'}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(driver)}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-[#C8A96A]/40 hover:text-[#C8A96A]"
                        >
                          Edit
                        </button>

                        {driver.status !== 'OFF_DUTY' && (
                          <button
                            disabled={actionLoadingId === driver.id}
                            onClick={() =>
                              updateDriverStatus(driver.id, 'OFF_DUTY')
                            }
                            className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-[11px] font-medium text-yellow-300 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-3 py-1.5 text-[11px] font-medium text-[#C8A96A] transition hover:bg-[#C8A96A]/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

function DriverStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    ON_TRIP: 'border-white/20 bg-white/10 text-white',
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