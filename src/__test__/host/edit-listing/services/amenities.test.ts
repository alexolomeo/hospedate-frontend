import { describe, it, expect, vi, type Mock } from 'vitest';
import api from '@/utils/api';
import {
  addAmenityToDefaultSpace,
  removeAmenityFromDefaultSpace,
} from '@/services/host/edit-listing/amenities';
import { markHasPatchedOnce } from '@/stores/host/editListing/editListingSession';

vi.mock('@/utils/api', () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/stores/host/editListing/editListingSession', () => ({
  markHasPatchedOnce: vi.fn(),
}));

describe('amenities service', () => {
  const listingId = '123';
  const amenityId = 45;
  const endpoint = `/listings/${listingId}/spaces/amenities`;

  describe('addAmenityToDefaultSpace', () => {
    it('should send POST request and mark listing as patched when status is 201', async () => {
      (api.post as Mock).mockResolvedValueOnce({ status: 201 });

      await addAmenityToDefaultSpace(listingId, amenityId);

      expect(api.post).toHaveBeenCalledWith(
        endpoint,
        { amenity_id: amenityId },
        { skipGlobal404Redirect: true }
      );
      expect(markHasPatchedOnce).toHaveBeenCalledWith(listingId);
    });

    it('should also accept status 200 as success', async () => {
      (api.post as Mock).mockResolvedValueOnce({ status: 200 });

      await addAmenityToDefaultSpace(listingId, amenityId);

      expect(api.post).toHaveBeenCalledWith(
        endpoint,
        { amenity_id: amenityId },
        { skipGlobal404Redirect: true }
      );
      expect(markHasPatchedOnce).toHaveBeenCalledWith(listingId);
    });

    it('should throw error for unexpected status', async () => {
      (api.post as Mock).mockResolvedValueOnce({ status: 500 });

      await expect(
        addAmenityToDefaultSpace(listingId, amenityId)
      ).rejects.toThrow('[addAmenityToDefaultSpace] Unexpected status=500');
    });
  });

  describe('removeAmenityFromDefaultSpace', () => {
    it('should send DELETE request and mark listing as patched when status is 204', async () => {
      (api.delete as Mock).mockResolvedValueOnce({ status: 204 });

      await removeAmenityFromDefaultSpace(listingId, amenityId);

      expect(api.delete).toHaveBeenCalledWith(endpoint, {
        data: { amenity_id: amenityId },
        skipGlobal404Redirect: true,
      });
      expect(markHasPatchedOnce).toHaveBeenCalledWith(listingId);
    });

    it('should also accept status 200 as success', async () => {
      (api.delete as Mock).mockResolvedValueOnce({ status: 200 });

      await removeAmenityFromDefaultSpace(listingId, amenityId);

      expect(api.delete).toHaveBeenCalledWith(endpoint, {
        data: { amenity_id: amenityId },
        skipGlobal404Redirect: true,
      });
      expect(markHasPatchedOnce).toHaveBeenCalledWith(listingId);
    });

    it('should throw error for unexpected status', async () => {
      (api.delete as Mock).mockResolvedValueOnce({ status: 404 });

      await expect(
        removeAmenityFromDefaultSpace(listingId, amenityId)
      ).rejects.toThrow(
        '[removeAmenityFromDefaultSpace] Unexpected status=404'
      );
    });
  });
});
