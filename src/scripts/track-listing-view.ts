import { trackViewListing } from '@/services/analytics';

/**
 * Track listing view from window data
 * This script is loaded on listing detail pages
 */
declare global {
  interface Window {
    __listingData?: {
      id: number;
      title: string;
    };
  }
}

// Track listing view when data is available
if (typeof window !== 'undefined' && window.__listingData) {
  const { id, title } = window.__listingData;
  if (id) {
    trackViewListing(String(id), title);
  }
}
