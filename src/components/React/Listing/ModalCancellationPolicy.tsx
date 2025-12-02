import type { CancellationPolicy } from '@/types/listing/cancellationPolicy';
import {
  getTranslation,
  translate,
  type SupportedLanguages,
} from '@/utils/i18n';
import React, { useCallback } from 'react';
import { safeFormatDate } from '@/utils/dateUtils';
import { Modal } from '../Common/ModalDialog';
import AppButton from '../Common/AppButton';
import { RuleType } from '@/types/enums/ruleType';

interface Props {
  cancellationPolicy: CancellationPolicy | null | undefined;
  lang?: SupportedLanguages;
}

const ModalCancellationPolicy: React.FC<Props> = ({
  cancellationPolicy,
  lang = 'es',
}) => {
  const t = getTranslation(lang);
  const basePath = 'listingDetail.thingsToKnow.cancellationPolicy';
  const description =
    t.listingDetail.thingsToKnow.cancellationPolicy.description;
  const buttonText =
    t.listingDetail.thingsToKnow.cancellationPolicy.moreInformation;

  const handleMoreInfoClick = useCallback(() => {
    window.open('/cancellation', '_blank');
  }, []);

  const hasTranslation = (
    tObj: Record<string, unknown>,
    fullKey: string
  ): boolean => {
    if (!fullKey || typeof fullKey !== 'string') return false;
    const keys = fullKey.split('.');
    let text: unknown = tObj;
    for (const k of keys) {
      if (text && typeof text === 'object') {
        // text is an object; access property safely via index signature
        text = (text as Record<string, unknown>)[k];
      } else {
        text = undefined;
        break;
      }
    }
    return typeof text === 'string';
  };

  const summaryText = useCallback(
    (rule: CancellationPolicy['rules'][number]) => {
      const transKey = `${basePath}.${rule.descriptionKey}`;
      if (!hasTranslation(t, transKey)) return '';
      return translate(t, transKey, {
        booking_window_hours:
          rule.descriptionPlaceholders.bookingWindowHours ?? 0,
        // Use safe formatting for the deadline placeholder
        deadline: safeFormatDate(rule.descriptionPlaceholders.deadline, lang),
        deadline1: safeFormatDate(rule.descriptionPlaceholders.deadline1, lang),
        deadline2: safeFormatDate(rule.descriptionPlaceholders.deadline2, lang),
        deadline3: safeFormatDate(rule.descriptionPlaceholders.deadline3, lang),
        refund_percentage: rule.descriptionPlaceholders.refundPercentage ?? 0,
        non_refundable_nights:
          rule.descriptionPlaceholders.nonRefundableNights ?? 0,
      });
    },
    [t, lang]
  );

  const getTypeRefund = (percentage: number, includeServiceFee: boolean) => {
    if (percentage >= 100) {
      return includeServiceFee
        ? t.listingDetail.thingsToKnow.cancellationPolicy.full_refund
        : t.listingDetail.thingsToKnow.cancellationPolicy.partial_refund;
    }
    if (percentage > 0 && percentage < 100) {
      return t.listingDetail.thingsToKnow.cancellationPolicy.partial_refund;
    }
    return t.listingDetail.thingsToKnow.cancellationPolicy.no_refund;
  };
  return (
    <Modal
      id="cancellation-policy"
      showHeader={true}
      title={t.listingDetail.thingsToKnow.cancellationPolicy.title}
      maxWidth={'max-w-xl'}
      maxHeight={'max-h-[90vh]'}
      bgColor={'bg-[var(--color-base-150)]'}
    >
      <div>
        <p className="justify-center self-stretch py-4 text-sm leading-normal font-normal">
          {description}
        </p>
        {cancellationPolicy?.rules.length != 0 ? (
          cancellationPolicy?.rules.map((rule, index) => (
            <div
              key={index}
              className="flex flex-row gap-x-4 self-stretch py-4 leading-none font-normal"
            >
              <div className="basis-1/4">
                <p className="flex flex-nowrap text-sm font-medium whitespace-nowrap">
                  {rule.ruleType === RuleType.BeforeCheckIn
                    ? t.listingDetail.thingsToKnow.cancellationPolicy.before
                    : t.listingDetail.thingsToKnow.cancellationPolicy.after}
                </p>
                <p className="text-neutral pr-5 text-xs lg:pr-1">
                  {safeFormatDate(rule.deadline, lang, true)}
                </p>
              </div>
              <div className="basis-3/4">
                <p className="text-sm font-medium">
                  {getTypeRefund(
                    rule.refund.percentage,
                    rule.refund.includeServiceFee
                  )}
                </p>
                <p className="text-neutral text-xs">{summaryText(rule)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-4 leading-none font-normal">
            <p className="text-sm font-medium">
              {t.listingDetail.thingsToKnow.cancellationPolicy.no_refund}
            </p>
            <p className="text-neutral text-xs">
              {
                t.listingDetail.thingsToKnow.cancellationPolicy
                  .cancellation_policy_not_refund_summary
              }
            </p>
          </div>
        )}
        <AppButton
          label={buttonText}
          variant="link"
          size="xs"
          data-testid="button-cancellation-policy-more-info"
          onClick={handleMoreInfoClick}
        />
      </div>
    </Modal>
  );
};

export default ModalCancellationPolicy;
