
/**
 * Track Data Cache Utility
 * 
 * Provides session storage-based caching for track data to prevent
 * unnecessary refetches when switching tabs
 */

interface TrackCacheEntry {
  data: any;
  timestamp: number;
  version: number;
}

interface TrackCache {
  [key: string]: TrackCacheEntry;
}

// Global state for visibility tracking to avoid circular dependencies
const visibilityState = {
  lastChangeTimestamp: Date.now(),
  isVisible: document.visibilityState === 'visible',
  hasRecentChange: false
};

// Cache validity duration - 5 minutes
const CACHE_TTL = 1000 * 60 * 5;

/**
 * Gets cached track data if available
 */
export const getCachedTrackData = (key: string): any | null => {
  try {
    const cacheString = sessionStorage.getItem('track_data_cache');
    if (!cacheString) return null;
    
    const cache: TrackCache = JSON.parse(cacheString);
    const entry = cache[key];
    
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    
    return null;
  } catch (error) {
    console.warn('Error reading from track cache:', error);
    return null;
  }
};

/**
 * Stores track data in cache
 */
export const cacheTrackData = (key: string, data: any): void => {
  try {
    const cacheString = sessionStorage.getItem('track_data_cache') || '{}';
    const cache: TrackCache = JSON.parse(cacheString);
    
    // Get current version or start at 1
    const currentEntry = cache[key];
    const version = currentEntry ? currentEntry.version + 1 : 1;
    
    // Store with timestamp and version
    cache[key] = {
      data,
      timestamp: Date.now(),
      version
    };
    
    sessionStorage.setItem('track_data_cache', JSON.stringify(cache));
  } catch (error) {
    console.warn('Error writing to track cache:', error);
  }
};

/**
 * Invalidates a specific track data entry
 */
export const invalidateTrackCache = (key: string): void => {
  try {
    const cacheString = sessionStorage.getItem('track_data_cache');
    if (!cacheString) return;
    
    const cache: TrackCache = JSON.parse(cacheString);
    delete cache[key];
    
    sessionStorage.setItem('track_data_cache', JSON.stringify(cache));
  } catch (error) {
    console.warn('Error invalidating track cache:', error);
  }
};

/**
 * Updates the visibility state when the document visibility changes
 * This is called from the visibility change event in main.tsx
 */
export const updateVisibilityState = (isNowVisible: boolean): void => {
  const now = Date.now();
  const wasVisible = visibilityState.isVisible;
  visibilityState.isVisible = isNowVisible;
  
  // Only mark as a change if we went from hidden to visible
  if (!wasVisible && isNowVisible) {
    visibilityState.lastChangeTimestamp = now;
    visibilityState.hasRecentChange = true;
    
    // Store in session storage for cross-component access
    try {
      sessionStorage.setItem('last_visibility_change', now.toString());
      sessionStorage.setItem('is_document_visible', 'true');
    } catch (e) {
      console.warn('Error setting visibility state in session storage:', e);
    }
    
    // Reset the change flag after a short delay
    setTimeout(() => {
      visibilityState.hasRecentChange = false;
    }, 2000);
  } else if (wasVisible && !isNowVisible) {
    visibilityState.lastChangeTimestamp = now;
    
    try {
      sessionStorage.setItem('last_visibility_change', now.toString());
      sessionStorage.setItem('is_document_visible', 'false');
    } catch (e) {
      console.warn('Error setting visibility state in session storage:', e);
    }
  }
};

/**
 * Checks if a visibility change happened recently
 */
export const isRecentVisibilityChange = (): boolean => {
  // First check our in-memory state which is faster and more reliable
  if (visibilityState.hasRecentChange) {
    return true;
  }
  
  // Fall back to session storage
  try {
    const lastChange = parseInt(sessionStorage.getItem('last_visibility_change') || '0', 10);
    return Date.now() - lastChange < 2000;
  } catch (e) {
    return false;
  }
};

/**
 * Gets the current document visibility state
 */
export const getDocumentVisibilityState = (): 'visible' | 'hidden' => {
  return visibilityState.isVisible ? 'visible' : 'hidden';
};

/**
 * Determines if we should fetch new data based on cache and visibility state
 */
export const shouldFetchData = (key: string): boolean => {
  // Always fetch if no cache exists
  if (!getCachedTrackData(key)) return true;
  
  // If this is a visibility change and we have cached data, don't fetch
  if (isRecentVisibilityChange()) return false;
  
  // Otherwise fetch based on TTL
  return true;
};

// Initialize visibility state from session storage if available
try {
  const storedVisibility = sessionStorage.getItem('is_document_visible');
  if (storedVisibility !== null) {
    visibilityState.isVisible = storedVisibility === 'true';
  }
  
  const storedLastChange = sessionStorage.getItem('last_visibility_change');
  if (storedLastChange) {
    const timestamp = parseInt(storedLastChange, 10);
    visibilityState.lastChangeTimestamp = timestamp;
    visibilityState.hasRecentChange = Date.now() - timestamp < 2000;
  }
} catch (e) {
  console.warn('Error initializing visibility state from session storage:', e);
}
