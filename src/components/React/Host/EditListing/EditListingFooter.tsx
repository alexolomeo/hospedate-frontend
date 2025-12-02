import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import AppButton from '@/components/React/Common/AppButton';

interface FooterCustomAction {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  title?: string;
}

interface Props {
  lang?: SupportedLanguages;
  title?: string;
  canSave: boolean;
  saving: boolean;
  onSave: () => Promise<'ok' | 'error' | 'cancel'>;
  saveLabelOverride?: string;
  customAction?: FooterCustomAction;
}

export default function EditListingFooter({
  lang = 'es',
  title,
  canSave,
  saving,
  onSave,
  saveLabelOverride,
  customAction,
}: Props) {
  const t = getTranslation(lang);

  const disabled = !canSave || saving;
  const defaultLabel = t.hostContent.editListing.footer.save;
  const label = saving
    ? t.hostContent.editListing.footer.saving
    : (saveLabelOverride ?? defaultLabel);

  const handleClick = async (): Promise<void> => {
    if (customAction) {
      await customAction.onClick();
    } else {
      await onSave();
    }
  };

  const buttonLabel = customAction ? customAction.label : label;

  return (
    <div className="border-base-200 bg-base-100 flex items-center justify-between border-t py-4 md:px-[clamp(1rem,8vw,143px)]">
      <span className="text-base-content font-semibold md:text-xl">
        {customAction?.title ?? title ?? t.hostContent.editListing.footer.title}
      </span>

      <AppButton
        label={buttonLabel}
        type="button"
        variant="default"
        size="sm"
        rounded
        fontSemibold
        className="h-12 w-[122px] px-4 text-sm leading-[14px] shadow-sm"
        onClick={handleClick}
        disabled={customAction?.disabled ?? disabled}
        aria-disabled={customAction?.disabled ?? disabled}
        aria-busy={saving}
      />
    </div>
  );
}
