
import { useRef, useEffect, useState } from 'react';
import { AudioContextState } from './useAudioContext';

interface VisualizerOptions {
  barCount?: number;
  barColor?: string;
  barSpacing?: number;
  capColor?: string;
  capHeight?: number;
  capFallSpeed?: number;
  maxFrequency?: number;
  targetFPS?: number;
}

// Shared frame rate controller across all visualizer instances
// Explicitly export for use in other visualizers
export const sharedFrameController = {
  lastFrameTime: 0,
  requestId: null as number | null,
  activeVisualizers: new Set<() => void>(),
  
  // Register a visualizer's draw function
  register(drawFn: () => void) {
    this.activeVisualizers.add(drawFn);
    if (this.activeVisualizers.size === 1) {
      this.startLoop();
    }
  },
  
  // Unregister a visualizer's draw function
  unregister(drawFn: () => void) {
    this.activeVisualizers.delete(drawFn);
    if (this.activeVisualizers.size === 0 && this.requestId !== null) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }
  },
  
  // Main animation loop that controls all visualizers
  startLoop() {
    const loop = () => {
      const now = performance.now();
      // Run all active visualizer draw functions
      this.activeVisualizers.forEach(drawFn => drawFn());
      this.lastFrameTime = now;
      this.requestId = requestAnimationFrame(loop);
    };
    
    this.requestId = requestAnimationFrame(loop);
  }
};

export function useAudioVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: VisualizerOptions = {}
) {
  const [isActive, setIsActive] = useState(false);
  const dataArray = useRef<Uint8Array | null>(null);
  const caps = useRef<number[]>([]);
  const canvasDimensions = useRef({ width: 0, height: 0 });
  const lastDrawTime = useRef(0);

  // Default options
  const {
    barCount = 64,
    barColor = '#9b87f5',
    barSpacing = 2,
    capColor = '#D946EF',
    capHeight = 2,
    capFallSpeed = 0.8,
    maxFrequency = 15000,
    targetFPS = 30, // Default target of 30fps for better performance
  } = options;

  // Initialize the frequency data array with reduced size for better performance
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    // Reduce FFT size for better performance
    const fftSize = 1024; // Reduced from 2048
    audioContext.analyserNode.fftSize = fftSize;
    audioContext.analyserNode.smoothingTimeConstant = 0.7; // Slightly reduced for better performance
    
    const bufferLength = audioContext.analyserNode.frequencyBinCount;
    dataArray.current = new Uint8Array(bufferLength);
    
    // Initialize caps array
    caps.current = Array(barCount).fill(0);
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode, barCount]);

  // Toggle visualizer active state
  const toggleVisualizer = () => {
    setIsActive(prev => !prev);
  };

  // Set initial active state to true
  useEffect(() => {
    setIsActive(true);
  }, []);

  // Draw the visualizer frame
  const draw = () => {
    if (!canvasRef.current || !audioContext.analyserNode || !dataArray.current || !isActive) {
      return;
    }

    const now = performance.now();
    const frameInterval = 1000 / targetFPS;
    
    // Skip frame if not enough time has elapsed
    if (now - lastDrawTime.current < frameInterval) {
      return;
    }
    
    lastDrawTime.current = now;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance
    
    if (!ctx) return;
    
    // Get current dimensions from the parent element
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.clientWidth;
    const height = parent ? parent.clientHeight : canvas.clientHeight;
    
    // Only update canvas dimensions if they've changed
    if (canvasDimensions.current.width !== width || canvasDimensions.current.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvasDimensions.current = { width, height };
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get frequency data
    audioContext.analyserNode.getByteFrequencyData(dataArray.current);
    
    // Calculate the width of each bar based on canvas width and desired bar count
    const barWidth = Math.floor(width / barCount) - barSpacing;
    
    // Calculate the frequency range we want to display
    const sampleRate = audioContext.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const maxBinIndex = Math.floor((maxFrequency / nyquist) * dataArray.current.length);
    
    // Draw bars and caps
    for (let i = 0; i < barCount; i++) {
      // Map the bar index to a frequency bin index up to maxBinIndex
      const startBin = Math.floor(i * maxBinIndex / barCount);
      const endBin = Math.floor((i + 1) * maxBinIndex / barCount);
      
      // Get the average value for this bar's frequency range
      let sum = 0;
      for (let j = startBin; j < endBin; j++) {
        sum += dataArray.current[j];
      }
      
      const average = sum / (endBin - startBin) || 0;
      
      // Calculate bar height based on frequency value (0-255)
      const barHeight = (average / 255) * height * 0.8; // 80% of canvas height max
      
      // Draw the bar
      ctx.fillStyle = barColor;
      ctx.fillRect(
        i * (barWidth + barSpacing), 
        height - barHeight, 
        barWidth, 
        barHeight
      );
      
      // Update and draw caps
      if (barHeight > caps.current[i]) {
        caps.current[i] = barHeight;
      } else {
        caps.current[i] = caps.current[i] * capFallSpeed;
      }
      
      // Draw the cap
      ctx.fillStyle = capColor;
      ctx.fillRect(
        i * (barWidth + barSpacing), 
        height - caps.current[i] - capHeight, 
        barWidth, 
        capHeight
      );
    }
    
    // Only draw labels at a lower frequency to save performance
    if (now % 500 < frameInterval) {
      // Draw frequency labels
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
  };

  // Start/stop animation based on playing state and active state
  useEffect(() => {
    if (isPlaying && isActive && audioContext.isInitialized) {
      // Resume the audio context if it's suspended (browser autoplay policy)
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      sharedFrameController.register(draw);
    } else {
      sharedFrameController.unregister(draw);
    }
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [isPlaying, isActive, audioContext.isInitialized]);

  return { isActive, toggleVisualizer };
}
