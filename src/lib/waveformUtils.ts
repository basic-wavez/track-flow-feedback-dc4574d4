
/**
 * Helper function to generate waveform with variance as fallback
 * Now with enhanced dynamics but reduced overall amplitude (approximately 2/3 of original)
 */
export const generateWaveformWithVariance = (segments: number, variance: number = 0.6) => {
  // Generate base waveform data
  const baseData = generateWaveformData(segments);
  
  // Apply variance with dynamic enhancement but reduce overall amplitude
  return baseData.map((value, index) => {
    // Add some variance based on the parameter (increased from previous version)
    const varianceFactor = 1 + (Math.random() * variance * 1.5 - variance * 0.75);
    
    // Add occasional dramatic peaks for more visual interest (around 10% of bars)
    const dramaticPeak = Math.random() > 0.9 ? Math.random() * 0.5 : 0;
    
    // Use non-linear mapping to enhance dynamics (power curve)
    const enhancedValue = Math.pow(value * varianceFactor + dramaticPeak, 0.8);
    
    // Create occasional clusters of peaks for more realistic appearance
    const isInCluster = index > 0 && baseData[index - 1] > 0.6;
    const clusterBonus = isInCluster ? 0.15 : 0;
    
    // Apply amplitude reduction factor (approximately 2/3)
    const amplitudeReductionFactor = 0.67;
    
    // Use a wider range but with reduced maximum (0.01 to 0.65 instead of 0.01 to 0.98)
    return Math.min(0.65, Math.max(0.01, (enhancedValue + clusterBonus) * amplitudeReductionFactor));
  });
};

/**
 * Generate a placeholder for the waveform visualization
 * Enhanced to create more dynamic and visually striking patterns, but with reduced amplitude
 */
export const generateWaveformData = (length: number = 250): number[] => {
  const data = [];
  
  // Parameters to control the waveform shape
  const baseCurveFrequency = 0.05;
  const secondaryCurveFrequency = 0.1;
  const tertiaryFrequency = 0.02;
  let prevValue = Math.random() * 0.3 + 0.2;
  
  // Amplitude reduction factor
  const amplitudeReductionFactor = 0.67;
  
  for (let i = 0; i < length; i++) {
    // Create a base sine wave pattern for natural-looking oscillations
    const baseCurve = Math.sin(i * baseCurveFrequency) * 0.15;
    const secondaryCurve = Math.sin(i * secondaryCurveFrequency * 3) * 0.1;
    const tertiaryCurve = Math.cos(i * tertiaryFrequency * 7) * 0.05;
    
    // Add some randomness for texture
    const randomFactor = Math.random() * 0.3;
    
    // Calculate a value with some continuity from the previous value (smoother transitions)
    let newValue = prevValue * 0.3 + (0.2 + baseCurve + secondaryCurve + tertiaryCurve + randomFactor) * 0.7;
    
    // Apply amplitude reduction
    newValue = newValue * amplitudeReductionFactor;
    
    // Ensure values stay in desired range with more extreme dynamics (0.02 to 0.65)
    newValue = Math.max(0.02, Math.min(0.65, newValue));
    
    // Add some dramatic peaks (about 5% of bars) - but still maintain reduced height
    if (Math.random() > 0.95) {
      newValue = Math.min(0.65, newValue * (1.3 + Math.random() * 0.7));
    }
    
    // Add some very quiet sections (about 8% of bars)
    if (Math.random() > 0.92) {
      newValue = newValue * 0.3;
    }
    
    data.push(newValue);
    prevValue = newValue;
  }
  
  return data;
};

/**
 * Check if waveform peaks data is valid
 * @param data The peaks data to validate
 */
export const isValidPeaksData = (data: any): boolean => {
  return Array.isArray(data) && 
         data.length > 0 && 
         data.every(value => typeof value === 'number' && !isNaN(value));
};

/**
 * Create a cache key for storing waveform data
 * @param url The URL used as the basis for the cache key
 */
export const createWaveformCacheKey = (url: string): string => {
  // Create a hash from the URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `waveform_peaks_${Math.abs(hash)}`;
};
