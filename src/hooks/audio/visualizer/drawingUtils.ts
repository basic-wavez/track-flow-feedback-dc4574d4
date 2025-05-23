
/**
 * Draw bars and caps for the FFT visualizer
 */
export function drawBarsAndCaps(
  ctx: CanvasRenderingContext2D,
  barCount: number, 
  smoothedDataArray: Float32Array,
  caps: number[],
  width: number, 
  height: number,
  barColor: string,
  capColor: string,
  barSpacing: number,
  capHeight: number,
  capFallSpeed: number
): void {
  // Calculate bar width with spacing
  const barWidth = Math.floor(width / barCount) - barSpacing;
  
  // Draw bars and caps based on smoothed data
  for (let i = 0; i < barCount; i++) {
    // Get smoothed value for this bar
    const value = smoothedDataArray ? smoothedDataArray[i] : 0;
    
    // Calculate bar height based on frequency value (0-255)
    const barHeight = (value / 255) * height * 0.8; // 80% of canvas height max
    
    // Draw the bar
    ctx.fillStyle = barColor;
    ctx.fillRect(
      i * (barWidth + barSpacing), 
      height - barHeight, 
      barWidth, 
      barHeight
    );
    
    // Update and draw caps
    if (barHeight > caps[i]) {
      caps[i] = barHeight;
    } else {
      caps[i] = caps[i] * capFallSpeed;
    }
    
    // Draw the cap
    ctx.fillStyle = capColor;
    ctx.fillRect(
      i * (barWidth + barSpacing), 
      height - caps[i] - capHeight, 
      barWidth, 
      capHeight
    );
  }
}
