
import { RGBColor } from './colorMapUtils';

interface SpectrogramDimensions {
  width: number;
  height: number;
}

interface RenderOptions {
  useLogScale: boolean;
  maxBinIndex: number;
  logPositionCache?: number[];
}

/**
 * Renders the spectrogram data to an ImageData object
 */
export const renderSpectrogram = (
  ctx: CanvasRenderingContext2D,
  dimensions: SpectrogramDimensions,
  spectrogramData: Uint8Array[],
  colorCache: RGBColor[],
  options: RenderOptions
): void => {
  const { width, height } = dimensions;
  const { useLogScale, maxBinIndex, logPositionCache } = options;
  
  // Create ImageData for faster pixel manipulation
  const imgData = ctx.createImageData(width, 1);
  const data = imgData.data;
  
  // Ensure we're filling the entire width of the canvas
  // Use all available spectrogramData columns
  const columnsToDraw = Math.min(spectrogramData.length, width);
  
  // Draw from right to left (newest data on the right)
  for (let x = 0; x < columnsToDraw; x++) {
    const column = spectrogramData[x];
    if (!column) continue;
    
    // Calculate the exact position on canvas (right-aligned)
    // This ensures we start from the right edge and fill toward the left
    const xPos = width - x - 1;
    
    // Skip if outside the canvas
    if (xPos < 0 || xPos >= width) continue;
    
    // Clear the image data array for the current column
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }
    
    // For each vertical pixel in our column
    for (let y = 0; y < height; y++) {
      // Map canvas Y position to frequency bin index
      let binIndex;
      
      if (useLogScale && logPositionCache && logPositionCache.length > 0) {
        // Use the reverse mapping from pixel to bin
        binIndex = Math.min(
          Math.floor(y / height * maxBinIndex),
          maxBinIndex - 1
        );
        
        // Apply log mapping using the cache
        const mappedBinIndex = Math.floor((logPositionCache[binIndex] / height) * maxBinIndex);
        binIndex = Math.min(mappedBinIndex, maxBinIndex - 1);
      } else {
        // Linear mapping from pixel position to bin index
        binIndex = Math.floor(y / height * maxBinIndex);
      }
      
      if (binIndex < 0 || binIndex >= maxBinIndex) continue;
      
      const value = column[binIndex];
      
      // Skip processing if value is 0
      if (value === 0) continue;
      
      // Calculate the position in the image data array
      // We're drawing one column at a time, so y maps to pixel index
      const pos = y * 4;
      
      // Use pre-calculated RGB values from color cache
      const color = colorCache[value];
      
      data[pos] = color.r;     // R
      data[pos + 1] = color.g; // G
      data[pos + 2] = color.b; // B
      data[pos + 3] = 255;     // A
    }
    
    // Put the column image data to the canvas
    ctx.putImageData(imgData, xPos, 0);
  }
};

/**
 * Draw frequency labels on the spectrogram
 */
export const drawFrequencyLabels = (
  ctx: CanvasRenderingContext2D, 
  height: number,
  useLogScale: boolean
): void => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  
  // Update frequency labels to account for logarithmic scale
  // Use positions that look good with a log scale
  const labels = useLogScale 
    ? [
        { freq: '20 kHz', pos: 0.05 },
        { freq: '10 kHz', pos: 0.15 },
        { freq: '5 kHz', pos: 0.25 },
        { freq: '2 kHz', pos: 0.4 },
        { freq: '1 kHz', pos: 0.55 },
        { freq: '500 Hz', pos: 0.7 },
        { freq: '200 Hz', pos: 0.85 },
        { freq: '50 Hz', pos: 0.95 }
      ]
    : [
        { freq: '20 kHz', pos: 0.05 },
        { freq: '15 kHz', pos: 0.15 },
        { freq: '10 kHz', pos: 0.3 },
        { freq: '5 kHz', pos: 0.5 },
        { freq: '2 kHz', pos: 0.7 },
        { freq: '500 Hz', pos: 0.9 }
      ];
  
  labels.forEach(label => {
    ctx.fillText(label.freq, 5, height * label.pos);
  });
};

/**
 * Compute log position cache to map frequencies logarithmically
 */
export const computeLogPositionCache = (
  height: number,
  binCount: number,
  maxFrequency: number,
  sampleRate: number
): number[] => {
  // Calculate the maximum bin index based on the max frequency
  const nyquist = sampleRate / 2;
  const maxBinIndex = Math.floor((maxFrequency / nyquist) * binCount);
  
  const cache = new Array(maxBinIndex);
  
  for (let i = 0; i < maxBinIndex; i++) {
    // This formula maps frequency bin indices to logarithmically-spaced Y positions
    // The multiplier 9 controls how "logarithmic" the scale is
    const logY = Math.floor(
      Math.log10(1 + 9 * i / maxBinIndex) / Math.log10(10) * height
    );
    
    cache[i] = height - logY - 1;
  }
  
  return cache;
};
