import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  transformIncomesData,
} from '@/utils/incomesTransformers';
import {
  PayoutStatus,
  type SummaryPayoutsResponse,
} from '@/types/host/incomes';

describe('formatCurrency', () => {
  it('should format currency with default BOB', () => {
    const result = formatCurrency(1234.56);
    // The actual format depends on the system locale (es-BO uses dots for thousands, comma for decimals)
    expect(result).toContain('BOB');
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
  });

  it('should format currency with custom currency', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('USD');
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
  });

  it('should format currency with zero decimals', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('BOB');
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('should format small amounts', () => {
    const result = formatCurrency(0.5);
    expect(result).toContain('BOB');
    expect(result).toContain('0');
    expect(result).toContain('5');
  });

  it('should format large amounts', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain('BOB');
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('567');
    expect(result).toContain('89');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-100);
    expect(result).toContain('BOB');
    expect(result).toContain('-');
    expect(result).toContain('100');
  });
});

describe('transformIncomesData', () => {
  const mockResponse: SummaryPayoutsResponse = {
    completedPayouts: [
      {
        id: 1,
        amount: 500.0,
        paymentDate: '2025-10-15T10:00:00Z',
        guest: {
          id: 101,
          name: 'John Doe',
          profilePicture: {
            original: 'https://example.com/avatar.jpg',
            srcsetWebp: 'https://example.com/avatar.webp 480w',
            srcsetAvif: 'https://example.com/avatar.avif 480w',
          },
        },
        listing: {
          id: 201,
          title: 'Beautiful Apartment',
        },
        trip: {
          id: 301,
          checkInDate: '2025-10-10',
          checkoutDate: '2025-10-15',
        },
      },
      {
        id: 2,
        amount: 750.0,
        paymentDate: '2025-10-20T10:00:00Z',
        guest: {
          id: 102,
          name: 'Jane Smith',
        },
        listing: {
          id: 202,
          title: 'Cozy Studio',
        },
        trip: {
          id: 302,
          checkInDate: '2025-10-18',
          checkoutDate: '2025-10-22',
        },
      },
    ],
    pendingPayouts: [
      {
        id: 3,
        amount: 300.0,
        guest: {
          id: 103,
          name: 'Alice Johnson',
          profilePicture: {
            original: 'https://example.com/avatar3.jpg',
            srcsetWebp: 'https://example.com/avatar3.webp 480w',
            srcsetAvif: 'https://example.com/avatar3.avif 480w',
          },
        },
        listing: {
          id: 203,
          title: 'Mountain Cabin',
        },
        trip: {
          id: 303,
          checkInDate: '2025-10-25',
          checkoutDate: '2025-10-30',
        },
      },
    ],
    summary: {
      pending: 300.0,
      received: 1250.0,
      totalYear: 5000.0,
    },
  };

  it('should transform completed payouts correctly', () => {
    const result = transformIncomesData(mockResponse);

    expect(result.payouts.completed).toHaveLength(2);
    expect(result.payouts.completed[0]).toMatchObject({
      id: '1',
      status: PayoutStatus.Paid,
      guestName: 'John Doe',
      propertyName: 'Beautiful Apartment',
      guestAvatar: 'https://example.com/avatar.jpg',
      tripId: 301,
    });
    expect(result.payouts.completed[0].amount).toContain('500');
    expect(result.payouts.completed[0].date).toBeTruthy();
    expect(result.payouts.completed[0].bookingDates).toBeTruthy();
  });

  it('should handle missing profile picture in completed payouts', () => {
    const result = transformIncomesData(mockResponse);

    expect(result.payouts.completed[1].guestAvatar).toBe('');
  });

  it('should transform pending payouts correctly', () => {
    const result = transformIncomesData(mockResponse);

    expect(result.payouts.pending).toHaveLength(1);
    expect(result.payouts.pending[0]).toMatchObject({
      id: '3',
      date: '',
      status: PayoutStatus.Pending,
      guestName: 'Alice Johnson',
      propertyName: 'Mountain Cabin',
      guestAvatar: 'https://example.com/avatar3.jpg',
      tripId: 303,
    });
    expect(result.payouts.pending[0].amount).toContain('300');
  });

  it('should handle missing guest in pending payouts', () => {
    const responseWithoutGuest: SummaryPayoutsResponse = {
      ...mockResponse,
      pendingPayouts: [
        {
          id: 4,
          listing: {
            id: 204,
            title: 'Beach House',
          },
          trip: {
            id: 304,
            checkInDate: '2025-11-01',
            checkoutDate: '2025-11-05',
          },
        },
      ],
    };

    const result = transformIncomesData(responseWithoutGuest);

    expect(result.payouts.pending[0].guestName).toBe('');
    expect(result.payouts.pending[0].guestAvatar).toBe('');
  });

  it('should handle missing amount in pending payouts', () => {
    const responseWithoutAmount: SummaryPayoutsResponse = {
      ...mockResponse,
      pendingPayouts: [
        {
          id: 5,
          guest: {
            id: 105,
            name: 'Bob Wilson',
            profilePicture: {
              original: 'https://example.com/avatar5.jpg',
              srcsetWebp: '',
              srcsetAvif: '',
            },
          },
          listing: {
            id: 205,
            title: 'City Loft',
          },
          trip: {
            id: 305,
            checkInDate: '2025-11-10',
            checkoutDate: '2025-11-15',
          },
        },
      ],
    };

    const result = transformIncomesData(responseWithoutAmount);

    expect(result.payouts.pending[0].amount).toContain('0');
  });

  it('should calculate summary correctly', () => {
    const result = transformIncomesData(mockResponse);

    expect(result.summary).toEqual({
      earnedThisMonth: 1550.0, // received (1250) + pending (300)
      yearTotal: 5000.0,
      collectedThisMonth: 1250.0,
      pendingThisMonth: 300.0,
      currency: 'BOB',
    });
  });

  it('should use custom currency', () => {
    const result = transformIncomesData(mockResponse, 'USD');

    expect(result.summary.currency).toBe('USD');
    expect(result.payouts.completed[0].amount).toContain('USD');
    expect(result.payouts.pending[0].amount).toContain('USD');
  });

  it('should handle empty payouts arrays', () => {
    const emptyResponse: SummaryPayoutsResponse = {
      completedPayouts: [],
      pendingPayouts: [],
      summary: {
        pending: 0,
        received: 0,
        totalYear: 0,
      },
    };

    const result = transformIncomesData(emptyResponse);

    expect(result.payouts.completed).toHaveLength(0);
    expect(result.payouts.pending).toHaveLength(0);
    expect(result.summary.earnedThisMonth).toBe(0);
  });

  it('should format booking dates correctly', () => {
    const result = transformIncomesData(mockResponse);

    // The bookingDates should be formatted by formatDateRange
    expect(result.payouts.completed[0].bookingDates).toBeTruthy();
    expect(result.payouts.pending[0].bookingDates).toBeTruthy();
  });
});
