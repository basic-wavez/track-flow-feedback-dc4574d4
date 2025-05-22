
/**
 * Draw the waveform bars on the canvas
 */
export const drawWaveformBars = (
  ctx: CanvasRenderingContext2D,
  waveformData: number[] | Float32Array,
  width: number,
  height: number,
  progressPixel: number,
  barColor: string,
  progressBarColor: string
): void => {
  if (!waveformData || waveformData.length === 0) return;
  
  const centerY = Math.floor(height / 2);
  const dataLength = waveformData.length;
  
  // Calculate bar width based on canvas width and data length
  // Use a minimum width to prevent bars from being too thin
  const barWidth = Math.max(1, Math.ceil(width / dataLength));
  
  // Calculate spacing between bars (0 = no space)
  const spacing = Math.max(0, Math.min(2, barWidth / 4));
  
  // Maximum possible amplitude for waveform normalization
  const maxAmplitude = 0.9;
  
  // Draw each bar
  for (let i = 0; i < dataLength; i++) {
    const x = Math.floor((i * width) / dataLength);
    
    // Get normalized value (0-1)
    let value = waveformData[i];
    if (value < 0) value = -value; // Ensure positive
    if (value > 1) value = 1; // Clamp to 1
    
    // Apply a slight power curve to make quieter parts more visible
    // and loud parts slightly less dominant
    const adjustedValue = Math.pow(value, 0.8);
    
    // Calculate bar height with some minimum to ensure visibility
    const barHeight = Math.max(
      2, 
      Math.floor(adjustedValue * height * maxAmplitude)
    );
    
    // For very low values, still show a minimal bar
    const minBarHeight = Math.max(1, Math.floor(height * 0.05));
    const finalBarHeight = value > 0.01 ? barHeight : minBarHeight;
    
    // Determine if this bar is before or after the playback position
    const isPlayed = x < progressPixel;
    
    // Set the color for this bar
    ctx.fillStyle = isPlayed ? progressBarColor : barColor;
    
    // Split the bar into two halves for a reflective effect
    const halfHeight = Math.floor(finalBarHeight / 2);
    
    // Draw top half (from center up)
    ctx.fillRect(
      x + spacing / 2, 
      centerY - halfHeight, 
      barWidth - spacing, 
      halfHeight
    );
    
    // Draw bottom half (from center down)
    ctx.fillRect(
      x + spacing / 2, 
      centerY, 
      barWidth - spacing, 
      halfHeight
    );
  }
};

/**
 * Draw the playback position line
 */
export const drawPlaybackPosition = (
  ctx: CanvasRenderingContext2D,
  progressPixel: number,
  height: number,
  color: string
): void => {
  // Only draw if we have a valid progress position
  if (progressPixel > 0) {
    ctx.fillStyle = color;
    ctx.fillRect(progressPixel - 1, 0, 2, height);
  }
};
