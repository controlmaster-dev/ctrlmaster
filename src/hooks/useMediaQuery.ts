


import { useState, useEffect } from 'react';


export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {

    if (typeof window === 'undefined') {
      return;
    }


    const mediaQueryList = window.matchMedia(query);


    setMatches(mediaQueryList.matches);


    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };


    mediaQueryList.addEventListener('change', listener);


    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}


export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}


export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}


export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
