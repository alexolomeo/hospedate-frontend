import { useState, useEffect, useCallback } from 'react';
import type { Listing } from '@/types/host/listing';

interface UseListingSelectionProps {
  userId?: string | number;
  storageKey?: string;
  multiple?: boolean;
  availableListings?: Listing[];
}

interface UseListingSelectionReturn {
  selectedListings: Listing[] | null;
  handleListingSelect: (listing: Listing) => void;
  handleListingsSelect: (listings: Listing[]) => void;
}

/**
 * Simplified hook to manage listing selection with localStorage persistence.
 * Does NOT handle fetching - that should be done by the parent component.
 * @param userId - The user ID for scoping localStorage keys
 * @param storageKey - Optional custom storage key (defaults to 'selectedListingId')
 * @param multiple - Whether to allow multiple listing selection
 * @param availableListings - The listings to restore selection from (when localStorage has IDs)
 */
export function useListingSelection({
  userId,
  storageKey = 'selectedListingId',
  multiple = false,
  availableListings = [],
}: UseListingSelectionProps): UseListingSelectionReturn {
  const [selectedListings, setSelectedListings] = useState<Listing[] | null>(
    null
  );

  // Restore selection from localStorage when availableListings changes
  useEffect(() => {
    if (!userId || availableListings.length === 0) {
      return;
    }

    // Only access localStorage on the client side
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(`host:${userId}:incomes:${storageKey}`);

      if (raw) {
        if (multiple) {
          // For multiple selection, expect a JSON array of IDs
          const persistedIds = JSON.parse(raw) as number[];
          if (Array.isArray(persistedIds)) {
            const restored = availableListings.filter((r) =>
              persistedIds.includes(r.id)
            );
            if (restored.length > 0) {
              setSelectedListings(restored);
              return;
            }
          }
        } else {
          // For single selection, expect a single ID
          const persistedId = parseInt(raw, 10);
          if (Number.isFinite(persistedId)) {
            const found = availableListings.find((r) => r.id === persistedId);
            if (found) {
              setSelectedListings([found]);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('[useListingSelection] Error reading localStorage:', error);
    }

    // If no persisted listing found, select the first available listing
    if (availableListings.length > 0) {
      const firstListing = availableListings[0];
      setSelectedListings([firstListing]);

      // Save the initial selection to localStorage
      try {
        if (multiple) {
          localStorage.setItem(
            `host:${userId}:incomes:${storageKey}`,
            JSON.stringify([firstListing.id])
          );
        } else {
          localStorage.setItem(
            `host:${userId}:incomes:${storageKey}`,
            String(firstListing.id)
          );
        }
      } catch (error) {
        console.error(
          '[useListingSelection] Error saving to localStorage:',
          error
        );
      }
    }
  }, [userId, storageKey, multiple, availableListings]);

  // Handle single listing selection
  const handleListingSelect = useCallback(
    (listing: Listing) => {
      setSelectedListings([listing]);
      if (typeof window !== 'undefined' && userId) {
        try {
          localStorage.setItem(
            `host:${userId}:incomes:${storageKey}`,
            String(listing.id)
          );
        } catch (error) {
          console.error(
            '[useListingSelection] Error saving to localStorage:',
            error
          );
        }
      }
    },
    [userId, storageKey]
  );

  // Handle multiple listings selection
  const handleListingsSelect = useCallback(
    (listings: Listing[]) => {
      setSelectedListings(listings);
      if (typeof window !== 'undefined' && userId) {
        try {
          const ids = listings.map((l) => l.id);
          localStorage.setItem(
            `host:${userId}:incomes:${storageKey}`,
            JSON.stringify(ids)
          );
        } catch (error) {
          console.error(
            '[useListingSelection] Error saving to localStorage:',
            error
          );
        }
      }
    },
    [userId, storageKey]
  );

  return {
    selectedListings,
    handleListingSelect,
    handleListingsSelect,
  };
}
