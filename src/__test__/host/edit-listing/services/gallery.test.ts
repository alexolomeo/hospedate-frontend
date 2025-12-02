import { describe, it, expect, vi, type Mock } from 'vitest';
import api from '@/utils/api';
import {
  fetchPhotosFromSpace,
  uploadSpacePhotoWithProgress,
  uploadSpacePhotosWithProgress,
  patchListingPhotoCaption,
  deleteListingPhoto,
  fetchSpaceTypes,
  createSpaceForListing,
  updatePhotosOrderBySpace,
  movePhotoToSpace,
  fetchAllListingPhotos,
  updateListingPhotosOrder,
} from '@/services/host/edit-listing/gallery';

vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('gallery service', () => {
  const listingId = '123';
  const spaceId = '10';
  const opts = { skipGlobal404Redirect: true };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPhotosFromSpace', () => {
    it('should return mapped photos when API returns valid data', async () => {
      (api.get as Mock).mockResolvedValueOnce({
        data: [
          {
            id: 1,
            media: {
              original: 'a.jpg',
              srcsetWebp: 'a.webp',
              srcsetAvif: 'a.avif',
            },
            caption: 'cap',
          },
        ],
      });

      const result = await fetchPhotosFromSpace(listingId, spaceId, opts);

      expect(api.get).toHaveBeenCalledWith(
        `/listings/${listingId}/spaces/${spaceId}/photos`,
        opts
      );
      expect(result).toEqual([
        {
          id: 1,
          photo: {
            original: 'a.jpg',
            srcsetWebp: 'a.webp',
            srcsetAvif: 'a.avif',
          },
          caption: 'cap',
        },
      ]);
    });

    it('should return [] when API call fails', async () => {
      (api.get as Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchPhotosFromSpace(listingId, spaceId);
      expect(result).toEqual([]);
    });
  });

  describe('uploadSpacePhotoWithProgress', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    it('should return photo id on success', async () => {
      (api.post as Mock).mockResolvedValueOnce({
        status: 201,
        data: { id: 9 },
      });

      const result = await uploadSpacePhotoWithProgress(
        listingId,
        spaceId,
        file
      );
      expect(result).toBe(9);
    });

    it('should return -1 on API error', async () => {
      (api.post as Mock).mockRejectedValueOnce(new Error('Upload failed'));
      const result = await uploadSpacePhotoWithProgress(
        listingId,
        spaceId,
        file
      );
      expect(result).toBe(-1);
    });
  });

  describe('uploadSpacePhotosWithProgress', () => {
    const files = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')];

    it('should call uploadSpacePhotoWithProgress for each file', async () => {
      (api.post as Mock).mockResolvedValue({ status: 201, data: { id: 1 } });
      const progressMock = vi.fn();

      const result = await uploadSpacePhotosWithProgress(
        listingId,
        spaceId,
        files,
        progressMock
      );

      expect(result.length).toBe(2);
      expect(progressMock).toHaveBeenCalled();
    });

    it('should return [] when files array is empty', async () => {
      const result = await uploadSpacePhotosWithProgress(
        listingId,
        spaceId,
        [],
        vi.fn()
      );
      expect(result).toEqual([]);
    });
  });

  describe('patchListingPhotoCaption', () => {
    it('should call patch API with correct params', async () => {
      (api.patch as Mock).mockResolvedValueOnce({ status: 204 });
      await patchListingPhotoCaption(listingId, 5, 'new caption', opts);
      expect(api.patch).toHaveBeenCalledWith(
        `/listings/${listingId}/photos/5`,
        { caption: 'new caption' },
        opts
      );
    });

    it('should handle API error gracefully', async () => {
      (api.patch as Mock).mockRejectedValueOnce(new Error('Fail'));
      await expect(
        patchListingPhotoCaption(listingId, 5, 'cap')
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteListingPhoto', () => {
    it('should send delete request successfully', async () => {
      (api.delete as Mock).mockResolvedValueOnce({ status: 204 });
      await deleteListingPhoto(listingId, 5, opts);
      expect(api.delete).toHaveBeenCalledWith(
        `/listings/${listingId}/photos/5`,
        opts
      );
    });
  });

  describe('fetchSpaceTypes', () => {
    it('should return mapped space types', async () => {
      (api.get as Mock).mockResolvedValueOnce({
        data: [
          {
            id: 1,
            name: 'Bedroom',
            photo: { original: 'o', srcsetWebp: 'w', srcsetAvif: 'a' },
          },
        ],
      });

      const result = await fetchSpaceTypes(opts);
      expect(result).toEqual([
        {
          id: 1,
          name: 'Bedroom',
          photo: { original: 'o', srcsetWebp: 'w', srcsetAvif: 'a' },
        },
      ]);
    });

    it('should return [] on API failure', async () => {
      (api.get as Mock).mockRejectedValueOnce(new Error('Fail'));
      const result = await fetchSpaceTypes();
      expect(result).toEqual([]);
    });
  });

  describe('createSpaceForListing', () => {
    it('should return id when API returns success', async () => {
      (api.post as Mock).mockResolvedValueOnce({
        status: 201,
        data: { id: 999 },
      });
      const result = await createSpaceForListing(listingId, 7, opts);
      expect(api.post).toHaveBeenCalledWith(
        `/hostings/listings/${listingId}/spaces/create`,
        { space_type_id: 7 },
        opts
      );
      expect(result).toBe(999);
    });

    it('should return null when API throws error', async () => {
      (api.post as Mock).mockRejectedValueOnce(new Error('error'));
      const result = await createSpaceForListing(listingId, 7);
      expect(result).toBeNull();
    });
  });

  describe('updatePhotosOrderBySpace', () => {
    it('should call patch API correctly', async () => {
      (api.patch as Mock).mockResolvedValueOnce({ status: 204 });
      await updatePhotosOrderBySpace(
        listingId,
        spaceId,
        [{ id: 1, order: 1 }],
        opts
      );
      expect(api.patch).toHaveBeenCalledWith(
        `/listings/${listingId}/spaces/${spaceId}/photos/order`,
        [{ id: 1, order: 1 }],
        opts
      );
    });
  });

  describe('movePhotoToSpace', () => {
    it('should call patch API correctly', async () => {
      (api.patch as Mock).mockResolvedValueOnce({ status: 204 });
      await movePhotoToSpace(listingId, '2', '3', 4, opts);
      expect(api.patch).toHaveBeenCalledWith(
        `/listings/${listingId}/spaces/2/photos/3`,
        { spaceId: 4 },
        opts
      );
    });
  });

  describe('fetchAllListingPhotos', () => {
    it('should return photo list when API returns success', async () => {
      const mockPhotos = [{ id: 1, order: 1, photo: { original: 'a.jpg' } }];
      (api.get as Mock).mockResolvedValueOnce({
        status: 200,
        data: mockPhotos,
      });
      const result = await fetchAllListingPhotos(listingId, opts);
      expect(api.get).toHaveBeenCalledWith(
        `/listings/${listingId}/spaces/photos`,
        opts
      );
      expect(result).toEqual(mockPhotos);
    });

    it('should return [] on API error', async () => {
      (api.get as Mock).mockRejectedValueOnce(new Error('Fail'));
      const result = await fetchAllListingPhotos(listingId);
      expect(result).toEqual([]);
    });
  });

  describe('updateListingPhotosOrder', () => {
    it('should call patch API correctly', async () => {
      (api.patch as Mock).mockResolvedValueOnce({ status: 204 });
      await updateListingPhotosOrder(listingId, [{ id: 1, order: 2 }], opts);
      expect(api.patch).toHaveBeenCalledWith(
        `/listings/${listingId}/photos/order`,
        [{ id: 1, order: 2 }],
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          ...opts,
        })
      );
    });

    it('should throw error on API failure', async () => {
      (api.patch as Mock).mockRejectedValueOnce(new Error('Fail'));
      await expect(
        updateListingPhotosOrder(listingId, [{ id: 1, order: 2 }])
      ).rejects.toThrow('Fail');
    });
  });
});
