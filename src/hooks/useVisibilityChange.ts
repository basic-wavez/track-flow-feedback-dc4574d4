
import { useEffect, useRef, useState } from "react";

export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState<boolean>(
    document.visibilityState === 'visible'
  );
  const previousVisibilityRef = useRef<'visible' | 'hidden'>(
    document.visibilityState === 'visible' ? 'visible' : 'hidden'
  );
  const isVisibilityChangeRef = useRef<boolean>(false);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasHidden = previousVisibilityRef.current === 'hidden';
      const isNowVisible = document.visibilityState === 'visible';
      
      previousVisibilityRef.current = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      setIsVisible(isNowVisible);
      
      // Mark that a visibility change occurred
      if (wasHidden && isNowVisible) {
        console.log('Tab became visible');
        isVisibilityChangeRef.current = true;
        
        // Reset after a delay to allow for future genuine navigation events
        setTimeout(() => {
          isVisibilityChangeRef.current = false;
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return {
    isVisible,
    isVisibilityChange: isVisibilityChangeRef.current
  };
};
