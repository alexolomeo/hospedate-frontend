import api from '@/utils/api';
import pLimit from 'p-limit';
import type { AxiosProgressEvent } from 'axios';
import type {
  SpacePhoto,
  SpaceType,
  MediaPicture,
} from '@/types/host/edit-listing/spacePhotos';

type ApiSpacePhoto = {
  id: number;
  media: {
    original: string;
    srcsetWebp: string;
    srcsetAvif: string;
  };
  caption?: string;
  order?: number;
  spaceOrder?: number;
};
export interface UploadSpacePhotoResponse {
  id: number;
}
export interface CreateSpaceResponse {
  id: number;
}
export interface PhotoOrderUpdate {
  id: number;
  order: number;
}
export interface UploadDefaultSpacePhotoResponse {
  id: number;
}
export interface ListingPhoto {
  id: number;
  order: number;
  caption?: string;
  photo: MediaPicture;
}
export interface UpdatePhotoOrder {
  id: number;
  order: number;
}

export async function fetchPhotosFromSpace(
  listingId: string,
  spaceId: string,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<SpacePhoto[]> {
  try {
    const { data } = await api.get<ApiSpacePhoto[]>(
      `/listings/${encodeURIComponent(listingId)}/spaces/${encodeURIComponent(spaceId)}/photos`,
      { ...opts }
    );

    const safeArray = Array.isArray(data) ? data : [];
    return safeArray.map((item) => ({
      id: item.id,
      photo: {
        original: item.media?.original ?? '',
        srcsetWebp: item.media?.srcsetWebp ?? '',
        srcsetAvif: item.media?.srcsetAvif ?? '',
      },
      caption: item.caption ?? '',
    }));
  } catch (error) {
    console.error('[fetchPhotosFromSpace] Failed:', error);
    return [];
  }
}

export async function uploadSpacePhotoWithProgress(
  listingId: string,
  spaceId: string | number,
  file: File,
  onProgress?: (percent: number) => void,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<number> {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const { status, data } = await api.post<UploadSpacePhotoResponse>(
      `/listings/${encodeURIComponent(listingId)}/spaces/${encodeURIComponent(String(spaceId))}/photos`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt: AxiosProgressEvent) => {
          if (!onProgress) return;
          const total = evt.total;
          if (typeof total === 'number' && total > 0) {
            const percent = Math.round((evt.loaded * 100) / total);
            onProgress(percent);
          }
        },
        ...opts,
      }
    );

    if ((status !== 200 && status !== 201) || typeof data?.id !== 'number') {
      console.error(
        `[uploadSpacePhotoWithProgress] Unexpected status=${status}, id=${data?.id}`
      );
      return -1;
    }

    if (onProgress) onProgress(100);
    return data.id;
  } catch (error) {
    console.error('[uploadSpacePhotoWithProgress] Upload failed:', error);
    return -1;
  }
}

export async function uploadSpacePhotosWithProgress(
  listingId: string,
  spaceId: string | number,
  files: File[],
  onProgressByIndex: (index: number, progress: number) => void,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<number[]> {
  if (!listingId || !spaceId || files.length === 0) return [];

  const limit = pLimit(5);
  const uploadedIds: number[] = [];

  await Promise.all(
    files.map((file, index) =>
      limit(async () => {
        try {
          onProgressByIndex(index, 0);
          const id = await uploadSpacePhotoWithProgress(
            listingId,
            spaceId,
            file,
            (p) => onProgressByIndex(index, p),
            opts
          );
          if (id > 0) uploadedIds.push(id);
          onProgressByIndex(index, 100);
        } catch (err) {
          console.error(
            `[uploadSpacePhotosWithProgress] Failed photo [${index}]`,
            err
          );
          onProgressByIndex(index, -1);
        }
      })
    )
  );

  return uploadedIds;
}

export async function patchListingPhotoCaption(
  listingId: string,
  listingPhotoId: string | number,
  caption: string,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<void> {
  try {
    const { status } = await api.patch(
      `/listings/${encodeURIComponent(listingId)}/photos/${encodeURIComponent(String(listingPhotoId))}`,
      { caption },
      { ...opts }
    );
    if (status !== 200 && status !== 204) {
      console.error(`[patchListingPhotoCaption] Unexpected status=${status}`);
    }
  } catch (error) {
    console.error('[patchListingPhotoCaption] Failed:', error);
  }
}

export async function deleteListingPhoto(
  listingId: string,
  listingPhotoId: string | number,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<void> {
  try {
    const { status } = await api.delete(
      `/listings/${encodeURIComponent(listingId)}/photos/${encodeURIComponent(String(listingPhotoId))}`,
      { ...opts }
    );
    if (status !== 204 && status !== 200) {
      console.error(`[deleteListingPhoto] Unexpected status=${status}`);
    }
  } catch (error) {
    console.error('[deleteListingPhoto] Failed:', error);
  }
}

export async function fetchSpaceTypes(opts?: {
  skipGlobal404Redirect?: boolean;
}): Promise<SpaceType[]> {
  try {
    const { data } = await api.get<
      { id: number; name: string; photo: MediaPicture }[]
    >('/hostings/listings/space-types', { ...opts });

    if (!Array.isArray(data)) {
      console.warn('[fetchSpaceTypes] Unexpected response:', data);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      photo: {
        original: item.photo?.original ?? '',
        srcsetWebp: item.photo?.srcsetWebp ?? '',
        srcsetAvif: item.photo?.srcsetAvif ?? '',
      },
    }));
  } catch (error) {
    console.error('[fetchSpaceTypes] Failed:', error);
    return [];
  }
}

export async function createSpaceForListing(
  listingId: string | number,
  spaceTypeId: number,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<number | null> {
  try {
    const { data, status } = await api.post<CreateSpaceResponse>(
      `/hostings/listings/${encodeURIComponent(String(listingId))}/spaces/create`,
      { space_type_id: spaceTypeId },
      { ...opts }
    );

    if ((status === 200 || status === 201) && typeof data?.id === 'number') {
      return data.id;
    }

    console.error(`[createSpaceForListing] Unexpected status=${status}`, data);
    return null;
  } catch (error) {
    console.error('[createSpaceForListing] Failed:', error);
    return null;
  }
}

export async function updatePhotosOrderBySpace(
  listingId: string | number,
  spaceId: string | number,
  orderedPhotos: { id: number; order: number }[],
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<void> {
  try {
    const { status } = await api.patch(
      `/listings/${encodeURIComponent(listingId)}/spaces/${encodeURIComponent(String(spaceId))}/photos/order`,
      orderedPhotos,
      { ...opts }
    );

    if (status !== 200 && status !== 204) {
      console.error(`[updatePhotosOrderBySpace] Unexpected status=${status}`);
    }
  } catch (error) {
    console.error(
      `[updatePhotosOrderBySpace] Failed (listing=${listingId}, space=${spaceId})`,
      error
    );
  }
}

export async function movePhotoToSpace(
  listingId: string | number,
  fromSpaceId: string | number,
  photoId: string | number,
  targetSpaceId: number,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<void> {
  try {
    const { status } = await api.patch(
      `/listings/${encodeURIComponent(String(listingId))}/spaces/${encodeURIComponent(String(fromSpaceId))}/photos/${encodeURIComponent(String(photoId))}`,
      { spaceId: targetSpaceId },
      { ...opts }
    );

    if (status !== 204 && status !== 200) {
      console.error(`[movePhotoToSpace] Unexpected response status=${status}`);
    }
  } catch (error) {
    console.error(
      `[movePhotoToSpace] Failed (photo=${photoId}, target=${targetSpaceId})`,
      error
    );
  }
}

export async function uploadDefaultSpacePhotoWithProgress(
  listingId: string | number,
  file: File,
  onProgress?: (percent: number) => void,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<number> {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const { status, data } = await api.post<UploadDefaultSpacePhotoResponse>(
      `/listings/${encodeURIComponent(String(listingId))}/photos`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt: AxiosProgressEvent) => {
          if (!onProgress) return;
          const total = evt.total;
          if (typeof total === 'number' && total > 0) {
            const percent = Math.round((evt.loaded * 100) / total);
            onProgress(percent);
          }
        },
        ...opts,
      }
    );

    if ((status !== 200 && status !== 201) || typeof data?.id !== 'number') {
      console.error(
        `[uploadDefaultSpacePhotoWithProgress] Unexpected status=${status}, id=${data?.id} (type=${typeof data?.id})`
      );
      return -1;
    }

    if (onProgress) onProgress(100);
    return data.id;
  } catch (error) {
    console.error('[uploadDefaultSpacePhotoWithProgress] Failed:', error);
    return -1;
  }
}

export async function uploadDefaultSpacePhotosWithProgress(
  listingId: string | number,
  files: File[],
  onProgressByIndex: (index: number, progress: number) => void,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<number[]> {
  if (!listingId || files.length === 0) return [];

  const limit = pLimit(5);
  const uploadedIds: number[] = [];

  await Promise.all(
    files.map((file, index) =>
      limit(async () => {
        try {
          onProgressByIndex(index, 0);
          const id = await uploadDefaultSpacePhotoWithProgress(
            listingId,
            file,
            (p) => onProgressByIndex(index, p),
            opts
          );
          if (id > 0) uploadedIds.push(id);
          onProgressByIndex(index, 100);
        } catch (err) {
          console.error(
            `[uploadDefaultSpacePhotosWithProgress] Failed photo [${index}]`,
            err
          );
          onProgressByIndex(index, -1);
        }
      })
    )
  );

  return uploadedIds;
}

export async function fetchAllListingPhotos(
  listingId: string | number,
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<ListingPhoto[]> {
  try {
    const { data, status } = await api.get<ListingPhoto[]>(
      `/listings/${encodeURIComponent(String(listingId))}/spaces/photos`,
      { ...opts }
    );

    if (status !== 200 || !Array.isArray(data)) {
      console.error('[fetchAllListingPhotos] Unexpected response:', data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('[fetchAllListingPhotos] Failed:', error);
    return [];
  }
}

export async function updateListingPhotosOrder(
  listingId: string,
  data: UpdatePhotoOrder[],
  opts?: { skipGlobal404Redirect?: boolean }
): Promise<void> {
  try {
    const { status } = await api.patch(
      `/listings/${encodeURIComponent(listingId)}/photos/order`,
      data,
      {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
      }
    );

    if (status !== 200 && status !== 204) {
      console.error(`[updateListingPhotosOrder] Unexpected status=${status}`);
    }
  } catch (error) {
    console.error('[updateListingPhotosOrder] Error:', error);
    throw error;
  }
}
