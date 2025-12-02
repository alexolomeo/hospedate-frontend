import { describe, it, expect, vi, type Mock } from 'vitest';
import api from '@/utils/api';
import { removeListing } from '@/services/host/listings';

vi.mock('@/utils/api', () => {
  return {
    default: {
      delete: vi.fn(),
    },
  };
});

describe('removeListing', () => {
  it('should call api.delete with correct URL and body and resolve', async () => {
    const listingId = 'abc123';
    const reasons = [1, 2, 27];

    (api.delete as Mock).mockResolvedValueOnce({ status: 204 });

    await expect(removeListing(listingId, reasons)).resolves.toBeUndefined();

    expect(api.delete).toHaveBeenCalledWith(
      `/listings/${encodeURIComponent(listingId)}/remove`,
      { data: { reasons } }
    );
  });

  it('should URL-encode the listingId', async () => {
    const listingId = 'foo/bar baz';
    const reasons = [5];

    (api.delete as Mock).mockResolvedValueOnce({ status: 200 });

    await removeListing(listingId, reasons);

    expect(api.delete).toHaveBeenCalledWith(
      `/listings/${encodeURIComponent(listingId)}/remove`,
      { data: { reasons } }
    );
  });

  it('should log error and rethrow when request fails', async () => {
    const listingId = 'xyz789';
    const reasons = [10, 11];
    const boom = new Error('boom');

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (api.delete as Mock).mockRejectedValueOnce(boom);

    await expect(removeListing(listingId, reasons)).rejects.toThrow('boom');

    expect(api.delete).toHaveBeenCalledWith(
      `/listings/${encodeURIComponent(listingId)}/remove`,
      { data: { reasons } }
    );

    expect(spy).toHaveBeenCalledWith(
      `[removeListing] Error deleting listing with ID ${listingId}`,
      expect.objectContaining({
        error: boom,
        endpoint: `/listings/${encodeURIComponent(listingId)}/remove`,
      })
    );

    spy.mockRestore();
  });
});
