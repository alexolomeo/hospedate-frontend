import { trackPageView } from '../services/analytics';

/**
 * Track page views automatically on route changes
 * This script should be loaded on every page
 */

// Track initial page view
if (typeof window !== 'undefined') {
  // Track page view after analytics is initialized
  window.addEventListener('load', () => {
    setTimeout(() => {
      trackPageView(window.location.pathname, document.title);
    }, 500); // Small delay to ensure analytics is initialized
  });

  // Track page views on client-side navigation (for Astro view transitions)
  document.addEventListener('astro:page-load', () => {
    trackPageView(window.location.pathname, document.title);
  });
}
