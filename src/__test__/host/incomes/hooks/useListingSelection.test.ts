import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useListingSelection } from '@/components/React/Hooks/Incomes/useListingSelection';
import type { Listing } from '@/types/host/listing';

describe('useListingSelection', () => {
  const mockListings: Listing[] = [
    {
      id: 1,
      title: 'Beautiful Apartment',
      status: 'PUBLISHED',
      createdAt: '2025-10-01T10:00:00Z',
      propertyType: 'apartment',
      location: {
        address: '123 Main St',
        city: 'Santa Cruz',
        state: 'Santa Cruz',
        country: 'Bolivia',
      },
      photo: {
        original: 'https://example.com/image1.jpg',
        srcsetWebp: 'https://example.com/image1.webp 480w',
        srcsetAvif: 'https://example.com/image1.avif 480w',
      },
    },
    {
      id: 2,
      title: 'Cozy Studio',
      status: 'UNLISTED',
      createdAt: '2025-10-05T10:00:00Z',
      propertyType: 'studio',
      location: {
        address: '456 Oak Ave',
        city: 'La Paz',
        state: 'La Paz',
        country: 'Bolivia',
      },
      photo: {
        original: 'https://example.com/image2.jpg',
        srcsetWebp: 'https://example.com/image2.webp 480w',
        srcsetAvif: 'https://example.com/image2.avif 480w',
      },
    },
    {
      id: 3,
      title: 'Mountain Cabin',
      status: 'PUBLISHED',
      createdAt: '2025-10-10T10:00:00Z',
      propertyType: 'cabin',
      location: {
        address: '789 Pine Rd',
        city: 'Cochabamba',
        state: 'Cochabamba',
        country: 'Bolivia',
      },
      photo: {
        original: 'https://example.com/image3.jpg',
        srcsetWebp: 'https://example.com/image3.webp 480w',
        srcsetAvif: 'https://example.com/image3.avif 480w',
      },
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should select first listing by default when availableListings provided', async () => {
    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: mockListings,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([mockListings[0]]);
    });

    // Should also save to localStorage
    expect(localStorage.getItem('host:123:incomes:selectedListingId')).toBe(
      '1'
    );
  });

  it('should restore selection from localStorage if listing exists', async () => {
    localStorage.setItem('host:123:incomes:selectedListingId', '2');

    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: mockListings,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([mockListings[1]]);
    });
  });

  it('should fallback to first listing if cached ID not in available listings', async () => {
    localStorage.setItem('host:123:incomes:selectedListingId', '999');

    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: mockListings,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([mockListings[0]]);
    });
  });

  it('should handle single listing selection', async () => {
    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: mockListings,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedListings).not.toBeNull();
    });

    act(() => {
      result.current.handleListingSelect(mockListings[2]);
    });

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([mockListings[2]]);
    });

    expect(localStorage.getItem('host:123:incomes:selectedListingId')).toBe(
      '3'
    );
  });

  it('should handle multiple listing selection when enabled', async () => {
    localStorage.setItem(
      'host:123:incomes:selectedListingId',
      JSON.stringify([1, 3])
    );

    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: mockListings,
        multiple: true,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([
        mockListings[0],
        mockListings[2],
      ]);
    });

    act(() => {
      result.current.handleListingsSelect([mockListings[1]]);
    });

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([mockListings[1]]);
    });

    const saved = localStorage.getItem('host:123:incomes:selectedListingId');
    expect(JSON.parse(saved || '[]')).toEqual([2]);
  });

  it('should use custom storage key', async () => {
    localStorage.setItem('host:123:incomes:customKey', '2');

    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: mockListings,
        storageKey: 'customKey',
      })
    );

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([mockListings[1]]);
    });
  });

  it('should handle no userId', () => {
    const { result } = renderHook(() =>
      useListingSelection({
        userId: undefined,
        availableListings: mockListings,
      })
    );

    // Without userId, the hook won't initialize selection (returns early in useEffect)
    expect(result.current.selectedListings).toBeNull();
  });

  it('should handle empty availableListings', async () => {
    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: [],
      })
    );

    // Should remain null when no listings available
    expect(result.current.selectedListings).toBeNull();
  });

  it('should handle invalid localStorage data', async () => {
    localStorage.setItem('host:123:incomes:selectedListingId', 'invalid');

    const { result } = renderHook(() =>
      useListingSelection({
        userId: 123,
        availableListings: mockListings,
      })
    );

    await waitFor(() => {
      // Should fallback to first listing
      expect(result.current.selectedListings).toEqual([mockListings[0]]);
    });
  });

  it('should update selection when availableListings change', async () => {
    const { result, rerender } = renderHook(
      ({ listings }) =>
        useListingSelection({
          userId: 123,
          availableListings: listings,
        }),
      {
        initialProps: { listings: [mockListings[0]] },
      }
    );

    await waitFor(() => {
      expect(result.current.selectedListings).toEqual([mockListings[0]]);
    });

    // Update available listings
    rerender({ listings: mockListings });

    await waitFor(() => {
      // Should maintain selection if listing still exists
      expect(result.current.selectedListings).toEqual([mockListings[0]]);
    });
  });
});
