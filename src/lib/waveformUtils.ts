
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
    return Math.min(1, Math.max(0.05, value * varianceFactor));
  });
};

/**
 * Generate a placeholder for the waveform visualization
 * Used as a fallback when real audio analysis is not possible
 */
export const generateWaveformData = (length: number = 100): number[] => {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push(Math.random() * 0.5 + 0.25); // Values between 0.25 and 0.75
  }
  return data;
};
