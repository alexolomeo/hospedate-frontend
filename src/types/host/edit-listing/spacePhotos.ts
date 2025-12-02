export interface MediaPicture {
  original: string;
  srcsetWebp: string;
  srcsetAvif: string;
}

export interface SpacePhoto {
  id: number;
  photo: MediaPicture;
  caption: string;
}

export interface SpaceType {
  id: number;
  name: string;
  photo: MediaPicture;
}
