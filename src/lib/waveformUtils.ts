
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
  
  // Create a more drum-beat like pattern with alternating high and low amplitudes
  // to match the visual style in the screenshot
  for (let i = 0; i < length; i++) {
    // Create drum-like pattern with higher values every 16 steps
    const isBeat = i % 16 < 4; 
    
    // Higher amplitude for beats (0.6-0.9), lower for off-beats (0.1-0.4)
    const baseValue = isBeat ? (0.6 + Math.random() * 0.3) : (0.1 + Math.random() * 0.3);
    
    // Add some randomness to make it look natural
    data.push(baseValue);
  }
  
  return data;
};
