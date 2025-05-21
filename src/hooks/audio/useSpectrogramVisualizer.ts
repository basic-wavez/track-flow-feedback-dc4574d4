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
  targetFPS?: number; // New option for frame rate control
  bufferSize?: number; // Control how much history we keep
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

  // Default options
  const {
    colorStart = '#000033',
    colorMid = '#9b87f5',
    colorEnd = '#ff0000',
    timeScale = 2.0,
    backgroundColor = '#000000',
    maxFrequency = 15000,
    targetFPS = 20, // Lower target FPS for spectrogram which is performance heavy
    bufferSize = 200 // Limit the history size to 200 columns
  } = options;

  // Initialize the frequency data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    // Reduce FFT size for better performance
    analyser.fftSize = 1024; // Reduced from 2048
    
    dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    
    // Pre-allocate a fixed size buffer for the spectrogram
    spectrogramData.current = Array(bufferSize)
      .fill(null)
      .map(() => new Uint8Array(analyser.frequencyBinCount).fill(0));
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode, bufferSize]);

  // Generate a color based on the signal intensity (0-255)
  // Create a cached color map for better performance
  const colorCache = useRef<string[]>(Array(256).fill(''));
  
  // Initialize color cache on mount
  useEffect(() => {
    // Generate all 256 possible colors and cache them
    for (let i = 0; i < 256; i++) {
      const normalizedValue = i / 255;
      if (normalizedValue < 0.5) {
        // Interpolate between colorStart and colorMid
        const t = normalizedValue * 2;
        colorCache.current[i] = interpolateColor(colorStart, colorMid, t);
      } else {
        // Interpolate between colorMid and colorEnd
        const t = (normalizedValue - 0.5) * 2;
        colorCache.current[i] = interpolateColor(colorMid, colorEnd, t);
      }
    }
  }, [colorStart, colorMid, colorEnd]);
  
  const getColorForValue = (value: number): string => {
    const index = Math.min(255, Math.max(0, Math.floor(value)));
    return colorCache.current[index];
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
    const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance
    
    if (!ctx) return;
    
    // Get current dimensions from the parent element
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.width;
    const height = parent ? parent.clientHeight : canvas.height;
    
    // Only update canvas dimensions if they've changed
    if (canvasDimensions.current.width !== width || canvasDimensions.current.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvasDimensions.current = { width, height };
      
      // Clear the canvas completely when dimensions change
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Throttle updates based on timeScale
    const updateInterval = 1000 / 30 / timeScale; // 30fps divided by timeScale
    let needsFullRedraw = false;
    
    if (now - lastDrawTime.current >= updateInterval) {
      // Get frequency data
      audioContext.analyserNode.getByteFrequencyData(dataArray.current);
      
      // Shift the spectrogram data buffer (circular buffer approach)
      for (let i = spectrogramData.current.length - 1; i > 0; i--) {
        spectrogramData.current[i] = spectrogramData.current[i - 1];
      }
      
      // Add the new data at the beginning
      if (dataArray.current) {
        spectrogramData.current[0] = new Uint8Array(dataArray.current);
      }
      
      lastDrawTime.current = now;
      needsFullRedraw = true;
    }
    
    if (needsFullRedraw) {
      // Use a more efficient drawing approach
      // 1. Create an ImageData object for the whole canvas
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      
      // Calculate the index corresponding to our maxFrequency
      const sampleRate = audioContext.audioContext?.sampleRate || 44100;
      const nyquist = sampleRate / 2;
      const binCount = dataArray.current.length;
      const maxBinIndex = Math.floor((maxFrequency / nyquist) * binCount);
      
      // Render fewer bins on mobile or for performance reasons
      const renderStep = Math.max(1, Math.floor(maxBinIndex / 100));
      
      // Draw from right to left (newest data on the right)
      const columnsToDraw = Math.min(spectrogramData.current.length, width);
      
      for (let x = 0; x < columnsToDraw; x++) {
        const column = spectrogramData.current[x];
        if (!column) continue;
        
        // Only draw a subset of the frequency bins for better performance
        for (let y = 0; y < maxBinIndex; y += renderStep) {
          const value = column[y];
          if (value > 0) {
            // Calculate position in the frequency range (bottom to top)
            const yPos = height - Math.floor((y * height) / maxBinIndex) - 1;
            
            // Calculate position in the imageData
            const pos = (yPos * width + (width - x - 1)) * 4; // RGBA = 4 bytes
            
            // Get color from cache
            const hexColor = getColorForValue(value);
            
            // Set RGB values from the hex color
            data[pos] = parseInt(hexColor.substring(1, 3), 16); // R
            data[pos + 1] = parseInt(hexColor.substring(3, 5), 16); // G
            data[pos + 2] = parseInt(hexColor.substring(5, 7), 16); // B
            data[pos + 3] = 255; // Alpha (fully opaque)
          }
        }
      }
      
      // Put the image data to the canvas in one operation
      ctx.putImageData(imageData, 0, 0);
      
      // Draw frequency labels (only every 10 frames to reduce overhead)
      if (frameCount.current % 10 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        
        // Updated labels to focus on 0-15kHz range
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
      }
    }
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized) {
      // Resume the audio context if it's suspended
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      // Initialize the data array when starting to play
      spectrogramData.current = Array(bufferSize)
        .fill(null)
        .map(() => new Uint8Array(dataArray.current?.length || 0).fill(0));
      
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
