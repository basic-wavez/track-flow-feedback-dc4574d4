
import { useState, useEffect } from 'react';

/**
 * Visibility State Manager Singleton
 * 
 * This singleton manages document visibility state across the application
 * in a consistent way, preventing race conditions and duplicate listeners.
 */

// Use a singleton pattern for the VisibilityStateManager
export class VisibilityStateManager {
  private static instance: VisibilityStateManager;
  private lastVisibilityChangeTime: number = 0;
  private currentVisibilityState: 'visible' | 'hidden' = 'visible';
  private visibilityChangeListeners: Set<() => void> = new Set();
  
  private constructor() {
    // Initialize with current document state if in browser environment
    if (typeof document !== 'undefined') {
      this.currentVisibilityState = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      
      // Store initial state timestamp
      this.lastVisibilityChangeTime = Date.now();
    }
  }
  
  // Get the singleton instance
  public static getInstance(): VisibilityStateManager {
    if (!VisibilityStateManager.instance) {
      VisibilityStateManager.instance = new VisibilityStateManager();
    }
    return VisibilityStateManager.instance;
  }
  
  // Handle visibility changes
  private handleVisibilityChange = (): void => {
    this.lastVisibilityChangeTime = Date.now();
    this.currentVisibilityState = document.visibilityState === 'visible' ? 'visible' : 'hidden';
    
    // Notify all listeners
    this.visibilityChangeListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in visibility change listener:', error);
      }
    });
  }
  
  // Get current visibility state
  public static getState(): 'visible' | 'hidden' {
    return VisibilityStateManager.getInstance().currentVisibilityState;
  }
  
  // Check if visibility state changed recently
  public static isRecentChange(withinMs: number = 3000): boolean {
    const instance = VisibilityStateManager.getInstance();
    return (Date.now() - instance.lastVisibilityChangeTime) < withinMs;
  }
  
  // Add a visibility change listener
  public static addListener(callback: () => void): () => void {
    const instance = VisibilityStateManager.getInstance();
    instance.visibilityChangeListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      instance.visibilityChangeListeners.delete(callback);
    };
  }
  
  // Clean up event listeners (useful for testing environments)
  public static cleanup(): void {
    const instance = VisibilityStateManager.getInstance();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', instance.handleVisibilityChange);
    }
    instance.visibilityChangeListeners.clear();
  }
}

// React hook for consuming the visibility state
export const useVisibilityChange = () => {
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  
  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(VisibilityStateManager.getState() === 'visible');
    };
    
    // Subscribe to visibility changes
    const unsubscribe = VisibilityStateManager.addListener(updateVisibility);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  return {
    isVisible,
    isHidden: !isVisible,
    isRecentChange: (withinMs?: number) => VisibilityStateManager.isRecentChange(withinMs)
  };
};
