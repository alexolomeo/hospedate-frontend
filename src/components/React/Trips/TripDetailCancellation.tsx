import React from 'react';
import { translate, type SupportedLanguages } from '@/utils/i18n';
import { type TripDetail } from '@/types/tripDetail';
import ListingCancellationPolicy from '../Listing/ListingCancellationPolicy';

interface TripDetailCancellationProps {
  tripDetail: TripDetail;
  t: ReturnType<typeof translate>;
  lang: SupportedLanguages;
}

const TripDetailCancellation: React.FC<TripDetailCancellationProps> = ({
  tripDetail,
  t,
  lang = 'es',
}) => {
  return (
    <section className="bg-base-100 my-4 flex flex-col gap-0">
      <h3 className="text-base-content text-xl font-bold">
        {translate(t, 'tripDetail.cancellation.title')}
      </h3>
      <ListingCancellationPolicy
        cancellationPolicy={tripDetail.cancellationPolicy}
        lang={lang}
        isFormValid={true}
      />
    </section>
  );
};

export default TripDetailCancellation;
