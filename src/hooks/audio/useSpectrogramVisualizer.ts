
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';

interface SpectrogramOptions {
  colorStart?: string;
  colorEnd?: string;
  colorMid?: string;
  timeScale?: number;
  backgroundColor?: string;
}

export function useSpectrogramVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: SpectrogramOptions = {}
) {
  const animationFrameId = useRef<number | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const spectrogramData = useRef<Uint8Array[]>([]);
  const lastDrawTime = useRef<number>(0);

  // Default options
  const {
    colorStart = '#000033',
    colorMid = '#9b87f5',
    colorEnd = '#ff0000',
    timeScale = 2.0,
    backgroundColor = '#000000'
  } = options;

  // Initialize the frequency data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    
    // Clear spectrogram history on mount
    spectrogramData.current = [];
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [audioContext.analyserNode]);

  // Generate a color based on the signal intensity (0-255)
  const getColorForValue = (value: number): string => {
    const normalizedValue = value / 255;
    
    // Use a three-color gradient
    if (normalizedValue < 0.5) {
      // Interpolate between colorStart and colorMid
      const t = normalizedValue * 2;
      return interpolateColor(colorStart, colorMid, t);
    } else {
      // Interpolate between colorMid and colorEnd
      const t = (normalizedValue - 0.5) * 2;
      return interpolateColor(colorMid, colorEnd, t);
    }
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

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Make sure the canvas dimensions match the element's display size
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    
    // Throttle updates based on timeScale (higher value = slower updates)
    const now = performance.now();
    const timeSinceLastDraw = now - lastDrawTime.current;
    const updateInterval = 1000 / 30 / timeScale; // 30fps divided by timeScale
    
    let needsFullRedraw = false;
    
    if (timeSinceLastDraw >= updateInterval) {
      // Get frequency data
      audioContext.analyserNode.getByteFrequencyData(dataArray.current);
      
      // Add the new frequency data to the spectrogram history
      // We need to make a copy because getByteFrequencyData reuses the same array
      spectrogramData.current.push(new Uint8Array(dataArray.current));
      
      // Limit the history size based on canvas width
      // We want each column to be 1px wide
      while (spectrogramData.current.length > width) {
        spectrogramData.current.shift();
      }
      
      lastDrawTime.current = now;
      needsFullRedraw = true;
    }
    
    if (needsFullRedraw) {
      // Clear the canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Draw each column of the spectrogram
      const frequencyBins = dataArray.current.length;
      const binHeight = height / frequencyBins;
      
      // Draw from right to left (newest data on the right)
      for (let x = 0; x < spectrogramData.current.length; x++) {
        const column = spectrogramData.current[spectrogramData.current.length - 1 - x];
        
        // Draw column from bottom to top (low frequencies at the bottom)
        for (let y = 0; y < frequencyBins; y++) {
          const value = column[y];
          if (value > 0) { // Only draw visible frequencies
            ctx.fillStyle = getColorForValue(value);
            // Draw from bottom to top (low frequencies at bottom)
            const yPos = height - (y * binHeight) - binHeight;
            ctx.fillRect(
              width - x - 1, // Right to left
              yPos,
              1, // 1px wide
              Math.max(1, binHeight) // At least 1px high
            );
          }
        }
      }
      
      // Draw frequency labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      
      const labels = [
        { freq: '20 kHz', pos: 0.1 },
        { freq: '10 kHz', pos: 0.3 },
        { freq: '5 kHz', pos: 0.5 },
        { freq: '1 kHz', pos: 0.7 },
        { freq: '100 Hz', pos: 0.9 }
      ];
      
      labels.forEach(label => {
        ctx.fillText(label.freq, 5, height * label.pos);
      });
    }
    
    animationFrameId.current = requestAnimationFrame(draw);
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized) {
      // Resume the audio context if it's suspended (browser autoplay policy)
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      // Clear spectrogram history when starting to play
      spectrogramData.current = [];
      
      animationFrameId.current = requestAnimationFrame(draw);
    } else if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isPlaying, audioContext.isInitialized]);

  return { draw };
}
