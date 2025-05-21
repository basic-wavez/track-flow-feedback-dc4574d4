
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
}

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
  const colorCache = useRef<string[]>(Array(256).fill(''));
  const rgbColorCache = useRef<{r: number, g: number, b: number}[]>(Array(256).fill(null));

  // Default options
  const {
    colorStart = '#000033',
    colorMid = '#9b87f5',
    colorEnd = '#ff0000',
    timeScale = 2.0,
    backgroundColor = '#000000',
    maxFrequency = 15000,
    targetFPS = 20,
    bufferSize = 200
  } = options;

  // Initialize the frequency data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    analyser.fftSize = 1024;
    
    dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    
    // Don't initialize spectrogramData here - we'll do it once we know the canvas dimensions
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode]);

  // Pre-compute color cache on mount or when colors change
  useEffect(() => {
    // Generate all 256 possible colors and cache them
    for (let i = 0; i < 256; i++) {
      const normalizedValue = i / 255;
      let hexColor;
      let rgb;
      
      if (normalizedValue < 0.5) {
        // Interpolate between colorStart and colorMid
        const t = normalizedValue * 2;
        hexColor = interpolateColor(colorStart, colorMid, t);
        rgb = hexToRgb(hexColor);
      } else {
        // Interpolate between colorMid and colorEnd
        const t = (normalizedValue - 0.5) * 2;
        hexColor = interpolateColor(colorMid, colorEnd, t);
        rgb = hexToRgb(hexColor);
      }
      
      colorCache.current[i] = hexColor;
      rgbColorCache.current[i] = rgb;
    }
  }, [colorStart, colorMid, colorEnd]);
  
  // Helper function to convert hex to RGB without parsing each time
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
  };

  // Helper to interpolate between two colors
  const interpolateColor = (color1: string, color2: string, factor: number): string => {
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
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Function to initialize or resize the spectrogram buffer based on canvas dimensions
  const initializeSpectrogramBuffer = (width: number) => {
    if (!dataArray.current) return;
    
    // Use the actual canvas width as the buffer size to ensure full width coverage
    // This is key to fixing the filling issue - dynamic buffer size based on canvas width
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
      canvas.width = width;
      canvas.height = height;
      canvasDimensions.current = { width, height };
      
      // Reset the imageData when dimensions change
      imageData.current = null;
      
      // Initialize or resize spectrogram buffer when dimensions change
      initializeSpectrogramBuffer(width);
      
      // Clear the canvas completely
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Draw frequency labels once
      drawFrequencyLabels(ctx, height);
    }
    
    // Create or update the ImageData object if needed
    if (!imageData.current || imageData.current.width !== width || imageData.current.height !== height) {
      imageData.current = ctx.createImageData(width, height);
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
        
        // Calculate y position (scale the bin index to the canvas height)
        const yPos = Math.floor(height - (binIndex * heightScale) - 1);
        
        // Skip if outside the canvas
        if (yPos < 0 || yPos >= height) continue;
        
        // Calculate the position in the image data array
        const pos = (yPos * width + xPos) * 4;
        
        // Use pre-calculated RGB values from cache for better performance
        const rgbColor = rgbColorCache.current[value];
        
        data[pos] = rgbColor.r;     // R
        data[pos + 1] = rgbColor.g; // G
        data[pos + 2] = rgbColor.b; // B
        data[pos + 3] = 255;        // A
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
    
    // Fixed frequencies for more consistent appearance
    const labels = [
      { freq: '15 kHz', pos: 0.1 },
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
      }
      
      frameCount.current = 0;
      sharedFrameController.register(draw);
    } else {
      sharedFrameController.unregister(draw);
    }
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [isPlaying, audioContext.isInitialized, bufferSize]);

  return { draw };
}
