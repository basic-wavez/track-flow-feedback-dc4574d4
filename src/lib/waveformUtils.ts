
/**
 * Helper function to generate waveform with variance as fallback
 */
export const generateWaveformWithVariance = (segments: number, variance: number) => {
  // Generate base waveform data
  const baseData = generateWaveformData(segments);
  
  // Apply variance to make more realistic waveforms
  return baseData.map(value => {
    // Add some variance based on the parameter
    const varianceFactor = 1 + (Math.random() * variance - variance / 2);
    // Use a wider range (0.01 to 0.95) for better dynamics
    return Math.min(0.95, Math.max(0.01, value * varianceFactor));
  });
};

/**
 * Generate a placeholder for the waveform visualization
 * Used as a fallback when real audio analysis is not possible
 */
export const generateWaveformData = (length: number = 100): number[] => {
  const data = [];
  for (let i = 0; i < length; i++) {
    // Generate values with greater range (0.1 to 0.7 instead of 0.25 to 0.75)
    // This creates more visual interest in the placeholder waveform
    data.push(Math.random() * 0.6 + 0.1);
  }
  return data;
};
