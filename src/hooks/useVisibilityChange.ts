
import { useEffect, useRef, useState } from "react";
import { getDocumentVisibilityState, isRecentVisibilityChange } from "@/utils/trackDataCache";

export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState<boolean>(
    document.visibilityState === 'visible'
  );
  
  // Get the current visibility state from our centralized manager
  useEffect(() => {
    // Initial state
    setIsVisible(getDocumentVisibilityState() === 'visible');
    
    const handleVisibilityChange = () => {
      const isNowVisible = document.visibilityState === 'visible';
      setIsVisible(isNowVisible);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return {
    isVisible,
    isVisibilityChange: isRecentVisibilityChange()
  };
};
