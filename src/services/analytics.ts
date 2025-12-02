import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  type Analytics,
} from 'firebase/analytics';
import { app } from '../firebase/client';

let analytics: Analytics | null = null;

/**
 * Initialize Google Analytics
 * Should only be called on client side and when GA is enabled
 */
export const initializeAnalytics = (): Analytics | null => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if GA is enabled via environment variable
  const isEnabled = import.meta.env.PUBLIC_ENABLE_GOOGLE_ANALYTICS === 'true';
  if (!isEnabled) {
    console.info('Google Analytics is disabled');
    return null;
  }

  // Check if measurement ID is configured
  const measurementId = import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID;
  if (!measurementId) {
    console.warn('Google Analytics measurement ID is not configured');
    return null;
  }

  // Initialize analytics only once
  if (!analytics) {
    try {
      analytics = getAnalytics(app);
      console.info('Google Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
      return null;
    }
  }

  return analytics;
};

/**
 * Get the analytics instance
 */
export const getAnalyticsInstance = (): Analytics | null => {
  return analytics;
};

/**
 * Track a page view
 * @param page_path - The path of the page
 * @param page_title - The title of the page
 */
export const trackPageView = (page_path: string, page_title?: string) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_path,
      page_title: page_title || document.title,
      page_location: window.location.href,
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Track a custom event
 * @param eventName - Name of the event
 * @param eventParams - Optional parameters for the event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) => {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

/**
 * Track user login
 * @param method - Login method (e.g., 'google', 'email', 'facebook')
 */
export const trackLogin = (method: string) => {
  trackEvent('login', { method });
};

/**
 * Track user signup
 * @param method - Signup method (e.g., 'google', 'email', 'facebook')
 */
export const trackSignUp = (method: string) => {
  trackEvent('sign_up', { method });
};

/**
 * Track search performed by user
 * @param searchTerm - The search query
 */
export const trackSearch = (searchTerm: string) => {
  trackEvent('search', { search_term: searchTerm });
};

/**
 * Track when a user views a listing
 * @param listingId - ID of the listing
 * @param listingName - Name/title of the listing
 */
export const trackViewListing = (listingId: string, listingName?: string) => {
  trackEvent('view_item', {
    item_id: listingId,
    ...(listingName && { item_name: listingName }),
    item_category: 'listing',
  });
};

/**
 * Track when a user starts a booking
 * @param listingId - ID of the listing
 * @param value - Booking value
 * @param currency - Currency code (default: 'BOB')
 */
export const trackBeginCheckout = (
  listingId: string,
  value: number,
  currency: string = 'BOB'
) => {
  trackEvent('begin_checkout', {
    item_id: listingId,
    value,
    currency,
  });
};

/**
 * Track successful booking/purchase
 * @param transactionId - ID of the transaction
 * @param value - Transaction value
 * @param currency - Currency code (default: 'BOB')
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'BOB'
) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
  });
};

/**
 * Track when user creates a listing
 * @param listingId - ID of the created listing
 */
export const trackCreateListing = (listingId: string) => {
  trackEvent('create_listing', {
    listing_id: listingId,
  });
};

/**
 * Track when user updates a listing
 * @param listingId - ID of the updated listing
 */
export const trackUpdateListing = (listingId: string) => {
  trackEvent('update_listing', {
    listing_id: listingId,
  });
};

/**
 * Track when user sends a message
 */
export const trackSendMessage = () => {
  trackEvent('send_message');
};

/**
 * Track when user applies filters
 * @param filters - Applied filter parameters
 */
export const trackApplyFilters = (
  filters: Record<string, string | number | boolean>
) => {
  trackEvent('apply_filters', filters);
};

/**
 * Set user ID for analytics
 * @param userId - The user ID
 */
export const setAnalyticsUserId = (userId: string) => {
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
};

/**
 * Set user properties for analytics
 * @param properties - User properties to set
 */
export const setAnalyticsUserProperties = (
  properties: Record<string, string | number>
) => {
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};
