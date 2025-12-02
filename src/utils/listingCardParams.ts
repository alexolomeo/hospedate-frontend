import type { QueryParams } from '@/types/search';

export type PeopleParams = Pick<
  QueryParams,
  'adults' | 'children' | 'infants' | 'numPets'
>;

export interface AvailabilityLike {
  startDate: string;
  endDate: string;
}

export function buildListingQueryParams(
  queryParams?: Partial<PeopleParams>,
  availability?: AvailabilityLike
): URLSearchParams {
  const params = new URLSearchParams();
  const KEYS: (keyof PeopleParams)[] = [
    'adults',
    'children',
    'infants',
    'numPets',
  ];

  for (const key of KEYS) {
    const v = queryParams?.[key];
    if (v !== undefined && v !== null && v > 0) params.set(key, String(v));
  }

  // Dates
  if (availability) {
    params.set('checkInDate', availability.startDate);
    params.set('checkoutDate', availability.endDate);
  }

  if (availability && !params.has('adults')) {
    if (!queryParams || queryParams.adults === undefined) {
      params.set('adults', '1');
    }
  }

  return params;
}
/** Returns the listing URL with query parameters for people count and availability dates */
export function buildListingUrl(
  id: string | number,
  queryParams?: Partial<PeopleParams>,
  availability?: AvailabilityLike
): string {
  const params = buildListingQueryParams(queryParams, availability).toString();
  return params ? `/listing/${id}?${params}` : `/listing/${id}`;
}
