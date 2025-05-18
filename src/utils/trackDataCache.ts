/**
 * Track Data Cache Utility
 * 
 * Provides session storage-based caching for track data to prevent
 * unnecessary refetches when switching tabs
 */

// Import visibility functions directly from source
import { VisibilityStateManager } from "@/hooks/useVisibilityChange";

interface TrackCacheEntry {
  data: any;
  timestamp: number;
  version: number;
}

interface TrackCache {
  [key: string]: TrackCacheEntry;
}

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
 * Determines if we should fetch new data based on cache and visibility state
 */
export const shouldFetchData = (key: string): boolean => {
  // Always fetch if no cache exists
  if (!getCachedTrackData(key)) return true;
  
  // If this is a visibility change and we have cached data, don't fetch
  if (VisibilityStateManager.isRecentChange()) return false;
  
  // Otherwise fetch based on TTL
  return true;
};

// We no longer re-export visibility functions to avoid circular dependencies
