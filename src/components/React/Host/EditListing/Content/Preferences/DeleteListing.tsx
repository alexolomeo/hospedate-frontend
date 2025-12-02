import CheckboxItem from '@/components/React/Common/CheckboxItem';
import CollapseCard from '@/components/React/Common/CollapseCard';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import { useCallback, useMemo, useState } from 'react';
import {
  buildDeleteReasons,
  type DeleteSpaceDict,
  type ReasonCode,
  type ReasonGroupKey,
} from '@/components/React/Utils/edit-listing/deleteReasons';
import { useEditability } from '@/components/React/Host/EditListing/EditabilityContext';
import DeleteModal from '../YourPlace/EditSpacePhotos/DeleteModal';
import { AppModal } from '@/components/React/Common/AppModal';
import { removeListing } from '@/services/host/listings';
import { navigate } from 'astro/virtual-modules/transitions-router.js';
import { useToast } from '@/components/React/CreateListing/ToastContext';
import CannotDeleteListing from './CannotDeleteListing';

interface Props {
  lang?: SupportedLanguages;
  showManTitle?: boolean;
  initialSelectedCodes?: ReasonCode[];
  listingId: string;
  onSelectionChange?: (codes: ReasonCode[]) => void;
  hasPendingBookings: boolean;
}

export default function DeleteListing({
  lang = 'es',
  showManTitle = true,
  initialSelectedCodes = [],
  listingId,
  hasPendingBookings,
  onSelectionChange,
}: Props) {
  const t = getTranslation(lang);
  const { isReadOnly } = useEditability();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dict: DeleteSpaceDict = t.hostContent.editListing.content.deleteSpace;
  const { showToast } = useToast();
  const groups = useMemo(() => buildDeleteReasons(dict), [dict]);

  const [selected, setSelected] = useState<Set<ReasonCode>>(
    () => new Set(initialSelectedCodes)
  );

  const emitChange = useCallback(
    (next: Set<ReasonCode>) => {
      if (onSelectionChange) {
        onSelectionChange(Array.from(next).sort((a, b) => a - b));
      }
    },
    [onSelectionChange]
  );

  const toggleCode = useCallback(
    (code: ReasonCode) => {
      if (submitting) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        emitChange(next);
        return next;
      });
    },
    [emitChange, submitting]
  );

  const isChecked = useCallback(
    (code: ReasonCode) => selected.has(code),
    [selected]
  );

  const renderGroup = (title: string, key: ReasonGroupKey) => (
    <CollapseCard title={title}>
      {groups[key].map((item) => (
        <CheckboxItem
          key={item.id}
          id={item.id}
          name={item.name}
          label={item.label}
          checked={isChecked(item.code)}
          onChange={() => toggleCode(item.code)}
          disabled={isReadOnly}
        />
      ))}
    </CollapseCard>
  );
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const reasons = Array.from(selected).sort((a, b) => a - b);
      await removeListing(listingId, reasons);
      setIsDeleteModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch {
      showToast({
        type: 'error',
        message:
          t.hostContent.editListing.content.deleteSpace
            .couldNotCompleteDeletion,
      });
      setIsDeleteModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const goToListings = () => {
    setIsSuccessModalOpen(false);
    navigate('/hosting/listings');
  };

  return hasPendingBookings ? (
    <div>
      <CannotDeleteListing lang={lang} listingId={listingId} />
    </div>
  ) : (
    <div className="space-y-8 px-1">
      {showManTitle && <h1 className="edit-listing-title">{dict.question}</h1>}
      {renderGroup(dict.noLongerCanHost.title, 'noLongerCanHost')}
      {renderGroup(dict.cannotHost.title, 'cannotHost')}
      {renderGroup(dict.expectedMoreFromHost.title, 'expectedMoreFromHost')}
      {renderGroup(
        dict.expectedToEarnMoreMoney.title,
        'expectedToEarnMoreMoney'
      )}
      {renderGroup(dict.expectedMoreFromGuests.title, 'expectedMoreFromGuests')}
      {renderGroup(dict.duplicateSpace.title, 'duplicateSpace')}
      <div className="flex items-center justify-end gap-3">
        {submitting && (
          <span className="text-sm opacity-70" aria-live="polite">
            {t.hostContent.editListing.content.deleteSpace.deleting}
          </span>
        )}
        <button
          className="btn btn-primary rounded-full"
          onClick={openDeleteModal}
          disabled={isReadOnly || submitting || selected.size === 0}
        >
          {t.hostContent.editListing.content.deleteSpace.deleteListing}
        </button>
      </div>
      <DeleteModal
        open={isDeleteModalOpen}
        onClose={() => !submitting && setIsDeleteModalOpen(false)}
        lang={lang}
        title={t.hostContent.editListing.content.deleteSpace.confirmDeleteTitle}
        description={
          t.hostContent.editListing.content.deleteSpace.confirmDeleteDescription
        }
        handleDelete={handleDelete}
        loading={submitting}
      ></DeleteModal>
      <AppModal
        id="success-delete-modal"
        isOpen={isSuccessModalOpen}
        showHeader={false}
      >
        <div className="space-y-5">
          <p className="text-primary font-semibold">
            {t.hostContent.editListing.content.deleteSpace.deletedSuccessTitle}
          </p>
          <div className="flex justify-end">
            <button
              className="btn btn-primary rounded-full"
              onClick={goToListings}
            >
              {t.hostContent.editListing.content.deleteSpace.backToListingsCta}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
