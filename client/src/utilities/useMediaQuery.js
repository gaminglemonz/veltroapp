import { useEffect, useState } from 'react';
export default function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
      if (typeof window !== 'undefined') {
        return window.matchMedia(query).matches;
      }
      return false;
    });
  
    useEffect(() => {
      if (typeof window === 'undefined') return;
  
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);
  
      setMatches(media.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }, [query]);
  
    return matches;
  }