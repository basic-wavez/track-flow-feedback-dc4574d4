
import { useCallback } from 'react';

interface WaveformCacheHook {
  createCacheKey: (url: string) => string;
  cacheWaveform: (url: string, data: number[]) => void;
  getCachedWaveform: (url: string) => number[] | null;
}

export function useWaveformCache(): WaveformCacheHook {
  // Create a consistent cache key from a URL
  const createCacheKey = useCallback((url: string): string => {
    // Extract the track ID or other unique identifier from the URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    return `waveform:${filename}`;
  }, []);
  
  // Save waveform data to localStorage
  const cacheWaveform = useCallback((url: string, data: number[]): void => {
    if (!url || !data || data.length === 0) return;
    
    const key = createCacheKey(url);
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Cached waveform data with key: ${key}`);
    } catch (err) {
      console.warn('Failed to cache waveform data in localStorage:', err);
    }
  }, [createCacheKey]);
  
  // Retrieve waveform data from localStorage
  const getCachedWaveform = useCallback((url: string): number[] | null => {
    if (!url) return null;
    
    const key = createCacheKey(url);
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        console.log(`Retrieved cached waveform data for key: ${key}`);
        return parsedData;
      }
    } catch (err) {
      console.warn('Failed to read waveform data from localStorage:', err);
    }
    
    return null;
  }, [createCacheKey]);
  
  return {
    createCacheKey,
    cacheWaveform,
    getCachedWaveform
  };
}
