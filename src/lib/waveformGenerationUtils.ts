
/**
 * Utilities specifically for generating and managing waveform data
 */

/**
 * Generate a waveform data array with consistent peaks
 * This is useful when we're unable to analyze the actual audio
 * or when we need a placeholder while loading.
 * 
 * @param segments Number of segments in the waveform
 * @returns Array of waveform amplitudes (0-1 range)
 */
export function generateConsistentWaveform(segments: number): number[] {
  const waveform = [];
  
  // Create a semi-realistic waveform pattern
  for (let i = 0; i < segments; i++) {
    // Create a repeating pattern that looks like music
    const position = i / segments;
    
    // Base amplitude varies based on position (creates "song sections")
    let baseAmplitude = 0.3;
    
    // Create "verse/chorus" sections that are louder
    if (position > 0.2 && position < 0.4) baseAmplitude = 0.5;
    if (position > 0.6 && position < 0.8) baseAmplitude = 0.6;
    
    // Add smaller variations to make it look more natural
    const variation = 0.2 * (Math.sin(i * 0.1) + Math.sin(i * 0.17) + Math.sin(i * 0.23));
    
    // Combine base amplitude and variation
    const amplitude = Math.min(0.9, Math.max(0.05, baseAmplitude + variation));
    
    waveform.push(amplitude);
  }
  
  return waveform;
}

/**
 * Cache waveform data to localStorage
 * 
 * @param key Cache key - typically trackId or URL
 * @param waveformData The waveform data array
 * @returns boolean indicating success
 */
export function cacheWaveformData(key: string, waveformData: number[]): boolean {
  try {
    const cacheKey = `waveform:${key}`;
    localStorage.setItem(cacheKey, JSON.stringify(waveformData));
    return true;
  } catch (error) {
    console.error("Error caching waveform data:", error);
    return false;
  }
}

/**
 * Retrieve cached waveform data from localStorage
 * 
 * @param key Cache key - typically trackId or URL
 * @returns The waveform data array if found, null otherwise
 */
export function getCachedWaveformData(key: string): number[] | null {
  try {
    const cacheKey = `waveform:${key}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error("Error retrieving cached waveform data:", error);
    return null;
  }
}

/**
 * Clear cached waveform data for a specific key
 * 
 * @param key Cache key to clear
 */
export function clearCachedWaveformData(key: string): void {
  try {
    const cacheKey = `waveform:${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing cached waveform data:", error);
  }
}
