import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import ManageSpaceModal from '@/components/React/Host/EditListing/Content/YourPlace/EditSpacePhotos/ManageSpaceModal';
import type {
  SpaceType,
  SpacePhoto,
} from '@/types/host/edit-listing/spacePhotos';

jest.mock('@/components/React/Common/Modal', () => {
  return function MockModal(props: {
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) {
    return (
      <div data-testid="modal">
        <h1>{props.title}</h1>
        {props.children}
        {props.footer && <div data-testid="modal-footer">{props.footer}</div>}
      </div>
    );
  };
});

jest.mock('@/components/React/Common/ResponsiveImage', () => ({
  ResponsiveImage: jest.fn(
    (props: { photo: { original: string }; alt: string }) => (
      <img
        data-testid="responsive-image"
        alt={props.alt}
        src={props.photo.original}
      />
    )
  ),
}));

jest.mock(
  '@/components/React/Host/EditListing/Content/YourPlace/EditSpacePhotos/SuccessModal',
  () => {
    return function MockSuccessModal() {
      return <div data-testid="success-modal">SuccessModal</div>;
    };
  }
);

jest.mock('@/utils/i18n', () => ({
  getTranslation: jest.fn(() => ({
    hostContent: {
      editListing: {
        content: {
          gallery: {
            selectRoom: 'Select room',
            move: 'Move',
            add: 'Add',
            next: 'Next',
            save: 'Save',
            noSpacesImageAlt: 'No spaces available',
            assignPhotosTitle: 'Assign Photos',
            noAvailablePhotos: 'No available photos',
            addSpaceError: 'Could not create space',
          },
        },
      },
    },
  })),
  translate: jest.fn((_t, key) => key),
}));

jest.mock('@/components/React/CreateListing/ToastContext', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

jest.mock('@/services/host/edit-listing/gallery', () => ({
  fetchSpaceTypes: jest.fn(),
  fetchPhotosFromSpace: jest.fn(),
  createSpaceForListing: jest.fn(),
  updatePhotosOrderBySpace: jest.fn(),
  movePhotoToSpace: jest.fn(),
}));

import {
  fetchSpaceTypes,
  fetchPhotosFromSpace,
  createSpaceForListing,
  updatePhotosOrderBySpace,
  movePhotoToSpace,
} from '@/services/host/edit-listing/gallery';

describe('ManageSpaceModal (React component)', () => {
  const listingId = '123';
  const onClose = jest.fn();
  const onRefreshListingValues = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('loads and displays space types when modal is open', async () => {
    (fetchSpaceTypes as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        name: 'Bedroom',
        photo: { original: 'bed.jpg', srcsetWebp: '', srcsetAvif: '' },
      },
      {
        id: 2,
        name: 'Kitchen',
        photo: { original: 'kit.jpg', srcsetWebp: '', srcsetAvif: '' },
      },
    ]);

    render(
      <ManageSpaceModal
        open={true}
        onClose={onClose}
        mode="create"
        listingId={listingId}
      />
    );

    await waitFor(() => {
      expect(fetchSpaceTypes).toHaveBeenCalledWith({
        skipGlobal404Redirect: true,
      });
    });

    expect(screen.getByText('Select room')).toBeInTheDocument();
    expect(screen.getAllByTestId('responsive-image').length).toBe(2);
  });

  it('creates a new space and loads default photos when defaultSpaceId exists', async () => {
    const mockSpace: SpaceType = {
      id: 9,
      name: 'Office',
      photo: { original: 'o.jpg', srcsetWebp: '', srcsetAvif: '' },
    };

    const mockPhotos: SpacePhoto[] = [
      {
        id: 10,
        caption: 'Photo 1',
        photo: { original: 'p1.jpg', srcsetWebp: '', srcsetAvif: '' },
      },
    ];

    (fetchSpaceTypes as jest.Mock).mockResolvedValueOnce([mockSpace]);
    (createSpaceForListing as jest.Mock).mockResolvedValueOnce(99);
    (fetchPhotosFromSpace as jest.Mock).mockResolvedValueOnce(mockPhotos);

    render(
      <ManageSpaceModal
        open={true}
        onClose={onClose}
        mode="create"
        listingId={listingId}
        defaultSpaceId="10"
        onRefreshListingValues={onRefreshListingValues}
      />
    );

    await waitFor(() =>
      expect(screen.getByText('Select room')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('responsive-image'));

    const button = await screen.findByText('Next');
    fireEvent.click(button);

    await waitFor(() => {
      expect(createSpaceForListing).toHaveBeenCalledWith(
        listingId,
        mockSpace.id,
        { skipGlobal404Redirect: true }
      );
      expect(fetchPhotosFromSpace).toHaveBeenCalledWith(listingId, '10', {
        skipGlobal404Redirect: true,
      });
    });
  });

  it('shows success modal directly when no default space exists', async () => {
    const mockSpace: SpaceType = {
      id: 9,
      name: 'Office',
      photo: { original: 'o.jpg', srcsetWebp: '', srcsetAvif: '' },
    };

    (fetchSpaceTypes as jest.Mock).mockResolvedValueOnce([mockSpace]);
    (createSpaceForListing as jest.Mock).mockResolvedValueOnce(123);

    render(
      <ManageSpaceModal
        open={true}
        onClose={onClose}
        mode="create"
        listingId={listingId}
        onRefreshListingValues={onRefreshListingValues}
      />
    );

    await waitFor(() =>
      expect(screen.getByText('Select room')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('responsive-image'));
    const button = screen.getByText('Add');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onRefreshListingValues).toHaveBeenCalled();
      expect(screen.getByTestId('success-modal')).toBeInTheDocument();
    });
  });

  it('handles photo move flow correctly', async () => {
    const space: SpaceType = {
      id: 5,
      name: 'Living',
      photo: { original: 'l.jpg', srcsetWebp: '', srcsetAvif: '' },
    };
    const photos: SpacePhoto[] = [
      {
        id: 11,
        caption: 'ph1',
        photo: { original: 'ph1.jpg', srcsetWebp: '', srcsetAvif: '' },
      },
      {
        id: 12,
        caption: 'ph2',
        photo: { original: 'ph2.jpg', srcsetWebp: '', srcsetAvif: '' },
      },
    ];

    (fetchSpaceTypes as jest.Mock).mockResolvedValueOnce([space]);
    (createSpaceForListing as jest.Mock).mockResolvedValueOnce(77);
    (fetchPhotosFromSpace as jest.Mock).mockResolvedValueOnce(photos);
    (movePhotoToSpace as jest.Mock).mockResolvedValue(undefined);
    (updatePhotosOrderBySpace as jest.Mock).mockResolvedValue(undefined);

    render(
      <ManageSpaceModal
        open={true}
        onClose={onClose}
        mode="create"
        listingId={listingId}
        defaultSpaceId="10"
        onRefreshListingValues={onRefreshListingValues}
      />
    );

    await waitFor(() =>
      expect(screen.getByText('Select room')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('responsive-image'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => expect(fetchPhotosFromSpace).toHaveBeenCalled());

    fireEvent.click(screen.getAllByTestId('responsive-image')[0]);
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(movePhotoToSpace).toHaveBeenCalled();
      expect(updatePhotosOrderBySpace).toHaveBeenCalled();
      expect(onRefreshListingValues).toHaveBeenCalled();
    });
  });

  it('calls onMovePhoto and closes modal when in move mode', async () => {
    const mockSpace: SpaceType = {
      id: 9,
      name: 'Office',
      photo: { original: 'o.jpg', srcsetWebp: '', srcsetAvif: '' },
    };

    const onMovePhoto = jest.fn().mockResolvedValue(undefined);
    (fetchSpaceTypes as jest.Mock).mockResolvedValueOnce([mockSpace]);

    render(
      <ManageSpaceModal
        open={true}
        onClose={onClose}
        mode="move"
        listingId={listingId}
        onMovePhoto={onMovePhoto}
      />
    );

    await waitFor(() =>
      expect(screen.getByText('Select room')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('responsive-image'));
    const button = screen.getByText('Move');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onMovePhoto).toHaveBeenCalledWith(mockSpace);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
