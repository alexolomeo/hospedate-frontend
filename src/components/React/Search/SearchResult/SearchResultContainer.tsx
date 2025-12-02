import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  motion,
  useAnimation,
  useDragControls,
  type PanInfo,
} from 'framer-motion';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import {
  $params,
  $searchMode,
  $isLoading,
  $hoveredListingId,
  $mapState,
  $pagination,
} from '@/stores/searchStore';
import { useStore } from '@nanostores/react';
import type { QueryParams, MapState, FilterState } from '@/types/search';
import { SearchType } from '@/types/search';
import { useListingsSearcher } from '@/components/React/Hooks/useListingsSearcher';
import SearchCardResult from './SearchCardResult';
import ListingGoogleMap from './ListingGoogleMap';
import { useDebounce } from '../../Hooks/useDebounce';
import { updateUrlWithFilters } from '@/utils/urlUtils';
import ModalFilter from '../ModalFilter';
import { trackApplyFilters } from '@/services/analytics';

interface Props {
  queryParams: QueryParams;
  lang?: SupportedLanguages;
  googleDescription?: string | null;
}

/**
 * Mobile Bottom Sheet States
 * - mapFull: Map takes 100% viewport height, results minimized
 * - half: Map and results each take 50% viewport height
 * - listFull: Results take 100% viewport height, map hidden
 */
type MobileSheetState = 'mapFull' | 'half' | 'listFull';

/**
 * Get the Y position (top offset) for each mobile sheet state
 * These values represent how far down from the top of the viewport the results sheet should be positioned
 */

// Velocity threshold for momentum-based transitions
export const VELOCITY_THRESHOLD = 500;

export default function SearchResultContainer({
  queryParams,
  lang = 'es',
  googleDescription,
}: Props) {
  const t = getTranslation(lang);
  type PendingMap = { state: MapState; skipSearch: boolean };
  const [pendingMap, setPendingMap] = useState<PendingMap | null>(null);
  const debouncedMap = useDebounce(pendingMap, 900);
  const [localDestination, setLocalDestination] = useState(googleDescription);
  const { search } = useListingsSearcher();

  const isLoading = useStore($isLoading);
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const HEADER_OFFSET = 79;

  // Mobile Bottom Sheet State Management
  const [mobileSheetState, setMobileSheetState] =
    useState<MobileSheetState>('half');
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const controls = useAnimation();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      const el = topAnchorRef.current;
      if (el) {
        const y =
          el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleInteraction = useCallback(() => {
    $isLoading.set(true);
  }, []);
  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
  };

  useEffect(() => {
    const paramsToSet: Partial<QueryParams> = {};
    if (queryParams.placeId) {
      paramsToSet.placeId = queryParams.placeId;
    }
    if (queryParams.checkInDate) {
      paramsToSet.checkInDate = queryParams.checkInDate;
    }
    if (queryParams.checkoutDate) {
      paramsToSet.checkoutDate = queryParams.checkoutDate;
    }
    if (queryParams.adults && queryParams.adults > 0) {
      paramsToSet.adults = queryParams.adults;
    }
    if (queryParams.children && queryParams.children > 0) {
      paramsToSet.children = queryParams.children;
    }
    if (queryParams.infants && queryParams.infants > 0) {
      paramsToSet.infants = queryParams.infants;
    }
    if (queryParams.numPets && queryParams.numPets > 0) {
      paramsToSet.numPets = queryParams.numPets;
    }
    if (queryParams.flexible) {
      paramsToSet.flexible = queryParams.flexible;
    }

    $params.set({
      ...$params.get(),
      ...paramsToSet,
    });
    const currentPagination = $pagination.get();
    $pagination.set({
      ...currentPagination,
      limit: queryParams.limit,
      offset: queryParams.offset || 0,
    });
    $searchMode.set(queryParams.searchType);
    search();
  }, [queryParams, search]);

  const handlePageChange = useCallback(
    (newOffset: number) => {
      const currentPagination = $pagination.get();
      if (newOffset !== currentPagination.offset) {
        $pagination.set({ ...currentPagination, offset: newOffset });
        search();
      }
    },
    [search]
  );

  const handleMapMove = useCallback(
    (newMapState: MapState, opts?: { skipSearch: boolean }) => {
      setPendingMap({ state: newMapState, skipSearch: !!opts?.skipSearch });
    },
    []
  );

  const handleFilterChange = useCallback(
    (state: FilterState) => {
      const newFilterParams: Partial<QueryParams> = {};
      newFilterParams.maxPrice = state.price.max;
      newFilterParams.minPrice = state.price.min;
      newFilterParams.minBeds = state.rooms.beds;
      newFilterParams.minBaths = state.rooms.baths;
      newFilterParams.minRooms = state.rooms.bedrooms;

      newFilterParams.amenities = state.amenities;
      newFilterParams.propertyTypeGroups = state.propertyTypeGroups;
      newFilterParams.reservationOptions = state.reservations;
      $params.set({
        ...$params.get(),
        ...newFilterParams,
      });

      // Track filter application
      trackApplyFilters({
        min_price: state.price.min || 0,
        max_price: state.price.max || 0,
        min_beds: state.rooms.beds || 0,
        min_baths: state.rooms.baths || 0,
        min_bedrooms: state.rooms.bedrooms || 0,
        amenities_count: state.amenities.length,
        property_types_count: state.propertyTypeGroups.length,
        reservation_options_count: state.reservations.length,
        has_price_filter: state.price.min > 0 || state.price.max > 0,
        has_rooms_filter:
          (state.rooms.beds || 0) > 0 ||
          (state.rooms.baths || 0) > 0 ||
          (state.rooms.bedrooms || 0) > 0,
        has_amenities_filter: state.amenities.length > 0,
        has_property_type_filter: state.propertyTypeGroups.length > 0,
        has_reservation_options_filter: state.reservations.length > 0,
      });

      updateUrlWithFilters(state);
      search();
    },
    [search]
  );

  useEffect(() => {
    if (!debouncedMap) return;

    const currentParams = $params.get();
    const isMapMode = !debouncedMap.skipSearch;

    // If the search is set to MAP type, we only remove the placeId
    const cleanParams = isMapMode
      ? Object.fromEntries(
          Object.entries(currentParams).filter(([key]) => key !== 'placeId')
        )
      : currentParams;

    $mapState.set(debouncedMap.state);
    $params.set({
      ...cleanParams,
      northEastLat: formatCoordinate(debouncedMap.state.bounds.northEastLat),
      northEastLng: formatCoordinate(debouncedMap.state.bounds.northEastLng),
      southWestLat: formatCoordinate(debouncedMap.state.bounds.southWestLat),
      southWestLng: formatCoordinate(debouncedMap.state.bounds.southWestLng),
      zoom: debouncedMap.state.zoom,
    });

    if (!debouncedMap.skipSearch) {
      $searchMode.set(SearchType.Map);

      try {
        window.dispatchEvent(
          new CustomEvent('search:clear-destination', {
            detail: {
              googleDescription: '',
              userInput: '',
              placeId: null,
              isMapArea: true,
            },
          })
        );
      } catch (e) {
        console.log('Failed to dispatch search:clear-destination event', e);
      }

      setLocalDestination(' ' + t.search.destination.map);

      const currentPagination = $pagination.get();
      $pagination.set({ ...currentPagination, offset: 0 });

      search();
    }
  }, [debouncedMap, search, t.search.destination.map]);

  const handleListingHover = useCallback((id: string | null) => {
    $hoveredListingId.set(id);
  }, []);

  /**
   * Track viewport height changes for mobile bottom sheet calculations
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Animate sheet to the target state with smooth spring physics
   * Now we just set the state and let the map height animation handle the visual change
   */
  const animateToState = useCallback(
    (state: MobileSheetState) => {
      setMobileSheetState(state);
      // Reset the drag position to 0
      void controls.start({
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        },
      });
    },
    [controls]
  );

  /**
   * Handle drag end event to determine which state to snap to
   * Based on drag distance and velocity (momentum)
   */
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // Minimum drag distance to trigger a state change (in pixels)
      const DRAG_THRESHOLD = 50;

      // If dragging with high velocity, respect momentum
      if (Math.abs(velocity.y) > VELOCITY_THRESHOLD) {
        if (velocity.y > 0) {
          // Fast downward swipe - show more map
          if (mobileSheetState === 'listFull') {
            animateToState('half');
          } else if (mobileSheetState === 'half') {
            animateToState('mapFull');
          }
        } else {
          // Fast upward swipe - show more list
          if (mobileSheetState === 'mapFull') {
            animateToState('half');
          } else if (mobileSheetState === 'half') {
            animateToState('listFull');
          }
        }
        return;
      }

      // Otherwise, check if drag distance exceeds threshold
      if (Math.abs(offset.y) > DRAG_THRESHOLD) {
        if (offset.y > 0) {
          // Dragged down - show more map
          if (mobileSheetState === 'listFull') {
            animateToState('half');
          } else if (mobileSheetState === 'half') {
            animateToState('mapFull');
          }
        } else {
          // Dragged up - show more list
          if (mobileSheetState === 'mapFull') {
            animateToState('half');
          } else if (mobileSheetState === 'half') {
            animateToState('listFull');
          }
        }
      } else {
        // Drag was too small, snap back to current state
        animateToState(mobileSheetState);
      }
    },
    [mobileSheetState, animateToState]
  );

  /**
   * Handle keyboard interactions for the grab handle
   * Enter/Space: Toggle between states
   * ArrowUp: Expand list (show more cards)
   * ArrowDown: Collapse list (show more map)
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Prevent default scroll behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'Enter':
        case ' ': // Space key
          // Toggle through states in order: mapFull -> half -> listFull -> half -> ...
          if (mobileSheetState === 'mapFull') {
            animateToState('half');
          } else if (mobileSheetState === 'half') {
            animateToState('listFull');
          } else {
            animateToState('half');
          }
          break;

        case 'ArrowUp':
          // Show more list (expand upward)
          if (mobileSheetState === 'mapFull') {
            animateToState('half');
          } else if (mobileSheetState === 'half') {
            animateToState('listFull');
          }
          break;

        case 'ArrowDown':
          // Show more map (collapse downward)
          if (mobileSheetState === 'listFull') {
            animateToState('half');
          } else if (mobileSheetState === 'half') {
            animateToState('mapFull');
          }
          break;

        default:
          break;
      }
    },
    [mobileSheetState, animateToState]
  );

  /**
   * Initialize sheet position and handle viewport changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Always start at y: 0 since we're using map height animation now
    void controls.start({ y: 0, transition: { duration: 0 } });

    const handleResize = () => {
      // Update viewport height for map calculations
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [controls]);

  return (
    <>
      {/* Desktop Layout - Unchanged from original */}
      <section className="hidden w-full px-4 py-3 sm:px-8 md:flex md:px-12 lg:px-16 xl:px-20">
        <div className="flex w-full flex-col md:flex-row md:gap-[2%]">
          <div ref={topAnchorRef} aria-hidden="true" />
          <div className="w-full md:order-2 md:w-[38%]">
            <div className="sticky top-[100px] h-[calc(100vh-100px)] w-full pb-5">
              <div className="h-full w-full overflow-hidden rounded-xl">
                <ListingGoogleMap
                  onInteraction={handleInteraction}
                  onMapMove={handleMapMove}
                  onListingHover={handleListingHover}
                  lang={lang}
                />
              </div>
            </div>
          </div>

          <div className="w-full md:order-1 md:w-[60%]">
            <SearchCardResult
              destination={localDestination}
              onPageChange={handlePageChange}
              onListingHover={handleListingHover}
              lang={lang}
              queryParams={queryParams}
            />
          </div>
        </div>
        <ModalFilter lang={lang} onUpdateFilters={handleFilterChange} />
      </section>

      {/* Mobile Layout - Single Scroll with Collapsible Map */}
      <section className="relative block w-full md:hidden">
        {/* Map Container - Collapses based on sheet state */}
        <motion.div
          className="relative w-full overflow-hidden"
          animate={{
            height:
              mobileSheetState === 'listFull'
                ? 0
                : mobileSheetState === 'half'
                  ? viewportHeight * 0.5
                  : viewportHeight - 100, // Leave 100px for grab handle section to be clearly visible
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
        >
          <div className="h-screen w-full">
            <ListingGoogleMap
              onInteraction={handleInteraction}
              onMapMove={handleMapMove}
              onListingHover={handleListingHover}
              lang={lang}
            />
          </div>
        </motion.div>

        {/* Draggable Results Sheet */}
        <motion.div
          ref={sheetRef}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{
            top: -150,
            bottom: 50,
          }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          animate={controls}
          initial={{ y: 0 }}
          className="relative z-10 flex min-h-screen flex-col bg-white"
          style={{
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          {/* Grab Handle */}
          <div
            className="sticky top-0 z-20 flex w-full justify-center bg-white py-4"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: 'none' }}
          >
            <div
              className="h-1.5 w-12 cursor-grab rounded-full bg-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:cursor-grabbing"
              aria-label="Drag handle to adjust map and list view. Press Enter or Space to toggle, or use arrow keys to expand or collapse."
              aria-expanded={mobileSheetState === 'listFull'}
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Results Content - Natural Page Scroll */}
          <div className="px-4 pb-8">
            <SearchCardResult
              destination={localDestination}
              onPageChange={handlePageChange}
              onListingHover={handleListingHover}
              lang={lang}
              queryParams={queryParams}
            />
          </div>
        </motion.div>

        <ModalFilter lang={lang} onUpdateFilters={handleFilterChange} />
      </section>
    </>
  );
}
