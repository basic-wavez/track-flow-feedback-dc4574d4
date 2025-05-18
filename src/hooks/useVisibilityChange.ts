
import { useEffect, useState } from "react";

// Track visibility state without circular dependencies
const visibilityState = {
  isVisible: typeof document !== 'undefined' && document.visibilityState === 'visible',
  lastChangeTime: Date.now(),
  hasRecentChange: false
};

// Update visibility state - called from the event listener
const updateVisibilityState = (isNowVisible: boolean) => {
  const wasVisible = visibilityState.isVisible;
  const now = Date.now();
  
  visibilityState.isVisible = isNowVisible;
  
  // Only mark as a change if we went from hidden to visible
  if (!wasVisible && isNowVisible) {
    visibilityState.lastChangeTime = now;
    visibilityState.hasRecentChange = true;
    
    // Reset the change flag after a short delay
    setTimeout(() => {
      visibilityState.hasRecentChange = false;
    }, 2000);
  } else if (wasVisible && !isNowVisible) {
    visibilityState.lastChangeTime = now;
  }
};

// Helper function to check recent visibility changes
export const isRecentVisibilityChange = (): boolean => {
  return visibilityState.hasRecentChange;
};

// Helper function to get current visibility state
export const getDocumentVisibilityState = (): 'visible' | 'hidden' => {
  return visibilityState.isVisible ? 'visible' : 'hidden';
};

// Initialize the event listener at the module level
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const isNowVisible = document.visibilityState === 'visible';
    updateVisibilityState(isNowVisible);
  });
}

/**
 * Hook that provides the current visibility state of the document
 */
export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== 'undefined' && document.visibilityState === 'visible'
  );
  
  useEffect(() => {
    // Initial state
    setIsVisible(document.visibilityState === 'visible');
    
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
