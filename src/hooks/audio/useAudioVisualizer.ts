
import { useRef, useEffect, useState } from 'react';
import { AudioContextState } from './useAudioContext';

interface VisualizerOptions {
  barCount?: number;
  barColor?: string;
  barSpacing?: number;
  capColor?: string;
  capHeight?: number;
  capFallSpeed?: number;
}

export function useAudioVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: VisualizerOptions = {}
) {
  const [isActive, setIsActive] = useState(false);
  const animationFrameId = useRef<number | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const caps = useRef<number[]>([]);

  // Default options
  const {
    barCount = 64,
    barColor = '#9b87f5',
    barSpacing = 2,
    capColor = '#D946EF',
    capHeight = 2,
    capFallSpeed = 0.8,
  } = options;

  // Initialize the frequency data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const bufferLength = audioContext.analyserNode.frequencyBinCount;
    dataArray.current = new Uint8Array(bufferLength);
    
    // Initialize caps array
    const initialCaps = Array(barCount).fill(0);
    caps.current = initialCaps;
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
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

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Get current dimensions from the parent element, not from getBoundingClientRect
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.clientWidth;
    const height = parent ? parent.clientHeight : canvas.clientHeight;
    
    // Only update canvas dimensions if they've changed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get frequency data
    audioContext.analyserNode.getByteFrequencyData(dataArray.current);
    
    // Calculate the width of each bar based on canvas width and desired bar count
    const barWidth = Math.floor(width / barCount) - barSpacing;
    
    // Draw bars and caps
    for (let i = 0; i < barCount; i++) {
      // Get the average value for this bar's frequency range
      const startIndex = Math.floor(i * audioContext.analyserNode.frequencyBinCount / barCount);
      const endIndex = Math.floor((i + 1) * audioContext.analyserNode.frequencyBinCount / barCount);
      
      let sum = 0;
      for (let j = startIndex; j < endIndex; j++) {
        sum += dataArray.current[j];
      }
      
      const average = sum / (endIndex - startIndex);
      
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
    
    animationFrameId.current = requestAnimationFrame(draw);
  };

  // Start/stop animation based on playing state and active state
  useEffect(() => {
    if (isPlaying && isActive && audioContext.isInitialized) {
      // Resume the audio context if it's suspended (browser autoplay policy)
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
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
  }, [isPlaying, isActive, audioContext.isInitialized]);

  return { isActive, toggleVisualizer };
}
