'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

type VehicleBooking = {
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
  driver?: {
    fullName: string;
    phone?: string | null;
  } | null;
  route?: {
    name?: string | null;
  } | null;
};

type Vehicle = {
  id: string;
  companyId: string;
  name: string;
  registrationNo: string;
  vehicleType: string;
  passengerCapacity: number;
  luggageCapacity?: string | null;
  status: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  bookings?: VehicleBooking[];
  company?: {
    id: string;
    name: string;
  };
};

type VehicleForm = {
  name: string;
  registrationNo: string;
  vehicleType: string;
  passengerCapacity: string;
  luggageCapacity: string;
  imageUrl: string;
};

const initialForm: VehicleForm = {
  name: '',
  registrationNo: '',
  vehicleType: '',
  passengerCapacity: '',
  luggageCapacity: '',
  imageUrl: '',
};

const vehicleTypeSuggestions = [
  'Shuttle Van',
  'Executive Shuttle',
  'SUV',
  'Sedan',
  'Minibus',
  'Luxury Vehicle',
  'Airport Transfer Vehicle',
  'Corporate Vehicle',
];

function getVehicleOperationalBooking(vehicle: Vehicle) {
  const bookings = [...(vehicle.bookings ?? [])];

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

function getVehicleOperationalLabel(vehicle: Vehicle) {
  const booking = getVehicleOperationalBooking(vehicle);

  if (!booking) {
    return 'No assigned active or upcoming booking';
  }

  if (booking.status === 'IN_PROGRESS') {
    return 'Vehicle is currently on trip';
  }

  if (booking.status === 'CONFIRMED') {
    return 'Vehicle is reserved for a confirmed booking';
  }

  return 'Vehicle is assigned to a pending booking';
}

function getVehicleDisplayStatus(vehicle: Vehicle) {
  const booking = getVehicleOperationalBooking(vehicle);

  if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'INACTIVE') {
    return vehicle.status;
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

  return vehicle.status;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function fetchVehicles() {
    try {
      setErrorMessage('');
      const data = await apiGet<Vehicle[] | Vehicle>('/vehicles');
      setVehicles(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading vehicles',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVehicles();
  }, []);

  const vehicleStats = useMemo(() => {
    return {
      total: vehicles.length,
      available: vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE')
        .length,
      booked: vehicles.filter((vehicle) => vehicle.status === 'BOOKED').length,
      assigned: vehicles.filter((vehicle) =>
        Boolean(getVehicleOperationalBooking(vehicle)),
      ).length,
      maintenance: vehicles.filter(
        (vehicle) => vehicle.status === 'MAINTENANCE',
      ).length,
      inactive: vehicles.filter((vehicle) => vehicle.status === 'INACTIVE')
        .length,
    };
  }, [vehicles]);

  function updateForm(field: keyof VehicleForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setShowForm(false);
    setEditingVehicleId('');
    setErrorMessage('');
    setSuccessMessage('');
  }

  function startEdit(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id);
    setShowForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    setForm({
      name: vehicle.name,
      registrationNo: vehicle.registrationNo,
      vehicleType: vehicle.vehicleType,
      passengerCapacity: String(vehicle.passengerCapacity),
      luggageCapacity: vehicle.luggageCapacity ?? '',
      imageUrl: vehicle.imageUrl ?? '',
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

    const passengerCapacity = Number(form.passengerCapacity);

    if (!form.name.trim()) {
      setErrorMessage('Vehicle name is required.');
      return;
    }

    if (!form.registrationNo.trim()) {
      setErrorMessage('Registration number is required.');
      return;
    }

    if (!form.vehicleType.trim()) {
      setErrorMessage('Vehicle type is required.');
      return;
    }

    if (!Number.isInteger(passengerCapacity) || passengerCapacity < 1) {
      setErrorMessage('Passenger capacity must be a valid number above 0.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        registrationNo: form.registrationNo.trim().toUpperCase(),
        vehicleType: form.vehicleType.trim(),
        passengerCapacity,
        luggageCapacity: form.luggageCapacity.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
      };

      if (editingVehicleId) {
        await apiPatch<Vehicle>(`/vehicles/${editingVehicleId}`, payload);
        setSuccessMessage('Vehicle updated successfully.');
      } else {
        await apiPost<Vehicle>('/vehicles', {
          companyId: COMPANY_ID,
          ...payload,
        });
        setSuccessMessage('Vehicle added successfully.');
      }

      setForm(initialForm);
      setShowForm(false);
      setEditingVehicleId('');
      await fetchVehicles();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the vehicle',
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateVehicleStatus(vehicleId: string, status: string) {
    try {
      setActionLoadingId(vehicleId);
      setErrorMessage('');
      setSuccessMessage('');

      await apiPatch<Vehicle>(`/vehicles/${vehicleId}`, {
        status,
      });

      setSuccessMessage(`Vehicle status updated to ${status}.`);
      await fetchVehicles();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating vehicle status',
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
            Fleet Control
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Vehicle Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Add, edit and manage vehicles for shuttle services, car rental,
            airport transfers, executive travel and corporate transport.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setEditingVehicleId('');
              setForm(initialForm);
              setErrorMessage('');
              setSuccessMessage('');
            }
          }}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C8A96A]"
        >
          {showForm ? 'Close Form' : 'Add Vehicle'}
        </button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Total Vehicles" value={vehicleStats.total} />
        <SummaryCard title="Available" value={vehicleStats.available} accent />
        <SummaryCard title="Booked" value={vehicleStats.booked} />
        <SummaryCard title="Assigned Trips" value={vehicleStats.assigned} />
        <SummaryCard title="Maintenance" value={vehicleStats.maintenance} />
        <SummaryCard title="Inactive" value={vehicleStats.inactive} />
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
              {editingVehicleId ? 'Edit Fleet Asset' : 'New Fleet Asset'}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
              Register or update vehicles used by the business. Vehicles can be
              shuttle vans, SUVs, sedans, minibuses, luxury cars or airport
              transfer vehicles.
            </p>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Vehicle Name" required>
                <input
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="Toyota Hiace Quantum"
                  className="input-field"
                />
              </FormField>

              <FormField label="Registration Number" required>
                <input
                  value={form.registrationNo}
                  onChange={(event) =>
                    updateForm('registrationNo', event.target.value)
                  }
                  placeholder="ACB 1234"
                  className="input-field uppercase"
                />
              </FormField>

              <FormField label="Vehicle Type" required>
                <input
                  value={form.vehicleType}
                  onChange={(event) =>
                    updateForm('vehicleType', event.target.value)
                  }
                  placeholder="Shuttle Van, SUV, Sedan"
                  className="input-field"
                />
              </FormField>

              <FormField label="Passenger Capacity" required>
                <input
                  value={form.passengerCapacity}
                  onChange={(event) =>
                    updateForm('passengerCapacity', event.target.value)
                  }
                  placeholder="14"
                  type="number"
                  min="1"
                  className="input-field"
                />
              </FormField>

              <FormField label="Luggage Capacity">
                <input
                  value={form.luggageCapacity}
                  onChange={(event) =>
                    updateForm('luggageCapacity', event.target.value)
                  }
                  placeholder="Medium luggage capacity"
                  className="input-field"
                />
              </FormField>

              <FormField label="Image URL">
                <input
                  value={form.imageUrl}
                  onChange={(event) =>
                    updateForm('imageUrl', event.target.value)
                  }
                  placeholder="https://..."
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                Common vehicle types
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {vehicleTypeSuggestions.map((vehicleType) => (
                  <button
                    key={vehicleType}
                    type="button"
                    onClick={() => updateForm('vehicleType', vehicleType)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-[#C8A96A]"
                  >
                    {vehicleType}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#C8A96A] px-6 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? editingVehicleId
                    ? 'Updating Vehicle...'
                    : 'Saving Vehicle...'
                  : editingVehicleId
                    ? 'Update Vehicle'
                    : 'Save Vehicle'}
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
          Loading vehicles...
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Fleet Records
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Registered Vehicles
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Live vehicle data from the operations database.
              </p>
            </div>

            <button
              onClick={fetchVehicles}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                <tr>
                  <th className="w-[18%] px-4 py-4 font-medium">Vehicle</th>
                  <th className="w-[12%] px-3 py-4 font-medium">Capacity</th>
                  <th className="w-[42%] px-3 py-4 font-medium">
                    Assignment & Trip Context
                  </th>
                  <th className="w-[13%] px-3 py-4 font-medium">Company</th>
                  <th className="w-[15%] px-3 py-4 text-center font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {vehicles.map((vehicle) => {
                  const operationalBooking = getVehicleOperationalBooking(vehicle);

                  return (
                    <tr
                      key={vehicle.id}
                      className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{vehicle.name}</p>
                          <p className="text-[11px] font-medium text-[#C8A96A]">
                            {vehicle.registrationNo}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {vehicle.vehicleType} · ID: {vehicle.id.slice(0, 8)}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">
                          {vehicle.passengerCapacity} seats
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                          {vehicle.luggageCapacity || 'Luggage not specified'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        {operationalBooking ? (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <VehicleStatusBadge status={getVehicleDisplayStatus(vehicle)} />
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
                                Driver:{' '}
                                <span className="text-neutral-300">
                                  {operationalBooking.driver?.fullName ?? 'Not assigned'}
                                </span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <VehicleStatusBadge status={getVehicleDisplayStatus(vehicle)} />
                              <span className="text-[11px] font-semibold text-neutral-300">
                                No active or upcoming assignment
                              </span>
                            </div>

                            <p className="mt-2 text-[11px] leading-5 text-neutral-500">
                              {getVehicleOperationalLabel(vehicle)}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 text-neutral-300">
                        {vehicle.company?.name ?? 'Unknown company'}
                      </td>

                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => startEdit(vehicle)}
                            className="w-[104px] rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-[#C8A96A]/40 hover:text-[#C8A96A]"
                          >
                            Edit
                          </button>

                          {vehicle.status !== 'MAINTENANCE' && (
                            <button
                              disabled={actionLoadingId === vehicle.id}
                              onClick={() =>
                                updateVehicleStatus(vehicle.id, 'MAINTENANCE')
                              }
                              className="w-[104px] rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-[11px] font-medium text-yellow-300 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Maintenance
                            </button>
                          )}

                          {vehicle.status !== 'INACTIVE' && (
                            <button
                              disabled={actionLoadingId === vehicle.id}
                              onClick={() =>
                                updateVehicleStatus(vehicle.id, 'INACTIVE')
                              }
                              className="w-[104px] rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Deactivate
                            </button>
                          )}

                          {vehicle.status !== 'AVAILABLE' && (
                            <button
                              disabled={actionLoadingId === vehicle.id}
                              onClick={() =>
                                updateVehicleStatus(vehicle.id, 'AVAILABLE')
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

          {vehicles.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">
              No vehicles found.
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

function VehicleStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    ASSIGNED: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    RESERVED: 'border-green-500/30 bg-green-500/10 text-green-300',
    ON_TRIP: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    BOOKED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    IN_SERVICE: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    MAINTENANCE: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
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