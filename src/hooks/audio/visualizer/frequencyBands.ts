
/**
 * Calculate logarithmic frequency bins (mel bands)
 */
export function calculateMelBands(
  bufferLength: number, 
  bandCount: number, 
  sampleRate: number,
  maxFrequency: number
): number[][] {
  const nyquist = sampleRate / 2;
  const maxBinIndex = Math.floor((maxFrequency / nyquist) * bufferLength);
  
  // Create logarithmically spaced bands
  const bands: number[][] = [];
  
  for (let i = 0; i < bandCount; i++) {
    // Use a logarithmic scale to determine band edges
    const startFreq = Math.exp(Math.log(20) + (Math.log(maxFrequency) - Math.log(20)) * (i / bandCount));
    const endFreq = Math.exp(Math.log(20) + (Math.log(maxFrequency) - Math.log(20)) * ((i + 1) / bandCount));
    
    // Convert frequencies to bin indices
    const startBin = Math.floor((startFreq / nyquist) * bufferLength);
    const endBin = Math.min(Math.floor((endFreq / nyquist) * bufferLength), maxBinIndex);
    
    // Store bin range for this mel band
    bands.push([Math.max(startBin, 0), endBin]);
  }
  
  console.log(`FFT Visualizer: Created ${bandCount} logarithmic frequency bands (mel bands)`);
  return bands;
}

/**
 * Process frequency data through mel bands and apply smoothing
 */
export function processFrequencyData(
  dataArray: Uint8Array,
  melBands: number[][],
  smoothedDataArray: Float32Array,
  smoothingFactor: number
): void {
  for (let i = 0; i < melBands.length; i++) {
    if (melBands[i]) {
      const [startBin, endBin] = melBands[i];
      
      // Calculate average value for this mel band
      let sum = 0;
      let count = 0;
      for (let j = startBin; j <= endBin; j++) {
        sum += dataArray[j];
        count++;
      }
      
      const average = count > 0 ? sum / count : 0;
      
      // Apply exponential moving average for smoothing
      smoothedDataArray[i] = smoothingFactor * smoothedDataArray[i] + 
                           (1 - smoothingFactor) * average;
    }
  }
}

/**
 * Draw frequency labels on the visualizer
 */
export function drawFrequencyLabels(
  ctx: CanvasRenderingContext2D,
  barCount: number,
  barWidth: number,
  barSpacing: number,
  height: number,
  maxFrequency: number
): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '9px sans-serif';
  
  // Only show frequency labels on bars at specific positions
  const frequencyLabels = [
    { freq: '0', position: 0 },
    { freq: '5k', position: Math.floor(barCount * (5000 / maxFrequency)) },
    { freq: '10k', position: Math.floor(barCount * (10000 / maxFrequency)) },
    { freq: '15k', position: barCount - 1 }
  ];
  
  frequencyLabels.forEach(label => {
    if (label.position >= 0 && label.position < barCount) {
      const x = label.position * (barWidth + barSpacing) + barWidth/2;
      ctx.textAlign = 'center';
      ctx.fillText(label.freq, x, height - 5);
    }
  });
}
