import { useCallback } from 'react';

/**
 * useScrollToTop Hook
 *
 * Provides a function to programmatically scroll to the top of the page.
 * Use this in button clicks, form submissions, or any interactive element
 * where you want to ensure the user is scrolled to the top.
 *
 * @returns scrollToTop function
 *
 * @example
 * const scrollToTop = useScrollToTop();
 *
 * const handleSubmit = () => {
 *   // ... form logic
 *   scrollToTop();
 * };
 *
 * @example
 * const handleNext = () => {
 *   setCurrentPage(page + 1);
 *   scrollToTop(); // Scroll to top after pagination change
 * };
 */
export const useScrollToTop = () => {
  const scrollToTop = useCallback(() => {
    // Multiple approaches for maximum compatibility
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Smooth scroll for programmatic calls
    });

    // Fallback for older browsers
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Also try scrolling the main element if it exists
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
  }, []);

  return scrollToTop;
};

/**
 * Utility function to scroll to top (non-hook version)
 * Use this in event handlers or places where hooks can't be used
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });

  // Fallback
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const mainElement = document.querySelector('main');
  if (mainElement) {
    mainElement.scrollTop = 0;
  }
};

export default useScrollToTop;
