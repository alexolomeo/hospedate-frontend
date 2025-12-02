import { useEffect, useState, useCallback } from 'react';
import ChevronLeftIcon from '/src/icons/chevron-left-mini.svg?react';
import {
  getTranslation,
  translate,
  type SupportedLanguages,
} from '@/utils/i18n';
import type { GalleryNav } from '@/types/host/edit-listing/galleryNav';
import {
  fetchAllListingPhotos,
  updateListingPhotosOrder,
  type ListingPhoto,
} from '@/services/host/edit-listing/gallery';
import SortablePhotosGrid from './SortablePhotosGrid';
import LoadingSpinner from '@/components/React/Common/LoadingSpinner';
import { useToast } from '@/components/React/CreateListing/ToastContext';

interface Props {
  lang?: SupportedLanguages;
  nav: GalleryNav;
  listingId: string;
  onRefreshListingValues?: () => Promise<void>;
}

export default function EditAllPhotosGallery({
  lang = 'es',
  nav,
  listingId,
  onRefreshListingValues,
}: Props) {
  const t = getTranslation(lang);
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const loadPhotos = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchAllListingPhotos(listingId, {
        skipGlobal404Redirect: true,
      });
      setPhotos(data);
    } catch (err) {
      console.error('[EditAllPhotosGallery] Failed to fetch photos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  const handleReorder = async (updated: ListingPhoto[]): Promise<void> => {
    setPhotos(updated);

    try {
      const reorderedPayload = updated.map((photo, index) => ({
        id: photo.id,
        order: index + 1,
      }));

      await updateListingPhotosOrder(listingId, reorderedPayload, {
        skipGlobal404Redirect: true,
      });

      if (onRefreshListingValues) {
        await onRefreshListingValues();
      }
    } catch (error) {
      console.error(
        '[EditAllPhotosGallery] Failed to update photo order:',
        error
      );
      showToast({
        type: 'error',
        message: translate(
          t,
          'hostContent.editListing.commonMessages.failedAction'
        ),
      });
    }
  };

  return (
    <div className="flex flex-col bg-[var(--color-base-100)] text-[var(--color-base-content)]">
      <div className="flex flex-1 flex-col items-start px-4 sm:px-6 lg:px-12 xl:px-[120px]">
        <div className="flex w-full items-start justify-between pt-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={nav.backFromAllPhotos}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
              aria-label={translate(
                t,
                'hostContent.editListing.content.gallery.back'
              )}
            >
              <ChevronLeftIcon className="h-[14px] w-[14px]" />
            </button>
            <h1 className="text-lg font-bold sm:text-xl">
              {translate(
                t,
                'hostContent.editListing.content.gallery.allPhotos'
              )}
            </h1>
          </div>
        </div>

        <p className="mt-2 text-sm text-[var(--color-neutral)]">
          {translate(
            t,
            'hostContent.editListing.content.gallery.reorderInstruction'
          )}
        </p>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner
              size="md"
              message={translate(t, 'common.loading')}
            />
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-error text-sm font-medium">
              {translate(
                t,
                'hostContent.editListing.commonMessages.failedFetch'
              )}
            </p>
          </div>
        ) : (
          <div className="w-full py-8">
            <SortablePhotosGrid photos={photos} onReorder={handleReorder} />
          </div>
        )}
      </div>
    </div>
  );
}
