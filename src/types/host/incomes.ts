export enum PayoutStatus {
  Paid = 'paid',
  Pending = 'pending',
}

export interface Payout {
  id: string;
  date: string;
  amount: string;
  status: PayoutStatus;
  guestName: string;
  bookingDates: string;
  propertyName: string;
  guestAvatar: string;
  tripId: number;
}

export interface SummaryPayoutsResponse {
  completedPayouts: CompletedPayout[];
  pendingPayouts: PendingPayout[];
  summary: Summary;
}

export interface CompletedPayout {
  amount: number;
  guest: CompletedPayoutGuest;
  /**
   * <- Hostpayout.id
   */
  id: number;
  listing: CompletedPayoutListing;
  paymentDate: string;
  trip: CompletedPayoutTrip;
}

export interface CompletedPayoutGuest {
  /**
   * User.id
   */
  id: number;
  name: string;
  profilePicture?: MediaPicture;
}

/**
 * MediaPicture
 */
export interface MediaPicture {
  original: string;
  srcsetAvif: string;
  srcsetWebp: string;
}

export interface CompletedPayoutListing {
  id: number;
  title: string;
}

export interface CompletedPayoutTrip {
  checkInDate: string;
  checkoutDate: string;
  id: number;
}

export interface PendingPayout {
  amount?: number;
  guest?: PendingPayoutGuest;
  /**
   * <- .id
   */
  id?: number;
  listing: PendingPayoutListing;
  trip: PendingPayoutTrip;
}

export interface PendingPayoutGuest {
  /**
   * User.id
   */
  id: number;
  name: string;
  profilePicture: MediaPicture;
}

export interface PendingPayoutListing {
  id: number;
  title: string;
}

export interface PendingPayoutTrip {
  checkInDate: string;
  checkoutDate: string;
  id: number;
}

export interface Summary {
  pending: number;
  received: number;
  totalYear: number;
}
