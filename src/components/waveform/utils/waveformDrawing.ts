
/**
 * Utility functions for drawing waveform visualizations
 */

/**
 * Draws the waveform bars on the canvas
 */
export const drawWaveformBars = (
  ctx: CanvasRenderingContext2D,
  waveformData: number[],
  width: number,
  height: number,
  progressPixel: number,
  isMp3Available: boolean
) => {
  const barWidth = width / waveformData.length;
  const barMargin = barWidth * 0.25; // Increased spacing for more distinct bars
  const effectiveBarWidth = barWidth - barMargin;
  
  // Add a subtle background glow effect
  if (progressPixel > 0) {
    const glowGradient = ctx.createRadialGradient(
      progressPixel, height/2, 5, 
      progressPixel, height/2, height * 0.8
    );
    glowGradient.addColorStop(0, 'rgba(241, 132, 200, 0.3)');
    glowGradient.addColorStop(1, 'rgba(241, 132, 200, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Draw each bar with enhanced styling and reduced height
  for (let i = 0; i < waveformData.length; i++) {
    const x = i * barWidth;
    
    // Use the amplitude with a power curve for more pronounced peaks
    const amplitude = Math.pow(waveformData[i], 0.9); 
    const barHeight = height * amplitude;
    const y = (height - barHeight) / 2;
    
    // Alternate slightly taller bars for visual interest
    const heightMultiplier = i % 2 === 0 ? 1 : 0.92;
    const adjustedBarHeight = barHeight * heightMultiplier;
    const adjustedY = (height - adjustedBarHeight) / 2;
    
    // Create more dynamic coloring with gradients
    let gradient;
    
    if (x < progressPixel) {
      // Enhanced gradient for played section
      gradient = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + adjustedBarHeight);
      
      if (isMp3Available) {
        // Create a more vibrant pink gradient with multiple color stops
        gradient.addColorStop(0, 'rgba(255, 192, 230, 0.98)'); // Lighter pink at top
        gradient.addColorStop(0.5, 'rgba(246, 152, 210, 0.95)'); // Mid pink in middle
        gradient.addColorStop(1, 'rgba(210, 113, 181, 0.92)');  // Deeper pink at bottom
        
        // Higher amplitude bars get more vibrant colors
        if (amplitude > 0.6) {
          gradient.addColorStop(0, 'rgba(255, 200, 235, 1)'); // Even brighter for peaks
          gradient.addColorStop(1, 'rgba(235, 133, 201, 0.95)');
        }
      } else {
        // Standard gradient but still enhanced
        gradient.addColorStop(0, 'rgba(251, 182, 220, 0.98)');
        gradient.addColorStop(1, 'rgba(220, 143, 191, 0.9)');
      }
      
      ctx.fillStyle = gradient;
    } else {
      // Enhanced gradient for unplayed section - now with more depth
      gradient = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + adjustedBarHeight);
      
      if (isMp3Available) {
        gradient.addColorStop(0, 'rgba(241, 172, 210, 0.5)');
        gradient.addColorStop(1, 'rgba(221, 152, 190, 0.4)');
      } else {
        gradient.addColorStop(0, 'rgba(231, 162, 200, 0.4)');
        gradient.addColorStop(1, 'rgba(201, 132, 170, 0.3)');
      }
      
      ctx.fillStyle = gradient;
    }
    
    drawRoundedBar(ctx, x, adjustedY, barMargin, effectiveBarWidth, adjustedBarHeight);
  }
};

/**
 * Draws a single rounded bar for the waveform
 */
export const drawRoundedBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  barMargin: number,
  effectiveBarWidth: number,
  height: number
) => {
  const radius = Math.min(effectiveBarWidth / 2, 3);
  
  ctx.beginPath();
  
  // Top-left corner
  ctx.moveTo(x + barMargin/2 + radius, y);
  // Top-right corner
  ctx.lineTo(x + barMargin/2 + effectiveBarWidth - radius, y);
  ctx.quadraticCurveTo(
    x + barMargin/2 + effectiveBarWidth, y, 
    x + barMargin/2 + effectiveBarWidth, y + radius
  );
  // Bottom-right corner
  ctx.lineTo(x + barMargin/2 + effectiveBarWidth, y + height - radius);
  ctx.quadraticCurveTo(
    x + barMargin/2 + effectiveBarWidth, y + height,
    x + barMargin/2 + effectiveBarWidth - radius, y + height
  );
  // Bottom-left corner
  ctx.lineTo(x + barMargin/2 + radius, y + height);
  ctx.quadraticCurveTo(
    x + barMargin/2, y + height,
    x + barMargin/2, y + height - radius
  );
  // Back to top-left
  ctx.lineTo(x + barMargin/2, y + radius);
  ctx.quadraticCurveTo(
    x + barMargin/2, y, 
    x + barMargin/2 + radius, y
  );
  
  ctx.fill();
};

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
