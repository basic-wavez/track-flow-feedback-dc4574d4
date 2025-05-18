
/**
 * Global waveform cache manager to persist waveform data across tab switches and page navigations
 */

// In-memory cache for waveform data
const waveformMemoryCache: Record<string, number[]> = {};

// Track which URLs we've already tried to analyze to prevent redundant attempts
const analysisAttemptedUrls = new Set<string>();

// Track app visibility state to handle tab switches
let lastVisibilityState: 'visible' | 'hidden' = document.visibilityState === 'visible' 
  ? 'visible' 
  : 'hidden';

/**
 * Store waveform data in both memory and localStorage cache
 */
export const storeWaveformData = (url: string, data: number[]): void => {
  if (!url) return;
  
  console.log(`Storing waveform data for URL: ${url}`);
  
  // Store in memory cache
  waveformMemoryCache[url] = data;
  
  // Store in localStorage for persistence across page reloads
  try {
    const sessionKey = `waveform_${url}`;
    localStorage.setItem(sessionKey, JSON.stringify(data));
  } catch (e) {
    console.warn('Error storing waveform in localStorage:', e);
  }
  
  // Mark this URL as having been analyzed to prevent redundant attempts
  markAnalysisAttempted(url);
};

/**
 * Get cached waveform data from memory or localStorage
 */
export const getCachedWaveformData = (url: string): number[] | null => {
  if (!url) return null;
  
  // Check memory cache first (faster)
  if (waveformMemoryCache[url]) {
    return waveformMemoryCache[url];
  }
  
  // Try localStorage as fallback
  try {
    const sessionKey = `waveform_${url}`;
    const cachedData = localStorage.getItem(sessionKey);
    
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      // Also store in memory cache for future fast access
      waveformMemoryCache[url] = parsedData;
      return parsedData;
    }
  } catch (e) {
    console.warn('Error retrieving from localStorage:', e);
  }
  
  return null;
};

/**
 * Mark a URL as having been analyzed or attempted
 */
export const markAnalysisAttempted = (url: string): void => {
  if (!url) return;
  analysisAttemptedUrls.add(url);
};

/**
 * Check if analysis has been attempted for this URL
 */
export const hasAttemptedAnalysis = (url: string): boolean => {
  if (!url) return false;
  return analysisAttemptedUrls.has(url);
};

/**
 * Clear analysis attempted flag for testing
 */
export const clearAnalysisAttempted = (url: string): void => {
  if (!url) return;
  analysisAttemptedUrls.delete(url);
};

/**
 * Track visibility changes
 */
export const setupVisibilityTracking = (): () => void => {
  const handleVisibilityChange = () => {
    const wasHidden = lastVisibilityState === 'hidden';
    const isNowVisible = document.visibilityState === 'visible';
    
    lastVisibilityState = document.visibilityState === 'visible' ? 'visible' : 'hidden';
    
    if (wasHidden && isNowVisible) {
      console.log('WaveformCache: Tab became visible, ready to restore cached data');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Get app visibility state (for components to check)
 */
export const getLastVisibilityState = (): 'visible' | 'hidden' => {
  return lastVisibilityState;
};

/**
 * Check if tab has recently become visible (for preventing redundant operations)
 */
export const didTabBecomeVisible = (): boolean => {
  return lastVisibilityState === 'visible' && document.visibilityState === 'visible';
};

/**
 * Get all cached waveform URLs for debugging
 */
export const getCachedWaveformUrls = (): string[] => {
  return Object.keys(waveformMemoryCache);
};
