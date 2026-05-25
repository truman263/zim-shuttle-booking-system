const fs = require("fs");

const path = "apps/web/src/app/booking/page.tsx";
const backupPath = "apps/web/src/app/booking/page.custom-route-backup.tsx";

const original = fs.readFileSync(path, "utf8");
let content = original;

fs.writeFileSync(backupPath, original, { encoding: "utf8" });

function restoreAndFail(message) {
  fs.writeFileSync(path, original, { encoding: "utf8" });
  throw new Error(message + "\nOriginal page.tsx restored. Backup saved at " + backupPath);
}

function replaceRegex(regex, replacement, label) {
  if (!regex.test(content)) {
    restoreAndFail("Could not match: " + label);
  }

  content = content.replace(regex, replacement);
}

try {
  // 1. Add RouteMode type.
  if (!content.includes("type RouteMode = 'SAVED_ROUTE' | 'CUSTOM_ROUTE';")) {
    replaceRegex(
      /type TripDirection = 'ONE_WAY' \| 'ROUND_TRIP';/,
      "type TripDirection = 'ONE_WAY' | 'ROUND_TRIP';\ntype RouteMode = 'SAVED_ROUTE' | 'CUSTOM_ROUTE';",
      "RouteMode type"
    );
  }

  // 2. Add SmartRouteEstimate type.
  if (!content.includes("type SmartRouteEstimate =")) {
    replaceRegex(
      /type PriceCalculation = \{/,
`type SmartRouteEstimate = {
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
  message?: string;
  reason?: string;
  breakdown?: {
    label: string;
    amount: number;
  }[];
};

type PriceCalculation = {`,
      "SmartRouteEstimate type"
    );
  }

  // 3. Widen estimate type anywhere it is used.
  content = content.replaceAll(
    "PriceCalculation | null",
    "PriceCalculation | SmartRouteEstimate | null"
  );

  // 4. Add routeMode to BookingForm.
  if (!content.includes("routeMode: RouteMode;")) {
    replaceRegex(
      /type BookingForm = \{\s*routeId: string;/,
`type BookingForm = {
  routeMode: RouteMode;
  routeId: string;`,
      "BookingForm routeMode"
    );
  }

  // 5. Add routeMode to initialForm.
  if (!content.includes("routeMode: 'SAVED_ROUTE'")) {
    replaceRegex(
      /const initialForm: BookingForm = \{\s*routeId: '',/,
`const initialForm: BookingForm = {
  routeMode: 'SAVED_ROUTE',
  routeId: '',`,
      "initialForm routeMode"
    );
  }

  // 6. Add usesCustomRoute helper after usesRoundTrip.
  if (!content.includes("const usesCustomRoute = form.routeMode === 'CUSTOM_ROUTE';")) {
    replaceRegex(
      /(const usesRoundTrip = form\.tripDirection === 'ROUND_TRIP';)/,
      "$1\n  const usesCustomRoute = form.routeMode === 'CUSTOM_ROUTE';",
      "usesCustomRoute helper"
    );
  }

  // 7. Add setRouteMode before selectRoute.
  if (!content.includes("function setRouteMode(mode: RouteMode)")) {
    replaceRegex(
      /  function selectRoute\(routeId: string\) \{/,
`  function setRouteMode(mode: RouteMode) {
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

  function selectRoute(routeId: string) {`,
      "setRouteMode function"
    );
  }

  // 8. Route ID only required for saved routes.
  replaceRegex(
    /if \(!form\.routeId\) \{\s*return 'Please select a route\.';\s*\}/,
`if (!usesCustomRoute && !form.routeId) {
      return 'Please select a route or choose Custom Route.';
    }`,
    "route validation"
  );

  // 9. Use smart-routes endpoint for custom route estimates.
  replaceRegex(
    /const result = await apiPost<PriceCalculation(?: \| SmartRouteEstimate \| null)?>\(\s*'\/public-bookings\/estimate',\s*\{[\s\S]*?roundTripDiscountPercentage: 0,\s*\},\s*\);/,
`const result = usesCustomRoute
        ? await apiPost<SmartRouteEstimate>('/smart-routes/estimate', {
            companyId: COMPANY_ID,
            pickupLocation: form.pickupLocation.trim(),
            destination: form.destination.trim(),
            tripDirection: form.tripDirection,
            passengers: Number(form.passengers),
          })
        : await apiPost<PriceCalculation>('/public-bookings/estimate', {
            companyId: COMPANY_ID,
            routeId: form.routeId,
            tripType: mapRouteTypeToTripType(selectedRoute?.routeType),
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
          });`,
    "estimate API branch"
  );

  // 10. Custom success message.
  replaceRegex(
    /setSuccessMessage\('Estimate ready\.'\);/,
`setSuccessMessage(
          usesCustomRoute
            ? 'Smart route estimate ready.'
            : 'Estimate ready.',
        );`,
    "estimate success message"
  );

  // 11. Submit custom booking without a saved routeId.
  replaceRegex(
    /routeId: form\.routeId,\s*tripType: mapRouteTypeToTripType\(selectedRoute\?\.routeType\),\s*tripDirection: form\.tripDirection,/,
`routeId: usesCustomRoute ? undefined : form.routeId,
        tripType: usesCustomRoute
          ? 'CUSTOM'
          : mapRouteTypeToTripType(selectedRoute?.routeType),
        customTripType: usesCustomRoute ? 'Smart Custom Route' : undefined,
        tripDirection: form.tripDirection,`,
    "submit route payload"
  );

  // 12. Send smart route price on custom bookings.
  if (!content.includes("estimatedPrice: usesCustomRoute")) {
    replaceRegex(
      /roundTripDiscountPercentage: 0,\s*depositAmount: 0,/,
`roundTripDiscountPercentage: 0,
        estimatedPrice: usesCustomRoute
          ? estimate?.estimatedPrice || undefined
          : undefined,
        finalPrice: usesCustomRoute
          ? estimate?.estimatedPrice || undefined
          : undefined,
        depositAmount: 0,`,
      "smart route price payload"
    );
  }

  // 13. Pass route mode props to BookingFormView.
  replaceRegex(
    /(setTripDirection=\{setTripDirection\}\s*usesRoundTrip=\{usesRoundTrip\})/,
`$1
                usesCustomRoute={usesCustomRoute}
                setRouteMode={setRouteMode}`,
    "BookingFormView props"
  );

  // 14. Update BookingFormView signature.
  replaceRegex(
    /setTripDirection,\s*usesRoundTrip,\s*\}: \{\s*form: BookingForm;\s*activeRoutes: RouteRecord\[];\s*selectedRoute\?: RouteRecord;\s*loadingRoutes: boolean;\s*estimating: boolean;\s*submitting: boolean;\s*estimatePrice: \(\) => void;\s*submitBooking: \(event: FormEvent<HTMLFormElement>\) => void;\s*updateForm: \(field: keyof BookingForm, value: string\) => void;\s*selectRoute: \(routeId: string\) => void;\s*setTripDirection: \(direction: TripDirection\) => void;\s*usesRoundTrip: boolean;\s*\}\) \{/,
`setTripDirection,
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
}) {`,
    "BookingFormView signature"
  );

  // 15. Replace route picker UI.
  replaceRegex(
    /<div className="mt-3 grid gap-3 md:grid-cols-2">\s*<FormField label="Route" required>[\s\S]*?<FormField label="Passengers" required>[\s\S]*?<\/FormField>\s*<\/div>/,
`<div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRouteMode('SAVED_ROUTE')}
            className={modeButtonClass(form.routeMode === 'SAVED_ROUTE')}
          >
            Saved Route
          </button>

          <button
            type="button"
            onClick={() => setRouteMode('CUSTOM_ROUTE')}
            className={modeButtonClass(form.routeMode === 'CUSTOM_ROUTE')}
          >
            Custom Route
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {!usesCustomRoute && (
            <FormField label="Route" required>
              <RoutePicker
                routes={activeRoutes}
                selectedRoute={selectedRoute}
                loadingRoutes={loadingRoutes}
                onSelect={selectRoute}
              />
            </FormField>
          )}

          <FormField label="Passengers" required>
            <input
              type="number"
              min="1"
              value={form.passengers}
              onChange={(event) => updateForm('passengers', event.target.value)}
              className="input-glass"
            />
          </FormField>
        </div>

        {usesCustomRoute && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-xs leading-6 text-neutral-400 backdrop-blur-xl">
            Enter any pickup and destination below. Google Maps will calculate
            the driving distance, estimated duration and smart fare.
          </div>
        )}`,
    "route picker UI"
  );

  // 16. Hide saved-route detail card in custom route mode.
  replaceRegex(
    /\{selectedRoute && \(/,
    "{!usesCustomRoute && selectedRoute && (",
    "selected route detail card"
  );

  const required = [
    "type RouteMode = 'SAVED_ROUTE' | 'CUSTOM_ROUTE';",
    "type SmartRouteEstimate =",
    "routeMode: RouteMode;",
    "routeMode: 'SAVED_ROUTE'",
    "const usesCustomRoute = form.routeMode === 'CUSTOM_ROUTE';",
    "function setRouteMode(mode: RouteMode)",
    "Saved Route",
    "Custom Route",
    "/smart-routes/estimate",
    "Smart route estimate ready.",
    "Smart Custom Route",
  ];

  for (const item of required) {
    if (!content.includes(item)) {
      restoreAndFail("Validation failed. Missing: " + item);
    }
  }

  fs.writeFileSync(path, content, { encoding: "utf8" });
  console.log("SUCCESS: Custom route mode added safely.");
  console.log("Backup saved at: " + backupPath);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
