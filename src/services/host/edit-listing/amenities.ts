import api from '@/utils/api';
import type { AxiosRequestConfig } from 'axios';
import { markHasPatchedOnce } from '@/stores/host/editListing/editListingSession';

export type RequestOpts = {
  skipGlobal404Redirect?: boolean;
};

function with404Skip<T = unknown>(
  cfg: AxiosRequestConfig<T> | undefined,
  opts?: RequestOpts
): AxiosRequestConfig<T> {
  const shouldSkip = opts?.skipGlobal404Redirect ?? true;
  if (shouldSkip) {
    return { ...(cfg ?? {}), skipGlobal404Redirect: true };
  }
  return cfg ?? {};
}

export async function addAmenityToDefaultSpace(
  listingId: string | number,
  amenityId: number,
  opts?: RequestOpts
): Promise<void> {
  const endpoint = `/listings/${encodeURIComponent(
    String(listingId)
  )}/spaces/amenities`;

  try {
    const response = await api.post(
      endpoint,
      { amenity_id: amenityId },
      with404Skip(undefined, opts)
    );

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(
        `[addAmenityToDefaultSpace] Unexpected status=${response.status}`
      );
    }

    markHasPatchedOnce(String(listingId));
  } catch (error) {
    console.error('[addAmenityToDefaultSpace] Error:', error);
    throw error;
  }
}

export async function removeAmenityFromDefaultSpace(
  listingId: string | number,
  amenityId: number,
  opts?: RequestOpts
): Promise<void> {
  const endpoint = `/listings/${encodeURIComponent(
    String(listingId)
  )}/spaces/amenities`;

  try {
    const response = await api.delete(
      endpoint,
      with404Skip(
        {
          data: { amenity_id: amenityId },
        },
        opts
      )
    );

    if (response.status !== 204 && response.status !== 200) {
      throw new Error(
        `[removeAmenityFromDefaultSpace] Unexpected status=${response.status}`
      );
    }

    markHasPatchedOnce(String(listingId));
  } catch (error) {
    console.error('[removeAmenityFromDefaultSpace] Error:', error);
    throw error;
  }
}
