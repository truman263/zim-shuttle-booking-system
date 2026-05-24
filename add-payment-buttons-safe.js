const fs = require("fs");

const path = "apps/web/src/app/booking/page.tsx";
const backupPath = "apps/web/src/app/booking/page.payment-backup.tsx";

const original = fs.readFileSync(path, "utf8");
let content = original;

fs.writeFileSync(backupPath, original, { encoding: "utf8" });

function fail(message) {
  fs.writeFileSync(path, original, { encoding: "utf8" });
  throw new Error(`${message}\nOriginal file restored from memory. Backup saved at ${backupPath}`);
}

function replaceExact(search, replacement, label) {
  if (!content.includes(search)) {
    fail(`Could not find exact section: ${label}`);
  }

  content = content.replace(search, replacement);
}

function insertAfterExact(search, insertion, label) {
  const index = content.indexOf(search);

  if (index === -1) {
    fail(`Could not find exact insertion point: ${label}`);
  }

  const insertAt = index + search.length;
  content = content.slice(0, insertAt) + insertion + content.slice(insertAt);
}

try {
  // 1. Add payment checkout response type.
  if (!content.includes("type PaymentCheckoutResponse =")) {
    replaceExact(
`type TrackedBooking = {`,
`type PaymentCheckoutResponse = {
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

type TrackedBooking = {`,
      "PaymentCheckoutResponse type"
    );
  }

  // 2. Add payment loading state after tracking state.
  if (!content.includes("const [paymentLoading, setPaymentLoading] = useState")) {
    insertAfterExact(
`  const [tracking, setTracking] = useState(false);`,
`

  const [paymentLoading, setPaymentLoading] = useState<
    'DEPOSIT' | 'FULL_PAYMENT' | null
  >(null);`,
      "paymentLoading state"
    );
  }

  // 3. Add createPaymentCheckout before trackBooking.
  if (!content.includes("async function createPaymentCheckout")) {
    replaceExact(
`  async function trackBooking(event: FormEvent<HTMLFormElement>) {`,
`  async function createPaymentCheckout(
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

  async function trackBooking(event: FormEvent<HTMLFormElement>) {`,
      "createPaymentCheckout function"
    );
  }

  // 4. Pass payment props into SummaryPanel.
  if (!content.includes("createPaymentCheckout={createPaymentCheckout}")) {
    replaceExact(
`                      switchMode={switchMode}
                      setTrackingRef={setTrackingRef}
                    />`,
`                      switchMode={switchMode}
                      setTrackingRef={setTrackingRef}
                      createPaymentCheckout={createPaymentCheckout}
                      paymentLoading={paymentLoading}
                    />`,
      "SummaryPanel props"
    );
  }

  // 5. Update SummaryPanel function signature.
  if (!content.includes("paymentLoading: 'DEPOSIT' | 'FULL_PAYMENT' | null;")) {
    replaceExact(
`function SummaryPanel({
  estimate,
  bookingResponse,
  trackedBooking,
  formatMoney,
  formatDate,
  humanise,
  switchMode,
  setTrackingRef,
}: {
  estimate: PriceCalculation | null;
  bookingResponse: BookingResponse | null;
  trackedBooking: TrackedBooking | null;
  formatMoney: (value: string | number | null | undefined) => string;
  formatDate: (value?: string | null) => string;
  humanise: (value?: string | null) => string;
  switchMode: (mode: ViewMode) => void;
  setTrackingRef: (value: string) => void;
}) {`,
`function SummaryPanel({
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
  estimate: PriceCalculation | null;
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
}) {`,
      "SummaryPanel signature"
    );
  }

  // 6. Replace Track This Booking button with payment action buttons.
  if (!content.includes("Pay Deposit")) {
    replaceExact(
`        <button
          type="button"
          onClick={() => {
            setTrackingRef(bookingResponse.bookingRef);
            switchMode('TRACK');
          }}
          className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-300"
        >
          Track This Booking
        </button>`,
`        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              createPaymentCheckout(bookingResponse.bookingId, 'DEPOSIT')
            }
            disabled={paymentLoading !== null}
            className="rounded-full bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentLoading === 'DEPOSIT' ? 'Preparing...' : 'Pay Deposit'}
          </button>

          <button
            type="button"
            onClick={() =>
              createPaymentCheckout(bookingResponse.bookingId, 'FULL_PAYMENT')
            }
            disabled={paymentLoading !== null}
            className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentLoading === 'FULL_PAYMENT'
              ? 'Preparing...'
              : 'Pay Full Amount'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTrackingRef(bookingResponse.bookingRef);
              switchMode('TRACK');
            }}
            className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            Track Booking
          </button>
        </div>`,
      "booking success payment buttons"
    );
  }

  const required = [
    "type PaymentCheckoutResponse =",
    "const [paymentLoading, setPaymentLoading]",
    "async function createPaymentCheckout",
    "createPaymentCheckout={createPaymentCheckout}",
    "paymentLoading={paymentLoading}",
    "Pay Deposit",
    "Pay Full Amount",
    "Track Booking",
  ];

  for (const item of required) {
    if (!content.includes(item)) {
      fail(`Validation failed. Missing required item: ${item}`);
    }
  }

  fs.writeFileSync(path, content, { encoding: "utf8" });

  console.log("SUCCESS: Payment buttons safely added to public booking page.");
  console.log(`Backup saved at: ${backupPath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
