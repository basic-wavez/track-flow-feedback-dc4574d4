
import { useRef, useEffect, useState } from 'react';
import { AudioContextState } from './useAudioContext';
import { usePeaksData } from '@/context/PeaksDataContext';

interface VisualizerOptions {
  barCount?: number;
  barColor?: string;
  barSpacing?: number;
  capColor?: string;
  capHeight?: number;
  capFallSpeed?: number;
  maxFrequency?: number;
  targetFPS?: number;
  smoothingFactor?: number;
  usePeaksData?: boolean; // New option to use pre-computed peaks
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
  
  // Access the shared peaks data context
  const { hasPeaksData, peaksData } = usePeaksData();
  const usePredefinedPeaks = options.usePeaksData && hasPeaksData;
  
  // Log if we're using pre-computed peaks
  useEffect(() => {
    if (usePredefinedPeaks) {
      console.log('AudioVisualizer: Using pre-computed peaks data for visualization');
    }
  }, [usePredefinedPeaks]);

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
  } = options;

  // Initialize the frequency data arrays and mel bands
  useEffect(() => {
    if (usePredefinedPeaks) {
      // If using predefined peaks, we won't need mel bands or audio context analysis
      // so initialize directly from the peaks data
      
      const peaksCount = peaksData?.length || barCount;
      smoothedDataArray.current = new Float32Array(peaksCount);
      
      // Initialize the smoothed data array from peaks - normalize to range 0-255
      if (peaksData && smoothedDataArray.current) {
        const maxPeak = Math.max(...peaksData);
        for (let i = 0; i < peaksData.length; i++) {
          // Scale peaks to appropriate range for FFT visualization (0-255)
          smoothedDataArray.current[i] = (peaksData[i] / maxPeak) * 255;
        }
      }
      
      // Initialize caps array
      caps.current = Array(peaksCount).fill(0);
      
      console.log('AudioVisualizer: Initialized with pre-computed peaks data');
      return;
    }
    
    // Normal initialization with audio analyzer
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
  }, [audioContext.analyserNode, barCount, usePredefinedPeaks, peaksData]);

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

  // Custom draw function for pre-computed peaks data
  const drawWithPeaks = () => {
    if (!canvasRef.current || !smoothedDataArray.current || !isActive) {
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
    
    // Calculate bar width with spacing
    const peaksCount = smoothedDataArray.current.length;
    const barWidth = Math.floor(width / peaksCount) - barSpacing;
    
    // For pre-computed peaks, we already have data in smoothedDataArray
    // We just need to modulate it to create an animated effect
    if (isPlaying) {
      // Create "dancing bars" effect based on time
      const timeModulation = Math.sin(now / 500) * 0.15 + 0.85; // 0.7-1.0 range
      
      for (let i = 0; i < smoothedDataArray.current.length; i++) {
        // Apply different modulation to different frequency bands for interesting effect
        const modFactor = timeModulation * (1 + Math.sin(i / 5 + now / 1000) * 0.2);
        
        // Add some randomness to make it more "alive" during playback
        const randomFactor = isPlaying ? Math.random() * 0.15 : 0;
        
        // Modulate the value, maintaining some minimum level
        const baseValue = smoothedDataArray.current[i];
        const modulatedValue = Math.max(baseValue * 0.3, baseValue * modFactor + randomFactor * baseValue);
        
        // Store back the slightly changed value for next frame
        smoothedDataArray.current[i] = baseValue * 0.95 + modulatedValue * 0.05;
      }
    }
    
    // Draw bars and caps based on data
    for (let i = 0; i < peaksCount; i++) {
      // Get value for this bar
      const value = smoothedDataArray.current[i];
      
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
  };

  // Draw the visualizer frame - using audio analyzer
  const drawWithAnalyzer = () => {
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
    
    // Get frequency data
    audioContext.analyserNode.getByteFrequencyData(dataArray.current);
    
    // Calculate bar width with spacing
    const barWidth = Math.floor(width / barCount) - barSpacing;
    
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

  // Choose which draw function to use based on whether we have pre-computed peaks
  const draw = () => {
    if (usePredefinedPeaks) {
      drawWithPeaks();
    } else {
      drawWithAnalyzer();
    }
  };

  // Start/stop animation based on playing state and active state
  useEffect(() => {
    if (isPlaying && isActive) {
      if (usePredefinedPeaks) {
        // If using pre-computed peaks, we don't need the audio context to be initialized
        sharedFrameController.register(draw);
      } else if (audioContext.isInitialized) {
        // Resume the audio context if it's suspended (browser autoplay policy)
        if (audioContext.audioContext?.state === 'suspended') {
          audioContext.audioContext.resume().catch(console.error);
        }
        
        sharedFrameController.register(draw);
      }
    } else {
      sharedFrameController.unregister(draw);
    }
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [isPlaying, isActive, audioContext.isInitialized, usePredefinedPeaks]);

  return { isActive, toggleVisualizer };
}
