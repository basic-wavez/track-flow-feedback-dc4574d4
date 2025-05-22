
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
  smoothingFactor?: number; // Option for EMA smoothing
  preComputedWaveform?: number[] | null; // New option for pre-computed waveform data
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
  const smoothedDataArray = useRef<Float32Array | null>(null);
  const caps = useRef<number[]>([]);
  const canvasDimensions = useRef({ width: 0, height: 0 });
  const lastDrawTime = useRef(0);
  const melBands = useRef<number[][]>([]);
  const usesPreComputedData = useRef(false);
  const preComputedNormalized = useRef<Float32Array | null>(null);

  // Default options
  const {
    barCount = 64,
    barColor = '#9b87f5',
    barSpacing = 2,
    capColor = '#D946EF',
    capHeight = 2,
    capFallSpeed = 0.8,
    maxFrequency = 15000,
    targetFPS = 30,
    smoothingFactor = 0.7,
    preComputedWaveform = null,
  } = options;

  // Process pre-computed waveform data when available
  useEffect(() => {
    if (preComputedWaveform && preComputedWaveform.length > 0) {
      console.log('useAudioVisualizer: Using pre-computed waveform data with', preComputedWaveform.length, 'points');
      
      // Create normalized data for visualizer (scale to 0-255 range like frequency data)
      const normalized = new Float32Array(barCount);
      
      // Process the waveform data to fit our bar count
      // For a simple approach, we'll sample at regular intervals
      const step = preComputedWaveform.length / barCount;
      
      for (let i = 0; i < barCount; i++) {
        const index = Math.floor(i * step);
        if (index < preComputedWaveform.length) {
          // Normalize values to 0-255 range for consistent visualization
          normalized[i] = Math.abs(preComputedWaveform[index]) * 255;
        }
      }
      
      preComputedNormalized.current = normalized;
      usesPreComputedData.current = true;
      
      // Initialize smoothed data array with the normalized values
      if (!smoothedDataArray.current) {
        smoothedDataArray.current = new Float32Array(barCount);
        for (let i = 0; i < barCount; i++) {
          smoothedDataArray.current[i] = normalized[i];
        }
      }
      
      // Initialize caps array if needed
      if (caps.current.length === 0) {
        caps.current = Array(barCount).fill(0);
      }
      
      console.log('useAudioVisualizer: Pre-computed data processed successfully');
    }
  }, [preComputedWaveform, barCount]);

  // Initialize the frequency data arrays and mel bands
  useEffect(() => {
    // Skip initializing analyzer node when using pre-computed data
    if (usesPreComputedData.current) {
      console.log('useAudioVisualizer: Using pre-computed data, skipping analyzer setup');
      return;
    }
    
    if (!audioContext.analyserNode) return;
    
    // Use enhanced FFT settings as in the spectrogram
    try {
      // Larger FFT size for better frequency resolution
      audioContext.analyserNode.fftSize = 8192;
      // Keep smoothingTimeConstant at 0 to preserve transients
      audioContext.analyserNode.smoothingTimeConstant = 0;
      // Wider dynamic range
      audioContext.analyserNode.minDecibels = -90;
      audioContext.analyserNode.maxDecibels = -30;
      
      console.log("FFT Visualizer: Enhanced FFT settings applied");
    } catch (e) {
      console.warn("FFT Visualizer: Could not set requested fftSize, using browser default:", e);
    }
    
    const bufferLength = audioContext.analyserNode.frequencyBinCount;
    dataArray.current = new Uint8Array(bufferLength);
    smoothedDataArray.current = new Float32Array(barCount);
    
    // Initialize caps array
    caps.current = Array(barCount).fill(0);
    
    // Calculate mel bands (logarithmic frequency bins)
    calculateMelBands(bufferLength, barCount);
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode, barCount]);

  // Calculate logarithmic frequency bins (mel bands)
  const calculateMelBands = (bufferLength: number, bandCount: number) => {
    const sampleRate = audioContext.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const maxBinIndex = Math.floor((maxFrequency / nyquist) * bufferLength);
    
    // Clear existing bands
    melBands.current = [];
    
    // Create logarithmically spaced bands
    for (let i = 0; i < bandCount; i++) {
      // Use a logarithmic scale to determine band edges
      const startFreq = Math.exp(Math.log(20) + (Math.log(maxFrequency) - Math.log(20)) * (i / bandCount));
      const endFreq = Math.exp(Math.log(20) + (Math.log(maxFrequency) - Math.log(20)) * ((i + 1) / bandCount));
      
      // Convert frequencies to bin indices
      const startBin = Math.floor((startFreq / nyquist) * bufferLength);
      const endBin = Math.min(Math.floor((endFreq / nyquist) * bufferLength), maxBinIndex);
      
      // Store bin range for this mel band
      melBands.current.push([Math.max(startBin, 0), endBin]);
    }
    
    console.log(`FFT Visualizer: Created ${bandCount} logarithmic frequency bands (mel bands)`);
  };

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
    if (!canvasRef.current || !isActive) {
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
    const ctx = canvas.getContext('2d', { alpha: false });
    
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
    
    // If using pre-computed data, we don't need to get frequency data
    if (usesPreComputedData.current && preComputedNormalized.current) {
      // We already have our data in preComputedNormalized.current
      // No need to process through mel bands, just apply smoothing
      for (let i = 0; i < barCount; i++) {
        if (smoothedDataArray.current) {
          // Apply exponential moving average for smoothing
          smoothedDataArray.current[i] = smoothingFactor * smoothedDataArray.current[i] + 
                                     (1 - smoothingFactor) * (preComputedNormalized.current[i] || 0);
        }
      }
    } else if (audioContext.analyserNode && dataArray.current) {
      // Get frequency data from the analyzer node
      audioContext.analyserNode.getByteFrequencyData(dataArray.current);
      
      // Process data through mel bands and apply exponential moving average
      for (let i = 0; i < barCount; i++) {
        if (melBands.current[i]) {
          const [startBin, endBin] = melBands.current[i];
          
          // Calculate average value for this mel band
          let sum = 0;
          let count = 0;
          for (let j = startBin; j <= endBin; j++) {
            sum += dataArray.current[j];
            count++;
          }
          
          const average = count > 0 ? sum / count : 0;
          
          // Apply exponential moving average for smoothing
          if (smoothedDataArray.current) {
            smoothedDataArray.current[i] = smoothingFactor * smoothedDataArray.current[i] + 
                                       (1 - smoothingFactor) * average;
          }
        }
      }
    }
    
    // Calculate bar width with spacing
    const barWidth = Math.floor(width / barCount) - barSpacing;
    
    // Draw bars and caps based on smoothed data
    for (let i = 0; i < barCount; i++) {
      // Get smoothed value for this bar
      const value = smoothedDataArray.current ? smoothedDataArray.current[i] : 0;
      
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
    if (isPlaying && isActive) {
      // If using pre-computed data, we don't need to resume audio context
      if (!usesPreComputedData.current && audioContext.audioContext?.state === 'suspended') {
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
