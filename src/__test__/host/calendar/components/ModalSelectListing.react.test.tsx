import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import ModalSelectListing from '@/components/React/Host/Calendar/ModalSelectListing';
import type { Listing } from '@/types/host/listing';

// Mock the Modal component to simplify testing
jest.mock('@/components/React/Common/Modal', () => ({
  __esModule: true,
  default: ({
    open,
    title,
    children,
    footer,
    topRightAction,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
    topRightAction: React.ReactNode;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-header">
          <h2>{title}</h2>
          {topRightAction}
        </div>
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-footer">{footer}</div>
      </div>
    );
  },
}));

// Mock ResponsiveImage component
jest.mock('@/components/React/Common/ResponsiveImage', () => ({
  ResponsiveImage: ({ alt, className }: { alt: string; className: string }) => (
    <img alt={alt} className={className} />
  ),
}));

// Mock SVG imports
jest.mock('/src/icons/x-mark-mini.svg?react', () => ({
  __esModule: true,
  default: () => <span data-testid="x-mark-icon">X</span>,
}));

// Helper to create mock listings
const createMockListing = (
  id: number,
  overrides?: Partial<Listing>
): Listing => ({
  id,
  title: `Test Listing ${id}`,
  status: 'PUBLISHED',
  createdAt: '2024-01-01T00:00:00Z',
  propertyType: 'apartment',
  photo: {
    original: `/listing-${id}.jpg`,
    srcsetWebp: '',
    srcsetAvif: '',
  },
  ...overrides,
});

describe('ModalSelectListing', () => {
  const mockOnClose = jest.fn();
  const mockFetchListings = jest.fn();
  const mockOnSelect = jest.fn();
  const mockHandleListingSelect = jest.fn();
  const mockHandleListingsSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <ModalSelectListing
          open={false}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should display default title', () => {
      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      // Should display the default title text
      expect(screen.getByText('Selecciona un anuncio')).toBeInTheDocument();
    });

    it('should display custom title when provided', () => {
      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          title="Custom Title"
          lang="es"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch listings on mount when modal opens', async () => {
      const mockListings = [
        createMockListing(1),
        createMockListing(2),
        createMockListing(3),
      ];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(mockFetchListings).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
        expect(screen.getByText('Test Listing 2')).toBeInTheDocument();
        expect(screen.getByText('Test Listing 3')).toBeInTheDocument();
      });
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetchListings.mockRejectedValue(new Error('Network error'));

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display empty state when no listings are available', async () => {
      mockFetchListings.mockResolvedValue([]);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        // Should display the default empty message
        expect(
          screen.getByText('Uuups... por ahora no tenemos datos para mostrarte')
        ).toBeInTheDocument();
      });
    });

    it('should use custom empty message when provided', async () => {
      mockFetchListings.mockResolvedValue([]);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          emptyMessage="No listings found"
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No listings found')).toBeInTheDocument();
      });
    });

    it('should show loading spinner while fetching', () => {
      mockFetchListings.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      expect(screen.getByTestId('modal-body')).toContainHTML('loading-spinner');
    });
  });

  describe('Pagination', () => {
    it('should show "Load More" button when there are more items', async () => {
      const mockListings = Array.from({ length: 10 }, (_, i) =>
        createMockListing(i + 1)
      );
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          limit={10}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      // Should show load more button when result count equals limit
      await waitFor(() => {
        const modalBody = screen.getByTestId('modal-body');
        const loadMoreButton = within(modalBody).queryByText(/mostrar más/i);
        expect(loadMoreButton).toBeInTheDocument();
      });
    });

    it('should not show "Load More" button when all items are loaded', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          limit={10}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      // Should not show load more button when result count is less than limit
      await waitFor(() => {
        const modalBody = screen.getByTestId('modal-body');
        const loadMoreButton = within(modalBody).queryByText(/mostrar más/i);
        expect(loadMoreButton).not.toBeInTheDocument();
      });
    });

    it('should load more listings when "Load More" is clicked', async () => {
      const firstBatch = Array.from({ length: 10 }, (_, i) =>
        createMockListing(i + 1)
      );
      const secondBatch = Array.from({ length: 5 }, (_, i) =>
        createMockListing(i + 11)
      );

      mockFetchListings
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          limit={10}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText(/mostrar más/i);
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockFetchListings).toHaveBeenCalledWith({
          limit: 10,
          offset: 10,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Test Listing 11')).toBeInTheDocument();
      });
    });

    it('should not show duplicates when loading more', async () => {
      const firstBatch = [createMockListing(1), createMockListing(2)];
      const secondBatch = [createMockListing(2), createMockListing(3)]; // Duplicate ID 2

      mockFetchListings
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          limit={2}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText(/mostrar más/i);
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText('Test Listing 3')).toBeInTheDocument();
      });

      // Should only have one instance of "Test Listing 2"
      const listing2Elements = screen.getAllByText('Test Listing 2');
      expect(listing2Elements).toHaveLength(1);
    });
  });

  describe('Single Selection Mode', () => {
    it('should select a listing when clicked', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          multiple={false}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.click(listing1);

      const checkbox = within(listing1).getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should replace selection when selecting another listing in single mode', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          multiple={false}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      const listing2 = screen
        .getByText('Test Listing 2')
        .closest('div[role="button"]') as HTMLElement;

      fireEvent.click(listing1);
      fireEvent.click(listing2);

      const checkbox1 = within(listing1).getByRole('checkbox');
      const checkbox2 = within(listing2).getByRole('checkbox');

      expect(checkbox1).not.toBeChecked();
      expect(checkbox2).toBeChecked();
    });

    it('should call onSelect with single listing on apply', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          onSelect={mockOnSelect}
          multiple={false}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.click(listing1);

      const applyButton = within(screen.getByTestId('modal-footer')).getByRole(
        'button'
      );
      fireEvent.click(applyButton);

      expect(mockOnSelect).toHaveBeenCalledWith(mockListings[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Multiple Selection Mode', () => {
    it('should allow selecting multiple listings', async () => {
      const mockListings = [
        createMockListing(1),
        createMockListing(2),
        createMockListing(3),
      ];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      const listing2 = screen
        .getByText('Test Listing 2')
        .closest('div[role="button"]') as HTMLElement;

      fireEvent.click(listing1);
      fireEvent.click(listing2);

      const checkbox1 = within(listing1).getByRole('checkbox');
      const checkbox2 = within(listing2).getByRole('checkbox');

      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();
    });

    it('should deselect a listing when clicked again', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      const checkbox = within(listing1).getByRole('checkbox');

      fireEvent.click(listing1);
      expect(checkbox).toBeChecked();

      fireEvent.click(listing1);
      expect(checkbox).not.toBeChecked();
    });

    it('should call onSelect with array of listings on apply', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          onSelect={mockOnSelect}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      const listing2 = screen
        .getByText('Test Listing 2')
        .closest('div[role="button"]') as HTMLElement;

      fireEvent.click(listing1);
      fireEvent.click(listing2);

      const applyButton = within(screen.getByTestId('modal-footer')).getByRole(
        'button'
      );
      fireEvent.click(applyButton);

      expect(mockOnSelect).toHaveBeenCalledWith([
        mockListings[0],
        mockListings[1],
      ]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Legacy Props Support', () => {
    it('should call handleListingSelect in single mode (backward compatibility)', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          handleListingSelect={mockHandleListingSelect}
          multiple={false}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.click(listing1);

      const applyButton = within(screen.getByTestId('modal-footer')).getByRole(
        'button'
      );
      fireEvent.click(applyButton);

      expect(mockHandleListingSelect).toHaveBeenCalledWith(mockListings[0]);
    });

    it('should call handleListingsSelect in multiple mode (backward compatibility)', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          handleListingsSelect={mockHandleListingsSelect}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.click(listing1);

      const applyButton = within(screen.getByTestId('modal-footer')).getByRole(
        'button'
      );
      fireEvent.click(applyButton);

      expect(mockHandleListingsSelect).toHaveBeenCalledWith([mockListings[0]]);
    });

    it('should use legacy listings prop if provided', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          listings={mockListings}
          lang="es"
        />
      );

      // Wait for legacy listings to be rendered
      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
        expect(screen.getByText('Test Listing 2')).toBeInTheDocument();
      });

      // Should not call fetchListings when using legacy prop
      expect(mockFetchListings).not.toHaveBeenCalled();
    });
  });

  describe('Cache Functionality', () => {
    it('should save selection to localStorage when cacheKey is provided', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);
      const cacheKey = 'test-cache-key';

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          cacheKey={cacheKey}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.click(listing1);

      const applyButton = within(screen.getByTestId('modal-footer')).getByRole(
        'button'
      );
      fireEvent.click(applyButton);

      const cached = localStorage.getItem(cacheKey);
      expect(cached).toBe('[1]');
    });

    it('should restore selection from localStorage when cacheKey is provided', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);
      const cacheKey = 'test-cache-key';

      localStorage.setItem(cacheKey, JSON.stringify([1]));

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          cacheKey={cacheKey}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      // Wait for the effect to restore selection from cache
      await waitFor(() => {
        const listing1 = screen
          .getByText('Test Listing 1')
          .closest('div[role="button"]') as HTMLElement;
        const checkbox1 = within(listing1).getByRole('checkbox');
        expect(checkbox1).toBeChecked();
      });
    });
  });

  describe('Auto-select First', () => {
    it('should auto-select first listing when autoSelectFirst is true and no selection exists', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          autoSelectFirst={true}
          multiple={false}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      // Wait for the effect to auto-select
      await waitFor(() => {
        const listing1 = screen
          .getByText('Test Listing 1')
          .closest('div[role="button"]') as HTMLElement;
        const checkbox1 = within(listing1).getByRole('checkbox');
        expect(checkbox1).toBeChecked();
      });
    });

    it('should not auto-select when autoSelectFirst is false', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          autoSelectFirst={false}
          multiple={false}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      const checkbox1 = within(listing1).getByRole('checkbox');

      expect(checkbox1).not.toBeChecked();
    });

    it('should not auto-select in multiple mode', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          autoSelectFirst={true}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      const checkbox1 = within(listing1).getByRole('checkbox');

      expect(checkbox1).not.toBeChecked();
    });
  });

  describe('Initial Selection', () => {
    it('should show selectedListing as checked in single mode', async () => {
      const mockListings = [createMockListing(1), createMockListing(2)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          selectedListing={mockListings[1]}
          multiple={false}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 2')).toBeInTheDocument();
      });

      const listing2 = screen
        .getByText('Test Listing 2')
        .closest('div[role="button"]') as HTMLElement;
      const checkbox2 = within(listing2).getByRole('checkbox');

      expect(checkbox2).toBeChecked();
    });

    it('should show selectedListings as checked in multiple mode', async () => {
      const mockListings = [
        createMockListing(1),
        createMockListing(2),
        createMockListing(3),
      ];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          selectedListings={[mockListings[0], mockListings[2]]}
          multiple={true}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      const listing2 = screen
        .getByText('Test Listing 2')
        .closest('div[role="button"]') as HTMLElement;
      const listing3 = screen
        .getByText('Test Listing 3')
        .closest('div[role="button"]') as HTMLElement;

      const checkbox1 = within(listing1).getByRole('checkbox');
      const checkbox2 = within(listing2).getByRole('checkbox');
      const checkbox3 = within(listing3).getByRole('checkbox');

      expect(checkbox1).toBeChecked();
      expect(checkbox2).not.toBeChecked();
      expect(checkbox3).toBeChecked();
    });
  });

  describe('Apply Button', () => {
    it('should disable apply button when no selection is made', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const applyButton = within(screen.getByTestId('modal-footer')).getByRole(
        'button'
      );
      expect(applyButton).toBeDisabled();
    });

    it('should enable apply button when a selection is made', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.click(listing1);

      const applyButton = within(screen.getByTestId('modal-footer')).getByRole(
        'button'
      );
      expect(applyButton).toBeEnabled();
    });

    it('should use custom apply button label when provided', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          selectedListing={mockListings[0]}
          applyButtonLabel="Confirm Selection"
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Confirm Selection')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle selection on Enter key', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.keyDown(listing1, { key: 'Enter', code: 'Enter' });

      const checkbox = within(listing1).getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should toggle selection on Space key', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
      });

      const listing1 = screen
        .getByText('Test Listing 1')
        .closest('div[role="button"]') as HTMLElement;
      fireEvent.keyDown(listing1, { key: ' ', code: 'Space' });

      const checkbox = within(listing1).getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Close Modal', () => {
    it('should call onClose when close button is clicked', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
      });

      const closeButton = screen
        .getByTestId('x-mark-icon')
        .closest('button') as HTMLElement;
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Listing Display', () => {
    it('should display listing photo when available', async () => {
      const mockListings = [createMockListing(1)];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByAltText('listing-1')).toBeInTheDocument();
      });
    });

    it('should display listing title when available', async () => {
      const mockListings = [createMockListing(1, { title: 'Cozy Apartment' })];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cozy Apartment')).toBeInTheDocument();
      });
    });

    it('should display formatted date when title is not available', async () => {
      const mockListings = [
        createMockListing(1, {
          title: null,
          createdAt: '2024-01-15T10:00:00Z',
        }),
      ];
      mockFetchListings.mockResolvedValue(mockListings);

      render(
        <ModalSelectListing
          open={true}
          onClose={mockOnClose}
          fetchListings={mockFetchListings}
          lang="es"
        />
      );

      await waitFor(() => {
        const modalBody = screen.getByTestId('modal-body');
        expect(modalBody).toBeInTheDocument();
      });
    });
  });
});
