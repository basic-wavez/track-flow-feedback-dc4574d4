import { useRef, useEffect, useState } from 'react';
import { AudioContextState } from './useAudioContext';
import { VisualizerOptions } from './visualizer/types';
import { sharedFrameController } from './visualizer/frameController';
import { calculateMelBands, processFrequencyData, drawFrequencyLabels } from './visualizer/frequencyBands';
import { drawBarsAndCaps } from './visualizer/drawingUtils';

// Re-export the shared frame controller for use in other visualizers
export { sharedFrameController } from './visualizer/frameController';

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
    const sampleRate = audioContext.audioContext?.sampleRate || 44100;
    melBands.current = calculateMelBands(bufferLength, barCount, sampleRate, maxFrequency);
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode, barCount, maxFrequency]);

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
    
    // Process data through mel bands and apply exponential moving average
    if (smoothedDataArray.current) {
      processFrequencyData(dataArray.current, melBands.current, smoothedDataArray.current, smoothingFactor);
    }
    
    // Calculate bar width with spacing for the drawing function
    const barWidth = Math.floor(width / barCount) - barSpacing;
    
    // Draw bars and caps
    if (smoothedDataArray.current) {
      drawBarsAndCaps(
        ctx, 
        barCount, 
        smoothedDataArray.current, 
        caps.current, 
        width, 
        height, 
        barColor, 
        capColor, 
        barSpacing, 
        capHeight, 
        capFallSpeed
      );
    }
    
    // Only draw labels at a lower frequency to save performance
    if (now % 500 < frameInterval) {
      drawFrequencyLabels(ctx, barCount, barWidth, barSpacing, height, maxFrequency);
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
