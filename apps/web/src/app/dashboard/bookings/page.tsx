'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

type CustomerMode = 'EXISTING' | 'QUICK' | 'WALK_IN';

type BookingMode =
  | 'SAVED_ROUTE'
  | 'CUSTOM_TRIP'
  | 'HOURLY_HIRE'
  | 'DAILY_HIRE'
  | 'CUSTOM_QUOTE';

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
};

type RouteRecord = {
  id: string;
  name: string;
  pickupCity: string;
  destinationCity: string;
  basePrice: string | number;
  pricingMode: string;
  priceUnit: string;
  routeType?: string;
  roadCondition: string;
  distanceKm?: string | number | null;
  estimatedDurationMinutes?: number | null;
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
  passengerCapacity?: number;
  status: string;
};

type Zone = {
  id: string;
  name: string;
  zoneType: string;
  adjustmentType: string;
  adjustmentValue: string | number;
  roadCondition?: string | null;
  isActive: boolean;
};

type Booking = {
  id: string;
  bookingRef: string;
  tripType: string;
  customTripType?: string | null;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  dropoffDate?: string | null;
  durationHours?: string | number | null;
  durationDays?: string | number | null;
  passengers: number;
  estimatedPrice?: string | number | null;
  finalPrice: string | number | null;
  depositAmount?: string | number | null;
  luggageDetails?: string | null;
  specialNotes?: string | null;
  status: string;
  paymentStatus: string;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
  };
  route?: {
    id: string;
    name: string;
  } | null;
  driver?: {
    id: string;
    fullName: string;
  } | null;
  vehicle?: {
    id: string;
    name: string;
    registrationNo: string;
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
  customerMode: CustomerMode;
  bookingMode: BookingMode;

  customerId: string;
  quickCustomerName: string;
  quickCustomerPhone: string;
  quickCustomerEmail: string;

  routeId: string;
  driverId: string;
  vehicleId: string;

  tripType: string;
  customTripType: string;

  pickupLocation: string;
  destination: string;
  pickupDate: string;
  dropoffDate: string;
  passengers: string;

  distanceKm: string;
  roadCondition: string;
  pricingZone: string;

  hourlyRate: string;
  dailyRate: string;

  luggageDetails: string;
  specialNotes: string;

  estimatedPrice: string;
  finalPrice: string;
  depositAmount: string;
};

const initialForm: BookingForm = {
  customerMode: 'EXISTING',
  bookingMode: 'SAVED_ROUTE',

  customerId: '',
  quickCustomerName: '',
  quickCustomerPhone: '',
  quickCustomerEmail: '',

  routeId: '',
  driverId: '',
  vehicleId: '',

  tripType: 'CITY_TO_CITY',
  customTripType: '',

  pickupLocation: '',
  destination: '',
  pickupDate: '',
  dropoffDate: '',
  passengers: '1',

  distanceKm: '',
  roadCondition: '',
  pricingZone: '',

  hourlyRate: '',
  dailyRate: '',

  luggageDetails: '',
  specialNotes: '',

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
  const [editingBookingId, setEditingBookingId] = useState('');
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

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

  const selectedRoute = routes.find((route) => route.id === form.routeId);
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === form.vehicleId,
  );
  const selectedZone = zones.find((zone) => zone.zoneType === form.pricingZone);

  const availableDrivers = drivers.filter((driver) => {
    if (editingBookingId && driver.id === form.driverId) {
      return true;
    }

    return driver.status === 'AVAILABLE';
  });

  const availableVehicles = vehicles.filter((vehicle) => {
    if (editingBookingId && vehicle.id === form.vehicleId) {
      return true;
    }

    return vehicle.status === 'AVAILABLE';
  });

  const usesRoute = form.bookingMode === 'SAVED_ROUTE';
  const usesCustomDistance = form.bookingMode === 'CUSTOM_TRIP';
  const usesHourly = form.bookingMode === 'HOURLY_HIRE';
  const usesDaily = form.bookingMode === 'DAILY_HIRE';
  const usesManualQuote = form.bookingMode === 'CUSTOM_QUOTE';
  const needsDropoff = usesHourly || usesDaily || usesManualQuote;

  const duration = useMemo(() => {
    if (!form.pickupDate || !form.dropoffDate) {
      return {
        hours: 0,
        days: 0,
        billableDays: 0,
      };
    }

    const pickup = new Date(form.pickupDate);
    const dropoff = new Date(form.dropoffDate);

    if (
      Number.isNaN(pickup.getTime()) ||
      Number.isNaN(dropoff.getTime()) ||
      dropoff <= pickup
    ) {
      return {
        hours: 0,
        days: 0,
        billableDays: 0,
      };
    }

    const hours = (dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60);
    const days = hours / 24;

    return {
      hours: roundNumber(hours),
      days: roundNumber(days),
      billableDays: Math.ceil(days),
    };
  }, [form.pickupDate, form.dropoffDate]);

  function roundNumber(value: number) {
    return Math.round(value * 100) / 100;
  }

  function parseMoney(value: string) {
    const cleaned = String(value || '').replace(',', '.').trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function formatMoney(value: number | string | null | undefined) {
    const parsed = Number(String(value ?? 0).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
  }

  function formatDateForInput(value?: string | null) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
  }

  function updateForm(field: keyof BookingForm, value: string) {
    const decimalFields: (keyof BookingForm)[] = [
      'estimatedPrice',
      'finalPrice',
      'depositAmount',
      'distanceKm',
      'hourlyRate',
      'dailyRate',
    ];

    const nextValue = decimalFields.includes(field)
      ? value.replace(',', '.')
      : value;

    setForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue,
    }));

    if (
      field === 'routeId' ||
      field === 'vehicleId' ||
      field === 'pricingZone' ||
      field === 'roadCondition' ||
      field === 'distanceKm' ||
      field === 'passengers' ||
      field === 'bookingMode' ||
      field === 'pickupDate' ||
      field === 'dropoffDate' ||
      field === 'hourlyRate' ||
      field === 'dailyRate'
    ) {
      setCalculation(null);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setEditingBookingId('');
    setCalculation(null);
    setShowBreakdown(false);
    setErrorMessage('');
    setSuccessMessage('');
  }

  function setBookingMode(mode: BookingMode) {
    const nextTripType =
      mode === 'HOURLY_HIRE' || mode === 'DAILY_HIRE'
        ? 'CAR_RENTAL'
        : mode === 'CUSTOM_QUOTE'
          ? 'CUSTOM'
          : form.tripType;

    setForm((currentForm) => ({
      ...currentForm,
      bookingMode: mode,
      routeId: mode === 'SAVED_ROUTE' ? currentForm.routeId : '',
      distanceKm: mode === 'CUSTOM_TRIP' ? currentForm.distanceKm : '',
      hourlyRate: mode === 'HOURLY_HIRE' ? currentForm.hourlyRate : '',
      dailyRate: mode === 'DAILY_HIRE' ? currentForm.dailyRate : '',
      tripType: nextTripType,
      pickupLocation: mode === 'SAVED_ROUTE' ? currentForm.pickupLocation : '',
      destination: mode === 'SAVED_ROUTE' ? currentForm.destination : '',
      estimatedPrice: '',
      finalPrice: '',
    }));

    setCalculation(null);
    setShowBreakdown(false);
  }

  function mapRouteTypeToTripType(routeType?: string) {
    const map: Record<string, string> = {
      CITY_TO_CITY: 'CITY_TO_CITY',
      AIRPORT_TRANSFER: 'AIRPORT_TRANSFER',
      PRIVATE_HIRE: 'PRIVATE_HIRE',
      CORPORATE_TRANSFER: 'CORPORATE_TRANSPORT',
      TOUR_PACKAGE: 'TOURISM',
      CUSTOM: 'CUSTOM',
      LOCAL_TRANSFER: 'CUSTOM',
    };

    return routeType ? map[routeType] ?? 'CUSTOM' : 'CUSTOM';
  }

  function applyRouteDefaults(routeId: string) {
    const route = routes.find((item) => item.id === routeId);

    if (!route) {
      setForm((currentForm) => ({
        ...currentForm,
        routeId: '',
        pickupLocation: '',
        destination: '',
        distanceKm: '',
        roadCondition: '',
        estimatedPrice: '',
        finalPrice: '',
      }));

      setCalculation(null);
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      routeId,
      bookingMode: 'SAVED_ROUTE',
      pickupLocation: route.pickupCity,
      destination: route.destinationCity,
      tripType: mapRouteTypeToTripType(route.routeType),
      roadCondition: route.roadCondition || '',
      distanceKm: '',
      estimatedPrice: '',
      finalPrice: '',
    }));

    setCalculation(null);
  }

  function applyZone(zoneType: string) {
    const zone = zones.find((item) => item.zoneType === zoneType);

    setForm((currentForm) => ({
      ...currentForm,
      pricingZone: zoneType,
      roadCondition: zone?.roadCondition || currentForm.roadCondition,
      estimatedPrice: '',
      finalPrice: '',
    }));

    setCalculation(null);
  }

  function inferBookingMode(booking: Booking): BookingMode {
    if (booking.route?.id) {
      return 'SAVED_ROUTE';
    }

    if (booking.tripType === 'CAR_RENTAL' && booking.dropoffDate) {
      return 'DAILY_HIRE';
    }

    if (booking.tripType === 'CUSTOM') {
      return 'CUSTOM_QUOTE';
    }

    return 'CUSTOM_TRIP';
  }

  function startEditBooking(booking: Booking) {
    if (
      booking.status === 'COMPLETED' ||
      booking.status === 'CANCELLED' ||
      booking.status === 'NO_SHOW'
    ) {
      setErrorMessage('Completed, cancelled or no-show bookings cannot be edited.');
      return;
    }

    setEditingBookingId(booking.id);
    setShowForm(true);
    setCalculation(null);
    setShowBreakdown(false);
    setErrorMessage('');
    setSuccessMessage('');

    setForm({
      ...initialForm,
      customerMode: 'EXISTING',
      bookingMode: inferBookingMode(booking),

      customerId: booking.customer?.id ?? '',
      routeId: booking.route?.id ?? '',
      driverId: booking.driver?.id ?? '',
      vehicleId: booking.vehicle?.id ?? '',

      tripType: booking.tripType,
      customTripType: booking.customTripType ?? '',

      pickupLocation: booking.pickupLocation ?? '',
      destination: booking.destination ?? '',
      pickupDate: formatDateForInput(booking.pickupDate),
      dropoffDate: formatDateForInput(booking.dropoffDate),
      passengers: String(booking.passengers ?? 1),

      luggageDetails: booking.luggageDetails ?? '',
      specialNotes: booking.specialNotes ?? '',

      estimatedPrice: booking.estimatedPrice
        ? formatMoney(booking.estimatedPrice)
        : booking.finalPrice
          ? formatMoney(booking.finalPrice)
          : '',
      finalPrice: booking.finalPrice ? formatMoney(booking.finalPrice) : '',
      depositAmount: booking.depositAmount
        ? formatMoney(booking.depositAmount)
        : '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function calculatePrice() {
    setErrorMessage('');
    setSuccessMessage('');

    const passengers = Number(form.passengers || 1);

    if (!Number.isInteger(passengers) || passengers < 1) {
      setErrorMessage('Passengers must be at least 1.');
      return;
    }

    if (
      selectedVehicle?.passengerCapacity &&
      passengers > selectedVehicle.passengerCapacity
    ) {
      setErrorMessage(
        `Passengers cannot exceed vehicle capacity of ${selectedVehicle.passengerCapacity}.`,
      );
      return;
    }

    if (usesRoute && !form.routeId) {
      setErrorMessage('Select a saved route or choose another booking mode.');
      return;
    }

    if (usesCustomDistance) {
      const distance = Number(form.distanceKm);

      if (!form.pickupLocation.trim()) {
        setErrorMessage('Enter pickup location for custom trip.');
        return;
      }

      if (!form.destination.trim()) {
        setErrorMessage('Enter destination for custom trip.');
        return;
      }

      if (!Number.isFinite(distance) || distance <= 0) {
        setErrorMessage('Enter a valid distance for custom trip pricing.');
        return;
      }
    }

    if (usesHourly) {
      const hourlyRate = parseMoney(form.hourlyRate);

      if (!duration.hours || duration.hours <= 0) {
        setErrorMessage(
          'Select valid pickup and drop-off times for hourly hire.',
        );
        return;
      }

      if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
        setErrorMessage('Enter a valid hourly rate.');
        return;
      }
    }

    if (usesDaily) {
      const dailyRate = parseMoney(form.dailyRate);

      if (!duration.days || duration.days <= 0) {
        setErrorMessage(
          'Select valid pickup and drop-off times for daily hire.',
        );
        return;
      }

      if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
        setErrorMessage('Enter a valid daily rate.');
        return;
      }
    }

    if (usesManualQuote) {
      setErrorMessage(
        'Custom Quote uses manual final price. Enter the final price directly.',
      );
      return;
    }

    try {
      setCalculating(true);

      const pricingMode = usesRoute
        ? undefined
        : usesCustomDistance
          ? 'DISTANCE_BASED'
          : usesHourly
            ? 'HOURLY'
            : usesDaily
              ? 'DAILY'
              : undefined;

      const result = await apiPost<PriceCalculation>(
        '/pricing-calculator/calculate',
        {
          companyId: COMPANY_ID,
          routeId: usesRoute ? form.routeId : undefined,
          pricingMode,
          distanceKm: usesCustomDistance ? Number(form.distanceKm) : undefined,
          durationHours: usesHourly ? duration.hours : undefined,
          durationDays: usesDaily ? duration.days : undefined,
          hourlyRate: usesHourly ? parseMoney(form.hourlyRate) : undefined,
          dailyRate: usesDaily ? parseMoney(form.dailyRate) : undefined,
          vehicleType: selectedVehicle?.vehicleType,
          roadCondition: form.roadCondition || undefined,
          zoneType: form.pricingZone || undefined,
          passengers,
        },
      );

      const formattedPrice = formatMoney(result.estimatedPrice);

      setCalculation(result);
      setShowBreakdown(false);

      setForm((currentForm) => ({
        ...currentForm,
        estimatedPrice: formattedPrice,
        finalPrice: formattedPrice,
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

  async function resolveCustomerId() {
    if (form.customerMode === 'EXISTING') {
      if (!form.customerId) {
        throw new Error('Select an existing customer or use Quick Customer.');
      }

      return form.customerId;
    }

    if (form.customerMode === 'QUICK') {
      if (!form.quickCustomerName.trim()) {
        throw new Error('Enter customer name.');
      }

      if (!form.quickCustomerPhone.trim()) {
        throw new Error('Enter customer phone number.');
      }

      const customer = await apiPost<Customer>('/customers', {
        companyId: COMPANY_ID,
        fullName: form.quickCustomerName.trim(),
        phone: form.quickCustomerPhone.trim(),
        email: form.quickCustomerEmail.trim() || undefined,
        nationalId: '',
        address: '',
      });

      return customer.id;
    }

    const customer = await apiPost<Customer>('/customers', {
      companyId: COMPANY_ID,
      fullName: 'Walk-in Customer',
      phone: `WALK-IN-${Date.now()}`,
      email: undefined,
      nationalId: '',
      address: '',
    });

    return customer.id;
  }

  async function saveBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (usesRoute && !form.routeId) {
      setErrorMessage('Select a saved route or choose another booking mode.');
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

    const pickupDate = new Date(form.pickupDate);

    if (Number.isNaN(pickupDate.getTime())) {
      setErrorMessage('Pickup date and time are invalid.');
      return;
    }

    let dropoffDate: Date | null = null;

    if (form.dropoffDate) {
      dropoffDate = new Date(form.dropoffDate);

      if (Number.isNaN(dropoffDate.getTime())) {
        setErrorMessage('Drop-off date and time are invalid.');
        return;
      }

      if (dropoffDate <= pickupDate) {
        setErrorMessage('Drop-off date must be after pickup date.');
        return;
      }
    }

    if ((usesHourly || usesDaily) && !dropoffDate) {
      setErrorMessage('Drop-off date is required for hourly or daily hire.');
      return;
    }

    const passengers = Number(form.passengers);

    if (!Number.isInteger(passengers) || passengers < 1) {
      setErrorMessage('Passengers must be at least 1.');
      return;
    }

    if (
      selectedVehicle?.passengerCapacity &&
      passengers > selectedVehicle.passengerCapacity
    ) {
      setErrorMessage(
        `Passengers cannot exceed vehicle capacity of ${selectedVehicle.passengerCapacity}.`,
      );
      return;
    }

    if (form.tripType === 'CUSTOM' && !form.customTripType.trim()) {
      setErrorMessage('Enter the custom trip type.');
      return;
    }

    const finalPrice = parseMoney(form.finalPrice);
    const estimatedPrice = parseMoney(form.estimatedPrice || form.finalPrice);
    const depositAmount = parseMoney(form.depositAmount || '0');

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      setErrorMessage('Final price must be a valid amount above 0.');
      return;
    }

    if (!Number.isFinite(estimatedPrice) || estimatedPrice <= 0) {
      setErrorMessage('Estimated price must be a valid amount above 0.');
      return;
    }

    if (!Number.isFinite(depositAmount) || depositAmount < 0) {
      setErrorMessage('Deposit amount must be valid and cannot be negative.');
      return;
    }

    if (depositAmount > finalPrice) {
      setErrorMessage('Deposit amount cannot be greater than final price.');
      return;
    }

    try {
      setSaving(true);

      const customerId = await resolveCustomerId();

      const payload = {
        customerId,
        routeId: usesRoute ? form.routeId : editingBookingId ? null : undefined,
        driverId: form.driverId || (editingBookingId ? null : undefined),
        vehicleId: form.vehicleId || (editingBookingId ? null : undefined),
        tripType: form.tripType,
        customTripType:
          form.tripType === 'CUSTOM' ? form.customTripType.trim() : undefined,
        pickupLocation: form.pickupLocation.trim(),
        destination: form.destination.trim(),
        pickupDate: pickupDate.toISOString(),
        dropoffDate: dropoffDate
          ? dropoffDate.toISOString()
          : editingBookingId
            ? null
            : undefined,
        passengers,
        luggageDetails: form.luggageDetails.trim() || undefined,
        specialNotes: form.specialNotes.trim() || undefined,
        estimatedPrice,
        finalPrice,
        depositAmount,
      };

      if (editingBookingId) {
        await apiPatch(`/bookings/${editingBookingId}`, payload);
        setSuccessMessage('Booking updated successfully.');
      } else {
        await apiPost<Booking>('/bookings', {
          companyId: COMPANY_ID,
          ...payload,
        });
        setSuccessMessage('Booking created successfully.');
      }

      resetForm();
      setShowForm(false);
      await fetchPageData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving booking',
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
            Create premium bookings for saved routes, custom transfers, hourly
            hire, daily rental and manual quotes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
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

      {successMessage && <Notice type="success" message={successMessage} />}
      {errorMessage && <Notice type="error" message={errorMessage} />}

      {showForm && (
        <form
          noValidate
          onSubmit={saveBooking}
          className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#050505]"
        >
          <PanelHeader
            eyebrow={
              editingBookingId
                ? 'Premium Booking Workflow'
                : 'Premium Booking Workflow'
            }
            title={editingBookingId ? 'Edit Booking' : 'Create Booking'}
            subtitle={
              editingBookingId
                ? 'Update booking details, assignment, dates, pricing and payment information.'
                : 'A guided workflow for customer details, trip setup, assignment and pricing.'
            }
          />

          <div className="space-y-8 p-6">
            <section>
              <SectionTitle
                number="01"
                title="Customer"
                subtitle="Choose an existing customer, quickly capture a new one or create a walk-in booking."
              />

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateForm('customerMode', 'EXISTING')}
                  className={modeButtonClass(form.customerMode === 'EXISTING')}
                >
                  Existing Customer
                </button>

                <button
                  type="button"
                  onClick={() => updateForm('customerMode', 'QUICK')}
                  className={modeButtonClass(form.customerMode === 'QUICK')}
                >
                  Quick Customer
                </button>

                <button
                  type="button"
                  onClick={() => updateForm('customerMode', 'WALK_IN')}
                  className={modeButtonClass(form.customerMode === 'WALK_IN')}
                >
                  Walk-in
                </button>
              </div>

              {form.customerMode === 'EXISTING' && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                </div>
              )}

              {form.customerMode === 'QUICK' && (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <FormField label="Customer Name" required>
                    <input
                      value={form.quickCustomerName}
                      onChange={(event) =>
                        updateForm('quickCustomerName', event.target.value)
                      }
                      placeholder="Enter customer full name"
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Phone Number" required>
                    <input
                      value={form.quickCustomerPhone}
                      onChange={(event) =>
                        updateForm('quickCustomerPhone', event.target.value)
                      }
                      placeholder="+263..."
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Email Optional">
                    <input
                      value={form.quickCustomerEmail}
                      onChange={(event) =>
                        updateForm('quickCustomerEmail', event.target.value)
                      }
                      placeholder="customer@example.com"
                      className="input-field"
                    />
                  </FormField>
                </div>
              )}

              {form.customerMode === 'WALK_IN' && (
                <div className="mt-4 rounded-2xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-4 text-sm text-[#C8A96A]">
                  This booking will be saved under a walk-in customer record.
                </div>
              )}
            </section>

            <section>
              <SectionTitle
                number="02"
                title="Trip Setup"
                subtitle="Choose the booking mode. The form only shows the fields needed for that mode."
              />

              <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                {[
                  ['SAVED_ROUTE', 'Saved Route'],
                  ['CUSTOM_TRIP', 'Custom Trip'],
                  ['HOURLY_HIRE', 'Hourly Hire'],
                  ['DAILY_HIRE', 'Daily Hire'],
                  ['CUSTOM_QUOTE', 'Custom Quote'],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBookingMode(mode as BookingMode)}
                    className={modeButtonClass(form.bookingMode === mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {usesRoute && (
                  <FormField label="Route" required>
                    <select
                      value={form.routeId}
                      onChange={(event) =>
                        applyRouteDefaults(event.target.value)
                      }
                      className="input-field"
                    >
                      <option value="">Select saved route</option>
                      {routes
                        .filter((route) => route.isActive)
                        .map((route) => (
                          <option key={route.id} value={route.id}>
                            {route.name} - ${String(route.basePrice)}
                          </option>
                        ))}
                    </select>
                  </FormField>
                )}

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

                {form.tripType === 'CUSTOM' && (
                  <FormField label="Custom Trip Type" required>
                    <input
                      value={form.customTripType}
                      onChange={(event) =>
                        updateForm('customTripType', event.target.value)
                      }
                      placeholder="Example: Wedding Guest Transport"
                      className="input-field"
                    />
                  </FormField>
                )}

                <FormField label="Pickup Date & Time" required>
                  <input
                    value={form.pickupDate}
                    onChange={(event) =>
                      updateForm('pickupDate', event.target.value)
                    }
                    type="datetime-local"
                    className="input-field"
                  />
                </FormField>

                {(needsDropoff || form.dropoffDate) && (
                  <FormField
                    label={
                      usesRoute || usesCustomDistance
                        ? 'Drop-off Date & Time Optional'
                        : 'Drop-off Date & Time'
                    }
                    required={usesHourly || usesDaily}
                  >
                    <input
                      value={form.dropoffDate}
                      onChange={(event) =>
                        updateForm('dropoffDate', event.target.value)
                      }
                      type="datetime-local"
                      className="input-field"
                    />
                  </FormField>
                )}

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
              </div>

              {selectedRoute && usesRoute && (
                <div className="mt-4 rounded-2xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-4 text-sm">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold text-[#C8A96A]">
                        Saved Route Selected
                      </p>
                      <p className="mt-1 text-neutral-400">
                        Distance and base pricing are locked to this route.
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-semibold text-white">
                        ${String(selectedRoute.basePrice)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {selectedRoute.priceUnit?.replaceAll('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-neutral-300 md:grid-cols-4">
                    <RouteMeta label="Route" value={selectedRoute.name} />
                    <RouteMeta label="From" value={selectedRoute.pickupCity} />
                    <RouteMeta label="To" value={selectedRoute.destinationCity} />
                    <RouteMeta
                      label="Distance"
                      value={
                        selectedRoute.distanceKm
                          ? `${selectedRoute.distanceKm} km`
                          : 'Not set'
                      }
                    />
                    <RouteMeta
                      label="Road"
                      value={selectedRoute.roadCondition || 'Default'}
                    />
                    <RouteMeta
                      label="Pricing"
                      value={selectedRoute.pricingMode?.replaceAll('_', ' ')}
                    />
                    <RouteMeta
                      label="Duration"
                      value={
                        selectedRoute.estimatedDurationMinutes
                          ? `${selectedRoute.estimatedDurationMinutes} mins`
                          : 'Not set'
                      }
                    />
                  </div>
                </div>
              )}

              {duration.hours > 0 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-300">
                  Duration: {duration.hours} hour(s), approximately{' '}
                  {duration.days} day(s)
                  {usesDaily && `, billed as ${duration.billableDays} day(s)`}
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField
                  label={usesRoute ? 'Exact Pickup Point' : 'Pickup Location'}
                  required
                >
                  <input
                    value={form.pickupLocation}
                    onChange={(event) =>
                      updateForm('pickupLocation', event.target.value)
                    }
                    placeholder={
                      usesRoute
                        ? 'Example: Terminal 2, Harare Airport'
                        : 'Enter pickup location'
                    }
                    className="input-field"
                  />
                </FormField>

                <FormField
                  label={usesRoute ? 'Exact Destination Point' : 'Destination'}
                  required
                >
                  <input
                    value={form.destination}
                    onChange={(event) =>
                      updateForm('destination', event.target.value)
                    }
                    placeholder={
                      usesRoute
                        ? 'Example: Hotel entrance, Harare CBD'
                        : 'Enter destination'
                    }
                    className="input-field"
                  />
                </FormField>
              </div>
            </section>

            <section>
              <SectionTitle
                number="03"
                title="Assignment and Conditions"
                subtitle="Assign available resources and add only the pricing conditions that apply."
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

                {usesCustomDistance && (
                  <FormField label="Distance KM" required>
                    <input
                      value={form.distanceKm}
                      onChange={(event) =>
                        updateForm('distanceKm', event.target.value)
                      }
                      inputMode="decimal"
                      placeholder="Enter estimated distance"
                      className="input-field"
                    />
                  </FormField>
                )}

                {usesHourly && (
                  <FormField label="Hourly Rate" required>
                    <input
                      value={form.hourlyRate}
                      onChange={(event) =>
                        updateForm('hourlyRate', event.target.value)
                      }
                      inputMode="decimal"
                      placeholder="Example: 15.00"
                      className="input-field"
                    />
                  </FormField>
                )}

                {usesDaily && (
                  <FormField label="Daily Rate" required>
                    <input
                      value={form.dailyRate}
                      onChange={(event) =>
                        updateForm('dailyRate', event.target.value)
                      }
                      inputMode="decimal"
                      placeholder="Example: 80.00"
                      className="input-field"
                    />
                  </FormField>
                )}

                <FormField label="Road Condition">
                  <select
                    value={form.roadCondition}
                    onChange={(event) =>
                      updateForm('roadCondition', event.target.value)
                    }
                    className="input-field"
                  >
                    <option value="">Use default</option>
                    <option value="GOOD">Good</option>
                    <option value="AVERAGE">Average</option>
                    <option value="BAD">Bad</option>
                    <option value="RURAL">Rural</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </FormField>

                <FormField label="Pricing Zone">
                  <select
                    value={form.pricingZone}
                    onChange={(event) => applyZone(event.target.value)}
                    className="input-field"
                  >
                    <option value="">No pricing zone</option>
                    {zones
                      .filter((zone) => zone.isActive)
                      .map((zone) => (
                        <option key={zone.id} value={zone.zoneType}>
                          {zone.name}
                        </option>
                      ))}
                  </select>
                </FormField>
              </div>

              {selectedZone?.roadCondition && (
                <div className="mt-4 rounded-2xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-4 text-sm text-[#C8A96A]">
                  Pricing zone selected: {selectedZone.name}. Road condition has
                  been aligned to {selectedZone.roadCondition}.
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label="Luggage Details">
                  <input
                    value={form.luggageDetails}
                    onChange={(event) =>
                      updateForm('luggageDetails', event.target.value)
                    }
                    placeholder="Example: Two medium bags"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Special Notes">
                  <input
                    value={form.specialNotes}
                    onChange={(event) =>
                      updateForm('specialNotes', event.target.value)
                    }
                    placeholder="Example: Customer prefers front seat"
                    className="input-field"
                  />
                </FormField>
              </div>
            </section>

            <section>
              <SectionTitle
                number="04"
                title="Pricing and Payment"
                subtitle="Calculate the fare, review the total, then enter the final price and deposit."
              />

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Pricing Engine
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">
                      Estimated Fare
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      Uses route pricing, distance rules, hourly/daily rates,
                      vehicle type, road condition and pricing zone.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={calculatePrice}
                    disabled={calculating || usesManualQuote}
                    className="rounded-full bg-[#C8A96A] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {usesManualQuote
                      ? 'Manual Quote'
                      : calculating
                        ? 'Calculating...'
                        : 'Calculate Price'}
                  </button>
                </div>

                {usesManualQuote && (
                  <div className="mt-5 rounded-2xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-4 text-sm text-[#C8A96A]">
                    Custom Quote mode does not use automatic calculation. Enter
                    the agreed final price manually.
                  </div>
                )}

                {calculation && (
                  <div className="mt-5">
                    <div className="rounded-2xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 p-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-[#C8A96A]">
                        Estimated Total
                      </p>
                      <p className="mt-3 text-4xl font-semibold text-white">
                        ${formatMoney(calculation.estimatedPrice)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBreakdown((current) => !current)}
                      className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
                    >
                      {showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
                    </button>

                    {showBreakdown && (
                      <div className="mt-4 space-y-2">
                        {calculation.breakdown.map((item, index) => (
                          <div
                            key={`${item.label}-${index}`}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs"
                          >
                            <span className="text-neutral-300">
                              {item.label}
                            </span>
                            <span className="font-semibold text-[#C8A96A]">
                              ${formatMoney(item.amount)}
                              {item.percentage ? ` (${item.percentage}%)` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <FormField label="Estimated Price">
                  <input
                    value={form.estimatedPrice}
                    onChange={(event) =>
                      updateForm('estimatedPrice', event.target.value)
                    }
                    inputMode="decimal"
                    placeholder="0.00"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Final Price" required>
                  <input
                    value={form.finalPrice}
                    onChange={(event) =>
                      updateForm('finalPrice', event.target.value)
                    }
                    inputMode="decimal"
                    placeholder="0.00"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Deposit Amount">
                  <input
                    value={form.depositAmount}
                    onChange={(event) =>
                      updateForm('depositAmount', event.target.value)
                    }
                    inputMode="decimal"
                    placeholder="0.00"
                    className="input-field"
                  />
                </FormField>
              </div>
            </section>

            {errorMessage && <Notice type="error" message={errorMessage} />}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#C8A96A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? editingBookingId
                    ? 'Saving Changes...'
                    : 'Saving Booking...'
                  : editingBookingId
                    ? 'Save Changes'
                    : 'Save Booking'}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
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
        <BookingsTable
          bookings={bookings}
          actionLoadingId={actionLoadingId}
          onRefresh={fetchPageData}
          onEdit={startEditBooking}
          onStatusChange={updateBookingStatus}
        />
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

function Notice({
  type,
  message,
}: {
  type: 'success' | 'error';
  message: string;
}) {
  const classes =
    type === 'success'
      ? 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]'
      : 'border-red-500/20 bg-red-500/10 text-red-300';

  return (
    <div className={`mb-6 rounded-3xl border p-5 text-sm ${classes}`}>
      {message}
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
      <p className="text-xs uppercase tracking-[0.3em] text-[#C8A96A]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
        {subtitle}
      </p>
    </div>
  );
}

function SectionTitle({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-t border-white/10 pt-6 first:border-t-0 first:pt-0">
      <p className="text-xs uppercase tracking-[0.3em] text-[#C8A96A]">
        {number}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
    </div>
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

function RouteMeta({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <p>
      <span className="text-neutral-500">{label}:</span> {value || 'Not set'}
    </p>
  );
}

function modeButtonClass(active: boolean) {
  return `rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
    active
      ? 'border-[#C8A96A]/50 bg-[#C8A96A]/15 text-[#C8A96A]'
      : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:border-[#C8A96A]/40 hover:text-white'
  }`;
}

function BookingsTable({
  bookings,
  actionLoadingId,
  onRefresh,
  onEdit,
  onStatusChange,
}: {
  bookings: Booking[];
  actionLoadingId: string;
  onRefresh: () => void;
  onEdit: (booking: Booking) => void;
  onStatusChange: (bookingId: string, status: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">All Bookings</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Live records from the booking system database.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1220px] table-fixed border-collapse text-left text-[11px]">
          <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
            <tr>
              <th className="w-[9%] px-3 py-4 font-medium">Booking</th>
              <th className="w-[10%] px-3 py-4 font-medium">Customer</th>
              <th className="w-[12%] px-3 py-4 font-medium">Trip</th>
              <th className="w-[10%] px-3 py-4 font-medium">Pickup</th>
              <th className="w-[10%] px-3 py-4 font-medium">Drop-off</th>
              <th className="w-[8%] px-3 py-4 font-medium">Driver</th>
              <th className="w-[10%] px-3 py-4 font-medium">Vehicle</th>
              <th className="w-[4%] px-2 py-4 text-center font-medium">
                Pax
              </th>
              <th className="w-[8%] px-2 py-4 text-center font-medium">
                Status
              </th>
              <th className="w-[8%] px-2 py-4 text-center font-medium">
                Payment
              </th>
              <th className="w-[6%] px-2 py-4 text-right font-medium">
                Amount
              </th>
              <th className="w-[12%] px-3 py-4 font-medium">Actions</th>
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
                    <p className="break-words font-semibold leading-5 text-white">
                      {booking.bookingRef}
                    </p>
                    <p className="mt-1 leading-5 text-neutral-500">
                      {booking.customTripType ||
                        booking.tripType.replaceAll('_', ' ')}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <p className="font-semibold leading-5 text-white">
                      {booking.customer?.fullName ?? 'Unknown'}
                    </p>
                    <p className="mt-1 leading-5 text-neutral-500">
                      {booking.customer?.phone ?? 'No phone'}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <p className="font-semibold leading-5 text-white">
                      {booking.route?.name ?? 'Custom trip'}
                    </p>
                    <p className="mt-1 leading-5 text-neutral-500">
                      {booking.pickupLocation} → {booking.destination}
                    </p>
                  </td>

                  <td className="px-3 py-4 leading-5 text-neutral-300">
                    {new Date(booking.pickupDate).toLocaleString()}
                  </td>

                  <td className="px-3 py-4 leading-5 text-neutral-300">
                    {booking.dropoffDate
                      ? new Date(booking.dropoffDate).toLocaleString()
                      : 'Not set'}

                    {booking.durationDays && (
                      <p className="mt-1 text-neutral-500">
                        {booking.durationDays} day(s)
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-4 font-semibold leading-5 text-white">
                    {booking.driver?.fullName ?? 'Not assigned'}
                  </td>

                  <td className="px-3 py-4">
                    {booking.vehicle ? (
                      <>
                        <p className="font-semibold leading-5 text-white">
                          {booking.vehicle.name}
                        </p>
                        <p className="mt-1 leading-5 text-neutral-500">
                          {booking.vehicle.registrationNo}
                        </p>
                      </>
                    ) : (
                      <span className="text-neutral-400">Not assigned</span>
                    )}
                  </td>

                  <td className="px-2 py-4 text-center font-semibold text-white">
                    {booking.passengers}
                  </td>

                  <td className="px-2 py-4 text-center">
                    <StatusBadge status={booking.status} />
                  </td>

                  <td className="px-2 py-4 text-center">
                    <PaymentBadge status={booking.paymentStatus} />
                  </td>

                  <td className="px-2 py-4 text-right font-semibold text-[#C8A96A]">
                    ${booking.finalPrice ?? 0}
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={isFinalStatus}
                        onClick={() => onEdit(booking)}
                        className="rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#C8A96A] transition hover:bg-[#C8A96A]/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          actionLoadingId === booking.id || isFinalStatus
                        }
                        onClick={() => onStatusChange(booking.id, 'COMPLETED')}
                        className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-[11px] font-medium text-green-300 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {actionLoadingId === booking.id
                          ? 'Working'
                          : 'Complete'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          actionLoadingId === booking.id || isFinalStatus
                        }
                        onClick={() => onStatusChange(booking.id, 'CANCELLED')}
                        className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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

  const labels: Record<string, string> = {
    DRIVER_ASSIGNED: 'ASSIGNED',
    VEHICLE_ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'ACTIVE',
    NO_SHOW: 'NO SHOW',
  };

  return (
    <span
      title={status.replaceAll('_', ' ')}
      className={`mx-auto inline-flex h-6 min-w-[72px] items-center justify-center rounded-full border px-2 text-center text-[10px] font-bold uppercase leading-none tracking-wide ${
        styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300'
      }`}
    >
      {labels[status] ?? status.replaceAll('_', ' ')}
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

  const labels: Record<string, string> = {
    PARTIALLY_PAID: 'PARTIAL',
  };

  return (
    <span
      title={status.replaceAll('_', ' ')}
      className={`mx-auto inline-flex h-6 min-w-[68px] items-center justify-center rounded-full border px-2 text-center text-[10px] font-bold uppercase leading-none tracking-wide ${
        styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300'
      }`}
    >
      {labels[status] ?? status.replaceAll('_', ' ')}
    </span>
  );
}