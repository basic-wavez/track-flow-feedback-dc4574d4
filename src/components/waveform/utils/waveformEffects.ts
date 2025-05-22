
/**
 * Apply visual effects to the waveform based on playback state
 */
export const applyWaveformEffects = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isPlaying: boolean,
  isBuffering: boolean
): void => {
  // Apply buffering effect
  if (isBuffering) {
    // Add pulsing overlay when buffering
    const now = Date.now();
    const pulseOpacity = Math.abs(Math.sin(now / 500) * 0.2);
    
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Apply playing effect (subtle glow)
  if (isPlaying && !isBuffering) {
    // Create a subtle gradient glow at the bottom with our pink color
    const glowGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
    glowGradient.addColorStop(0, 'rgba(210, 148, 182, 0)');
    glowGradient.addColorStop(1, 'rgba(210, 148, 182, 0.15)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
  }
};
