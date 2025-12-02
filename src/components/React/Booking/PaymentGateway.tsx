import { retrieveReservationPayment } from '@/services/booking';
import { getTripDetail } from '@/services/users';
import { TripStatus, type TripDetail } from '@/types/tripDetail';
import { type SupportedLanguages, getTranslation } from '@/utils/i18n';
import { useEffect, useState } from 'react';
import ReservationSummaryPanel from './ReservationDetails';
import type { Guests } from '@/types/search';
import { parseISO } from 'date-fns';
import { getPaymentChannelForBooking } from '@/services/realtime/channels';
import { useAblyChannel } from '@/components/React/Hooks/useAblyChannel';
import { navigate } from 'astro/virtual-modules/transitions-router.js';
import ChevronRightIcon from '/src/icons/chevron-right.svg?react';
import ChevronUpIcon from '/src/icons/chevron-up.svg?react';
import CloseIcon from '/src/icons/close.svg?react';

interface Props {
  lang?: SupportedLanguages;
  tripId: string;
}
interface AblyMessageData {
  success: boolean;
  type: string;
}

function isValidAblyData(data: unknown): data is AblyMessageData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as Record<string, unknown>).success === 'boolean' &&
    'type' in data &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}

function parseAndValidateAblyData(rawData: unknown): AblyMessageData | null {
  let parsed: unknown;

  try {
    parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  } catch (err) {
    console.error('Error parsing Ably message data:', err);
    return null;
  }

  if (
    isValidAblyData(parsed) &&
    parsed.success &&
    parsed.type === 'reservation'
  ) {
    return parsed;
  }

  return null;
}
export default function PaymentGateway({ lang = 'es', tripId }: Props) {
  const [tripDetail, setTripDetail] = useState<TripDetail | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);

  const t = getTranslation(lang);

  useEffect(() => {
    const fetchPaymentUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await getTripDetail(tripId);
        if (detail.status !== TripStatus.WaitingPaymentConfirmation) {
          window.location.href = `/users/trips/${tripId}`;
          return;
        }
        setTripDetail(detail);
        const reservationCode = detail?.booking?.reservationCode;
        if (reservationCode) {
          const url = await retrieveReservationPayment(reservationCode);
          if (url) {
            setPaymentUrl(url);
          } else {
            setError('Failed to retrieve payment URL.');
          }
        } else {
          setError('Reservation code not found.');
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchPaymentUrl();
    }
  }, [tripId]);

  useAblyChannel(
    tripId ? getPaymentChannelForBooking(tripId) : '',
    (msg) => {
      if (!msg?.data) return;
      const data = parseAndValidateAblyData(msg.data);
      if (data) {
        navigate(`/booking/success/${tripId}`);
      }
    },
    { events: ['new_message'] }
  );

  if (loading) {
    return (
      <div className="relative flex h-[calc(100vh-8rem)] w-full">
        {/* Fullscreen iframe skeleton */}
        <div className="relative flex-1">
          <div className="h-full w-full animate-pulse rounded-lg bg-sky-50"></div>
        </div>

        {/* Desktop: Side drawer skeleton */}
        <div className="fixed top-16 right-0 z-50 hidden h-[calc(100vh-4rem)] w-12 flex-col bg-white shadow-2xl md:flex">
          <div className="flex h-16 w-12 animate-pulse items-center justify-center bg-[var(--color-base-150)]">
            <div className="h-5 w-5 rounded bg-sky-50"></div>
          </div>
        </div>

        {/* Mobile: Bottom drawer tab skeleton */}
        <div className="fixed right-0 bottom-0 left-0 z-50 flex flex-col bg-white shadow-2xl md:hidden">
          <div className="flex animate-pulse items-center justify-center gap-2 py-3">
            <div className="h-5 w-5 rounded bg-sky-50"></div>
            <div className="h-4 w-32 rounded bg-sky-50"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div></div>;
  }
  const safeParse = (s?: string) => (s ? parseISO(s) : null);
  const from = safeParse(tripDetail?.booking?.checkInDate);
  const to = safeParse(tripDetail?.booking?.checkoutDate);
  const guest: Guests = {
    adults: tripDetail?.booking.adults ?? 0,
    children: 0,
    infants: 0,
    pets: tripDetail?.booking.pets ?? 0,
  };

  return (
    <>
      <div className="relative flex h-[calc(100vh-8rem)] w-full">
        {/* Fullscreen iframe */}
        <div className="relative flex-1">
          {paymentUrl && (
            <>
              <iframe
                src={paymentUrl}
                className="h-full w-full rounded-lg border-none"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                allow="payment"
              />
            </>
          )}
        </div>

        {/* Desktop: Side drawer - Trip Details */}
        {tripDetail && (
          <div
            className={`fixed top-18 right-0 z-50 hidden h-[calc(100vh-4rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:flex ${
              isAccordionOpen ? 'w-96 translate-x-0' : 'w-12 translate-x-0'
            }`}
          >
            {/* Toggle Button - Visible when closed on desktop */}
            {!isAccordionOpen && (
              <button
                type="button"
                onClick={() => setIsAccordionOpen(true)}
                className="hidden h-16 w-12 items-center justify-center border-l border-gray-200 bg-[var(--color-base-150)] transition-colors hover:bg-[var(--color-base-200)] md:flex"
                aria-label={t.paymentGateway.openDetails}
              >
                <ChevronRightIcon className="text-primary h-5 w-5 rotate-180" />
              </button>
            )}

            {/* Panel Header - Visible when open */}
            {isAccordionOpen && (
              <>
                <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {t.paymentGateway.reservationDetails}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAccordionOpen(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-200"
                    aria-label={t.common.close}
                  >
                    <CloseIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto">
                  <ReservationSummaryPanel
                    listing={null}
                    cancellationPolicy={tripDetail.cancellationPolicy}
                    from={from}
                    to={to}
                    guest={guest}
                    currency={tripDetail.paymentDetail.currency}
                    weeklyDiscount={tripDetail.paymentDetail.weeklyDiscount}
                    monthlyDiscount={tripDetail.paymentDetail.monthlyDiscount}
                    total={tripDetail.paymentDetail.totalPrice}
                    perNight={tripDetail.paymentDetail.totalNightlyPrice}
                    title={tripDetail.title}
                    photo={tripDetail.photos[0]}
                    lang={lang}
                    serviceFee={tripDetail.paymentDetail.totalServiceFee}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Mobile: Bottom drawer - Trip Details */}
        {tripDetail && (
          <div
            className={`fixed right-0 bottom-0 left-0 z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
              isAccordionOpen
                ? 'translate-y-0'
                : 'translate-y-[calc(100%-3.5rem)]'
            }`}
            style={{ maxHeight: '85vh' }}
          >
            {/* Drag Handle - Clickable tab when drawer is closed */}
            <button
              type="button"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="flex flex-shrink-0 items-center justify-center gap-2 py-3 transition-colors active:bg-gray-100"
              aria-label={
                isAccordionOpen
                  ? t.paymentGateway.closeDetails
                  : t.paymentGateway.viewReservationDetails
              }
            >
              <ChevronUpIcon
                className={`h-5 w-5 text-gray-600 transition-transform ${
                  isAccordionOpen ? 'rotate-180' : ''
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                {t.paymentGateway.reservationDetails}
              </span>
            </button>

            {/* Panel Content - Only visible when open */}
            {isAccordionOpen && (
              <>
                <div className="flex h-14 flex-shrink-0 items-center justify-end border-b border-gray-200 px-4">
                  <button
                    type="button"
                    onClick={() => setIsAccordionOpen(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-200"
                    aria-label={t.common.close}
                  >
                    <CloseIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <ReservationSummaryPanel
                    listing={null}
                    cancellationPolicy={tripDetail.cancellationPolicy}
                    from={from}
                    to={to}
                    guest={guest}
                    currency={tripDetail.paymentDetail.currency}
                    weeklyDiscount={tripDetail.paymentDetail.weeklyDiscount}
                    monthlyDiscount={tripDetail.paymentDetail.monthlyDiscount}
                    total={tripDetail.paymentDetail.totalPrice}
                    perNight={tripDetail.paymentDetail.totalNightlyPrice}
                    title={tripDetail.title}
                    photo={tripDetail.photos[0]}
                    lang={lang}
                    serviceFee={tripDetail.paymentDetail.totalServiceFee}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
