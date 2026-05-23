'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

type Customer = {
  id: string;
  fullName: string;
  phone: string;
};

type RouteRecord = {
  id: string;
  name: string;
  pickupCity: string;
  destinationCity: string;
  basePrice: string | number;
  pricingMode: string;
  priceUnit: string;
  roadCondition: string;
  isActive: boolean;
};

type Driver = {
  id: string;
  fullName: string;
  status: string;
};

type Vehicle = {
  id: string;
  name: string;
  registrationNo: string;
  vehicleType: string;
  status: string;
};

type Zone = {
  id: string;
  name: string;
  zoneType: string;
  adjustmentType: string;
  adjustmentValue: string | number;
  isActive: boolean;
};

type Booking = {
  id: string;
  bookingRef: string;
  tripType: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  passengers: number;
  finalPrice: string | number | null;
  status: string;
  paymentStatus: string;
  customer?: {
    fullName: string;
    phone: string;
  };
  route?: {
    name: string;
  };
  driver?: {
    fullName: string;
    status: string;
  } | null;
  vehicle?: {
    name: string;
    registrationNo: string;
    status: string;
  } | null;
};

type PricingBreakdownItem = {
  label: string;
  type: string;
  amount: number;
  percentage?: number;
};

type PriceCalculation = {
  estimatedPrice: number;
  breakdown: PricingBreakdownItem[];
};

type BookingForm = {
  customerId: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
  tripType: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  passengers: string;
  luggageDetails: string;
  specialNotes: string;
  roadCondition: string;
  zoneType: string;
  distanceKm: string;
  estimatedPrice: string;
  finalPrice: string;
  depositAmount: string;
};

const initialForm: BookingForm = {
  customerId: '',
  routeId: '',
  driverId: '',
  vehicleId: '',
  tripType: 'CITY_TO_CITY',
  pickupLocation: '',
  destination: '',
  pickupDate: '',
  passengers: '1',
  luggageDetails: '',
  specialNotes: '',
  roadCondition: '',
  zoneType: '',
  distanceKm: '',
  estimatedPrice: '',
  finalPrice: '',
  depositAmount: '',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  const [form, setForm] = useState<BookingForm>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function fetchPageData() {
    try {
      setErrorMessage('');

      const [
        bookingsData,
        customersData,
        routesData,
        driversData,
        vehiclesData,
        zonesData,
      ] = await Promise.all([
        apiGet<Booking[] | Booking>('/bookings'),
        apiGet<Customer[] | Customer>('/customers'),
        apiGet<RouteRecord[] | RouteRecord>('/routes'),
        apiGet<Driver[] | Driver>('/drivers'),
        apiGet<Vehicle[] | Vehicle>('/vehicles'),
        apiGet<Zone[] | Zone>('/zones'),
      ]);

      setBookings(Array.isArray(bookingsData) ? bookingsData : [bookingsData]);
      setCustomers(
        Array.isArray(customersData) ? customersData : [customersData],
      );
      setRoutes(Array.isArray(routesData) ? routesData : [routesData]);
      setDrivers(Array.isArray(driversData) ? driversData : [driversData]);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [vehiclesData]);
      setZones(Array.isArray(zonesData) ? zonesData : [zonesData]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading booking data',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPageData();
  }, []);

  const bookingStats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === 'PENDING')
        .length,
      completed: bookings.filter((booking) => booking.status === 'COMPLETED')
        .length,
      paid: bookings.filter((booking) => booking.paymentStatus === 'PAID')
        .length,
    };
  }, [bookings]);

  function updateForm(field: keyof BookingForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (
      field === 'routeId' ||
      field === 'vehicleId' ||
      field === 'zoneType' ||
      field === 'roadCondition' ||
      field === 'distanceKm' ||
      field === 'passengers'
    ) {
      setCalculation(null);
    }
  }

  function applyRouteDefaults(routeId: string) {
    const selectedRoute = routes.find((route) => route.id === routeId);

    if (!selectedRoute) {
      updateForm('routeId', routeId);
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      routeId,
      pickupLocation: selectedRoute.pickupCity,
      destination: selectedRoute.destinationCity,
      tripType:
        selectedRoute.pricingMode === 'FIXED_ROUTE'
          ? 'CITY_TO_CITY'
          : currentForm.tripType,
      roadCondition: selectedRoute.roadCondition || currentForm.roadCondition,
    }));

    setCalculation(null);
  }

  async function calculatePrice() {
    setErrorMessage('');
    setSuccessMessage('');

    if (!form.routeId && !form.distanceKm) {
      setErrorMessage(
        'Select a fixed route or enter distance for custom pricing.',
      );
      return;
    }

    if (!form.passengers || Number(form.passengers) < 1) {
      setErrorMessage('Passengers must be at least 1.');
      return;
    }

    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.id === form.vehicleId,
    );

    try {
      setCalculating(true);

      const result = await apiPost<PriceCalculation>(
        '/pricing-calculator/calculate',
        {
          companyId: COMPANY_ID,
          routeId: form.routeId || undefined,
          pricingMode: form.routeId ? undefined : 'DISTANCE_BASED',
          distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
          vehicleType: selectedVehicle?.vehicleType,
          roadCondition: form.roadCondition || undefined,
          zoneType: form.zoneType || undefined,
          passengers: Number(form.passengers),
        },
      );

      setCalculation(result);

      setForm((currentForm) => ({
        ...currentForm,
        estimatedPrice: String(result.estimatedPrice),
        finalPrice: String(result.estimatedPrice),
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while calculating price',
      );
    } finally {
      setCalculating(false);
    }
  }

  async function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!form.customerId) {
      setErrorMessage('Select a customer.');
      return;
    }

    if (!form.pickupLocation.trim()) {
      setErrorMessage('Pickup location is required.');
      return;
    }

    if (!form.destination.trim()) {
      setErrorMessage('Destination is required.');
      return;
    }

    if (!form.pickupDate) {
      setErrorMessage('Pickup date and time are required.');
      return;
    }

    if (!form.finalPrice) {
      setErrorMessage('Calculate or enter final price before saving.');
      return;
    }

    try {
      setSaving(true);

      await apiPost<Booking>('/bookings', {
        companyId: COMPANY_ID,
        customerId: form.customerId,
        routeId: form.routeId || undefined,
        driverId: form.driverId || undefined,
        vehicleId: form.vehicleId || undefined,
        tripType: form.tripType,
        pickupLocation: form.pickupLocation.trim(),
        destination: form.destination.trim(),
        pickupDate: new Date(form.pickupDate).toISOString(),
        passengers: Number(form.passengers),
        luggageDetails: form.luggageDetails.trim() || undefined,
        specialNotes: form.specialNotes.trim() || undefined,
        estimatedPrice: Number(form.estimatedPrice || form.finalPrice),
        finalPrice: Number(form.finalPrice),
        depositAmount: Number(form.depositAmount || 0),
      });

      setSuccessMessage('Booking created successfully.');
      setForm(initialForm);
      setCalculation(null);
      setShowForm(false);
      await fetchPageData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating booking',
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      setActionLoadingId(bookingId);

      await apiPatch(`/bookings/${bookingId}/status`, {
        status,
      });

      await fetchPageData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating booking',
      );
    } finally {
      setActionLoadingId('');
    }
  }

  const availableDrivers = drivers.filter(
    (driver) => driver.status === 'AVAILABLE',
  );

  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === 'AVAILABLE',
  );

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Bookings
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Bookings Management
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Create premium bookings with automatic fare calculation, fixed
            routes, custom distance pricing, zone surcharges and vehicle
            adjustments.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm((current) => !current);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C8A96A]"
        >
          {showForm ? 'Close Form' : 'New Booking'}
        </button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Bookings" value={bookingStats.total} />
        <SummaryCard title="Pending" value={bookingStats.pending} />
        <SummaryCard title="Completed" value={bookingStats.completed} />
        <SummaryCard title="Paid" value={bookingStats.paid} accent />
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
          onSubmit={createBooking}
          className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#050505]"
        >
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C8A96A]">
              Premium Booking Workflow
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Create Booking
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
              Select customer, route, vehicle and trip conditions. The system
              calculates the estimated fare before the booking is saved.
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Customer" required>
                <select
                  value={form.customerId}
                  onChange={(event) =>
                    updateForm('customerId', event.target.value)
                  }
                  className="input-field"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} - {customer.phone}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fixed Route">
                <select
                  value={form.routeId}
                  onChange={(event) => applyRouteDefaults(event.target.value)}
                  className="input-field"
                >
                  <option value="">Custom route / no fixed route</option>
                  {routes
                    .filter((route) => route.isActive)
                    .map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} - ${String(route.basePrice)}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Vehicle">
                <select
                  value={form.vehicleId}
                  onChange={(event) =>
                    updateForm('vehicleId', event.target.value)
                  }
                  className="input-field"
                >
                  <option value="">Select vehicle</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} - {vehicle.vehicleType}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Driver">
                <select
                  value={form.driverId}
                  onChange={(event) =>
                    updateForm('driverId', event.target.value)
                  }
                  className="input-field"
                >
                  <option value="">Select driver</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.fullName}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Trip Type" required>
                <select
                  value={form.tripType}
                  onChange={(event) =>
                    updateForm('tripType', event.target.value)
                  }
                  className="input-field"
                >
                  <option value="CITY_TO_CITY">City to City</option>
                  <option value="AIRPORT_TRANSFER">Airport Transfer</option>
                  <option value="PRIVATE_HIRE">Private Hire</option>
                  <option value="CORPORATE_TRANSPORT">
                    Corporate Transport
                  </option>
                  <option value="EVENT_TRANSPORT">Event Transport</option>
                  <option value="TOURISM">Tourism</option>
                  <option value="CAR_RENTAL">Car Rental</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </FormField>

              <FormField label="Pickup Location" required>
                <input
                  value={form.pickupLocation}
                  onChange={(event) =>
                    updateForm('pickupLocation', event.target.value)
                  }
                  placeholder="Harare CBD"
                  className="input-field"
                />
              </FormField>

              <FormField label="Destination" required>
                <input
                  value={form.destination}
                  onChange={(event) =>
                    updateForm('destination', event.target.value)
                  }
                  placeholder="Masvingo CBD"
                  className="input-field"
                />
              </FormField>

              <FormField label="Pickup Date and Time" required>
                <input
                  value={form.pickupDate}
                  onChange={(event) =>
                    updateForm('pickupDate', event.target.value)
                  }
                  type="datetime-local"
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <FormField label="Passengers" required>
                <input
                  value={form.passengers}
                  onChange={(event) =>
                    updateForm('passengers', event.target.value)
                  }
                  type="number"
                  min="1"
                  className="input-field"
                />
              </FormField>

              <FormField label="Distance KM">
                <input
                  value={form.distanceKm}
                  onChange={(event) =>
                    updateForm('distanceKm', event.target.value)
                  }
                  type="number"
                  min="0"
                  placeholder="For custom route"
                  className="input-field"
                />
              </FormField>

              <FormField label="Road Condition">
                <select
                  value={form.roadCondition}
                  onChange={(event) =>
                    updateForm('roadCondition', event.target.value)
                  }
                  className="input-field"
                >
                  <option value="">Use route/default</option>
                  <option value="GOOD">Good</option>
                  <option value="AVERAGE">Average</option>
                  <option value="BAD">Bad</option>
                  <option value="RURAL">Rural</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </FormField>

              <FormField label="Zone">
                <select
                  value={form.zoneType}
                  onChange={(event) =>
                    updateForm('zoneType', event.target.value)
                  }
                  className="input-field"
                >
                  <option value="">No zone surcharge</option>
                  {zones
                    .filter((zone) => zone.isActive)
                    .map((zone) => (
                      <option key={zone.id} value={zone.zoneType}>
                        {zone.name}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Deposit Amount">
                <input
                  value={form.depositAmount}
                  onChange={(event) =>
                    updateForm('depositAmount', event.target.value)
                  }
                  type="number"
                  min="0"
                  placeholder="0"
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Luggage Details">
                <input
                  value={form.luggageDetails}
                  onChange={(event) =>
                    updateForm('luggageDetails', event.target.value)
                  }
                  placeholder="Two medium bags"
                  className="input-field"
                />
              </FormField>

              <FormField label="Special Notes">
                <input
                  value={form.specialNotes}
                  onChange={(event) =>
                    updateForm('specialNotes', event.target.value)
                  }
                  placeholder="Customer prefers front seat if available"
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Pricing Engine
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    Estimated Fare
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Calculate using fixed routes, distance bands, zones, vehicle
                    type and road condition.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={calculatePrice}
                  disabled={calculating}
                  className="rounded-full bg-[#C8A96A] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {calculating ? 'Calculating...' : 'Calculate Price'}
                </button>
              </div>

              {calculation && (
                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="space-y-2">
                    {calculation.breakdown.map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs"
                      >
                        <span className="text-neutral-300">{item.label}</span>
                        <span className="font-semibold text-[#C8A96A]">
                          ${item.amount}
                          {item.percentage ? ` (${item.percentage}%)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#C8A96A]">
                      Estimated Total
                    </p>
                    <p className="mt-3 text-4xl font-semibold text-white">
                      ${calculation.estimatedPrice}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Estimated Price">
                <input
                  value={form.estimatedPrice}
                  onChange={(event) =>
                    updateForm('estimatedPrice', event.target.value)
                  }
                  type="number"
                  min="0"
                  className="input-field"
                />
              </FormField>

              <FormField label="Final Price" required>
                <input
                  value={form.finalPrice}
                  onChange={(event) =>
                    updateForm('finalPrice', event.target.value)
                  }
                  type="number"
                  min="0"
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#C8A96A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving Booking...' : 'Save Booking'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setCalculation(null);
                  setShowForm(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
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
          Loading bookings...
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">All Bookings</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Live records from the booking system database.
              </p>
            </div>

            <button
              onClick={fetchPageData}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                <tr>
                  <th className="w-[11%] px-3 py-4 font-medium">Booking</th>
                  <th className="w-[12%] px-3 py-4 font-medium">Customer</th>
                  <th className="w-[13%] px-3 py-4 font-medium">Route</th>
                  <th className="w-[11%] px-3 py-4 font-medium">Pickup</th>
                  <th className="w-[10%] px-3 py-4 font-medium">Driver</th>
                  <th className="w-[12%] px-3 py-4 font-medium">Vehicle</th>
                  <th className="w-[7%] px-3 py-4 font-medium">Pax</th>
                  <th className="w-[10%] px-3 py-4 font-medium">Status</th>
                  <th className="w-[9%] px-3 py-4 font-medium">Payment</th>
                  <th className="w-[7%] px-3 py-4 font-medium">Amount</th>
                  <th className="w-[13%] px-3 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => {
                  const isFinalStatus =
                    booking.status === 'COMPLETED' ||
                    booking.status === 'CANCELLED';

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-4">
                        <p className="break-words font-semibold text-white">
                          {booking.bookingRef}
                        </p>
                        <p className="mt-1 text-neutral-500">
                          {booking.tripType.replaceAll('_', ' ')}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">
                          {booking.customer?.fullName ?? 'Unknown'}
                        </p>
                        <p className="mt-1 text-neutral-500">
                          {booking.customer?.phone ?? 'No phone'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">
                          {booking.route?.name ?? 'Custom route'}
                        </p>
                        <p className="mt-1 text-neutral-500">
                          {booking.pickupLocation} → {booking.destination}
                        </p>
                      </td>

                      <td className="px-3 py-4 text-neutral-300">
                        {new Date(booking.pickupDate).toLocaleString()}
                      </td>

                      <td className="px-3 py-4 font-semibold text-white">
                        {booking.driver?.fullName ?? 'Not assigned'}
                      </td>

                      <td className="px-3 py-4">
                        {booking.vehicle ? (
                          <>
                            <p className="font-semibold text-white">
                              {booking.vehicle.name}
                            </p>
                            <p className="mt-1 text-neutral-500">
                              {booking.vehicle.registrationNo}
                            </p>
                          </>
                        ) : (
                          <span className="text-neutral-400">
                            Not assigned
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-4 font-semibold text-white">
                        {booking.passengers}
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge status={booking.status} />
                      </td>

                      <td className="px-3 py-4">
                        <PaymentBadge status={booking.paymentStatus} />
                      </td>

                      <td className="px-3 py-4 font-semibold text-[#C8A96A]">
                        ${booking.finalPrice ?? 0}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            disabled={
                              actionLoadingId === booking.id || isFinalStatus
                            }
                            onClick={() =>
                              updateBookingStatus(booking.id, 'COMPLETED')
                            }
                            className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {actionLoadingId === booking.id
                              ? 'Working'
                              : 'Complete'}
                          </button>

                          <button
                            disabled={
                              actionLoadingId === booking.id || isFinalStatus
                            }
                            onClick={() =>
                              updateBookingStatus(booking.id, 'CANCELLED')
                            }
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {bookings.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">
              No bookings found.
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

        .input-field option {
          background: #050505;
          color: white;
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    CONFIRMED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    DRIVER_ASSIGNED: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    VEHICLE_ASSIGNED: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    IN_PROGRESS: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    COMPLETED: 'border-green-500/30 bg-green-500/10 text-green-300',
    CANCELLED: 'border-red-500/30 bg-red-500/10 text-red-300',
    NO_SHOW: 'border-red-500/30 bg-red-500/10 text-red-300',
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

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: 'border-green-500/30 bg-green-500/10 text-green-300',
    PARTIALLY_PAID: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    UNPAID: 'border-red-500/30 bg-red-500/10 text-red-300',
    FAILED: 'border-red-500/30 bg-red-500/10 text-red-300',
    REFUNDED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
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