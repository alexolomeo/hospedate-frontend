import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import { navigate } from 'astro/virtual-modules/transitions-router.js';

interface Props {
  lang?: SupportedLanguages;
  listingId: string;
}

export default function CannotDeleteListing({ lang = 'es', listingId }: Props) {
  const t = getTranslation(lang);
  const dict = t.hostContent.editListing.content.deleteSpace.blocked;
  return (
    <div className="flex h-[501px] flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center justify-start gap-4">
        <img
          src="/images/trash.webp"
          alt="trash"
          aria-hidden="true"
          className="h-24 w-24"
        />
        <div className="flex flex-col items-center justify-center gap-1 self-stretch text-center">
          <p className="text-warning text-base leading-normal font-semibold">
            {dict.title}
          </p>
          <div className="text-xl leading-7 font-bold">
            {dict.reasonActiveBooking}
          </div>
        </div>
      </div>
      <p className="justify-center text-center text-sm leading-none font-normal">
        {dict.hintHide}
      </p>
      <button
        className="btn btn-primary rounded-full"
        onClick={() => {
          navigate(`/hosting/listing/edit/${listingId}/listing-state`);
        }}
      >
        {dict.goToHideCta}
      </button>
    </div>
  );
}
