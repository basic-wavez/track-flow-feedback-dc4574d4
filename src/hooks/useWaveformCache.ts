
import { useCallback } from 'react';

/**
 * Hook for managing waveform data caching
 */
export const useWaveformCache = () => {
  /**
   * Get a cache key for a waveform URL
   */
  const getCacheKey = useCallback((url: string): string => {
    // Remove any query parameters to create consistent keys
    return `waveform:${url.split('?')[0]}`;
  }, []);

  /**
   * Store waveform data in cache
   */
  const cacheWaveform = useCallback((url: string, data: number[]): boolean => {
    if (!url || !data || !Array.isArray(data)) return false;
    
    try {
      const cacheKey = getCacheKey(url);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to store waveform in cache:', error);
      return false;
    }
  }, [getCacheKey]);

  /**
   * Get cached waveform data
   */
  const getCachedWaveform = useCallback((url: string): number[] | null => {
    if (!url) return null;
    
    try {
      const cacheKey = getCacheKey(url);
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const parsedData = JSON.parse(cachedData);
      return Array.isArray(parsedData) && parsedData.length > 0 ? parsedData : null;
    } catch (error) {
      console.error('Failed to retrieve waveform from cache:', error);
      return null;
    }
  }, [getCacheKey]);

  /**
   * Clear cached waveform data
   */
  const clearWaveformCache = useCallback((url?: string): boolean => {
    try {
      if (url) {
        // Clear specific waveform
        const cacheKey = getCacheKey(url);
        localStorage.removeItem(cacheKey);
      } else {
        // Clear all waveform data
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('waveform:')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      return true;
    } catch (error) {
      console.error('Failed to clear waveform cache:', error);
      return false;
    }
  }, [getCacheKey]);

  return {
    getCacheKey,
    cacheWaveform,
    getCachedWaveform,
    clearWaveformCache
  };
};
