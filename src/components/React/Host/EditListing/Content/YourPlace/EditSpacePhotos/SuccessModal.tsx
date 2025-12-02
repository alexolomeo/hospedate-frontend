import Modal from '@/components/React/Common/Modal';
import {
  getTranslation,
  translate,
  type SupportedLanguages,
} from '@/utils/i18n';
import CheckBadgeSolidIcon from '/src/icons/check-badge-solid.svg?react';

interface UploadPhotosModalProps {
  open: boolean;
  onClose: () => void;
  lang?: SupportedLanguages;
  amount: number;
  space?: string | null;
}
export default function SuccessModal({
  open,
  onClose,
  lang = 'es',
  amount,
  space,
}: UploadPhotosModalProps) {
  const t = getTranslation(lang);
  const spaceText = space
    ? translate(t, `spaceTypes.${space}`)
    : t.hostContent.editListing.content.gallery.additionalPhotos;

  const message =
    amount > 0
      ? translate(t, 'hostContent.editListing.content.gallery.photosAdded', {
          count: amount,
          space: spaceText,
        })
      : translate(t, 'hostContent.editListing.content.gallery.spaceCreated', {
          space: spaceText,
        });

  return (
    <Modal
      open={open}
      centerContent
      showCancelButton={false}
      widthClass="md:max-w-[300px]"
      heightClass="md:max-h-[300px]"
      onClose={onClose}
      footer={
        <button
          onClick={onClose}
          className="btn btn-primary w-full rounded-full text-sm font-medium"
        >
          {t.createListing.wizardStepContent.uploadPhotosModal.okButton}
        </button>
      }
      lang={lang}
    >
      <div className="flex flex-col items-center gap-2">
        <CheckBadgeSolidIcon className="text-success h-10 w-10" />
        <p className="text-center font-medium">{message}</p>
      </div>
    </Modal>
  );
}
