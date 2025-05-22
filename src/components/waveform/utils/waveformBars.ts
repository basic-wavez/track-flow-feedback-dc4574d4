
/**
 * Utility functions for drawing waveform bars
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
