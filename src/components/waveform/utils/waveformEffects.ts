
/**
 * Utility functions for drawing waveform animation effects
 */

import { drawRoundedBar } from './waveformBars';

/**
 * Draws pulse effects on the waveform bars near the current position
 */
export const drawPulseEffects = (
  ctx: CanvasRenderingContext2D,
  waveformData: number[],
  width: number,
  height: number,
  progressPixel: number,
  isPlaying: boolean,
  isBuffering: boolean
) => {
  const barWidth = width / waveformData.length;
  const barMargin = barWidth * 0.25;
  const effectiveBarWidth = barWidth - barMargin;
  
  for (let i = 0; i < waveformData.length; i++) {
    const x = i * barWidth;
    
    // Add an enhanced pulsing effect to bars near the current position when playing
    if ((isPlaying || isBuffering) && x >= progressPixel - barWidth * 7 && x <= progressPixel + barWidth * 7) {
      const distance = Math.abs(x - progressPixel) / (barWidth * 7);
      const pulseOpacity = isBuffering 
        ? 0.8 - (distance * 0.8) 
        : 0.7 - (distance * 0.7);
      
      if (pulseOpacity > 0) {
        const amplitude = Math.pow(waveformData[i], 0.9);
        const barHeight = height * amplitude;
        
        // Alternate slightly taller bars for visual interest
        const heightMultiplier = i % 2 === 0 ? 1 : 0.92;
        const adjustedBarHeight = barHeight * heightMultiplier;
        const adjustedY = (height - adjustedBarHeight) / 2;
        
        // Create a more dramatic pulse effect with brighter colors
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
        
        // More pronounced pulsing - varies with time for animation
        const time = Date.now() / 1000;
        const pulseSin = Math.sin(time * 3 + i * 0.2) * 0.1 + 0.9;
        const pulseScale = isBuffering 
          ? 1 + (0.4 * (1 - distance) * pulseSin)
          : 1 + (0.3 * (1 - distance) * pulseSin);
        
        const pulseHeight = adjustedBarHeight * pulseScale;
        const pulseY = (height - pulseHeight) / 2;
        
        drawRoundedBar(ctx, x, pulseY, barMargin, effectiveBarWidth, pulseHeight);
      }
    }
  }
};

/**
 * Draws playhead and buffering effects
 */
export const drawPlayhead = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progressPixel: number,
  isBuffering: boolean
) => {
  // Only draw progress line if progress is valid
  if (progressPixel > 0) {
    // Draw a more visible playhead with glow effect
    const playheadGlow = ctx.createLinearGradient(
      progressPixel - 8, 0, 
      progressPixel + 8, 0
    );
    playheadGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    playheadGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    playheadGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = playheadGlow;
    ctx.fillRect(progressPixel - 8, 0, 16, height);
    
    // Draw the actual playhead line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(progressPixel - 1, 0, 2, height);
  }
  
  // Add buffering indicator with enhanced animation
  if (isBuffering) {
    const bufferingWidth = 30;
    const bufferingX = Math.min(progressPixel + 2, width - bufferingWidth);
    
    // Draw buffering animation pulse with time-based animation
    const time = Date.now() / 200;
    const pulseAlpha = 0.7 + Math.sin(time) * 0.3;
    
    // Create gradient for buffering indicator
    const bufferGradient = ctx.createLinearGradient(
      bufferingX, 0, 
      bufferingX + bufferingWidth, 0
    );
    bufferGradient.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha})`);
    bufferGradient.addColorStop(0.5, `rgba(255, 255, 255, ${pulseAlpha * 0.8})`);
    bufferGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    
    ctx.fillStyle = bufferGradient;
    ctx.fillRect(bufferingX, 0, bufferingWidth, height);
  }
};
