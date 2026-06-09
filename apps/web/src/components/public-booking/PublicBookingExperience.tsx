'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';
const WHATSAPP_NUMBER = '263773615432';
const CONTACT_EMAIL = 'info@ladybirdshuttles.co.zw';
const CONTACT_PHONE_DISPLAY = '+263 77 361 5432';

type PublicBookingExperienceVariant = 'full' | 'compactHero';

type PublicBookingExperienceProps = {
  variant?: PublicBookingExperienceVariant;
};

type ViewMode = 'BOOK' | 'TRACK';
type TripDirection = '' | 'ONE_WAY' | 'ROUND_TRIP';
type RouteMode = 'SAVED_ROUTE' | 'CUSTOM_ROUTE';

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
  isDeleted?: boolean;
};

type SmartRouteEstimate = {
  requiresManualQuote: boolean;
  pricingMode?: string;
  companyId: string;
  pickupLocation: string;
  destination: string;
  tripDirection: TripDirection;
  passengers: number;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  estimatedPrice?: number | null;
  matchedRouteId?: string | null;
  matchedRouteName?: string | null;
  matchedRouteDirection?: string | null;
  message?: string;
  reason?: string;
  breakdown?: {
    label: string;
    amount: number;
  }[];
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

function getSmartEstimateDistanceKm(
  estimate: PriceCalculation | SmartRouteEstimate | null,
) {
  if (!estimate || !('distanceKm' in estimate)) {
    return undefined;
  }

  return estimate.distanceKm;
}

function getSmartEstimateDurationMinutes(
  estimate: PriceCalculation | SmartRouteEstimate | null,
) {
  if (!estimate || !('durationMinutes' in estimate)) {
    return undefined;
  }

  return estimate.durationMinutes;
}

function hasSmartEstimateDetails(
  estimate: PriceCalculation | SmartRouteEstimate | null,
) {
  const distanceKm = getSmartEstimateDistanceKm(estimate);
  const durationMinutes = getSmartEstimateDurationMinutes(estimate);

  return (
    (typeof distanceKm === 'number' && distanceKm > 0) ||
    (typeof durationMinutes === 'number' && durationMinutes > 0) ||
    Boolean(
      estimate &&
        'matchedRouteName' in estimate &&
        estimate.matchedRouteName?.trim(),
    )
  );
}

function resolveCustomTripType(
  estimate: PriceCalculation | SmartRouteEstimate | null,
) {
  return hasSmartEstimateDetails(estimate)
    ? 'Smart Custom Route'
    : 'Custom Route Request';
}


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

type PaymentCheckoutResponse = {
  success: boolean;
  paynowConfigured?: boolean;
  requiresConfiguration?: boolean;
  message: string;
  bookingRef: string;
  bookingId: string;
  paymentId: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'BALANCE';
  paynowPaymentMethod: 'WEB' | 'ECOCASH' | 'ONEMONEY';
  amount: number;
  currency: string;
  paymentStatus: string;
  redirectUrl?: string | null;
  whatsapp?: string;
};

type TrackedBooking = {
  bookingRef: string;
  bookingId: string;
  status: string;
  paymentStatus: string;
  tripType: string;
  tripDirection: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  dropoffDate?: string | null;
  returnDate?: string | null;
  returnPickupLocation?: string | null;
  returnDestination?: string | null;
  passengers: number;
  estimatedPrice?: string | number | null;
  finalPrice?: string | number | null;
  depositAmount?: string | number | null;
  customer: {
    fullName: string;
    phone: string;
  };
  route?: {
    name: string;
    pickupCity: string;
    destinationCity: string;
  } | null;
  driver?: {
    fullName: string;
  } | null;
  vehicle?: {
    name: string;
    registrationNo: string;
  } | null;
};

type BookingForm = {
  routeMode: RouteMode;
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
  customerIdNumber: string;
  customerPhone: string;
  customerEmail: string;
};

const initialForm: BookingForm = {
  routeMode: 'SAVED_ROUTE',
  routeId: '',
  tripDirection: '',

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
  customerIdNumber: '',
  customerPhone: '',
  customerEmail: '',
};

function calculateBalanceAfterDeposit(
  price: string | number | null | undefined,
  deposit: string | number | null | undefined,
) {
  const parsedPrice = Number(price ?? 0);
  const parsedDeposit = Number(deposit ?? 0);

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return 0;
  }

  if (!Number.isFinite(parsedDeposit) || parsedDeposit <= 0) {
    return parsedPrice;
  }

  return Math.max(0, Number((parsedPrice - parsedDeposit).toFixed(2)));
}

export default function PublicBookingExperience({
  variant = 'full',
}: PublicBookingExperienceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('BOOK');

  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [form, setForm] = useState<BookingForm>(initialForm);

  const [estimate, setEstimate] = useState<PriceCalculation | SmartRouteEstimate | null>(null);
  const [bookingResponse, setBookingResponse] =
    useState<BookingResponse | null>(null);

  const [trackingRef, setTrackingRef] = useState('');
  const [trackedBooking, setTrackedBooking] = useState<TrackedBooking | null>(
    null,
  );

  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<
    'DEPOSIT' | 'FULL_PAYMENT' | null
  >(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedRoute = routes.find((route) => route.id === form.routeId);
  const usesRoundTrip = form.tripDirection === 'ROUND_TRIP';
  const usesCustomRoute = form.routeMode === 'CUSTOM_ROUTE';

  const activeRoutes = useMemo(() => {
    return routes.filter((route) => route.isActive && !route.isDeleted);
  }, [routes]);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoadingRoutes(true);
        const routesData = await apiGet<RouteRecord[] | RouteRecord>(
          '/public-routes',
        );
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

  useEffect(() => {
    if (
      loadingRoutes ||
      activeRoutes.length > 0 ||
      form.routeMode === 'CUSTOM_ROUTE'
    ) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      routeMode: 'CUSTOM_ROUTE',
      routeId: '',
      pickupLocation: '',
      destination: '',
      returnPickupLocation: '',
      returnDestination: '',
    }));
    setEstimate(null);
    setBookingResponse(null);
    setErrorMessage('');
    setSuccessMessage('');
  }, [activeRoutes.length, form.routeMode, loadingRoutes]);

  function clearMessages() {
    setErrorMessage('');
    setSuccessMessage('');
  }

  function updateForm(field: keyof BookingForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setEstimate(null);
    setBookingResponse(null);
    clearMessages();
  }

  function setRouteMode(mode: RouteMode) {
    setForm((currentForm) => {
      if (mode === 'CUSTOM_ROUTE') {
        return {
          ...currentForm,
          routeMode: mode,
          routeId: '',
          pickupLocation: '',
          destination: '',
          returnPickupLocation: '',
          returnDestination: '',
        };
      }

      return {
        ...currentForm,
        routeMode: mode,
        pickupLocation: '',
        destination: '',
        returnPickupLocation: '',
        returnDestination: '',
      };
    });

    setEstimate(null);
    setBookingResponse(null);
    clearMessages();
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
    setBookingResponse(null);
    clearMessages();
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
    clearMessages();
  }

  function switchMode(mode: ViewMode) {
    setViewMode(mode);
    clearMessages();
    setEstimate(null);
    setBookingResponse(null);
    setTrackedBooking(null);
  }

  function formatMoney(value: string | number | null | undefined) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
  }

  function formatDate(value?: string | null) {
    if (!value) {
      return 'Not set';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not set';
    }

    return date.toLocaleString();
  }

  function humanise(value?: string | null) {
    if (!value) {
      return 'Not set';
    }

    return value.replaceAll('_', ' ');
  }

  function mapRouteTypeToTripType(routeType?: string) {
    const map: Record<string, string> = {
      CITY_TO_CITY: 'CITY_TO_CITY',
      AIRPORT_TRANSFER: 'AIRPORT_TRANSFER',
      LOCAL_TRANSFER: 'CUSTOM',
      PRIVATE_HIRE: 'PRIVATE_HIRE',
      TOUR_PACKAGE: 'TOURISM',
      CORPORATE_TRANSFER: 'CORPORATE_TRANSPORT',
      CUSTOM: 'CUSTOM',
    };

    return routeType ? map[routeType] ?? 'CUSTOM' : 'CITY_TO_CITY';
  }

  function validateBookingForm(requireCustomerDetails: boolean) {
    if (!usesCustomRoute && activeRoutes.length === 0) {
      return 'No saved fare routes are currently available for instant pricing. Please use Custom Route to request a quote.';
    }

    if (!usesCustomRoute && !form.routeId) {
      return 'Please select a route or choose Custom Route.';
    }

    if (!form.tripDirection) {
      return 'Please choose One-way Trip or Round Trip.';
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

      if (!form.customerIdNumber.trim()) {
        return 'Please enter your ID or passport number.';
      }

      if (!form.customerPhone.trim()) {
        return 'Please enter your phone or WhatsApp number.';
      }

      if (!form.customerEmail.trim()) {
        return 'Please enter your email address.';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
        return 'Please enter a valid email address.';
      }
    }

    return '';
  }

  async function estimatePrice() {
    clearMessages();
    setBookingResponse(null);

    const validationError = validateBookingForm(false);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setEstimating(true);

      const result = usesCustomRoute
        ? await apiPost<SmartRouteEstimate>('/smart-routes/estimate', {
            companyId: COMPANY_ID,
            pickupLocation: form.pickupLocation.trim(),
            destination: form.destination.trim(),
            tripDirection: form.tripDirection,
            passengers: Number(form.passengers),
          })
        : await apiPost<PriceCalculation>('/public-bookings/estimate', {
            companyId: COMPANY_ID,
            routeId: usesCustomRoute ? undefined : form.routeId,
        tripType: usesCustomRoute
          ? 'CUSTOM'
          : mapRouteTypeToTripType(selectedRoute?.routeType),
        customTripType: usesCustomRoute
          ? resolveCustomTripType(estimate)
          : undefined,
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
          });

      setEstimate(result);

      if (result.requiresManualQuote) {
        setSuccessMessage(
          result.message ||
            (usesCustomRoute && hasSmartEstimateDetails(result)
              ? 'Route details are ready. Manual quote confirmation is still pending.'
              : 'This trip requires a manual quote. You can still submit your request.'),
        );
      } else {
        setSuccessMessage(
          usesCustomRoute
            ? 'Smart route estimate ready.'
            : 'Estimate ready.',
        );
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

    clearMessages();
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
        nationalId: form.customerIdNumber.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim(),

        routeId: usesCustomRoute ? undefined : form.routeId,
        tripType: usesCustomRoute
          ? 'CUSTOM'
          : mapRouteTypeToTripType(selectedRoute?.routeType),
        customTripType: usesCustomRoute
          ? resolveCustomTripType(estimate)
          : undefined,
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
        estimatedPrice: usesCustomRoute
          ? estimate?.estimatedPrice || undefined
          : undefined,
        finalPrice: usesCustomRoute
          ? estimate?.estimatedPrice || undefined
          : undefined,
        smartPricingMode:
          usesCustomRoute && estimate && 'pricingMode' in estimate
            ? estimate.pricingMode || undefined
            : undefined,
        smartDistanceKm:
          usesCustomRoute && estimate && 'distanceKm' in estimate
            ? getSmartEstimateDistanceKm(estimate) || undefined
            : undefined,
        smartDurationMinutes:
          usesCustomRoute && estimate && 'durationMinutes' in estimate
            ? getSmartEstimateDurationMinutes(estimate) || undefined
            : undefined,
        matchedRouteId:
          usesCustomRoute && estimate && 'matchedRouteId' in estimate
            ? estimate.matchedRouteId || undefined
            : undefined,
        matchedRouteName:
          usesCustomRoute && estimate && 'matchedRouteName' in estimate
            ? estimate.matchedRouteName || undefined
            : undefined,
        matchedRouteDirection:
          usesCustomRoute && estimate && 'matchedRouteDirection' in estimate
            ? estimate.matchedRouteDirection || undefined
            : undefined,
      });

      setBookingResponse(response);
      setTrackedBooking(null);
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

  async function createPaymentCheckout(
    bookingId: string,
    paymentType: 'DEPOSIT' | 'FULL_PAYMENT',
  ) {
    clearMessages();

    if (!bookingId) {
      setErrorMessage('Booking ID is missing. Please try submitting again.');
      return;
    }

    try {
      setPaymentLoading(paymentType);

      const response = await apiPost<PaymentCheckoutResponse>(
        '/public-payments/create-checkout',
        {
          bookingId,
          paymentType,
          paynowPaymentMethod: 'WEB',
        },
      );

      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return;
      }

      if (response.requiresConfiguration) {
        setErrorMessage(response.message);
        return;
      }

      setSuccessMessage(response.message || 'Payment checkout prepared.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to start payment checkout.',
      );
    } finally {
      setPaymentLoading(null);
    }
  }

  async function trackBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanRef = trackingRef.trim().toUpperCase();

    clearMessages();
    setTrackedBooking(null);

    if (!cleanRef) {
      setErrorMessage('Please enter your booking reference.');
      return;
    }

    try {
      setTracking(true);

      const result = await apiGet<TrackedBooking>(
        `/public-bookings/track/${encodeURIComponent(cleanRef)}`,
      );

      setTrackedBooking(result);
      setBookingResponse(null);
      setSuccessMessage('Booking found.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to find booking. Please check your booking reference.',
      );
    } finally {
      setTracking(false);
    }
  }

  const hasResult = estimate || bookingResponse || trackedBooking;

  return (
    <main data-view-variant={variant} className="relative min-h-dvh overflow-hidden bg-[#030303] text-white">
      <div
        className="booking-bg pointer-events-none absolute inset-0 bg-cover bg-right-top bg-no-repeat opacity-72"
      />

      <div className="pointer-events-none absolute inset-0 bg-black/38" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.76)_0%,rgba(5,5,5,0.48)_42%,rgba(0,0,0,0.9)_100%)]" />

      <div className="glass-motion-layer" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_30%)]" />

      <div className="animated-orb orb-one" />
      <div className="animated-orb orb-two" />
      <div className="animated-orb orb-three" />

      <section className="relative border-b border-white/10 px-4 py-8 sm:px-5 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
            LadyBird Shuttle Services
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_440px] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-[2.45rem] font-semibold leading-[1.02] tracking-tight sm:text-4xl md:text-6xl">
                Book and track your shuttle.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400 md:text-base">
                A clean booking experience for one-way trips, round trips,
                airport transfers and city-to-city travel.
              </p>
            </div>

            <div className="premium-glass glass-card-motion rounded-[28px] border border-white/10 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchMode('BOOK')}
                  className={tabButtonClass(viewMode === 'BOOK')}
                >
                  Book a Shuttle
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('TRACK')}
                  className={tabButtonClass(viewMode === 'TRACK')}
                >
                  Track Booking
                </button>
              </div>

              <p className="mt-3 px-2 text-sm leading-6 text-neutral-500">
                {viewMode === 'BOOK'
                  ? 'Submit your trip details through the secure booking form and keep your reference for tracking.'
                  : 'Enter your booking reference to view the latest status.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-6 sm:px-5 md:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="premium-glass glass-card-motion overflow-visible rounded-[28px] border border-white/10 text-white shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <h2 className="text-xl font-semibold">
                {viewMode === 'BOOK' ? 'Booking Details' : 'Track Booking'}
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                {viewMode === 'BOOK'
                  ? 'Complete the compact form below. Required fields are marked.'
                  : 'Use the booking reference you received after submitting your request.'}
              </p>
            </div>

            {viewMode === 'BOOK' ? (
              <BookingFormView
                form={form}
                activeRoutes={activeRoutes}
                selectedRoute={selectedRoute}
                loadingRoutes={loadingRoutes}
                estimating={estimating}
                submitting={submitting}
                estimatePrice={estimatePrice}
                submitBooking={submitBooking}
                updateForm={updateForm}
                selectRoute={selectRoute}
                setTripDirection={setTripDirection}
                usesRoundTrip={usesRoundTrip}
                usesCustomRoute={usesCustomRoute}
                setRouteMode={setRouteMode}
              />
            ) : (
              <TrackFormView
                trackingRef={trackingRef}
                setTrackingRef={setTrackingRef}
                tracking={tracking}
                trackBooking={trackBooking}
              />
            )}

            {(errorMessage || successMessage || hasResult) && (
              <div className="border-t border-white/10 p-5 md:p-6">
                <div className="grid gap-4">
                  {errorMessage && (
                    <Notice type="error" message={errorMessage} />
                  )}

                  {successMessage && (
                    <Notice type="success" message={successMessage} />
                  )}

                  {hasResult && (
                    <SummaryPanel
                      estimate={estimate}
                      bookingResponse={bookingResponse}
                      trackedBooking={trackedBooking}
                      formatMoney={formatMoney}
                      formatDate={formatDate}
                      humanise={humanise}
                      switchMode={switchMode}
                      setTrackingRef={setTrackingRef}
                      createPaymentCheckout={createPaymentCheckout}
                      paymentLoading={paymentLoading}
                    />
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      <BookingFooter switchMode={switchMode} />

      <NeedHelpButton />

      <style jsx global>{`
        .booking-bg {
          background-image: url("/booking-bg-desktop.jpg");
          background-position: right center;
          transform: scale(1.08);
          transform-origin: center;
          animation: backgroundDrift 28s ease-in-out infinite alternate;
          filter: saturate(0.9) contrast(1.08) brightness(0.94);
        }

        @media (max-width: 768px) {
          .booking-bg {
            background-image: url("/booking-bg-mobile.jpg");
            background-position: center top;
            transform: scale(1.04);
          }
        }

        .glass-motion-layer {
          pointer-events: none;
          position: absolute;
          inset: -20%;
          background:
            linear-gradient(
              115deg,
              transparent 0%,
              rgba(255, 255, 255, 0.035) 24%,
              transparent 42%
            ),
            linear-gradient(
              65deg,
              transparent 0%,
              rgba(255, 255, 255, 0.025) 18%,
              transparent 36%
            );
          transform: translateX(-18%) rotate(0deg);
          animation: glassSweep 18s ease-in-out infinite alternate;
          opacity: 0.9;
        }

        .animated-orb {
          pointer-events: none;
          position: absolute;
          border-radius: 9999px;
          background:
            radial-gradient(
              circle at 30% 30%,
              rgba(255, 255, 255, 0.22),
              rgba(255, 255, 255, 0.06) 40%,
              rgba(255, 255, 255, 0.015) 72%,
              transparent 100%
            );
          filter: blur(3px);
          opacity: 0.72;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        .orb-one {
          left: -120px;
          top: 150px;
          height: 330px;
          width: 330px;
          animation-name: floatOne;
          animation-duration: 18s;
        }

        .orb-two {
          right: 7%;
          top: 220px;
          height: 400px;
          width: 400px;
          opacity: 0.52;
          animation-name: floatTwo;
          animation-duration: 22s;
        }

        .orb-three {
          bottom: 5%;
          left: 44%;
          height: 290px;
          width: 290px;
          opacity: 0.44;
          animation-name: floatThree;
          animation-duration: 20s;
        }

        .premium-glass {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.11) 0%,
              rgba(255, 255, 255, 0.062) 42%,
              rgba(255, 255, 255, 0.036) 100%
            );
          backdrop-filter: blur(30px) saturate(165%);
          -webkit-backdrop-filter: blur(30px) saturate(165%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 0 rgba(255, 255, 255, 0.025),
            0 28px 90px rgba(0, 0, 0, 0.55);
        }

        .premium-glass::before {
          content: '';
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            radial-gradient(
              circle at 20% 10%,
              rgba(255, 255, 255, 0.13),
              transparent 26%
            ),
            linear-gradient(
              120deg,
              transparent 0%,
              rgba(255, 255, 255, 0.055) 22%,
              transparent 44%
            );
          transform: translateX(-18%);
          opacity: 0.8;
          animation: cardReflection 12s ease-in-out infinite alternate;
        }

        .glass-card-motion {
          animation: cardFloat 12s ease-in-out infinite alternate;
        }

        .input-glass {
          width: 100%;
          height: 46px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.075);
          padding: 0 14px;
          font-size: 0.86rem;
          color: #ffffff;
          outline: none;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .input-glass:hover {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.095);
        }

        .input-glass:focus {
          border-color: rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.11);
          box-shadow:
            0 0 0 3px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .input-glass::placeholder {
          color: rgba(255, 255, 255, 0.32);
          font-size: 0.78rem;
          letter-spacing: 0.01em;
        }

        input[type='datetime-local']::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.65;
          cursor: pointer;
        }

        input[type='datetime-local']::-webkit-calendar-picker-indicator:hover {
          opacity: 0.95;
        }

        @keyframes backgroundDrift {
          from {
            transform: scale(1.08) translate3d(-1.2%, -0.8%, 0);
            filter: saturate(0.88) contrast(1.05) brightness(0.9);
          }
          to {
            transform: scale(1.14) translate3d(1.4%, 1%, 0);
            filter: saturate(0.95) contrast(1.14) brightness(1);
          }
        }

        @keyframes glassSweep {
          from {
            transform: translate3d(-18%, -4%, 0) rotate(-2deg);
          }
          to {
            transform: translate3d(14%, 5%, 0) rotate(2deg);
          }
        }

        @keyframes cardReflection {
          from {
            transform: translateX(-24%);
            opacity: 0.52;
          }
          to {
            transform: translateX(16%);
            opacity: 0.82;
          }
        }

        @keyframes cardFloat {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(0, -2px, 0);
          }
        }

        @keyframes floatOne {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(60px, 35px, 0) scale(1.08);
          }
        }

        @keyframes floatTwo {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(-55px, 45px, 0) scale(1.05);
          }
        }

        @keyframes floatThree {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(45px, -35px, 0) scale(1.1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .booking-bg,
          .glass-motion-layer,
          .animated-orb,
          .premium-glass::before,
          .glass-card-motion {
            animation: none;
          }
        }
      
  .premium-glass,
  .premium-glass button,
  .premium-glass input,
  .premium-glass select,
  .premium-glass textarea {
    font-family: Inter, Poppins, Montserrat, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    letter-spacing: -0.01em;
  }

  .premium-glass button,
  .input-glass {
    font-size: 0.875rem;
    font-weight: 400;
  }

      `}</style>
    </main>
  );
}



function BookingFooter({
  switchMode,
}: {
  switchMode: (mode: ViewMode) => void;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 px-5 py-9 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-neutral-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-200">
            LadyBird Shuttle Services
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-500">
            Premium shuttle bookings for airport transfers, city-to-city trips,
            round trips and private hire across Zimbabwe.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="transition hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="transition hover:text-white"
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <nav
          aria-label="Public booking quick links"
          className="flex flex-wrap items-center gap-3 text-sm font-medium text-neutral-400"
        >
          <a href="/" className="transition hover:text-white">
            Home
          </a>

          <span className="text-neutral-700">/</span>

          <button
            type="button"
            onClick={() => switchMode('BOOK')}
            className="transition hover:text-white"
          >
            Book a Shuttle
          </button>

          <span className="text-neutral-700">/</span>

          <button
            type="button"
            onClick={() => switchMode('TRACK')}
            className="transition hover:text-white"
          >
            Track Booking
          </button>

          <span className="text-neutral-700">/</span>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              'Hello LadyBird Shuttle Services, I need help with my shuttle booking.',
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
          >
            WhatsApp
          </a>
        </nav>
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-2 border-t border-white/10 pt-5 text-xs leading-6 text-neutral-600 md:flex-row md:items-center md:justify-between">
        <p>&copy; {year} All Rights Reserved | LadyBird Shuttle Services</p>
        <p>
          Developed & Powered by{' '}
          <a
            href="https://truman.co.zw"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-400 transition hover:text-white"
          >
            Tirivsdhe Marinda
          </a>
        </p>
      </div>
    </footer>
  );
}

function NeedHelpButton() {
  const message =
    'Hello LadyBird Shuttle Services, I need help with my shuttle booking.';

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message,
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white px-4 py-2.5 text-xs font-semibold text-black shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition hover:bg-neutral-200 md:bottom-7 md:right-7"
      aria-label="Need help on WhatsApp"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          fill="currentColor"
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2.05 22l5.25-1.38a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.37c0-4.54 3.69-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.41 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.96-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.64 4.2 3.7.59.25 1.05.4 1.41.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z"
        />
      </svg>
      Need help?
    </a>
  );
}

function BookingFormView({
  form,
  activeRoutes,
  selectedRoute,
  loadingRoutes,
  estimating,
  submitting,
  estimatePrice,
  submitBooking,
  updateForm,
  selectRoute,
  setTripDirection,
  usesRoundTrip,
  usesCustomRoute,
  setRouteMode,
}: {
  form: BookingForm;
  activeRoutes: RouteRecord[];
  selectedRoute?: RouteRecord;
  loadingRoutes: boolean;
  estimating: boolean;
  submitting: boolean;
  estimatePrice: () => void;
  submitBooking: (event: FormEvent<HTMLFormElement>) => void;
  updateForm: (field: keyof BookingForm, value: string) => void;
  selectRoute: (routeId: string) => void;
  setTripDirection: (direction: TripDirection) => void;
  usesRoundTrip: boolean;
  usesCustomRoute: boolean;
  setRouteMode: (mode: RouteMode) => void;
}) {
  const hasSavedRoutes = activeRoutes.length > 0;

  return (
    <form noValidate onSubmit={submitBooking} className="space-y-4 p-4 sm:p-5">
      <section>
        <SectionTitle
          number="01"
          title="Route and trip"
          subtitle="Choose route and trip direction."
        />

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {!hasSavedRoutes ? (
            <button
              type="button"
              disabled
              className={`${modeButtonClass(false)} cursor-not-allowed opacity-65`}
            >
              Saved routes unavailable
            </button>
          ) : !usesCustomRoute ? (
            <RoutePicker
              routes={activeRoutes}
              selectedRoute={selectedRoute}
              loadingRoutes={loadingRoutes}
              onSelect={selectRoute}
            />
          ) : (
            <button
              type="button"
              onClick={() => setRouteMode('SAVED_ROUTE')}
              className={modeButtonClass(false)}
            >
              Saved Routes
            </button>
          )}

          <button
            type="button"
            onClick={() => setRouteMode('CUSTOM_ROUTE')}
            className={modeButtonClass(form.routeMode === 'CUSTOM_ROUTE')}
          >
            Custom Route
          </button>

          <button
            type="button"
            onClick={() => setTripDirection('ONE_WAY')}
            className={modeButtonClass(form.tripDirection === 'ONE_WAY')}
          >
            One-way Trip
          </button>

          <button
            type="button"
            onClick={() => setTripDirection('ROUND_TRIP')}
            className={modeButtonClass(form.tripDirection === 'ROUND_TRIP')}
          >
            Round Trip
          </button>
        </div>

        {!hasSavedRoutes && !loadingRoutes && (
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-medium leading-6 text-neutral-300">
            No saved fare routes are currently available for instant pricing.
            Please use Custom Route to request a quote.
          </p>
        )}

        {usesCustomRoute && (
          <p className="mt-3 text-xs font-medium text-neutral-400">
            Enter your exact pickup and destination below.
          </p>
        )}

        {!usesCustomRoute && selectedRoute && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="min-w-0">
                <p className="break-words font-semibold text-white">{selectedRoute.name}</p>
                <p className="mt-1 text-sm text-neutral-400">
                  {selectedRoute.pickupCity} → {selectedRoute.destinationCity}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-neutral-300">
                  {selectedRoute.pricingMode.replaceAll('_', ' ')}
                </p>
                <p className="text-xs text-neutral-500">
                  Fare will be shown after estimate
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          number="02"
          title="Travel details"
          subtitle="Add pickup, destination and luggage information."
        />

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FormField label="Pickup Date & Time" required>
            <input
              type="datetime-local"
              value={form.pickupDate}
              onChange={(event) => updateForm('pickupDate', event.target.value)}
              className="input-glass"
            />
          </FormField>

          <FormField label="Pickup Point" required>
            <LocationAutocompleteInput
              value={form.pickupLocation}
              onChange={(value) => updateForm('pickupLocation', value)}
              placeholder="Example: Harare CBD"
              className="input-glass"
            />
          </FormField>

          <FormField label="Destination" required>
            <LocationAutocompleteInput
              value={form.destination}
              onChange={(value) => updateForm('destination', value)}
              placeholder="Example: Masvingo CBD"
              className="input-glass"
            />
          </FormField>

          <FormField label="Passengers" required>
            <input
              type="number"
              min="1"
              value={form.passengers}
              onChange={(event) => updateForm('passengers', event.target.value)}
              className="input-glass"
            />
          </FormField>



          <FormField label="Luggage">
            <input
              value={form.luggageDetails}
              onChange={(event) =>
                updateForm('luggageDetails', event.target.value)
              }
              placeholder="Example: 2 bags"
              className="input-glass"
            />
          </FormField>
        </div>

        {usesRoundTrip && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <p className="text-sm font-semibold text-white">Return Journey</p>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Return Date & Time" required>
                <input
                  type="datetime-local"
                  value={form.returnDate}
                  onChange={(event) =>
                    updateForm('returnDate', event.target.value)
                  }
                  className="input-glass"
                />
              </FormField>

              <FormField label="Return Pickup Point" required>
                <LocationAutocompleteInput
                  value={form.returnPickupLocation}
                  onChange={(value) =>
                    updateForm('returnPickupLocation', value)
                  }
                  placeholder="Example: Masvingo CBD"
                  className="input-glass"
                />
              </FormField>

              <FormField label="Return Destination" required>
                <LocationAutocompleteInput
                  value={form.returnDestination}
                  onChange={(value) => updateForm('returnDestination', value)}
                  placeholder="Example: Harare CBD"
                  className="input-glass"
                />
              </FormField>

              <FormField label="Return Notes">
                <input
                  value={form.returnNotes}
                  onChange={(event) =>
                    updateForm('returnNotes', event.target.value)
                  }
                  placeholder="Optional instructions"
                  className="input-glass"
                />
              </FormField>
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          number="03"
          title="Your details"
          subtitle="We will use these details to confirm your booking."
        />

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="Full Name" required>
            <input
              value={form.customerName}
              onChange={(event) =>
                updateForm('customerName', event.target.value)
              }
              placeholder="Enter your full name"
              className="input-glass"
            />
          </FormField>

          <FormField label="ID / Passport No." required>
            <input
              value={form.customerIdNumber}
              onChange={(event) =>
                updateForm('customerIdNumber', event.target.value)
              }
              placeholder="ID or passport number"
              className="input-glass"
            />
          </FormField>

          <FormField label="Phone / WhatsApp" required>
            <input
              value={form.customerPhone}
              onChange={(event) =>
                updateForm('customerPhone', event.target.value)
              }
              placeholder="+263..."
              className="input-glass"
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(event) =>
                updateForm('customerEmail', event.target.value)
              }
              placeholder="you@example.com"
              className="input-glass"
            />
          </FormField>
        </div>

        <div className="mt-3">
          <FormField label="Special Request">
            <input
              value={form.specialNotes}
              onChange={(event) =>
                updateForm('specialNotes', event.target.value)
              }
              placeholder="Optional message"
              className="input-glass"
            />
          </FormField>
        </div>

      </section>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
        <button
          type="button"
          onClick={estimatePrice}
          disabled={estimating}
          className="rounded-full border border-white/20 bg-white/[0.03] px-5 py-3 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {estimating ? 'Calculating...' : 'Get Estimate'}
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Booking'}
        </button>
      </div>
    </form>
  );
}

function RoutePicker({
  routes,
  selectedRoute,
  loadingRoutes,
  onSelect,
}: {
  routes: RouteRecord[];
  selectedRoute?: RouteRecord;
  loadingRoutes: boolean;
  onSelect: (routeId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-[46px] w-full items-center justify-between rounded-2xl border border-white/15 bg-white/[0.055] px-4 text-left text-sm text-white transition hover:border-white/25 hover:bg-white/[0.075]"
      >
        <span className="truncate">
          {selectedRoute
            ? selectedRoute.name
            : loadingRoutes
              ? 'Loading routes...'
              : 'Saved Routes'}
        </span>

        <span
          className={`ml-4 shrink-0 text-xs text-neutral-500 transition ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-white/10 bg-[#0c0c0d]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          {routes.length === 0 && (
            <div className="rounded-xl px-3 py-3 text-sm text-neutral-400">
              No saved fare routes are currently available for instant pricing.
              Please use Custom Route to request a quote.
            </div>
          )}

          {routes.map((route) => (
            <button
              key={route.id}
              type="button"
              onClick={() => {
                onSelect(route.id);
                setOpen(false);
              }}
              className={`w-full rounded-xl px-4 py-3 text-left transition ${
                selectedRoute?.id === route.id
                  ? 'bg-white/[0.10]'
                  : 'hover:bg-white/[0.06]'
              }`}
            >
              <span className="block break-words text-sm font-semibold text-white">
                {route.name}
              </span>

              <span className="mt-1 block break-words text-xs text-neutral-400">
                {route.pickupCity} → {route.destinationCity}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackFormView({
  trackingRef,
  setTrackingRef,
  tracking,
  trackBooking,
}: {
  trackingRef: string;
  setTrackingRef: (value: string) => void;
  tracking: boolean;
  trackBooking: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form noValidate onSubmit={trackBooking} className="space-y-6 p-4 sm:p-5 md:p-6">
      <SectionTitle
        number="01"
        title="Booking reference"
        subtitle="Enter the reference you received after submitting your booking."
      />

      <FormField label="Booking Reference" required>
        <input
          value={trackingRef}
          onChange={(event) => setTrackingRef(event.target.value)}
          placeholder="Example: LB-20260523-3899"
          className="input-glass uppercase"
        />
      </FormField>

      <button
        type="submit"
        disabled={tracking}
        className="w-full rounded-full bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {tracking ? 'Checking...' : 'Track Booking'}
      </button>
    </form>
  );
}

function SummaryPanel({
  estimate,
  bookingResponse,
  trackedBooking,
  formatMoney,
  formatDate,
  humanise,
  switchMode,
  setTrackingRef,
  createPaymentCheckout,
  paymentLoading,
}: {
  estimate: PriceCalculation | SmartRouteEstimate | null;
  bookingResponse: BookingResponse | null;
  trackedBooking: TrackedBooking | null;
  formatMoney: (value: string | number | null | undefined) => string;
  formatDate: (value?: string | null) => string;
  humanise: (value?: string | null) => string;
  switchMode: (mode: ViewMode) => void;
  setTrackingRef: (value: string) => void;
  createPaymentCheckout: (
    bookingId: string,
    paymentType: 'DEPOSIT' | 'FULL_PAYMENT',
  ) => void;
  paymentLoading: 'DEPOSIT' | 'FULL_PAYMENT' | null;
}) {
  if (bookingResponse) {
    const confirmationUrl = `/booking/track?reference=${encodeURIComponent(
      bookingResponse.bookingRef,
    )}`;

    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-white backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Booking Received
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
          <div>
            <h3 className="text-xl font-semibold">Reference issued</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Keep this booking reference safe for tracking.
            </p>
          </div>

          <p className="break-words rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-xl font-semibold">
            {bookingResponse.bookingRef}
          </p>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-neutral-300 md:grid-cols-3">
          <p>Status: {humanise(bookingResponse.status)}</p>
          <p>Payment: {humanise(bookingResponse.paymentStatus)}</p>
          <p>Price: ${formatMoney(bookingResponse.finalPrice)}</p>
          <p>Deposit after approval: ${formatMoney(bookingResponse.depositAmount)}</p>
          <p>
            Balance after deposit: $
            {formatMoney(
              calculateBalanceAfterDeposit(
                bookingResponse.finalPrice,
                bookingResponse.depositAmount,
              ),
            )}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-neutral-200">
          Booking request received. Payment will be available once our team approves your booking.
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            href={confirmationUrl}
            className="rounded-full bg-white px-5 py-3 text-center text-xs font-semibold text-black transition hover:bg-neutral-200"
          >
            Track Booking
          </a>

          <a
            href={confirmationUrl}
            className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-center text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            Print Confirmation
          </a>

          <button
            type="button"
            onClick={() => {
              setTrackingRef(bookingResponse.bookingRef);
              switchMode('TRACK');
            }}
            className="rounded-full border border-white/10 bg-transparent px-5 py-3 text-xs font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white sm:col-span-2"
          >
            Track on this page
          </button>
        </div>
      </div>
    );
  }

  if (trackedBooking) {
    const paymentAllowedStatuses = [
      'CONFIRMED',
      'DRIVER_ASSIGNED',
      'VEHICLE_ASSIGNED',
      'IN_PROGRESS',
    ];

    const paymentBlockedStatuses = ['PENDING', 'CANCELLED', 'NO_SHOW', 'COMPLETED'];

    const canPay =
      paymentAllowedStatuses.includes(trackedBooking.status) &&
      trackedBooking.paymentStatus !== 'PAID';

    const isAwaitingApproval = trackedBooking.status === 'PENDING';
    const isInactiveBooking = paymentBlockedStatuses.includes(trackedBooking.status);

    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] text-white backdrop-blur-xl">
        <div className="border-b border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Booking Found
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="break-words text-2xl font-semibold">
                {trackedBooking.bookingRef}
              </h3>

              <p className="mt-1 text-sm text-neutral-400">
                {trackedBooking.customer.fullName} •{' '}
                {trackedBooking.customer.phone}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill>{humanise(trackedBooking.status)}</Pill>
              <Pill>{humanise(trackedBooking.paymentStatus)}</Pill>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoBlock
            title="Trip"
            lines={[
              trackedBooking.route?.name || 'Custom trip',
              humanise(trackedBooking.tripDirection),
              `${trackedBooking.pickupLocation} → ${trackedBooking.destination}`,
            ]}
          />

          <InfoBlock
            title="Schedule"
            lines={[
              `Pickup: ${formatDate(trackedBooking.pickupDate)}`,
              trackedBooking.tripDirection === 'ROUND_TRIP'
                ? `Return: ${formatDate(trackedBooking.returnDate)}`
                : `Drop-off: ${formatDate(trackedBooking.dropoffDate)}`,
            ]}
          />

          <InfoBlock
            title="Price"
            lines={[
              `Passengers: ${trackedBooking.passengers}`,
              `Final Price: $${formatMoney(trackedBooking.finalPrice)}`,
              `Deposit Required: $${formatMoney(trackedBooking.depositAmount)}`,
              `Balance After Deposit: $${formatMoney(
                calculateBalanceAfterDeposit(
                  trackedBooking.finalPrice,
                  trackedBooking.depositAmount,
                ),
              )}`,
            ]}
          />

          <InfoBlock
            title="Assignment"
            lines={[
              `Driver: ${
                trackedBooking.driver?.fullName || 'Not assigned yet'
              }`,
              `Vehicle: ${
                trackedBooking.vehicle
                  ? `${trackedBooking.vehicle.name} (${trackedBooking.vehicle.registrationNo})`
                  : 'Not assigned yet'
              }`,
            ]}
          />
        </div>

        <div className="border-t border-white/10 p-5">
          {isAwaitingApproval && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-neutral-200">
              <p className="font-semibold text-white">Awaiting approval</p>
              <p className="mt-1">
                Your booking request is being reviewed. Payment will become available once LadyBird Shuttle Services confirms your booking.
              </p>
            </div>
          )}

          {!isAwaitingApproval && canPay && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  createPaymentCheckout(trackedBooking.bookingId, 'DEPOSIT')
                }
                disabled={paymentLoading !== null}
                className="rounded-full bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentLoading === 'DEPOSIT' ? 'Preparing...' : 'Pay Deposit'}
              </button>

              <button
                type="button"
                onClick={() =>
                  createPaymentCheckout(trackedBooking.bookingId, 'FULL_PAYMENT')
                }
                disabled={paymentLoading !== null}
                className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentLoading === 'FULL_PAYMENT'
                  ? 'Preparing...'
                  : 'Pay Full Amount'}
              </button>
            </div>
          )}

          {!isAwaitingApproval && !canPay && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-neutral-400">
              {trackedBooking.paymentStatus === 'PAID'
                ? 'Payment is complete for this booking.'
                : trackedBooking.status === 'COMPLETED'
                  ? 'This ride has been completed.'
                  : trackedBooking.status === 'CANCELLED' || trackedBooking.status === 'NO_SHOW'
                    ? 'This booking is no longer active.'
                    : 'Payment is not available for the current booking status.'}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (estimate && (!estimate.requiresManualQuote || hasSmartEstimateDetails(estimate))) {
    const distanceKm = getSmartEstimateDistanceKm(estimate);
    const durationMinutes = getSmartEstimateDurationMinutes(estimate);
    const hasConfirmedEstimate =
      !estimate.requiresManualQuote &&
      typeof estimate.estimatedPrice === 'number';

    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-white backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {hasConfirmedEstimate ? 'Estimate' : 'Route Preview'}
            </p>

            <p className="mt-3 text-4xl font-semibold">
              {hasConfirmedEstimate
                ? `$${formatMoney(estimate.estimatedPrice)}`
                : 'Manual quote pending'}
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              {hasConfirmedEstimate
                ? 'Estimated fare based on your trip details.'
                : 'Distance and timing can guide the request, but the LadyBird team will confirm the fare before travel.'}
            </p>
          </div>
          {typeof distanceKm !== 'undefined' &&
            distanceKm !== null &&
            typeof durationMinutes !== 'undefined' &&
            durationMinutes !== null && (
              <div className="grid min-w-full gap-2 md:min-w-[360px]">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs">
                  <p className="text-neutral-500">Distance</p>
                  <p className="mt-1 font-semibold text-white">
                    {distanceKm} km
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs">
                  <p className="text-neutral-500">Estimated travel time</p>
                  <p className="mt-1 font-semibold text-white">
                    {durationMinutes} min
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs">
                  <p className="text-neutral-500">Route status</p>
                  <p className="mt-1 font-semibold text-white">
                    {estimate.requiresManualQuote
                      ? 'Manual quote pending'
                      : 'Route estimate ready'}
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  if (estimate?.requiresManualQuote) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-white backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Manual Quote
        </p>

        <p className="mt-4 text-sm leading-6 text-neutral-300">
          {estimate.message ||
            'This request requires manual price confirmation.'}
        </p>
      </div>
    );
  }

  return null;
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
    <div className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {number}
      </span>

      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
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
      <span className="mb-1.5 block text-xs font-medium text-neutral-200">
        {label}
        {required && <span className="ml-1 text-white">*</span>}
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
      ? 'border-white/10 bg-white/[0.06] text-neutral-100'
      : 'border-red-500/20 bg-red-500/10 text-red-200';

  return (
    <div className={`rounded-3xl border p-5 text-sm ${classes}`}>
      {message}
    </div>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
        {title}
      </p>

      <div className="mt-3 space-y-1">
        {lines.map((line, index) => (
          <p
            key={`${title}-${index}`}
            className={
              index === 0
                ? 'break-words font-semibold text-white'
                : 'break-words text-sm text-neutral-400'
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-200">
      {children}
    </span>
  );
}

function tabButtonClass(active: boolean) {
  return `rounded-full px-4 py-2.5 text-xs font-semibold transition ${
    active
      ? 'bg-white text-black'
      : 'border border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/25 hover:text-white'
  }`;
}

function modeButtonClass(active: boolean) {
  return `rounded-2xl border px-4 py-2.5 text-xs font-semibold transition ${
    active
      ? 'border-white bg-white text-black'
      : 'border-white/10 bg-white/[0.04] text-neutral-100 hover:border-white/25 hover:bg-white/[0.07]'
  }`;
}
