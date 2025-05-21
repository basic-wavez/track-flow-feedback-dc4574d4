
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';
import { sharedFrameController } from './useAudioVisualizer';

interface SpectrogramOptions {
  colorStart?: string;
  colorEnd?: string;
  colorMid?: string;
  timeScale?: number;
  backgroundColor?: string;
  maxFrequency?: number;
  targetFPS?: number;
  bufferSize?: number;
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  useLogScale?: boolean;
  useDevicePixelRatio?: boolean;
  colorMap?: 'default' | 'inferno' | 'magma' | 'turbo'; // New option for color map selection
}

// Color palettes for the different perceptual color maps
// These are simplified versions - in production you'd want more granular color stops
const INFERNO_PALETTE = [
  [0, 0, 4], [31, 12, 72], [85, 15, 109], [136, 34, 106], 
  [186, 54, 85], [227, 89, 51], [249, 140, 10], [249, 201, 50], [252, 255, 164]
];

const MAGMA_PALETTE = [
  [0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129], 
  [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135], [252, 253, 191]
];

const TURBO_PALETTE = [
  [48, 18, 59], [70, 45, 129], [63, 81, 181], [43, 116, 202], 
  [32, 149, 218], [34, 181, 229], [68, 209, 209], [121, 231, 155], 
  [174, 240, 98], [222, 238, 35], [249, 189, 0], [249, 140, 0], [227, 69, 14], [180, 0, 0]
];

export function useSpectrogramVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: SpectrogramOptions = {}
) {
  const dataArray = useRef<Uint8Array | null>(null);
  const spectrogramData = useRef<Uint8Array[]>([]);
  const lastDrawTime = useRef<number>(0);
  const canvasDimensions = useRef({ width: 0, height: 0 });
  const frameCount = useRef(0);
  const imageData = useRef<ImageData | null>(null);
  const colorCache = useRef<{r: number, g: number, b: number}[]>(Array(256).fill({r: 0, g: 0, b: 0}));
  const logPositionCache = useRef<number[]>([]);
  const devicePixelRatio = useRef<number>(window.devicePixelRatio || 1);

  // Default options
  const {
    colorStart = '#000033',
    colorMid = '#9b87f5',
    colorEnd = '#ff0000',
    timeScale = 2.0,
    backgroundColor = '#000000',
    maxFrequency = 15000,
    targetFPS = 20,
    bufferSize = 200,
    fftSize = 32768,
    smoothingTimeConstant = 0,
    minDecibels = -100,
    maxDecibels = -30,
    useLogScale = true,
    useDevicePixelRatio = true,
    colorMap = 'default', // Default to the standard color map
  } = options;

  // Initialize the frequency data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    
    // Apply the new FFT settings
    try {
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      
      console.log(`Spectrogram: Applied FFT settings - fftSize: ${fftSize}, smoothing: ${smoothingTimeConstant}, dB range: ${minDecibels} to ${maxDecibels}`);
    } catch (e) {
      console.warn(`Spectrogram: Could not set requested fftSize ${fftSize}, using maximum allowed by browser:`, e);
      // Some browsers limit fftSize, so we handle the error gracefully
    }
    
    dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode, fftSize, smoothingTimeConstant, minDecibels, maxDecibels]);

  // Generate the color map based on the selected palette
  useEffect(() => {
    // Generate all 256 possible colors and cache them
    for (let i = 0; i < 256; i++) {
      const normalizedValue = i / 255;
      
      if (colorMap === 'inferno') {
        colorCache.current[i] = interpolateColorArray(INFERNO_PALETTE, normalizedValue);
      } else if (colorMap === 'magma') {
        colorCache.current[i] = interpolateColorArray(MAGMA_PALETTE, normalizedValue);
      } else if (colorMap === 'turbo') {
        colorCache.current[i] = interpolateColorArray(TURBO_PALETTE, normalizedValue);
      } else {
        // Default color map (original three-color gradient)
        let rgb;
        if (normalizedValue < 0.5) {
          // Interpolate between colorStart and colorMid
          const t = normalizedValue * 2;
          rgb = interpolateHexColors(colorStart, colorMid, t);
        } else {
          // Interpolate between colorMid and colorEnd
          const t = (normalizedValue - 0.5) * 2;
          rgb = interpolateHexColors(colorMid, colorEnd, t);
        }
        colorCache.current[i] = rgb;
      }
    }
    
    console.log(`Generated color map: ${colorMap}`);
  }, [colorMap, colorStart, colorMid, colorEnd]);
  
  // Pre-compute log scale positions cache when canvas height changes
  const updateLogPositionCache = (height: number, binCount: number) => {
    if (!dataArray.current) return;
    
    // Calculate the maximum bin index based on the max frequency
    const sampleRate = audioContext.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const maxBinIndex = Math.floor((maxFrequency / nyquist) * binCount);
    
    logPositionCache.current = new Array(maxBinIndex);
    
    for (let i = 0; i < maxBinIndex; i++) {
      // This formula maps frequency bin indices to logarithmically-spaced Y positions
      // The multiplier 9 controls how "logarithmic" the scale is
      const logY = Math.floor(
        Math.log10(1 + 9 * i / maxBinIndex) / Math.log10(10) * height
      );
      
      logPositionCache.current[i] = height - logY - 1;
    }
    
    console.log(`Log position cache updated for ${maxBinIndex} bins, height: ${height}`);
  };

  // Helper to interpolate between two hex colors
  const interpolateHexColors = (color1: string, color2: string, factor: number): {r: number, g: number, b: number} => {
    // Parse hex colors to RGB
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    
    // Interpolate between the two colors
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    
    return { r, g, b };
  };
  
  // Helper to interpolate within a color palette array
  const interpolateColorArray = (palette: number[][], value: number): {r: number, g: number, b: number} => {
    if (value <= 0) return { r: palette[0][0], g: palette[0][1], b: palette[0][2] };
    if (value >= 1) return { r: palette[palette.length-1][0], g: palette[palette.length-1][1], b: palette[palette.length-1][2] };
    
    // Map value to the palette segments
    const segment = value * (palette.length - 1);
    const index = Math.floor(segment);
    const fraction = segment - index;
    
    // If exact match or at the end
    if (fraction === 0 || index >= palette.length - 1) {
      return { r: palette[index][0], g: palette[index][1], b: palette[index][2] };
    }
    
    // Interpolate between two palette entries
    const r = Math.round(palette[index][0] + fraction * (palette[index+1][0] - palette[index][0]));
    const g = Math.round(palette[index][1] + fraction * (palette[index+1][1] - palette[index][1]));
    const b = Math.round(palette[index][2] + fraction * (palette[index+1][2] - palette[index][2]));
    
    return { r, g, b };
  };

  // Function to initialize or resize the spectrogram buffer based on canvas dimensions
  const initializeSpectrogramBuffer = (width: number) => {
    if (!dataArray.current) return;
    
    // Use the actual canvas width as the buffer size to ensure full width coverage
    const actualBufferSize = Math.max(width, bufferSize);
    
    spectrogramData.current = Array(actualBufferSize)
      .fill(null)
      .map(() => new Uint8Array(dataArray.current?.length || 0).fill(0));
    
    console.log(`Spectrogram buffer resized: ${actualBufferSize} columns (canvas width: ${width}px)`);
  };

  // Draw the spectrogram frame
  const draw = () => {
    if (!canvasRef.current || !audioContext.analyserNode || !dataArray.current) {
      return;
    }

    const now = performance.now();
    const frameInterval = 1000 / targetFPS;
    
    // Skip frame if not enough time has elapsed
    if (now - lastDrawTime.current < frameInterval) {
      return;
    }
    
    frameCount.current += 1;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    if (!ctx) return;
    
    // Get current dimensions from the parent element
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.width;
    const height = parent ? parent.clientHeight : canvas.height;
    
    // Handle canvas dimension changes
    if (canvasDimensions.current.width !== width || canvasDimensions.current.height !== height) {
      // Apply device pixel ratio scaling for sharper rendering
      if (useDevicePixelRatio) {
        const dpr = devicePixelRatio.current;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // Scale the context to counter the DPR scaling of the canvas
        ctx.scale(dpr, dpr);
        
        // Set style dimensions to maintain layout size
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        console.log(`Spectrogram: Applied DPR scaling ${dpr}x to canvas`);
      } else {
        // Standard sizing without DPR scaling
        canvas.width = width;
        canvas.height = height;
      }
      
      canvasDimensions.current = { width, height };
      
      // Reset the imageData when dimensions change
      imageData.current = null;
      
      // Initialize or resize spectrogram buffer when dimensions change
      initializeSpectrogramBuffer(width);
      
      // Update the log position cache when dimensions change
      if (useLogScale && dataArray.current) {
        updateLogPositionCache(height, dataArray.current.length);
      }
      
      // Clear the canvas completely
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Draw frequency labels once
      drawFrequencyLabels(ctx, height);
    }
    
    // Create or update the ImageData object if needed
    if (!imageData.current || imageData.current.width !== (useDevicePixelRatio ? width * devicePixelRatio.current : width) || 
        imageData.current.height !== (useDevicePixelRatio ? height * devicePixelRatio.current : height)) {
      if (useDevicePixelRatio) {
        imageData.current = ctx.createImageData(width * devicePixelRatio.current, height * devicePixelRatio.current);
      } else {
        imageData.current = ctx.createImageData(width, height);
      }
    }
    
    // Update audio data at a rate based on timeScale
    // Lower timeScale = slower movement, higher timeScale = faster movement
    const updateInterval = 1000 / 30 / timeScale;
    if (now - lastDrawTime.current >= updateInterval) {
      // Get frequency data
      audioContext.analyserNode.getByteFrequencyData(dataArray.current);
      
      // Shift the spectrogram data buffer to make space for new data
      // Only shift when we actually have new data to add
      for (let i = spectrogramData.current.length - 1; i > 0; i--) {
        spectrogramData.current[i] = spectrogramData.current[i - 1];
      }
      
      // Add the new data at index 0 (newest data)
      spectrogramData.current[0] = new Uint8Array(dataArray.current);
      
      lastDrawTime.current = now;
      
      // Render the spectrogram
      renderSpectrogram(ctx, width, height);
    }
  };
  
  // Separate function for rendering the spectrogram to improve code organization
  const renderSpectrogram = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!dataArray.current || !imageData.current) return;
    
    // Get image data for faster pixel manipulation
    const imgData = imageData.current;
    const data = imgData.data;
    
    // Calculate the frequency scaling
    const sampleRate = audioContext.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binCount = dataArray.current.length;
    const maxBinIndex = Math.floor((maxFrequency / nyquist) * binCount);
    
    // Fill the image data
    const heightScale = height / maxBinIndex;
    
    // Clear the image data with black background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }
    
    // Ensure we're filling the entire width of the canvas
    // Use all available spectrogramData columns
    const columnsToDraw = Math.min(spectrogramData.current.length, width);
    
    // Draw from right to left (newest data on the right)
    for (let x = 0; x < columnsToDraw; x++) {
      const column = spectrogramData.current[x];
      if (!column) continue;
      
      // Calculate the exact position on canvas (right-aligned)
      // This ensures we start from the right edge and fill toward the left
      const xPos = width - x - 1;
      
      // Skip if outside the canvas
      if (xPos < 0 || xPos >= width) continue;
      
      // Draw each frequency bin
      for (let binIndex = 0; binIndex < maxBinIndex; binIndex++) {
        const value = column[binIndex];
        
        // Skip processing if value is 0
        if (value === 0) continue;
        
        // Calculate y position - use logarithmic or linear scale based on useLogScale option
        let yPos;
        if (useLogScale && logPositionCache.current.length > 0) {
          // Use pre-computed log position
          yPos = logPositionCache.current[binIndex];
        } else {
          // Fallback to linear scale if log scale not available or not enabled
          yPos = Math.floor(height - (binIndex * heightScale) - 1);
        }
        
        // Skip if outside the canvas
        if (yPos < 0 || yPos >= height) continue;
        
        // Calculate the position in the image data array
        const pos = (yPos * width + xPos) * 4;
        
        // Use pre-calculated RGB values from perceptual color maps for better visualization
        const color = colorCache.current[value];
        
        data[pos] = color.r;     // R
        data[pos + 1] = color.g; // G
        data[pos + 2] = color.b; // B
        data[pos + 3] = 255;     // A
      }
    }
    
    // Put the image data to the canvas in one operation
    ctx.putImageData(imgData, 0, 0);
    
    // Redraw the frequency labels on top to ensure they're visible
    if (frameCount.current % 30 === 0) {
      drawFrequencyLabels(ctx, height);
    }
  };
  
  // Separate function for drawing frequency labels
  const drawFrequencyLabels = (ctx: CanvasRenderingContext2D, height: number) => {
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

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized) {
      // Resume the audio context if it's suspended
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      // Initialize the spectrogram buffer when starting to play
      // But only if we already have canvas dimensions
      if (canvasDimensions.current.width > 0 && dataArray.current) {
        initializeSpectrogramBuffer(canvasDimensions.current.width);
        
        // Initialize log position cache if using log scale
        if (useLogScale) {
          updateLogPositionCache(canvasDimensions.current.height, dataArray.current.length);
        }
      }
      
      frameCount.current = 0;
      sharedFrameController.register(draw);
    } else {
      sharedFrameController.unregister(draw);
    }
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [isPlaying, audioContext.isInitialized, bufferSize, useLogScale]);

  return { draw };
}
