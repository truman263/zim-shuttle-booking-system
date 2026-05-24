'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

type TripDirection = 'ONE_WAY' | 'ROUND_TRIP';

type RouteRecord = {
  id: string;
  name: string;
  pickupCity: string;
  destinationCity: string;
  basePrice: string | number;
  pricingMode: string;
  priceUnit: string;
  routeType?: string;
  distanceKm?: string | number | null;
  estimatedDurationMinutes?: number | null;
  isActive: boolean;
};

type PriceCalculation = {
  requiresManualQuote?: boolean;
  message?: string;
  estimatedPrice?: number | null;
  breakdown?: {
    label: string;
    type: string;
    amount: number;
    percentage?: number;
  }[];
};

type BookingResponse = {
  success: boolean;
  requiresManualQuote: boolean;
  message: string;
  bookingRef: string;
  bookingId: string;
  status: string;
  paymentStatus: string;
  estimatedPrice?: string | number | null;
  finalPrice?: string | number | null;
  depositAmount?: string | number | null;
  customer: {
    fullName: string;
    phone: string;
    email?: string | null;
  };
};

type BookingForm = {
  routeId: string;
  tripDirection: TripDirection;

  pickupLocation: string;
  destination: string;
  pickupDate: string;

  returnDate: string;
  returnPickupLocation: string;
  returnDestination: string;
  returnNotes: string;

  passengers: string;
  luggageDetails: string;
  specialNotes: string;

  customerName: string;
  customerPhone: string;
  customerEmail: string;
};

const initialForm: BookingForm = {
  routeId: '',
  tripDirection: 'ONE_WAY',

  pickupLocation: '',
  destination: '',
  pickupDate: '',

  returnDate: '',
  returnPickupLocation: '',
  returnDestination: '',
  returnNotes: '',

  passengers: '1',
  luggageDetails: '',
  specialNotes: '',

  customerName: '',
  customerPhone: '',
  customerEmail: '',
};

export default function PublicBookingPage() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [form, setForm] = useState<BookingForm>(initialForm);

  const [estimate, setEstimate] = useState<PriceCalculation | null>(null);
  const [bookingResponse, setBookingResponse] =
    useState<BookingResponse | null>(null);

  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedRoute = routes.find((route) => route.id === form.routeId);
  const usesRoundTrip = form.tripDirection === 'ROUND_TRIP';

  const activeRoutes = useMemo(() => {
    return routes.filter((route) => route.isActive);
  }, [routes]);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoadingRoutes(true);
        const routesData = await apiGet<RouteRecord[] | RouteRecord>('/routes');
        const routeList = Array.isArray(routesData) ? routesData : [routesData];
        setRoutes(routeList);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load available routes.',
        );
      } finally {
        setLoadingRoutes(false);
      }
    }

    fetchRoutes();
  }, []);

  function updateForm(field: keyof BookingForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setEstimate(null);
    setBookingResponse(null);
    setSuccessMessage('');
    setErrorMessage('');
  }

  function selectRoute(routeId: string) {
    const route = routes.find((item) => item.id === routeId);

    if (!route) {
      setForm((currentForm) => ({
        ...currentForm,
        routeId: '',
        pickupLocation: '',
        destination: '',
        returnPickupLocation: '',
        returnDestination: '',
      }));
      setEstimate(null);
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      routeId,
      pickupLocation: route.pickupCity,
      destination: route.destinationCity,
      returnPickupLocation:
        currentForm.tripDirection === 'ROUND_TRIP'
          ? route.destinationCity
          : currentForm.returnPickupLocation,
      returnDestination:
        currentForm.tripDirection === 'ROUND_TRIP'
          ? route.pickupCity
          : currentForm.returnDestination,
    }));

    setEstimate(null);
  }

  function setTripDirection(direction: TripDirection) {
    setForm((currentForm) => {
      if (direction === 'ONE_WAY') {
        return {
          ...currentForm,
          tripDirection: 'ONE_WAY',
          returnDate: '',
          returnPickupLocation: '',
          returnDestination: '',
          returnNotes: '',
        };
      }

      return {
        ...currentForm,
        tripDirection: 'ROUND_TRIP',
        returnPickupLocation:
          currentForm.returnPickupLocation || currentForm.destination,
        returnDestination:
          currentForm.returnDestination || currentForm.pickupLocation,
      };
    });

    setEstimate(null);
    setBookingResponse(null);
    setErrorMessage('');
    setSuccessMessage('');
  }

  function formatMoney(value: string | number | null | undefined) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
  }

  function validateBookingForm(requireCustomerDetails: boolean) {
    if (!form.routeId) {
      return 'Please select a route.';
    }

    if (!form.pickupLocation.trim()) {
      return 'Please enter your pickup location.';
    }

    if (!form.destination.trim()) {
      return 'Please enter your destination.';
    }

    if (!form.pickupDate) {
      return 'Please select pickup date and time.';
    }

    const pickupDate = new Date(form.pickupDate);

    if (Number.isNaN(pickupDate.getTime())) {
      return 'Pickup date and time is invalid.';
    }

    if (pickupDate.getTime() < Date.now()) {
      return 'Pickup date cannot be in the past.';
    }

    const passengers = Number(form.passengers);

    if (!Number.isInteger(passengers) || passengers < 1) {
      return 'Passengers must be at least 1.';
    }

    if (usesRoundTrip) {
      if (!form.returnDate) {
        return 'Please select return date and time.';
      }

      const returnDate = new Date(form.returnDate);

      if (Number.isNaN(returnDate.getTime())) {
        return 'Return date and time is invalid.';
      }

      if (returnDate <= pickupDate) {
        return 'Return date must be after pickup date.';
      }

      if (!form.returnPickupLocation.trim()) {
        return 'Please enter return pickup location.';
      }

      if (!form.returnDestination.trim()) {
        return 'Please enter return destination.';
      }
    }

    if (requireCustomerDetails) {
      if (!form.customerName.trim()) {
        return 'Please enter your full name.';
      }

      if (!form.customerPhone.trim()) {
        return 'Please enter your phone or WhatsApp number.';
      }

      if (
        form.customerEmail.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())
      ) {
        return 'Please enter a valid email address.';
      }
    }

    return '';
  }

  async function estimatePrice() {
    setErrorMessage('');
    setSuccessMessage('');
    setBookingResponse(null);

    const validationError = validateBookingForm(false);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setEstimating(true);

      const result = await apiPost<PriceCalculation>(
        '/public-bookings/estimate',
        {
          companyId: COMPANY_ID,
          routeId: form.routeId,
          tripType: selectedRoute?.routeType || 'CITY_TO_CITY',
          tripDirection: form.tripDirection,
          pickupLocation: form.pickupLocation.trim(),
          destination: form.destination.trim(),
          pickupDate: new Date(form.pickupDate).toISOString(),
          returnDate: usesRoundTrip
            ? new Date(form.returnDate).toISOString()
            : undefined,
          returnPickupLocation: usesRoundTrip
            ? form.returnPickupLocation.trim()
            : undefined,
          returnDestination: usesRoundTrip
            ? form.returnDestination.trim()
            : undefined,
          passengers: Number(form.passengers),
          luggageDetails: form.luggageDetails.trim() || undefined,
          specialNotes: form.specialNotes.trim() || undefined,
          roundTripDiscountPercentage: 0,
        },
      );

      setEstimate(result);

      if (result.requiresManualQuote) {
        setSuccessMessage(
          result.message ||
            'This trip requires a manual quote. You can still submit your request.',
        );
      } else {
        setSuccessMessage('Price estimate generated successfully.');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to calculate price estimate.',
      );
    } finally {
      setEstimating(false);
    }
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');
    setBookingResponse(null);

    const validationError = validateBookingForm(true);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiPost<BookingResponse>('/public-bookings', {
        companyId: COMPANY_ID,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,

        routeId: form.routeId,
        tripType: selectedRoute?.routeType || 'CITY_TO_CITY',
        tripDirection: form.tripDirection,

        pickupLocation: form.pickupLocation.trim(),
        destination: form.destination.trim(),
        pickupDate: new Date(form.pickupDate).toISOString(),

        returnDate: usesRoundTrip
          ? new Date(form.returnDate).toISOString()
          : undefined,
        returnPickupLocation: usesRoundTrip
          ? form.returnPickupLocation.trim()
          : undefined,
        returnDestination: usesRoundTrip
          ? form.returnDestination.trim()
          : undefined,
        returnNotes: usesRoundTrip
          ? form.returnNotes.trim() || undefined
          : undefined,

        passengers: Number(form.passengers),
        luggageDetails: form.luggageDetails.trim() || undefined,
        specialNotes: form.specialNotes.trim() || undefined,

        roundTripDiscountPercentage: 0,
        depositAmount: 0,
      });

      setBookingResponse(response);
      setSuccessMessage(response.message || 'Booking request submitted.');
      setEstimate(null);
      setForm(initialForm);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit booking request.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#1f1a10_0%,#050505_45%)] px-6 py-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C8A96A]">
            LadyBird Shuttle Services
          </p>

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Book your shuttle with confidence.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400 md:text-base">
                Request one-way trips, round trips, airport transfers and
                city-to-city transport through a clean professional booking
                experience.
              </p>
            </div>

            <div className="rounded-3xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-5">
              <p className="text-sm font-semibold text-[#C8A96A]">
                Fast booking workflow
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-300">
                Select route, travel date, passenger details and submit your
                request. You will receive a booking reference immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px]">
          <form
            noValidate
            onSubmit={submitBooking}
            className="rounded-3xl border border-white/10 bg-white/[0.04]"
          >
            <div className="border-b border-white/10 px-6 py-5">
              <h2 className="text-xl font-semibold">Booking Details</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Complete the form below. Required fields are marked with gold.
              </p>
            </div>

            <div className="space-y-8 p-6">
              <section>
                <SectionTitle
                  number="01"
                  title="Route"
                  subtitle="Choose a common route. More routes can be added by the admin later."
                />

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField label="Route" required>
                    <select
                      value={form.routeId}
                      onChange={(event) => selectRoute(event.target.value)}
                      className="input-field"
                    >
                      <option value="">
                        {loadingRoutes ? 'Loading routes...' : 'Select route'}
                      </option>
                      {activeRoutes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name} - ${String(route.basePrice)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Passengers" required>
                    <input
                      type="number"
                      min="1"
                      value={form.passengers}
                      onChange={(event) =>
                        updateForm('passengers', event.target.value)
                      }
                      className="input-field"
                    />
                  </FormField>
                </div>

                {selectedRoute && (
                  <div className="mt-4 rounded-2xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-4 text-sm">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <p className="font-semibold text-[#C8A96A]">
                          {selectedRoute.name}
                        </p>
                        <p className="mt-1 text-neutral-400">
                          {selectedRoute.pickupCity} →{' '}
                          {selectedRoute.destinationCity}
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
                  </div>
                )}
              </section>

              <section>
                <SectionTitle
                  number="02"
                  title="Trip Direction"
                  subtitle="Select whether this is a one-way trip or a return journey."
                />

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTripDirection('ONE_WAY')}
                    className={modeButtonClass(
                      form.tripDirection === 'ONE_WAY',
                    )}
                  >
                    One-way Trip
                  </button>

                  <button
                    type="button"
                    onClick={() => setTripDirection('ROUND_TRIP')}
                    className={modeButtonClass(
                      form.tripDirection === 'ROUND_TRIP',
                    )}
                  >
                    Round Trip
                  </button>
                </div>
              </section>

              <section>
                <SectionTitle
                  number="03"
                  title="Travel Schedule"
                  subtitle="Tell us when and where you want to be picked up."
                />

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField label="Pickup Date & Time" required>
                    <input
                      type="datetime-local"
                      value={form.pickupDate}
                      onChange={(event) =>
                        updateForm('pickupDate', event.target.value)
                      }
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Pickup Point" required>
                    <input
                      value={form.pickupLocation}
                      onChange={(event) =>
                        updateForm('pickupLocation', event.target.value)
                      }
                      placeholder="Example: Harare CBD"
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Destination" required>
                    <input
                      value={form.destination}
                      onChange={(event) =>
                        updateForm('destination', event.target.value)
                      }
                      placeholder="Example: Masvingo CBD"
                      className="input-field"
                    />
                  </FormField>
                </div>

                {usesRoundTrip && (
                  <div className="mt-5 rounded-3xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-5">
                    <p className="text-sm font-semibold text-[#C8A96A]">
                      Return Journey
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      These fields help us prepare your return trip correctly.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <FormField label="Return Date & Time" required>
                        <input
                          type="datetime-local"
                          value={form.returnDate}
                          onChange={(event) =>
                            updateForm('returnDate', event.target.value)
                          }
                          className="input-field"
                        />
                      </FormField>

                      <FormField label="Return Pickup Point" required>
                        <input
                          value={form.returnPickupLocation}
                          onChange={(event) =>
                            updateForm(
                              'returnPickupLocation',
                              event.target.value,
                            )
                          }
                          placeholder="Example: Masvingo CBD"
                          className="input-field"
                        />
                      </FormField>

                      <FormField label="Return Destination" required>
                        <input
                          value={form.returnDestination}
                          onChange={(event) =>
                            updateForm(
                              'returnDestination',
                              event.target.value,
                            )
                          }
                          placeholder="Example: Harare CBD"
                          className="input-field"
                        />
                      </FormField>

                      <FormField label="Return Notes">
                        <input
                          value={form.returnNotes}
                          onChange={(event) =>
                            updateForm('returnNotes', event.target.value)
                          }
                          placeholder="Optional return instructions"
                          className="input-field"
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <SectionTitle
                  number="04"
                  title="Customer Details"
                  subtitle="We will use these details to confirm your booking."
                />

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField label="Full Name" required>
                    <input
                      value={form.customerName}
                      onChange={(event) =>
                        updateForm('customerName', event.target.value)
                      }
                      placeholder="Enter your full name"
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Phone / WhatsApp" required>
                    <input
                      value={form.customerPhone}
                      onChange={(event) =>
                        updateForm('customerPhone', event.target.value)
                      }
                      placeholder="+263..."
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Email Optional">
                    <input
                      value={form.customerEmail}
                      onChange={(event) =>
                        updateForm('customerEmail', event.target.value)
                      }
                      placeholder="you@example.com"
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Luggage Details">
                    <input
                      value={form.luggageDetails}
                      onChange={(event) =>
                        updateForm('luggageDetails', event.target.value)
                      }
                      placeholder="Example: 2 bags"
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField label="Special Request">
                    <input
                      value={form.specialNotes}
                      onChange={(event) =>
                        updateForm('specialNotes', event.target.value)
                      }
                      placeholder="Optional message for our team"
                      className="input-field"
                    />
                  </FormField>
                </div>
              </section>

              {errorMessage && <Notice type="error" message={errorMessage} />}
              {successMessage && (
                <Notice type="success" message={successMessage} />
              )}

              <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
                <button
                  type="button"
                  onClick={estimatePrice}
                  disabled={estimating}
                  className="rounded-full border border-[#C8A96A]/40 px-6 py-3 text-sm font-semibold text-[#C8A96A] transition hover:bg-[#C8A96A]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {estimating ? 'Calculating...' : 'Get Price Estimate'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#C8A96A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Estimate
              </p>

              {estimate && !estimate.requiresManualQuote ? (
                <>
                  <p className="mt-4 text-5xl font-semibold text-[#C8A96A]">
                    ${formatMoney(estimate.estimatedPrice)}
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Estimated fare based on selected route and trip direction.
                  </p>

                  {estimate.breakdown && estimate.breakdown.length > 0 && (
                    <div className="mt-5 space-y-2">
                      {estimate.breakdown.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs"
                        >
                          <span className="text-neutral-400">
                            {item.label}
                          </span>
                          <span className="font-semibold text-white">
                            ${formatMoney(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : estimate?.requiresManualQuote ? (
                <div className="mt-4 rounded-2xl border border-[#C8A96A]/20 bg-[#C8A96A]/10 p-4 text-sm text-[#C8A96A]">
                  {estimate.message ||
                    'This request requires manual price confirmation.'}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-neutral-500">
                  Your price estimate will appear here after you select your
                  route and travel details.
                </p>
              )}
            </div>

            {bookingResponse && (
              <div className="rounded-3xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 p-6">
                <p className="text-sm font-semibold text-[#C8A96A]">
                  Booking Request Received
                </p>

                <p className="mt-3 text-sm leading-6 text-neutral-300">
                  Your booking reference is:
                </p>

                <p className="mt-3 rounded-2xl border border-[#C8A96A]/30 bg-black/30 px-4 py-3 text-center text-xl font-semibold text-white">
                  {bookingResponse.bookingRef}
                </p>

                <div className="mt-4 space-y-2 text-sm text-neutral-300">
                  <p>Status: {bookingResponse.status}</p>
                  <p>Payment: {bookingResponse.paymentStatus}</p>
                  <p>Estimated Price: ${formatMoney(bookingResponse.finalPrice)}</p>
                </div>

                <p className="mt-4 text-xs leading-5 text-neutral-500">
                  Keep this reference safe. You can use it later to track your
                  booking.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

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
    </main>
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
    <div>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[11px] font-bold text-[#C8A96A]">
          {number}
        </span>

        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>
      </div>
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
    <div className={`rounded-3xl border p-5 text-sm ${classes}`}>
      {message}
    </div>
  );
}

function modeButtonClass(active: boolean) {
  return `rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
    active
      ? 'border-[#C8A96A]/50 bg-[#C8A96A]/15 text-[#C8A96A]'
      : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:border-[#C8A96A]/40 hover:text-white'
  }`;
}