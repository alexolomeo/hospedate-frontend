import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditAllPhotosGallery from '@/components/React/Host/EditListing/Content/YourPlace/EditSpacePhotos/EditAllPhotosGallery';
import { fetchAllListingPhotos } from '@/services/host/edit-listing/gallery';
import type { GalleryNav } from '@/types/host/edit-listing/galleryNav';

jest.mock('@/services/host/edit-listing/gallery', () => ({
  fetchAllListingPhotos: jest.fn(),
  updateListingPhotosOrder: jest.fn(),
}));

jest.mock('@/components/React/CreateListing/ToastContext', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

jest.mock('@/utils/i18n', () => ({
  getTranslation: jest.fn(() => ({
    hostContent: {
      editListing: {
        content: {
          gallery: {
            allPhotos: 'All photos',
            back: 'Back',
            reorderInstruction: 'Reorder your photos',
          },
        },
        commonMessages: {
          failedFetch: 'Failed to fetch',
          failedAction: 'Failed action',
        },
      },
    },
  })),
  translate: jest.fn((_t, key) => key),
}));

const createMockNav = (): GalleryNav => ({
  toRoot: jest.fn(),
  toAllPhotos: jest.fn(),
  toSpace: jest.fn(),
  toPhoto: jest.fn(),
  backFromSpace: jest.fn(),
  backFromPhoto: jest.fn(),
  backFromAllPhotos: jest.fn(),
});

describe('EditAllPhotosGallery', () => {
  const listingId = '123';
  const onRefreshListingValues = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading, fetches photos, and shows reorder instruction', async () => {
    const nav = createMockNav();

    (fetchAllListingPhotos as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        order: 1,
        photo: { original: 'photo.jpg', srcsetWebp: '', srcsetAvif: '' },
      },
    ]);

    render(
      <EditAllPhotosGallery
        listingId={listingId}
        nav={nav}
        onRefreshListingValues={onRefreshListingValues}
      />
    );

    expect(screen.getByText('common.loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchAllListingPhotos).toHaveBeenCalledWith(listingId, {
        skipGlobal404Redirect: true,
      });
    });

    expect(
      screen.getByText(
        'hostContent.editListing.content.gallery.reorderInstruction'
      )
    ).toBeInTheDocument();
  });
});
