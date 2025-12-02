import type { SummaryPayoutsResponse } from '@/types/host/incomes';
import { PayoutStatus, type Payout } from '@/types/host/incomes';
import { formatDateRange, formatDateWithYear } from './dateUtils';

export interface IncomesData {
  summary: {
    earnedThisMonth: number;
    yearTotal: number;
    collectedThisMonth: number;
    pendingThisMonth: number;
    currency: string;
  };
  payouts: {
    completed: Payout[];
    pending: Payout[];
  };
}

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'BOB'
): string => {
  return `${currency} ${amount.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Transform backend response to frontend data structure
 */
export function transformIncomesData(
  response: SummaryPayoutsResponse,
  currency: string = 'BOB'
): IncomesData {
  // Transform completed payouts
  const completed: Payout[] = response.completedPayouts.map((payout) => ({
    id: String(payout.id),
    date: formatDateWithYear(payout.paymentDate, 'es'),
    amount: formatCurrency(payout.amount, currency),
    status: PayoutStatus.Paid,
    guestName: payout.guest.name,
    bookingDates: formatDateRange(
      payout.trip.checkInDate,
      payout.trip.checkoutDate,
      'es'
    ),
    propertyName: payout.listing.title,
    guestAvatar: payout.guest.profilePicture?.original || '',
    tripId: payout.trip.id,
  }));

  // Transform pending payouts
  const pending: Payout[] = response.pendingPayouts.map((payout) => ({
    id: String(payout.id),
    date: '', // Pending payouts don't have a payment date yet
    amount: formatCurrency(payout.amount || 0, currency),
    status: PayoutStatus.Pending,
    guestName: payout.guest?.name || '',
    bookingDates: formatDateRange(
      payout.trip.checkInDate,
      payout.trip.checkoutDate,
      'es'
    ),
    propertyName: payout.listing.title,
    guestAvatar: payout.guest?.profilePicture?.original || '',
    tripId: payout.trip.id,
  }));

  return {
    summary: {
      earnedThisMonth: response.summary.received + response.summary.pending,
      yearTotal: response.summary.totalYear,
      collectedThisMonth: response.summary.received,
      pendingThisMonth: response.summary.pending,
      currency,
    },
    payouts: {
      completed,
      pending,
    },
  };
}
