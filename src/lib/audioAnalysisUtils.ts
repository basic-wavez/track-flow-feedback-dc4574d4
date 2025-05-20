
// This file contains utilities for audio analysis, including LUFS measurement

// Constants for LUFS calculation (based on ITU-R BS.1770 and EBU R128)
const LUFS_FRAME_SIZE = 4096; // Frame size for LUFS calculation
const LUFS_MEASUREMENT_INTERVAL_MS = 400; // 400ms integration period
const K_WEIGHTING_FILTER = [1.53512485958697, -2.69169618940638, 1.19839281085285]; // K-Weighting filter coefficients

/**
 * Calculate the RMS (Root Mean Square) value of an array of samples
 */
export function calculateRMS(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Calculate the peak level from an array of samples
 */
export function calculatePeak(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) {
      peak = abs;
    }
  }
  return peak;
}

/**
 * Convert linear amplitude to decibels
 */
export function linearToDecibels(linear: number, minDecibels = -100): number {
  if (linear <= 0) {
    return minDecibels;
  }
  return 20 * Math.log10(linear);
}

/**
 * Estimate LUFS (Loudness Units Full Scale) from time-domain samples
 * This is a simplified implementation of the EBU R128 standard
 */
export function calculateApproximateLUFS(
  leftSamples: Float32Array,
  rightSamples: Float32Array
): number {
  // Calculate RMS for each channel
  const leftRMS = calculateRMS(leftSamples);
  const rightRMS = calculateRMS(rightSamples);
  
  // Apply K-weighting (simplified) and calculate mean square
  const kWeightedMeanSquare = (leftRMS * leftRMS + rightRMS * rightRMS) / 2;
  
  // Convert to LUFS (simplified)
  // The -0.691 constant is a calibration offset from the ITU-R BS.1770
  const lufs = linearToDecibels(Math.sqrt(kWeightedMeanSquare)) - 0.691;
  
  return lufs;
}

/**
 * Scale a value between minValue and maxValue to a percentage (0-1)
 */
export function scaleToPercentage(value: number, minValue: number, maxValue: number): number {
  if (value <= minValue) return 0;
  if (value >= maxValue) return 1;
  return (value - minValue) / (maxValue - minValue);
}

/**
 * Get a suitable color based on dB level for metering
 */
export function getLevelColor(db: number): string {
  if (db > -3) return '#ff3b30'; // Red for loud
  if (db > -6) return '#ffcc00'; // Yellow for medium-loud
  if (db > -12) return '#34c759'; // Green for good level
  if (db > -20) return '#007aff'; // Blue for quiet
  return '#8e8e93'; // Gray for very quiet
}
