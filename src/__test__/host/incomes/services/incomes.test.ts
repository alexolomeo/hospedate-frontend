import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import api from '@/utils/api';
import {
  fetchHostIncomes,
  type QueryParamsHostIncomes,
} from '@/services/host/incomes';
import type { SummaryPayoutsResponse } from '@/types/host/incomes';

vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('fetchHostIncomes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    ],
    pendingPayouts: [
      {
        id: 2,
        amount: 300.0,
        guest: {
          id: 102,
          name: 'Jane Smith',
          profilePicture: {
            original: 'https://example.com/avatar2.jpg',
            srcsetWebp: 'https://example.com/avatar2.webp 480w',
            srcsetAvif: 'https://example.com/avatar2.avif 480w',
          },
        },
        listing: {
          id: 202,
          title: 'Cozy Studio',
        },
        trip: {
          id: 302,
          checkInDate: '2025-10-20',
          checkoutDate: '2025-10-25',
        },
      },
    ],
    summary: {
      pending: 300.0,
      received: 500.0,
      totalYear: 5000.0,
    },
  };

  it('should fetch host incomes successfully with required parameters', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockResponse });

    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 10,
    };

    const result = await fetchHostIncomes(params);

    expect(api.get).toHaveBeenCalledWith(
      '/hostings/payouts/summary?year=2025&month=10'
    );
    expect(result).toEqual(mockResponse);
  });

  it('should fetch host incomes with listing_id parameter', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockResponse });

    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 10,
      listing_id: 123,
    };

    const result = await fetchHostIncomes(params);

    expect(api.get).toHaveBeenCalledWith(
      '/hostings/payouts/summary?year=2025&month=10&listing_id=123'
    );
    expect(result).toEqual(mockResponse);
  });

  it('should not include listing_id in query if not provided', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockResponse });

    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 11,
    };

    await fetchHostIncomes(params);

    expect(api.get).toHaveBeenCalledWith(
      '/hostings/payouts/summary?year=2025&month=11'
    );
  });

  it('should not include listing_id if it is 0', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockResponse });

    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 10,
      listing_id: 0,
    };

    await fetchHostIncomes(params);

    expect(api.get).toHaveBeenCalledWith(
      '/hostings/payouts/summary?year=2025&month=10'
    );
  });

  it('should throw error if year is missing', async () => {
    const params = {
      month: 10,
    } as QueryParamsHostIncomes;

    await expect(fetchHostIncomes(params)).rejects.toThrow(
      '[fetchHostIncomes] Year and month are required parameters'
    );
  });

  it('should throw error if month is missing', async () => {
    const params = {
      year: 2025,
    } as QueryParamsHostIncomes;

    await expect(fetchHostIncomes(params)).rejects.toThrow(
      '[fetchHostIncomes] Year and month are required parameters'
    );
  });

  it('should throw error if year is below minimum (2025)', async () => {
    const params: QueryParamsHostIncomes = {
      year: 2024,
      month: 10,
    };

    await expect(fetchHostIncomes(params)).rejects.toThrow(
      '[fetchHostIncomes] Invalid year or month'
    );
  });

  it('should throw error if month is invalid (< 1)', async () => {
    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 0,
    };

    await expect(fetchHostIncomes(params)).rejects.toThrow(
      'Year and month are required parameters'
    );
  });

  it('should throw error if month is invalid (> 12)', async () => {
    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 13,
    };

    await expect(fetchHostIncomes(params)).rejects.toThrow(
      '[fetchHostIncomes] Invalid year or month'
    );
  });

  it('should throw error if trying to fetch data before October 2025', async () => {
    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 9,
    };

    await expect(fetchHostIncomes(params)).rejects.toThrow(
      '[fetchHostIncomes] Data is only available from October 2025 onwards'
    );
  });

  it('should allow fetching data for October 2025', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockResponse });

    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 10,
    };

    const result = await fetchHostIncomes(params);

    expect(api.get).toHaveBeenCalledWith(
      '/hostings/payouts/summary?year=2025&month=10'
    );
    expect(result).toEqual(mockResponse);
  });

  it('should allow fetching data for months after October 2025', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockResponse });

    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 11,
    };

    const result = await fetchHostIncomes(params);

    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Network error';
    (api.get as Mock).mockRejectedValue(new Error(errorMessage));

    const params: QueryParamsHostIncomes = {
      year: 2025,
      month: 10,
    };

    await expect(fetchHostIncomes(params)).rejects.toThrow(errorMessage);
    expect(api.get).toHaveBeenCalledWith(
      '/hostings/payouts/summary?year=2025&month=10'
    );
  });
});
