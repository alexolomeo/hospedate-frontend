import { getTranslation, type SupportedLanguages } from '@/utils/i18n';

interface IncomesCardSecondaryProps {
  date: string;
  amount: string;
  status: 'paid' | 'pending';
  guestName: string;
  bookingDates: string;
  propertyName: string;
  guestAvatar?: string;
  lang?: SupportedLanguages;
  onSelect: () => void;
}

/**
 * Secondary card for displaying individual payout information
 * Shows completed or pending payment details with guest information
 */
export default function IncomesCardSecondary({
  date,
  amount,
  status,
  guestName,
  bookingDates,
  propertyName,
  guestAvatar,
  lang = 'es',
  onSelect,
}: IncomesCardSecondaryProps) {
  const t = getTranslation(lang);

  const statusConfig = {
    paid: {
      label: t.incomes.paid,
      borderColor: 'border-success',
      textColor: 'text-success',
      bgColor: 'bg-white',
    },
    pending: {
      label: t.incomes.pending,
      borderColor: 'border-primary',
      textColor: 'text-primary',
      bgColor: 'bg-white',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="bg-base-100 border-base-200 flex h-full w-full cursor-pointer flex-col items-start justify-center gap-3 rounded-[30px] border p-4 shadow-sm"
      onClick={onSelect}
    >
      {/* Top section with date, amount, and status */}
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-col items-start justify-center gap-0">
          <p className="text-base-content flex items-center justify-start text-xs leading-4 font-normal">
            {date}
          </p>
          <p className="text-secondary flex items-center justify-end text-sm leading-5 font-semibold">
            {amount}
          </p>
        </div>

        {/* Status badge */}
        <div
          className={`${config.borderColor} ${config.bgColor} flex items-center justify-center gap-2 rounded-full border px-2 py-1.5 shadow-sm`}
        >
          <span
            className={`${config.textColor} flex items-center justify-center text-xs leading-3 font-semibold`}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Bottom section with guest info */}
      <div className="flex w-full flex-row items-center justify-start gap-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
          {guestAvatar ? (
            <img
              src={guestAvatar}
              alt={guestName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="bg-base-200 flex h-full w-full items-center justify-center text-xs font-semibold">
              {guestName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Guest and booking details */}
        <div className="flex flex-1 flex-col items-start justify-start gap-0">
          <p className="text-neutral flex w-full items-center justify-start text-sm leading-5 font-normal">
            {guestName}
          </p>
          <p className="text-neutral flex w-full items-center justify-start text-sm leading-5 font-normal">
            {bookingDates}
          </p>
          <p className="text-base-content flex w-full items-center justify-start text-sm leading-5 font-semibold">
            {propertyName}
          </p>
        </div>
      </div>
    </div>
  );
}
