import type { SummaryPayoutsResponse } from '@/types/host/incomes';
import api from '@/utils/api.ts';

const MIN_YEAR = 2025;
const MIN_MONTH = 10; // October

export interface QueryParamsHostIncomes {
  year: number;
  month: number;
  listing_id?: number;
}

function buildQuery(params: QueryParamsHostIncomes): URLSearchParams {
  const query = new URLSearchParams();

  // Year and month are required
  query.append('year', String(params.year));
  query.append('month', String(params.month));

  // listing_id is optional
  if (
    params.listing_id !== undefined &&
    params.listing_id !== null &&
    params.listing_id > 0
  ) {
    query.append('listing_id', String(params.listing_id));
  }

  return query;
}

export const fetchHostIncomes = async (
  params: QueryParamsHostIncomes
): Promise<SummaryPayoutsResponse> => {
  // Validate required parameters
  if (!params.year || !params.month) {
    throw new Error(
      '[fetchHostIncomes] Year and month are required parameters'
    );
  }

  // Validate year and month ranges
  if (params.year < MIN_YEAR || params.month < 1 || params.month > 12) {
    throw new Error('[fetchHostIncomes] Invalid year or month');
  }

  // Additional validation for October 2025 minimum
  if (params.year === MIN_YEAR && params.month < MIN_MONTH) {
    throw new Error(
      '[fetchHostIncomes] Data is only available from October 2025 onwards'
    );
  }

  try {
    const queryParams = buildQuery(params);
    const url = `/hostings/payouts/summary?${queryParams.toString()}`;
    const response = await api.get<SummaryPayoutsResponse>(url);
    return response.data;
  } catch (error) {
    console.error('[fetchHostIncomes] Error fetching host Incomes', {
      error,
      endpoint: '/hostings/payouts/summary',
      params,
    });
    throw error;
  }
};
