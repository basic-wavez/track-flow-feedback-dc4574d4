
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
let lastVisibilityChangeTime = Date.now();
const DEBOUNCE_VISIBILITY_MS = 150;

// Session ID to track the current browser session
const sessionId = Math.random().toString(36).substring(2, 15);

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
    localStorage.setItem(sessionKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      sessionId
    }));
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
      try {
        const parsed = JSON.parse(cachedData);
        const data = Array.isArray(parsed) ? parsed : parsed.data;
        
        if (Array.isArray(data) && data.length > 0) {
          // Also store in memory cache for future fast access
          waveformMemoryCache[url] = data;
          return data;
        }
      } catch (err) {
        console.warn('Error parsing cached waveform data:', err);
      }
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
  
  // Also store in localStorage to persist across page reloads
  try {
    const attemptedUrls = new Set(JSON.parse(localStorage.getItem('waveform_analyzed_urls') || '[]'));
    attemptedUrls.add(url);
    localStorage.setItem('waveform_analyzed_urls', JSON.stringify([...attemptedUrls]));
  } catch (e) {
    console.warn('Error storing analyzed URLs in localStorage:', e);
  }
};

/**
 * Check if analysis has been attempted for this URL
 */
export const hasAttemptedAnalysis = (url: string): boolean => {
  if (!url) return false;
  
  // First check memory cache
  if (analysisAttemptedUrls.has(url)) {
    return true;
  }
  
  // Then check localStorage
  try {
    const attemptedUrls = new Set(JSON.parse(localStorage.getItem('waveform_analyzed_urls') || '[]'));
    const hasAttempted = attemptedUrls.has(url);
    
    if (hasAttempted) {
      // Update memory cache
      analysisAttemptedUrls.add(url);
    }
    
    return hasAttempted;
  } catch (e) {
    console.warn('Error retrieving analyzed URLs from localStorage:', e);
    return false;
  }
};

/**
 * Clear analysis attempted flag for testing
 */
export const clearAnalysisAttempted = (url: string): void => {
  if (!url) return;
  analysisAttemptedUrls.delete(url);
  
  // Also update localStorage
  try {
    const attemptedUrls = new Set(JSON.parse(localStorage.getItem('waveform_analyzed_urls') || '[]'));
    attemptedUrls.delete(url);
    localStorage.setItem('waveform_analyzed_urls', JSON.stringify([...attemptedUrls]));
  } catch (e) {
    console.warn('Error updating analyzed URLs in localStorage:', e);
  }
};

/**
 * Add a cached timestamp for when the app last ran an audio analysis
 */
export const recordAnalysisTimestamp = (url: string): void => {
  if (!url) return;
  
  try {
    const timestamps = JSON.parse(localStorage.getItem('waveform_analysis_timestamps') || '{}');
    timestamps[url] = Date.now();
    localStorage.setItem('waveform_analysis_timestamps', JSON.stringify(timestamps));
  } catch (e) {
    console.warn('Error storing analysis timestamp:', e);
  }
};

/**
 * Track visibility changes
 */
export const setupVisibilityTracking = (): () => void => {
  const handleVisibilityChange = () => {
    const now = Date.now();
    // Debounce the visibility change event
    if (now - lastVisibilityChangeTime < DEBOUNCE_VISIBILITY_MS) {
      return;
    }
    
    lastVisibilityChangeTime = now;
    const wasHidden = lastVisibilityState === 'hidden';
    const isNowVisible = document.visibilityState === 'visible';
    
    lastVisibilityState = document.visibilityState === 'visible' ? 'visible' : 'hidden';
    
    if (wasHidden && isNowVisible) {
      console.log('WaveformCache: Tab became visible, ready to restore cached data');
    }
  };
  
  // Ensure we're only adding the event listener once
  document.removeEventListener('visibilitychange', handleVisibilityChange);
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
 * Clear all cached data - useful for testing
 */
export const clearAllCachedData = (): void => {
  // Clear memory cache
  Object.keys(waveformMemoryCache).forEach(key => {
    delete waveformMemoryCache[key];
  });
  
  // Clear analyzed URLs
  analysisAttemptedUrls.clear();
  
  // Clear localStorage cache
  try {
    // Find all waveform-related items in localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('waveform_') || key === 'waveform_analyzed_urls' || key === 'waveform_analysis_timestamps')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove them all
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Error clearing cache from localStorage:', e);
  }
};

/**
 * Get all cached waveform URLs for debugging
 */
export const getCachedWaveformUrls = (): string[] => {
  return Object.keys(waveformMemoryCache);
};
