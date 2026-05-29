'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';

type PaymentBooking = {
  id: string;
  bookingRef: string;
  pickupLocation: string;
  destination: string;
  pickupDate?: string | null;
  finalPrice?: number | string | null;
  estimatedPrice?: number | string | null;
  depositAmount?: number | string | null;
  paymentStatus: string;
  status: string;
  customer?: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

type Payment = {
  id: string;
  bookingId: string;
  amount: number | string;
  method: string;
  status: string;
  gateway?: string | null;
  paymentType?: string | null;
  paynowPaymentMethod?: string | null;
  currency?: string | null;
  transactionRef?: string | null;
  gatewayReference?: string | null;
  phone?: string | null;
  instructions?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: PaymentBooking | null;
};

function money(value?: number | string | null) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return '0.00';
  }

  return amount.toFixed(2);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nice(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  return value.replaceAll('_', ' ');
}

function getBookingTotal(payment: Payment) {
  return Number(
    payment.booking?.finalPrice ??
      payment.booking?.estimatedPrice ??
      payment.amount ??
      0,
  );
}

function getPaymentSource(payment: Payment) {
  if (payment.gateway === 'PAYNOW' || payment.method === 'PAYNOW') {
    return 'Online';
  }

  return 'Manual';
}

function getPaymentReference(payment: Payment) {
  return (
    payment.transactionRef ||
    payment.gatewayReference ||
    payment.phone ||
    payment.id.slice(0, 8)
  );
}

function getPaymentTime(payment: Payment) {
  const value = payment.paidAt ?? payment.createdAt;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return date.getTime();
}

function getBookingPaidTotalUpToPayment(
  currentPayment: Payment,
  allPayments: Payment[],
) {
  const currentPaymentTime = getPaymentTime(currentPayment);

  return allPayments
    .filter((payment) => payment.bookingId === currentPayment.bookingId)
    .filter((payment) => payment.status === 'PAID')
    .filter((payment) => getPaymentTime(payment) <= currentPaymentTime)
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
}

function getCurrentBookingPaidTotal(
  currentPayment: Payment,
  allPayments: Payment[],
) {
  return allPayments
    .filter((payment) => payment.bookingId === currentPayment.bookingId)
    .filter((payment) => payment.status === 'PAID')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function fetchPayments() {
    try {
      setErrorMessage('');
      const data = await apiGet<Payment[] | Payment>('/payments');
      setPayments(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading payments',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const paymentStats = useMemo(() => {
    const paidPayments = payments.filter((payment) => payment.status === 'PAID');
    const pendingPayments = payments.filter(
      (payment) => payment.status === 'UNPAID' || payment.status === 'PENDING',
    );
    const manualPayments = payments.filter(
      (payment) => getPaymentSource(payment) === 'Manual',
    );
    const onlinePayments = payments.filter(
      (payment) => getPaymentSource(payment) === 'Online',
    );

    return {
      totalRecords: payments.length,
      paidAmount: paidPayments.reduce(
        (sum, payment) => sum + Number(payment.amount ?? 0),
        0,
      ),
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      manualCount: manualPayments.length,
      onlineCount: onlinePayments.length,
    };
  }, [payments]);

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Payment Control
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Payment Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Track manual cash payments, EcoCash, bank transfers and Paynow
            payment attempts against each booking.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-[#C8A96A]/40 hover:text-white"
        >
          Refresh
        </button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Total Records" value={paymentStats.totalRecords} />
        <SummaryCard
          title="Paid Amount"
          value={'$' + money(paymentStats.paidAmount)}
          accent
        />
        <SummaryCard title="Paid" value={paymentStats.paidCount} />
        <SummaryCard title="Pending" value={paymentStats.pendingCount} />
        <SummaryCard title="Manual" value={paymentStats.manualCount} />
        <SummaryCard title="Online" value={paymentStats.onlineCount} />
      </section>

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-neutral-400">
          Loading payments...
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Payment Records
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Received and Initiated Payments
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Live payment records linked to bookings, customers and route
                pricing.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] table-fixed border-collapse text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-neutral-400">
                <tr>
                  <th className="w-[18%] px-4 py-4 font-medium">Payment</th>
                  <th className="w-[27%] px-3 py-4 font-medium">
                    Booking Context
                  </th>
                  <th className="w-[16%] px-3 py-4 font-medium">Method</th>
                  <th className="w-[15%] px-3 py-4 font-medium">Amount</th>
                  <th className="w-[14%] px-3 py-4 font-medium">Status</th>
                  <th className="w-[10%] px-3 py-4 font-medium">Date</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => {
                  const bookingTotal = getBookingTotal(payment);
                  const paidUpToThisPayment = getBookingPaidTotalUpToPayment(
                    payment,
                    payments,
                  );
                  const currentBookingPaidTotal = getCurrentBookingPaidTotal(
                    payment,
                    payments,
                  );
                  const balanceAfterThisPayment = Math.max(
                    bookingTotal - paidUpToThisPayment,
                    0,
                  );
                  const currentBookingBalance = Math.max(
                    bookingTotal - currentBookingPaidTotal,
                    0,
                  );
                  const isPaidTransaction = payment.status === 'PAID';
                  const isBookingSettled = currentBookingBalance <= 0;

                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-white/5 align-top transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <PaymentTypeBadge status={payment.paymentType} />
                          <p className="font-semibold text-white">
                            {payment.booking?.bookingRef ?? 'No booking ref'}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Ref: {getPaymentReference(payment)}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="font-medium text-white">
                            {payment.booking?.customer?.fullName ??
                              'Customer not available'}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-neutral-400">
                            {payment.booking?.pickupLocation ?? 'Pickup not set'} →{' '}
                            {payment.booking?.destination ?? 'Destination not set'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <BookingStatusBadge
                              status={payment.booking?.status ?? 'UNKNOWN'}
                            />
                            {isPaidTransaction && (
                              <PaymentStatusBadge
                                status={payment.booking?.paymentStatus ?? 'UNKNOWN'}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">
                          {nice(payment.method)}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          {getPaymentSource(payment)} · {nice(payment.gateway)}
                        </p>
                        {payment.paynowPaymentMethod && (
                          <p className="mt-1 text-[11px] text-neutral-500">
                            Paynow: {nice(payment.paynowPaymentMethod)}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <p className="text-lg font-semibold text-[#C8A96A]">
                          {'$' + money(payment.amount)}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Booking total: {'$' + money(bookingTotal)}
                        </p>

                        {isPaidTransaction ? (
                          <>
                            <p className="mt-1 text-[11px] text-neutral-500">
                              Paid after this: {'$' + money(paidUpToThisPayment)}
                            </p>
                            <p
                              className={
                                'mt-1 text-[11px] font-medium text-green-300'
                              }
                            >
                              Balance after this:{' '}
                              {'$' + money(balanceAfterThisPayment)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-1 text-[11px] text-neutral-500">
                              Received: $0.00
                            </p>
                            <p className="mt-1 text-[11px] text-neutral-500">
                              This online attempt did not receive money.
                            </p>
                            <p
                              className={
                                'mt-1 text-[11px] font-medium ' +
                                (isBookingSettled
                                  ? 'text-green-300'
                                  : 'text-neutral-400')
                              }
                            >
                              {isBookingSettled
                                ? 'Booking already settled'
                                : 'Booking balance: ' + '$' + money(currentBookingBalance)}
                            </p>
                          </>
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <PaymentStatusBadge status={payment.status} />
                        {payment.instructions && (
                          <p className="mt-2 text-[11px] leading-5 text-neutral-500">
                            {payment.instructions}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-4 text-[11px] leading-5 text-neutral-400">
                        <p>{formatDate(payment.paidAt ?? payment.createdAt)}</p>
                        <p className="mt-1 text-neutral-600">
                          ID: {payment.id.slice(0, 8)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">
              No payment records found.
            </div>
          )}
        </div>
      )}
    </section>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 transition hover:border-[#C8A96A]/25">
      <p className="text-xs font-medium text-neutral-400">{title}</p>
      <p
        className={
          'mt-2 text-2xl font-semibold ' +
          (accent ? 'text-[#C8A96A]' : 'text-white')
        }
      >
        {value}
      </p>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UNPAID: 'border-neutral-500/30 bg-neutral-500/10 text-neutral-300',
    PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    PARTIALLY_PAID: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    PAID: 'border-green-500/30 bg-green-500/10 text-green-300',
    FAILED: 'border-red-500/30 bg-red-500/10 text-red-300',
    REFUNDED: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    UNKNOWN: 'border-white/10 bg-white/5 text-neutral-300',
  };

  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300')
      }
    >
      {nice(status)}
    </span>
  );
}

function PaymentTypeBadge({ status }: { status?: string | null }) {
  const styles: Record<string, string> = {
    DEPOSIT: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    BALANCE: 'border-green-500/30 bg-green-500/10 text-green-300',
    FULL_PAYMENT: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
  };

  const safeStatus = status ?? 'DEPOSIT';

  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (styles[safeStatus] ?? 'border-white/10 bg-white/5 text-neutral-300')
      }
    >
      {nice(safeStatus)}
    </span>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    CONFIRMED: 'border-green-500/30 bg-green-500/10 text-green-300',
    IN_PROGRESS: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    COMPLETED: 'border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#C8A96A]',
    CANCELLED: 'border-red-500/30 bg-red-500/10 text-red-300',
    NO_SHOW: 'border-red-500/30 bg-red-500/10 text-red-300',
    UNKNOWN: 'border-white/10 bg-white/5 text-neutral-300',
  };

  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ' +
        (styles[status] ?? 'border-white/10 bg-white/5 text-neutral-300')
      }
    >
      {nice(status)}
    </span>
  );
}
