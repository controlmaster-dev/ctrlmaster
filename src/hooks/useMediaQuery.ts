/**
 * Custom hook for responsive media queries
 */

import { useState, useEffect } from 'react';

/**
 * Hook to check if media query matches
 * 
 * @param query - CSS media query string
 * @returns Boolean indicating if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR check)
    if (typeof window === 'undefined') {
      return;
    }

    // Create media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Define listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQueryList.addEventListener('change', listener);

    // Cleanup listener on unmount
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to check if viewport is mobile
 * 
 * @returns Boolean indicating if viewport is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to check if viewport is tablet
 * 
 * @returns Boolean indicating if viewport is tablet (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to check if viewport is desktop
 * 
 * @returns Boolean indicating if viewport is desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
