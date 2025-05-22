
/**
 * Main entry point for waveform rendering functions
 */

import { drawWaveformBars } from './waveformBars';
import { drawPulseEffects, drawPlayhead } from './waveformEffects';

/**
 * Renders the complete waveform with all effects
 */
export const renderWaveform = (
  ctx: CanvasRenderingContext2D,
  waveformData: number[],
  width: number,
  height: number,
  progressPixel: number,
  isPlaying: boolean,
  isBuffering: boolean,
  isMp3Available: boolean
) => {
  // Only proceed if we have valid waveform data
  if (!waveformData || waveformData.length === 0) {
    console.warn('No waveform data provided to renderer');
    return;
  }

  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw the waveform bars
  drawWaveformBars(ctx, waveformData, width, height, progressPixel, isMp3Available);
  
  // Draw pulse effects
  drawPulseEffects(ctx, waveformData, width, height, progressPixel, isPlaying, isBuffering);
  
  // Draw playhead and buffering indicator
  drawPlayhead(ctx, width, height, progressPixel, isBuffering);
};

// Export all drawing functions for direct usage if needed
export { drawWaveformBars } from './waveformBars';
export { drawRoundedBar } from './waveformBars';
export { drawPulseEffects, drawPlayhead } from './waveformEffects';
