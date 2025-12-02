import type { ReactElement } from 'react';
import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/React/Common/Modal';
import {
  getTranslation,
  translate,
  type SupportedLanguages,
} from '@/utils/i18n';
import { ResponsiveImage } from '@/components/React/Common/ResponsiveImage';
import type {
  SpaceType,
  SpacePhoto,
} from '@/types/host/edit-listing/spacePhotos';
import XMarkMini from '/src/icons/x-mark-mini.svg?react';
import SuccessModal from './SuccessModal';
import {
  fetchSpaceTypes,
  fetchPhotosFromSpace,
  createSpaceForListing,
  updatePhotosOrderBySpace,
  movePhotoToSpace,
} from '@/services/host/edit-listing/gallery';
import { useToast } from '@/components/React/CreateListing/ToastContext';

interface ManageSpaceModalProps {
  open: boolean;
  onClose: () => void;
  lang?: SupportedLanguages;
  mode: 'create' | 'move';
  listingId: string;
  onMovePhoto?: (targetSpace: SpaceType) => Promise<void>;
  defaultSpaceId?: string | number;
  onRefreshListingValues?: () => Promise<void>;
}

export default function ManageSpaceModal({
  open,
  onClose,
  lang = 'es',
  mode,
  listingId,
  onMovePhoto,
  defaultSpaceId,
  onRefreshListingValues,
}: ManageSpaceModalProps) {
  const t = getTranslation(lang);
  const { showToast } = useToast();

  const [step, setStep] = useState<'select-space' | 'select-photos'>(
    'select-space'
  );
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SpacePhoto[]>([]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [defaultPhotos, setDefaultPhotos] = useState<SpacePhoto[]>([]);
  const [loadingDefaultPhotos, setLoadingDefaultPhotos] = useState(false);
  const createdSpaceIdRef = useRef<number | null>(null);
  const lastMovedPhotosCountRef = useRef<number>(0);
  const lastCreatedSpaceNameRef = useRef<string>('');

  // --- show space types ---
  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    const loadSpaceTypes = async (): Promise<void> => {
      setLoadingSpaces(true);
      try {
        const data = await fetchSpaceTypes({ skipGlobal404Redirect: true });
        if (isMounted) {
          setSpaceTypes(data);
        }
      } catch (error) {
        console.error('[ManageSpaceModal] Failed to load space types:', error);
      } finally {
        if (isMounted) setLoadingSpaces(false);
      }
    };

    void loadSpaceTypes();

    return () => {
      isMounted = false;
    };
  }, [open]);

  const closeModal = (): void => {
    setSelectedSpace(null);
    setSelectedPhotos([]);
    setStep('select-space');
    onClose();
  };

  const handleCloseWithOptionalRefresh = async (): Promise<void> => {
    const shouldRefresh = createdSpaceIdRef.current !== null;

    if (shouldRefresh) {
      try {
        await onRefreshListingValues?.();
      } catch (err) {
        console.error(
          '[ManageSpaceModal] Failed to refresh after space creation:',
          err
        );
      }
    }

    closeModal();
  };

  const handleCreateSpace = async (space: SpaceType): Promise<void> => {
    setSelectedSpace(space);

    if (mode === 'move') {
      await onMovePhoto?.(space);
      closeModal();
      return;
    }

    try {
      const createdSpaceId = await createSpaceForListing(listingId, space.id, {
        skipGlobal404Redirect: true,
      });
      if (createdSpaceId === null) {
        showToast({
          type: 'error',
          message: t.hostContent.editListing.content.gallery.addSpaceError,
        });
        return;
      }
      createdSpaceIdRef.current = createdSpaceId;

      if (!defaultSpaceId) {
        await onRefreshListingValues?.();
        lastMovedPhotosCountRef.current = 0;
        lastCreatedSpaceNameRef.current = space.name;
        closeModal();
        setIsSuccessModalOpen(true);
        return;
      }

      setLoadingDefaultPhotos(true);
      const photos = await fetchPhotosFromSpace(
        listingId,
        String(defaultSpaceId),
        { skipGlobal404Redirect: true }
      );
      setDefaultPhotos(photos);
      setStep('select-photos');
    } catch (err) {
      console.error('[ManageSpaceModal] Failed to create or load photos:', err);
      await onRefreshListingValues?.();
      lastMovedPhotosCountRef.current = 0;
      lastCreatedSpaceNameRef.current = space.name;
      closeModal();
      setIsSuccessModalOpen(true);
    } finally {
      setLoadingDefaultPhotos(false);
    }
  };

  const handlePhotoToggle = (photo: SpacePhoto): void => {
    setSelectedPhotos((prev) =>
      prev.some((p) => p.id === photo.id)
        ? prev.filter((p) => p.id !== photo.id)
        : [...prev, photo]
    );
  };

  const handleMoveSelectedPhotos = async (): Promise<void> => {
    if (!selectedSpace || !defaultSpaceId) return;

    const newSpaceId = createdSpaceIdRef.current;
    if (!newSpaceId) {
      console.error('[ManageSpaceModal] Missing createdSpaceId');
      return;
    }

    try {
      for (const photo of selectedPhotos) {
        await movePhotoToSpace(
          listingId,
          defaultSpaceId,
          photo.id,
          newSpaceId,
          {
            skipGlobal404Redirect: true,
          }
        );
      }

      const newSpaceOrdered = selectedPhotos.map((p, index) => ({
        id: p.id,
        order: index + 1,
      }));
      await updatePhotosOrderBySpace(listingId, newSpaceId, newSpaceOrdered, {
        skipGlobal404Redirect: true,
      });

      const remainingDefaultPhotos = defaultPhotos.filter(
        (p) => !selectedPhotos.some((sel) => sel.id === p.id)
      );
      const reorderedDefault = remainingDefaultPhotos.map((p, index) => ({
        id: p.id,
        order: index + 1,
      }));
      await updatePhotosOrderBySpace(
        listingId,
        defaultSpaceId,
        reorderedDefault,
        {
          skipGlobal404Redirect: true,
        }
      );

      await onRefreshListingValues?.();
      lastMovedPhotosCountRef.current = selectedPhotos.length;
      lastCreatedSpaceNameRef.current = selectedSpace?.name ?? '';
      closeModal();
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('[ManageSpaceModal] Failed to move photos:', error);
    }
  };

  // --- Render Step 1: Select Space ---
  const renderSelectSpaceStep = (): ReactElement => (
    <Modal
      open={open}
      title={t.hostContent.editListing.content.gallery.selectRoom}
      onClose={closeModal}
      heightClass="max-h-11/12"
      titleClass="text-base leading-5 font-bold"
      closeOnBackdropClick={false}
      footer={
        <button
          className="btn btn-primary h-12 rounded-full px-4 text-sm font-normal md:px-6 md:text-base"
          disabled={!selectedSpace}
          onClick={() => selectedSpace && handleCreateSpace(selectedSpace)}
        >
          {mode === 'move'
            ? t.hostContent.editListing.content.gallery.move
            : !defaultSpaceId
              ? t.hostContent.editListing.content.gallery.add
              : t.hostContent.editListing.content.gallery.next}
        </button>
      }
      lang={lang}
    >
      {loadingSpaces ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner text-primary" />
        </div>
      ) : spaceTypes.length === 0 ? (
        <div className="text-neutral text-center text-sm">
          {t.hostContent.editListing.content.gallery.noSpacesImageAlt}
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3">
          {spaceTypes.map((space) => (
            <div
              key={space.id}
              className="inline-flex h-44 cursor-pointer flex-col gap-1.5"
              onClick={() => setSelectedSpace(space)}
            >
              <ResponsiveImage
                photo={space.photo}
                alt={space.name || 'space image'}
                className={`relative h-36 w-full rounded-[30.40px] object-cover ${
                  selectedSpace?.id === space.id
                    ? 'border-primary border-[3px]'
                    : 'border-[3px] border-transparent'
                }`}
              />
              <p className="text-sm font-normal">
                {translate(t, `spaceTypes.${space.name}`)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );

  // --- Render Step 2: Select Photos ---
  const renderSelectPhotosStep = (): ReactElement => (
    <Modal
      open={open}
      title={t.hostContent.editListing.content.gallery.assignPhotosTitle}
      subtitleClass="text-base leading-[14px] font-bold"
      titleClass="text-base leading-7 font-normal font-bold"
      TitleSubtitleContentClass="flex-col items-start mt-4"
      onClose={handleCloseWithOptionalRefresh}
      closeOnBackdropClick={false}
      heightClass="max-h-11/12"
      lang={lang}
      topLeftButton={false}
      topRightAction={
        <button
          onClick={handleCloseWithOptionalRefresh}
          className="mt-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[16px]"
        >
          <XMarkMini className="h-5 w-5 flex-shrink-0" />
        </button>
      }
      showSkipForNow={true}
      footer={
        <button
          className="flex h-12 w-full max-w-[280px] cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 text-sm text-white shadow-sm transition-opacity disabled:opacity-50 md:max-w-none md:px-6 md:text-base"
          disabled={selectedPhotos.length === 0}
          onClick={handleMoveSelectedPhotos}
        >
          {t.hostContent.editListing.content.gallery.save}
        </button>
      }
    >
      {loadingDefaultPhotos ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner text-primary" />
        </div>
      ) : defaultPhotos.length === 0 ? (
        <div className="text-neutral text-center text-sm">
          {t.hostContent.editListing.content.gallery.noAvailablePhotos}
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3">
          {defaultPhotos.map((photo) => (
            <div
              key={photo.id}
              className="inline-flex h-44 cursor-pointer flex-col gap-1.5"
              onClick={() => handlePhotoToggle(photo)}
            >
              <ResponsiveImage
                photo={photo.photo}
                alt="image selected"
                className={`relative h-36 w-full rounded-[30.40px] object-cover ${
                  selectedPhotos.some((p) => p.id === photo.id)
                    ? 'border-primary border-[3px]'
                    : 'border-[3px] border-transparent'
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );

  return (
    <>
      {step === 'select-space' && renderSelectSpaceStep()}
      {step === 'select-photos' &&
        mode === 'create' &&
        renderSelectPhotosStep()}
      <SuccessModal
        open={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        lang={lang}
        amount={lastMovedPhotosCountRef.current}
        space={lastCreatedSpaceNameRef.current}
      />
    </>
  );
}
