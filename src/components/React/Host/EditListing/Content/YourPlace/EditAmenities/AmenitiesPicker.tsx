import AppButton from '@/components/React/Common/AppButton';
import AppIcon from '@/components/React/Common/AppIcon';
import CheckIcon from '/src/icons/check-mini.svg?react';
import PlusIcon from '/src/icons/plus.svg?react';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { CatalogsSelectors } from '@/components/React/Hooks/Host/EditListing/useEditListing';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import LoadingSpinner from '@/components/React/Common/LoadingSpinner';
import ChevronLeftIcon from '/src/icons/chevron-left.svg?react';
import ChevronRightIcon from '/src/icons/chevron-right.svg?react';

interface Props {
  selectors: CatalogsSelectors;
  query: string;
  selectedAmenityIds: number[];
  onToggleAmenity: (id: number) => void;
  translateAmenityLabel: (icon: string) => string;
  translateAmenityGroupLabel: (name: string) => string;
  isPending?: (id: number) => boolean;
  lang?: SupportedLanguages;
}

export function AmenitiesPicker({
  selectors,
  query,
  selectedAmenityIds,
  onToggleAmenity,
  translateAmenityLabel,
  translateAmenityGroupLabel,
  isPending,
  lang = 'es',
}: Props) {
  const t = getTranslation(lang);
  const allLabel = t.hostContent.editListing.content.amenities.allLabel;

  function uniqueById<T extends { id: number }>(items: T[]): T[] {
    const seen = new Set<number>();
    const out: T[] = [];
    for (const it of items) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
    return out;
  }

  const allAmenities = useMemo(
    () => uniqueById(selectors.amenityGroups.flatMap((g) => g.amenities)),
    [selectors.amenityGroups]
  );

  const groupsWithAll = useMemo(
    () => [
      { id: 0, name: allLabel, amenities: allAmenities },
      ...selectors.amenityGroups,
    ],
    [selectors.amenityGroups, allAmenities, allLabel]
  );

  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  useEffect(() => {
    const exists = groupsWithAll.some((g) => g.id === selectedGroupId);
    if (!exists) setSelectedGroupId(0);
  }, [groupsWithAll, selectedGroupId]);

  const selectedGroup = useMemo(
    () =>
      groupsWithAll.find((g) => g.id === selectedGroupId) ?? groupsWithAll[0],
    [groupsWithAll, selectedGroupId]
  );

  const visibleAmenities = useMemo(() => {
    const pool = selectedGroup?.amenities ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((a) => {
      const translated = translateAmenityLabel(a.icon).toLowerCase();
      return a.name.toLowerCase().includes(q) || translated.includes(q);
    });
  }, [selectedGroup, query, translateAmenityLabel]);

  const isSelected = (id: number): boolean => selectedAmenityIds.includes(id);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const scrollTabs = useCallback((dir: 'left' | 'right') => {
    const el = tabsRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -200 : 200;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  return (
    <div className="overflow-visible overscroll-contain">
      {/* Tabs navigation */}
      <div className="bg-base-100 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Left arrow */}
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollTabs('left')}
            disabled={!canScrollLeft}
            className={`bg-primary text-base-100 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
              canScrollLeft
                ? 'hover:brightness-110 active:scale-95'
                : 'cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {/* Scrollable tabs */}
          <div
            id="amenity-tabs"
            ref={tabsRef}
            className="hide-scrollbar flex flex-1 flex-nowrap overflow-x-auto scroll-smooth py-4"
          >
            {groupsWithAll.map((group) => {
              const label =
                group.id === 0
                  ? allLabel
                  : translateAmenityGroupLabel(group.name);
              return (
                <AppButton
                  key={group.id}
                  size="sm"
                  label={label}
                  className="mx-2 flex-shrink-0 transition-all duration-200"
                  outline={selectedGroupId !== group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                />
              );
            })}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollTabs('right')}
            disabled={!canScrollRight}
            className={`bg-primary text-base-100 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
              canScrollRight
                ? 'hover:brightness-110 active:scale-95'
                : 'cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="border-base-200 border-b" />

        <h2 className="my-4 text-lg font-semibold">
          {selectedGroup?.id === 0
            ? allLabel
            : translateAmenityGroupLabel(selectedGroup?.name ?? '')}
        </h2>
      </div>

      {/* Amenity list */}
      <div className="flex flex-col gap-3">
        {visibleAmenities.map((amenity) => {
          const selected = isSelected(amenity.id);
          const pending = isPending?.(amenity.id) ?? false;

          return (
            <div key={amenity.id} className="flex justify-between">
              <div className="flex items-center justify-center gap-2">
                <AppIcon
                  iconName={amenity.icon}
                  folder="amenities"
                  className={`text-secondary h-6 w-6 ${pending ? 'opacity-40' : ''}`}
                  loaderCompact
                />
                <p
                  className={`text-sm ${
                    pending ? 'user-select-none opacity-50' : ''
                  }`}
                >
                  {translateAmenityLabel(amenity.icon)}
                </p>
              </div>

              <button
                onClick={() => !pending && onToggleAmenity(amenity.id)}
                disabled={pending}
                className={`btn btn-xs btn-circle transition-all duration-200 ${
                  pending
                    ? 'btn-disabled cursor-wait opacity-60'
                    : selected
                      ? 'btn-primary transform shadow-md'
                      : 'btn-base-200 hover:shadow-sm'
                }`}
              >
                {pending ? (
                  <LoadingSpinner
                    size="sm"
                    message=""
                    className="scale-75 pt-4"
                  />
                ) : selected ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <PlusIcon className="text-primary h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
