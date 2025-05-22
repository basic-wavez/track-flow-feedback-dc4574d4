
import { drawWaveformBars, drawPlaybackPosition } from './waveformBars';
import { applyWaveformEffects } from './waveformEffects';

/**
 * Render the waveform data to a canvas
 * @param ctx Canvas rendering context
 * @param waveformData Array of waveform data points
 * @param width Canvas width
 * @param height Canvas height
 * @param progressPixel Pixel position of playback progress
 * @param isPlaying Whether audio is currently playing
 * @param isBuffering Whether audio is buffering
 * @param isMp3Available Whether an MP3 version is available
 */
export const renderWaveform = (
  ctx: CanvasRenderingContext2D,
  waveformData: number[] | Float32Array,
  width: number,
  height: number,
  progressPixel: number,
  isPlaying: boolean,
  isBuffering: boolean,
  isMp3Available: boolean
): void => {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set up colors
  const backgroundColor = '#1a1a1a';
  const barColor = '#4a5568';
  const progressColor = isMp3Available ? 
    isBuffering ? 'rgba(210, 148, 182, 0.8)' : 'rgba(210, 148, 182, 0.8)'
    : 'rgba(245, 158, 11, 0.7)';
  const progressBarColor = progressColor;
  
  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Draw waveform bars with improved contrast and normalization
  drawWaveformBars(ctx, waveformData, width, height, progressPixel, barColor, progressBarColor);
  
  // Draw playback position line
  drawPlaybackPosition(ctx, progressPixel, height, progressColor);
  
  // Apply visual effects based on state
  applyWaveformEffects(ctx, width, height, isPlaying, isBuffering);
};
