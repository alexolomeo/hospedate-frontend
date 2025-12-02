import { useState, useEffect, useMemo, useRef } from 'react';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import ListIcon from '/src/icons/list-bullet.svg?react';
import GridIcon from '/src/icons/grid.svg?react';
import SearchIcon from '/src/icons/search.svg?react';
import DownArrowIcon from '/src/icons/chevron-down-double.svg?react';
import PlusIcon from '/src/icons/plus.svg?react';
import ListingCardGrid from '@/components/React/Host/Listings/ListingCardGrid';
import { fetchHostListings } from '@/services/host/listings';
import type { Listing } from '@/types/host/listing';
import PlusMiniIcon from '@/icons/plus-mini.svg?react';
import LoadingSpinner from '../../Common/LoadingSpinner';
import ListingTable from './ListingTable';
import { useDebounce } from '../../Hooks/useDebounce';
import { navigate } from 'astro:transitions/client';

interface Props {
  lang?: SupportedLanguages;
}

export default function ListingSection({ lang = 'es' }: Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingMoreRef = useRef(false);

  const LIMIT = 10;

  const filteredListings = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return listings.filter((listing) => {
      const title = listing.title?.toLowerCase() ?? '';
      const address = listing.location?.address?.toLowerCase() ?? '';
      const city = listing.location?.city?.toLowerCase() ?? '';
      return (
        title.includes(term) || address.includes(term) || city.includes(term)
      );
    });
  }, [listings, debouncedSearchTerm]);

  const t = getTranslation(lang);

  useEffect(() => {
    let cancelled = false;
    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHostListings({ limit: LIMIT, offset: 0 });
        if (cancelled) return;

        if (data) {
          setListings(data.results);
          setOffset(LIMIT);
          // Only set hasMore if we have the next property AND we received a full page of results
          setHasMore(!!data.next);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading listings:', error);
          setError(t.hostContent.listings.errorLoading);
          setListings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          isLoadingMoreRef.current = false;
        }
      }
    };

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const loadMore = async () => {
    // Use ref for synchronous check to prevent race conditions
    if (isLoadingMoreRef.current || !hasMore) {
      return;
    }

    // Set ref immediately to prevent concurrent calls
    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const data = await fetchHostListings({ limit: LIMIT, offset });
      if (data) {
        // Check for duplicate results
        const existingIds = new Set(listings.map((listing) => listing.id));
        const newListings = data.results.filter(
          (listing) => !existingIds.has(listing.id)
        );

        // If no new unique listings, stop pagination
        if (newListings.length === 0) {
          console.warn('Duplicate results detected, stopping pagination');
          setHasMore(!!data.next);
          setLoadingMore(false);
          isLoadingMoreRef.current = false;
          return;
        }

        // Check if we got fewer unique listings than expected
        if (newListings.length < data.results.length) {
          console.warn(
            `Filtered out ${data.results.length - newListings.length} duplicate listing(s)`
          );
        }

        setListings((prev) => [...prev, ...newListings]);
        setOffset((prev) => prev + LIMIT);
        setHasMore(!!data.next);
      }
    } catch (error) {
      console.error('Failed to load more listings:', error);
      // Don't set hasMore to false on error, allow retry
    } finally {
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  const hasAny = listings.length > 0;
  const hasFiltered = filteredListings.length > 0;
  const shouldShowLoadMore =
    !loading && hasFiltered && hasMore && !debouncedSearchTerm;

  return (
    <section className="flex w-full flex-col gap-6 overflow-x-hidden px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 md:px-12 lg:px-[80px] xl:px-[120px]">
      <div className="flex w-full flex-col gap-4">
        <h1 className="text-base-content text-2xl font-bold sm:text-3xl">
          {t.hostContent.listings.title}
        </h1>

        {/* Mobile-first controls layout */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar - full width on mobile */}
          <div className="order-2 max-w-md sm:order-1 sm:flex-1">
            <label className="border-secondary flex h-12 w-full items-center gap-2 rounded-full border px-4 shadow-sm">
              <SearchIcon className="text-secondary h-5 w-5 flex-shrink-0" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.hostContent.listings.searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-sm"
              />
            </label>
          </div>

          {/* Action buttons */}
          <div className="order-1 flex items-center justify-between gap-2 sm:order-2 sm:justify-end">
            <button
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-4 transition hover:bg-gray-100"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <>
                  <span className="text-sm">
                    {t.hostContent.listings.viewList}
                  </span>
                  <ListIcon className="h-5 w-5" />
                </>
              ) : (
                <>
                  <span className="text-sm">
                    {t.hostContent.listings.viewGrid}
                  </span>
                  <GridIcon className="h-5 w-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/listing/create')}
              className="bg-primary hover:bg-primary/90 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-white shadow-sm transition"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner lang={lang} />
      ) : error ? (
        <div className="flex h-[330px] w-full flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-primary-content flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold shadow-sm transition"
            >
              {t.hostContent.listings.retry}
            </button>
          </div>
        </div>
      ) : !hasAny ? (
        <div className="flex h-[330px] w-full flex-col items-center justify-center gap-6">
          <div
            className="h-[214px] w-[317px] bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/images/host/listings/empty-listings.webp')`,
            }}
          />
          <p className="text-neutral w-[269px] text-center text-sm leading-5">
            {t.hostContent.listings.emptyDescription}
          </p>
          <button
            className="bg-primary hover:bg-primary/90 text-primary-content flex h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm transition"
            onClick={() => navigate('/listing/create')}
          >
            <PlusMiniIcon className="h-4 w-4" />
            {t.hostContent.listings.addListing}
          </button>
        </div>
      ) : !hasFiltered ? (
        <div className="flex h-[200px] flex-col items-center justify-center gap-3">
          <p className="text-sm text-gray-500">
            {t.hostContent.listings.noResults}
          </p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="bg-primary hover:bg-primary/90 text-primary-content flex h-12 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold shadow-sm transition"
            aria-label={t.hostContent.listings.clear}
            title={t.hostContent.listings.clear}
          >
            {t.hostContent.listings.clear}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <ListingCardGrid
          searchTerm={debouncedSearchTerm}
          listings={filteredListings}
          lang={lang}
        />
      ) : (
        <ListingTable
          listings={filteredListings}
          searchTerm={debouncedSearchTerm}
          lang={lang}
        />
      )}

      {/* Load More Button */}
      {shouldShowLoadMore && (
        <div className="mt-5 flex items-center justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="btn btn-primary btn-ghost btn-md text-primary hover:text-base-100 mt-2 flex items-center justify-center gap-2 rounded-full"
          >
            {loadingMore
              ? t.hostContent.listings.loading
              : t.hostContent.listings.showMore}

            <DownArrowIcon className="h-3 w-3" />
          </button>
        </div>
      )}
    </section>
  );
}
