import type { Listing } from '@/types/host/listing';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import Modal from '@/components/React/Common/Modal';
import { ResponsiveImage } from '../../Common/ResponsiveImage';
import { useEffect, useState, useMemo, useCallback } from 'react';
import XMarkMini from '/src/icons/x-mark-mini.svg?react';
import { formatDateFull } from '@/utils/dateUtils';

interface FetchParams {
  limit: number;
  offset: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  lang?: SupportedLanguages;

  // External data fetching
  fetchListings: (params: FetchParams) => Promise<Listing[]>;

  // Selection handling
  onSelect?: (selection: Listing | Listing[]) => void;
  multiple?: boolean;

  // Initial selection
  selectedListing?: Listing;
  selectedListings?: Listing[];

  // Deprecated props (for backward compatibility)
  handleListingSelect?: (listing: Listing) => void;
  handleListingsSelect?: (listings: Listing[]) => void;
  listings?: Listing[];

  // Pagination
  limit?: number;

  // Cache behavior
  cacheKey?: string;
  autoSelectFirst?: boolean;

  // UI customization
  title?: string;
  emptyMessage?: string;
  applyButtonLabel?: string;
}

export default function ModalSelectListing({
  open,
  onClose,
  lang = 'es',
  fetchListings,
  onSelect,
  multiple = false,
  selectedListing,
  selectedListings,
  handleListingSelect,
  handleListingsSelect,
  listings: legacyListings,
  limit = 10,
  cacheKey,
  autoSelectFirst = false,
  title,
  emptyMessage,
  applyButtonLabel,
}: Props) {
  const t = getTranslation(lang);

  // State
  const [selected, setSelected] = useState<Listing[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);

  const fallbackPhoto = {
    original: '/images/host/listings/fallback-card-image.webp',
    srcsetWebp: '',
    srcsetAvif: '',
  };

  // Load listings from external fetch function or use legacy listings prop
  const loadListings = useCallback(
    async (currentOffset: number, append = false) => {
      // Use legacy listings only for initial load (when not appending)
      if (legacyListings && !append) {
        setListings(legacyListings);
        // If we received exactly 'limit' items, there might be more
        setHasMore(legacyListings.length === limit);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await fetchListings({
          limit,
          offset: currentOffset,
        });

        // Handle case where fetchListings returns undefined or null
        if (!results || !Array.isArray(results)) {
          setListings([]);
          setHasMore(false);
          return;
        }

        if (append) {
          setListings((prev) => {
            // Filter out duplicates by checking existing IDs
            const existingIds = new Set(prev.map((l) => l.id));
            const newListings = results.filter((l) => !existingIds.has(l.id));

            // Determine hasMore using combined checks for robustness
            let hasMoreData = false;

            // If no new listings were added after filtering, there's definitely no more data
            if (newListings.length === 0) {
              hasMoreData = false;
            } else {
              // Use 'next' property from API response if available
              if ('next' in results && typeof results.next !== 'undefined') {
                // Combine API's next property with our duplicate check
                // Only trust 'next' if we actually got new unique listings
                hasMoreData = !!results.next && newListings.length > 0;
              } else {
                // Fallback: If we received fewer unique items than limit, there's no more data
                hasMoreData = newListings.length === limit;
              }
            }

            setHasMore(hasMoreData);

            return [...prev, ...newListings];
          });
        } else {
          setListings(results);

          // Determine hasMore using combined checks for robustness
          let hasMoreData = false;

          // Use 'next' property from API response if available
          if ('next' in results && typeof results.next !== 'undefined') {
            // Combine API's next property with result count check
            hasMoreData = !!results.next && results.length > 0;
          } else {
            // Fallback: If we received fewer items than limit, there's no more data
            hasMoreData = results.length === limit;
          }

          setHasMore(hasMoreData);
        }
      } catch (err) {
        console.error('[ModalSelectListing] Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Error loading listings');
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [fetchListings, limit, legacyListings]
  );

  // Load initial data when modal opens
  useEffect(() => {
    if (open) {
      // Reset offset when modal opens
      setOffset(0);
      // Load initial data (will use legacyListings if available, otherwise fetch)
      loadListings(0, false);
    }
  }, [open, loadListings]);

  // Restore selection from cache or props
  useEffect(() => {
    if (!open) return;

    let initialSelection: Listing[] = [];

    // Try to restore from cache if cacheKey is provided
    if (cacheKey && listings.length > 0) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedIds: number[] = JSON.parse(cached);
          const idSet = new Set(cachedIds);
          initialSelection = listings.filter((l) => idSet.has(l.id));
        }
      } catch {
        // Ignore cache errors
      }
    }

    // Fall back to props if no cache
    if (initialSelection.length === 0) {
      if (multiple) {
        initialSelection = selectedListings || [];
      } else {
        initialSelection = selectedListing ? [selectedListing] : [];
      }
    }

    // Auto-select first listing if enabled and no selection
    if (
      autoSelectFirst &&
      !multiple &&
      initialSelection.length === 0 &&
      listings.length > 0
    ) {
      initialSelection = [listings[0]];
    }

    setSelected(initialSelection);
  }, [
    open,
    selectedListing,
    selectedListings,
    multiple,
    cacheKey,
    autoSelectFirst,
    listings,
  ]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    loadListings(nextOffset, true);
  }, [offset, limit, loadListings]);

  // Toggle selection
  const handleToggle = useCallback(
    (listing: Listing) => {
      if (multiple) {
        setSelected((prev) => {
          if (prev.some((l) => l.id === listing.id)) {
            return prev.filter((l) => l.id !== listing.id);
          } else {
            return [...prev, listing];
          }
        });
      } else {
        setSelected([listing]);
      }
    },
    [multiple]
  );

  // Handle apply button
  const handleApply = useCallback(() => {
    // Save to cache if cacheKey provided
    if (cacheKey) {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify(selected.map((l) => l.id))
        );
      } catch {
        // Ignore storage errors
      }
    }

    // Call new onSelect callback
    if (onSelect) {
      onSelect(multiple ? selected : selected[0]);
    }

    // Call legacy callbacks for backward compatibility
    if (multiple) {
      if (handleListingsSelect) {
        handleListingsSelect(selected);
      }
    } else {
      if (handleListingSelect && selected[0]) {
        handleListingSelect(selected[0]);
      }
    }

    onClose();
  }, [
    selected,
    multiple,
    cacheKey,
    onSelect,
    handleListingSelect,
    handleListingsSelect,
    onClose,
  ]);

  // Memoize display title
  const displayTitle = useMemo(
    () => title || t.hostContent.calendar.selectListing,
    [title, t]
  );

  const displayEmptyMessage = useMemo(
    () => emptyMessage || t.today.noEvents,
    [emptyMessage, t]
  );

  const displayApplyLabel = useMemo(
    () => applyButtonLabel || t.hostContent.calendar.apply,
    [applyButtonLabel, t]
  );

  // Memoize modal height class based on content
  const heightClass = useMemo(() => {
    const itemCount = listings.length;
    if (itemCount === 0) return 'max-h-[300px]';
    if (itemCount <= 3) return 'max-h-[400px]';
    if (itemCount <= 6) return 'max-h-[500px]';
    return 'max-h-[70vh]';
  }, [listings.length]);

  return (
    <Modal
      open={open}
      title={displayTitle}
      TitleSubtitleContentClass="flex-col items-start mt-4"
      titleClass="text-lg font-semibold"
      onClose={onClose}
      topLeftButton={false}
      heightClass={heightClass}
      topRightAction={
        <button
          onClick={onClose}
          className="mt-8 flex cursor-pointer items-center justify-center md:mr-10"
          aria-label="Close modal"
        >
          <XMarkMini className="h-5 w-5" />
        </button>
      }
      footer={
        <button
          onClick={handleApply}
          className="btn btn-primary rounded-full text-sm font-medium"
          disabled={selected.length === 0}
        >
          {displayApplyLabel}
        </button>
      }
      lang={lang}
      widthClass="max-w-md"
    >
      <div className="flex w-full flex-col items-center gap-2 overflow-y-auto px-2">
        {/* Error state */}
        {error && (
          <div className="text-error bg-error/10 w-full rounded-lg p-4 text-center text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length === 0 && !error && (
          <span className="text-base-content/70 py-8 text-sm">
            {displayEmptyMessage}
          </span>
        )}

        {/* Listings */}
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="hover:bg-base-200/50 flex w-full items-center justify-between gap-4 rounded-lg p-2 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => handleToggle(listing)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(listing);
              }
            }}
          >
            <div className="flex w-full items-center gap-2">
              <ResponsiveImage
                photo={listing.photo || fallbackPhoto}
                alt={`listing-${listing.id}`}
                className="h-10 w-10 flex-shrink-0 rounded-2xl object-cover"
              />
              <span className="w-56 truncate text-sm font-medium">
                {listing.title ?? formatDateFull(listing.createdAt)}
              </span>
            </div>
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm cursor-pointer"
              checked={selected.some((l) => l.id === listing.id)}
              readOnly
              aria-label={`Select ${listing.title || 'listing'}`}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex w-full items-center justify-center py-4">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        )}

        {/* Load more button */}
        {!loading && hasMore && listings.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="btn btn-outline btn-secondary btn-sm mt-2 w-full rounded-full"
          >
            {t.listings.loadMore}
          </button>
        )}
      </div>
    </Modal>
  );
}
