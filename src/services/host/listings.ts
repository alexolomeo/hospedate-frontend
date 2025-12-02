import api from '@/utils/api.ts';
import type { ListingsResponse, Status } from '@/types/host/listing';

export interface QueryParamsHostListings {
  readonly limit: number;
  readonly offset?: number;
  readonly listingStatus?: Status[];
}

/** Build a URLSearchParams enforcing expected semantics for limit/offset. */
function buildQuery(params: QueryParamsHostListings): URLSearchParams {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, raw]) => {
    if (raw === undefined || raw === null) return;

    if (typeof raw === 'number') {
      // limit must be > 0, offset must be >= 0
      if ((key === 'offset' && raw >= 0) || (key === 'limit' && raw > 0)) {
        query.append(key, String(raw));
      }
      return;
    }

    // Handle array values (like listingStatus)
    if (Array.isArray(raw)) {
      raw.forEach((value) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      return;
    }

    query.append(key, String(raw));
  });
  return query;
}

export const fetchHostListings = async (
  params: QueryParamsHostListings = { limit: 20, offset: 0 }
): Promise<ListingsResponse | null> => {
  try {
    const queryParams = buildQuery(params);
    const url = `/hostings/listings?${queryParams.toString()}`;
    const response = await api.get<ListingsResponse>(url);
    return response.data;
  } catch (error) {
    console.error('[fetchHostListings] Error fetching host listings', {
      error,
      endpoint: '/hostings/listings',
      params,
    });
    throw error;
  }
};

export const removeListing = async (
  listingId: string,
  reasons: number[]
): Promise<void> => {
  const url = `/listings/${encodeURIComponent(listingId)}/remove`;
  try {
    if (!listingId?.trim()) {
      throw new Error('listingId is required');
    }
    if (!reasons.length) {
      throw new Error('At least one reason is required');
    }
    const body = {
      reasons: reasons,
    };
    await api.delete(url, { data: body });
  } catch (error) {
    console.error(
      `[removeListing] Error deleting listing with ID ${listingId}`,
      {
        error,
        endpoint: url,
      }
    );
    throw error;
  }
};
