import InformationCircleIcon from '/src/icons/information-circle.svg?react';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';

interface IncomesCardPrimaryProps {
  title: string;
  amount: string;
  onInfoClick?: () => void;
  lang?: SupportedLanguages;
}

/**
 * Primary metric card for displaying Incomes statistics
 * Used for key financial metrics in the Incomes dashboard
 */
export default function IncomesCardPrimary({
  title,
  amount,
  onInfoClick,
  lang = 'es',
}: IncomesCardPrimaryProps) {
  const t = getTranslation(lang);

  return (
    <div className="bg-primary-content flex flex-1 flex-col items-start justify-start gap-5 rounded-xl p-3 md:p-4">
      {/* Header with title and info icon */}
      <div className="flex w-full flex-row items-center justify-start gap-2">
        <h3 className="text-base-content flex flex-1 items-end justify-start text-xs leading-4 font-normal">
          {title}
        </h3>
        {onInfoClick && (
          <button
            onClick={onInfoClick}
            className="flex h-3.5 w-3.5 cursor-pointer items-center justify-center hover:opacity-70"
            aria-label={t.incomes.moreInformation}
          >
            <InformationCircleIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Amount display */}
      <div className="flex w-full flex-1 flex-row items-end justify-start">
        <p className="text-primary flex flex-1 items-center justify-start text-xl leading-7 font-semibold">
          {amount}
        </p>
      </div>
    </div>
  );
}
