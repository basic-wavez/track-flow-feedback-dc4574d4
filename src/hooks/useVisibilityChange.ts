
/**
 * Central visibility state management for the entire application
 * This is implemented as a singleton to prevent circular dependencies
 */

import { useEffect, useState } from "react";

// Create a centralized visibility state manager (singleton pattern)
// This prevents circular dependencies and ensures consistent state across the app
export const VisibilityStateManager = {
  isVisible: typeof document !== 'undefined' && document.visibilityState === 'visible',
  lastChangeTime: Date.now(),
  hasRecentChange: false,
  listeners: new Set<(isVisible: boolean) => void>(),
  
  // Update visibility state
  updateState(isNowVisible: boolean) {
    const wasVisible = this.isVisible;
    const now = Date.now();
    
    // Only mark as a change if visibility actually changed
    if (wasVisible !== isNowVisible) {
      this.isVisible = isNowVisible;
      this.lastChangeTime = now;
      
      // Mark as recent change - important for optimizing fetches
      if (!wasVisible && isNowVisible) {
        this.hasRecentChange = true;
        
        // Reset the change flag after a short delay
        setTimeout(() => {
          this.hasRecentChange = false;
        }, 2000);
      }
      
      // Notify all listeners
      this.notifyListeners();
    }
  },
  
  // Add listener
  addListener(callback: (isVisible: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.isVisible));
  },
  
  // Get current state
  getState(): 'visible' | 'hidden' {
    return this.isVisible ? 'visible' : 'hidden';
  },
  
  // Check if there was a recent visibility change
  isRecentChange(): boolean {
    return this.hasRecentChange;
  }
};

// Set up event listener at module level
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const isNowVisible = document.visibilityState === 'visible';
    VisibilityStateManager.updateState(isNowVisible);
  });
  
  // Initial state setup
  VisibilityStateManager.updateState(document.visibilityState === 'visible');
}

/**
 * Hook that provides the current visibility state of the document
 * and subscribes to changes
 */
export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  
  useEffect(() => {
    // Initial state
    setIsVisible(VisibilityStateManager.isVisible);
    
    // Add listener for changes
    const removeListener = VisibilityStateManager.addListener(newVisibility => {
      setIsVisible(newVisibility);
    });
    
    // Clean up listener on unmount
    return removeListener;
  }, []);
  
  return {
    isVisible,
    isVisibilityChange: VisibilityStateManager.isRecentChange()
  };
};

// Helper function exports that directly use the singleton
// This avoids issues with hooks being used in non-React components
export const isRecentVisibilityChange = () => VisibilityStateManager.isRecentChange();
export const getDocumentVisibilityState = () => VisibilityStateManager.getState();

