const fs = require("fs");

const path = "apps/web/src/app/booking/page.tsx";
const backupPath = "apps/web/src/app/booking/page.payment-backup.tsx";

const original = fs.readFileSync(path, "utf8");
let content = original;

fs.writeFileSync(backupPath, original, { encoding: "utf8" });

function restoreAndFail(message) {
  fs.writeFileSync(path, original, { encoding: "utf8" });
  throw new Error(`${message}\nOriginal page.tsx restored. Backup saved at ${backupPath}`);
}

function replaceLiteral(search, replacement, label) {
  if (!content.includes(search)) {
    restoreAndFail(`Could not find: ${label}`);
  }
  content = content.replace(search, replacement);
}

function replaceRegex(regex, replacement, label) {
  if (!regex.test(content)) {
    restoreAndFail(`Could not match: ${label}`);
  }
  content = content.replace(regex, replacement);
}

try {
  if (!content.includes("type PaymentCheckoutResponse =")) {
    replaceLiteral(
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
      "TrackedBooking type insertion point"
    );
  }

  if (!content.includes("const [paymentLoading, setPaymentLoading] = useState")) {
    replaceLiteral(
`  const [tracking, setTracking] = useState(false);`,
`  const [tracking, setTracking] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<
    'DEPOSIT' | 'FULL_PAYMENT' | null
  >(null);`,
      "tracking state line"
    );
  }

  if (!content.includes("async function createPaymentCheckout")) {
    replaceLiteral(
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
      "trackBooking insertion point"
    );
  }

  if (!content.includes("createPaymentCheckout={createPaymentCheckout}")) {
    replaceRegex(
      /<SummaryPanel([\s\S]*?)setTrackingRef=\{setTrackingRef\}\s*\/>/,
      `<SummaryPanel$1setTrackingRef={setTrackingRef}
                      createPaymentCheckout={createPaymentCheckout}
                      paymentLoading={paymentLoading}
                    />`,
      "SummaryPanel component props"
    );
  }

  if (!content.includes("paymentLoading: 'DEPOSIT' | 'FULL_PAYMENT' | null;")) {
    replaceRegex(
      /function SummaryPanel\(\{\s*estimate,\s*bookingResponse,\s*trackedBooking,\s*formatMoney,\s*formatDate,\s*humanise,\s*switchMode,\s*setTrackingRef,\s*\}: \{\s*estimate: PriceCalculation \| null;\s*bookingResponse: BookingResponse \| null;\s*trackedBooking: TrackedBooking \| null;\s*formatMoney: \(value: string \| number \| null \| undefined\) => string;\s*formatDate: \(value\?: string \| null\) => string;\s*humanise: \(value\?: string \| null\) => string;\s*switchMode: \(mode: ViewMode\) => void;\s*setTrackingRef: \(value: string\) => void;\s*\}\) \{/,
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
      "SummaryPanel function signature"
    );
  }

  if (!content.includes("Pay Deposit")) {
    replaceLiteral(
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
      "Track This Booking button"
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
  ];

  for (const item of required) {
    if (!content.includes(item)) {
      restoreAndFail(`Validation failed. Missing: ${item}`);
    }
  }

  fs.writeFileSync(path, content, { encoding: "utf8" });

  console.log("SUCCESS: Payment buttons added safely.");
  console.log(`Backup saved at: ${backupPath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
