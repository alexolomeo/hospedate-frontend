import { useEffect, useState, useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import CalendarIcon from '/src/icons/calendar-outline.svg?react';
import ChevronDownIcon from '/src/icons/chevron-down.svg?react';
import IncomesCardPrimary from './IncomesCardPrimary';
import IncomesCardSecondary from './IncomesCardSecondary';
import { PayoutStatus } from '@/types/host/incomes';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import ModalSelectListing from '../Calendar/ModalSelectListing';
import { $userStore } from '@/stores/userStore';
import { ResponsiveImage } from '../../Common/ResponsiveImage';
import ModalFilterReservations from './ModalFilterReservations';
import { useFilterReservations } from '../../Hooks/Incomes/useFilterReservations';
import ErrorState from '../../Common/ErrorState';
import { fetchHostIncomes } from '@/services/host/incomes';
import type { IncomesData } from '@/utils/incomesTransformers';
import {
  formatCurrency,
  transformIncomesData,
} from '@/utils/incomesTransformers';
import { navigate } from 'astro/virtual-modules/transitions-router.js';
import { fetchHostListings } from '@/services/host/listings';
import type { Listing } from '@/types/host/listing';

interface Props {
  lang?: SupportedLanguages;
}

export default function IncomesPage({ lang = 'es' }: Props) {
  const t = getTranslation(lang);
  const user = useStore($userStore);
  const LIMIT_INITIAL_LISTINGS = 10;

  const [activeTab, setActiveTab] = useState<PayoutStatus>(PayoutStatus.Paid);
  const [isModalListingOpen, setIsModalListingOpen] = useState(false);
  const [isModalFilterOpen, setIsModalFilterOpen] = useState(false);
  const [incomesData, setIncomesData] = useState<IncomesData | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [loadingListings, setLoadingListings] = useState(true);
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);

  // Fetch function for modal (uses pagination)
  const fetchIncomesListings = useCallback(
    async (params: { limit: number; offset: number }) => {
      const data = await fetchHostListings({
        limit: params.limit,
        offset: params.offset,
        listingStatus: ['PUBLISHED', 'UNLISTED'],
      });

      return data?.results || [];
    },
    []
  );

  // Handle listing selection from modal
  const handleListingSelect = useCallback(
    (listing: Listing) => {
      setSelectedListing(listing);
      // Save to localStorage
      if (user?.id) {
        try {
          localStorage.setItem(
            `host:${user.id}:incomes:selectedListingId`,
            String(listing.id)
          );
        } catch (error) {
          console.error('[IncomesPage] Error saving to localStorage:', error);
        }
      }
    },
    [user?.id]
  );

  // Fetch initial listings to determine selection
  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const fetchInitialListing = async () => {
      try {
        setLoadingListings(true);
        // Fetch only first page (limit 10) to check for selection
        const results = await fetchIncomesListings({
          limit: LIMIT_INITIAL_LISTINGS,
          offset: 0,
        });

        if (!mounted) return;

        // Store the fetched listings for the modal
        setAvailableListings(results);

        if (results.length === 0) {
          setLoadingListings(false);
          return;
        }

        // Try to restore from localStorage
        let selected: Listing | null = null;
        try {
          const cachedId = localStorage.getItem(
            `host:${user.id}:incomes:selectedListingId`
          );
          if (cachedId) {
            const persistedId = parseInt(cachedId, 10);
            selected = results.find((l) => l.id === persistedId) || null;
          }
        } catch (error) {
          console.error(
            '[IncomesPage] Error reading from localStorage:',
            error
          );
        }

        // If no cached selection or not found in results, select first listing
        if (!selected) {
          selected = results[0];
          // Save the first listing as default
          try {
            localStorage.setItem(
              `host:${user.id}:incomes:selectedListingId`,
              String(selected.id)
            );
          } catch (error) {
            console.error('[IncomesPage] Error saving to localStorage:', error);
          }
        }

        if (mounted) {
          setSelectedListing(selected);
        }
      } catch (err) {
        console.error('[IncomesPage] Error fetching initial listing:', err);
      } finally {
        if (mounted) {
          setLoadingListings(false);
        }
      }
    };

    fetchInitialListing();
    return () => {
      mounted = false;
    };
  }, [user?.id, fetchIncomesListings]);

  const { selectedMonth, selectedYear, handleFilterReservations } =
    useFilterReservations({
      userId: user?.id,
    });

  // ===== Memoized constants =====
  const TABS = useMemo(
    () =>
      [
        { key: PayoutStatus.Paid, label: t.incomes.completedPayouts },
        { key: PayoutStatus.Pending, label: t.incomes.pendingPayouts },
      ] as const,
    [t.incomes.completedPayouts, t.incomes.pendingPayouts]
  );

  const fallbackPhoto = useMemo(
    () => ({
      original: '/images/host/listings/fallback-card-image.webp',
      srcsetWebp: '',
      srcsetAvif: '',
    }),
    []
  );

  const displayedPayouts = useMemo(
    () =>
      activeTab === PayoutStatus.Paid
        ? incomesData?.payouts.completed
        : incomesData?.payouts.pending,
    [activeTab, incomesData]
  );

  // ===== Stable callbacks =====
  const openListingModal = useCallback(() => setIsModalListingOpen(true), []);
  const closeListingModal = useCallback(() => setIsModalListingOpen(false), []);
  const openFilterModal = useCallback(() => setIsModalFilterOpen(true), []);
  const closeFilterModal = useCallback(() => setIsModalFilterOpen(false), []);

  // ===== Fetch data from backend =====
  useEffect(() => {
    if (!user?.id || !selectedYear || !selectedMonth) return;

    let mounted = true;
    const fetchIncomesData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = {
          year: parseInt(selectedYear),
          month: parseInt(selectedMonth),
          listing_id: selectedListing?.id,
        };

        const response = await fetchHostIncomes(params);

        if (mounted && response) {
          const transformedData = transformIncomesData(response);
          setIncomesData(transformedData);
        }
      } catch (err) {
        console.error('[IncomesPage] Error fetching incomes data:', err);
        if (mounted) {
          setError('Error fetching incomes data');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchIncomesData();
    return () => {
      mounted = false;
    };
  }, [user?.id, selectedYear, selectedMonth, selectedListing?.id]);

  // ===== Loading and Error States =====
  if ((isLoading && !incomesData) || loadingListings) {
    return (
      <div className="bg-base-100 flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="text-base-content/70 text-lg">
          {t.incomes.loadingIncomes}
        </p>
      </div>
    );
  }

  if (error || incomesData === undefined) {
    return <ErrorState message={error || 'Error fetching incomes data'} />;
  }

  // ===== Render =====
  return (
    <div className="bg-base-100 flex w-full flex-col items-start justify-center gap-12 px-4 py-12 md:px-12 xl:px-60">
      {/* Navigation Section */}
      <div className="flex w-full flex-col items-start justify-start gap-4">
        <div className="flex flex-row items-center gap-2">
          <h1 className="text-base-content text-2xl font-bold">
            {t.incomes.title}
          </h1>
        </div>
      </div>

      {/* Info Section */}
      <section className="flex w-full flex-col gap-14 md:flex-row">
        {/* Earnings Info */}
        <div className="flex flex-1 flex-col">
          <h2 className="text-base-content text-3xl font-normal">
            {t.incomes.earned}
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-primary text-4xl font-bold">
              {formatCurrency(
                incomesData.summary.earnedThisMonth,
                incomesData.summary.currency
              )}
            </p>
            <p className="text-base-content text-4xl font-normal">
              {t.incomes.thisMonth}
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={openFilterModal}
            className="border-secondary hover:bg-secondary-content flex h-12 cursor-pointer items-center justify-center rounded-full border px-4 shadow-sm"
          >
            <CalendarIcon className="text-secondary h-4 w-4" />
          </button>

          <button
            onClick={openListingModal}
            className="border-secondary hover:bg-secondary-content flex h-[50px] cursor-pointer items-center justify-center gap-2 rounded-full border px-4 shadow-sm"
          >
            {selectedListing ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl">
                  <ResponsiveImage
                    photo={selectedListing.photo || fallbackPhoto}
                    alt={`listing-${selectedListing.id}`}
                    className="object-cover"
                  />
                </div>
                <span className="text-secondary text-sm font-semibold md:w-54 md:truncate">
                  {selectedListing.title || t.today.selectListing}
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </>
            ) : (
              <p className="text-secondary font-semibold">
                {t.today.selectListing}
              </p>
            )}
          </button>
        </div>
      </section>

      {/* Metric Cards */}
      <section className="flex w-full flex-col gap-10 sm:flex-row sm:flex-wrap">
        <IncomesCardPrimary
          title={t.incomes.yearSummary}
          amount={formatCurrency(
            incomesData.summary.yearTotal,
            incomesData.summary.currency
          )}
          lang={lang}
        />
        <IncomesCardPrimary
          title={t.incomes.collectedThisMonth}
          amount={formatCurrency(
            incomesData.summary.collectedThisMonth,
            incomesData.summary.currency
          )}
          lang={lang}
        />
        <IncomesCardPrimary
          title={t.incomes.pendingThisMonth}
          amount={formatCurrency(
            incomesData.summary.pendingThisMonth,
            incomesData.summary.currency
          )}
          lang={lang}
        />
      </section>

      {/* Tabs */}
      <div className="border-base-content/10 relative flex w-full border-b-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="relative flex h-12 cursor-pointer flex-col items-center justify-center px-5 text-lg font-normal transition-colors duration-200"
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="bg-base-content absolute right-0 bottom-[-2px] left-0 h-[2px] transition-all duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* Completed/Pending Payouts Section */}
      <section className="flex w-full flex-col gap-4">
        <h2 className="text-base-content text-2xl font-bold">
          {activeTab === PayoutStatus.Paid
            ? t.incomes.completedPaymentsTitle
            : t.incomes.pendingPaymentsTitle}
        </h2>

        {displayedPayouts === undefined || displayedPayouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-16">
            <div className="bg-primary-content flex h-16 w-16 items-center justify-center rounded-full">
              <CalendarIcon className="text-primary h-8 w-8" />
            </div>
            <h3 className="text-base-content text-xl font-semibold">
              {activeTab === PayoutStatus.Paid
                ? t.incomes.noCompletedPayouts
                : t.incomes.noPendingPayouts}
            </h3>
            <p className="text-base-content/60 text-center text-sm">
              {activeTab === PayoutStatus.Paid
                ? t.incomes.noCompletedPayoutsDescription
                : t.incomes.noPendingPayoutsDescription}
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {displayedPayouts.map((payout) => (
              <IncomesCardSecondary
                key={payout.id}
                date={payout.date}
                amount={payout.amount}
                status={payout.status}
                guestName={payout.guestName}
                bookingDates={payout.bookingDates}
                propertyName={payout.propertyName}
                guestAvatar={payout.guestAvatar}
                lang={lang}
                onSelect={() => navigate(`/hosting/trips/${payout.tripId}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <ModalSelectListing
        open={isModalListingOpen}
        onClose={closeListingModal}
        fetchListings={fetchIncomesListings}
        listings={availableListings}
        selectedListing={selectedListing || undefined}
        handleListingSelect={handleListingSelect}
        multiple={false}
        lang={lang}
        limit={LIMIT_INITIAL_LISTINGS}
      />

      <ModalFilterReservations
        open={isModalFilterOpen}
        onClose={closeFilterModal}
        onApply={handleFilterReservations}
        lang={lang}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        requiredSelection="both"
      />
    </div>
  );
}
