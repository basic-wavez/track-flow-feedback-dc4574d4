
import { isValidPeaksData } from './waveformUtils';

/**
 * Try to load waveform peaks data from local storage
 * @param cacheKey The key to look for in localStorage
 * @returns The parsed peaks data as Float32Array if found and valid, null otherwise
 */
export const loadPeaksFromCache = (cacheKey: string): Float32Array | null => {
  try {
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }
    
    const parsedData = JSON.parse(cachedData);
    if (isValidPeaksData(parsedData)) {
      console.log('Using cached waveform peaks data from localStorage');
      return Float32Array.from(parsedData);
    } else {
      console.warn('Cached peaks data is invalid, removing from cache');
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (e) {
    console.warn('Error parsing cached peaks data:', e);
    localStorage.removeItem(cacheKey);
    return null;
  }
};

/**
 * Save peaks data to localStorage for future use
 * @param cacheKey The key to use in localStorage
 * @param peaksData The data to cache
 */
export const savePeaksToCache = (cacheKey: string, peaksData: number[] | Float32Array): void => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(Array.from(peaksData)));
  } catch (e) {
    console.warn('Failed to cache waveform peaks data:', e);
  }
};

/**
 * Create a cache key for a waveform peaks URL
 * @param url The URL to create a cache key for
 * @returns A string to use as localStorage cache key
 */
export const createPeaksCacheKey = (url: string): string => {
  return `waveform_peaks_${url}`;
};

/**
 * Fetch waveform peaks data from a URL
 * @param url The URL to fetch from
 * @returns The peaks data as Float32Array if successful, null otherwise
 */
export const fetchPeaksData = async (url: string): Promise<Float32Array | null> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch peaks data: ${response.status} ${response.statusText}`);
    }
    
    const peaksData = await response.json();
    
    if (isValidPeaksData(peaksData)) {
      console.log('Successfully loaded pre-computed waveform peaks:', peaksData.length, 'points');
      return Float32Array.from(peaksData);
    } else {
      throw new Error('Invalid peaks data format');
    }
  } catch (error) {
    console.error('Error fetching peaks data:', error);
    return null;
  }
};

/**
 * Load waveform peaks data with caching
 * @param url The URL to load peaks data from
 * @returns The loaded peaks data and a success flag
 */
export const loadPeaksDataWithCaching = async (
  url: string
): Promise<{ data: Float32Array | null; success: boolean }> => {
  if (!url) {
    return { data: null, success: false };
  }
  
  console.log('Attempting to load pre-computed peaks from:', url);
  
  // Create cache key for this URL
  const cacheKey = createPeaksCacheKey(url);
  
  // Try loading from cache first
  const cachedData = loadPeaksFromCache(cacheKey);
  if (cachedData) {
    return { data: cachedData, success: true };
  }
  
  // If not in cache, fetch from server
  console.log('Fetching peaks data from server:', url);
  const fetchedData = await fetchPeaksData(url);
  
  if (fetchedData) {
    // Cache for future use
    savePeaksToCache(cacheKey, fetchedData);
    return { data: fetchedData, success: true };
  }
  
  return { data: null, success: false };
};
